/**
 * WhatsApp Business API Service
 * Uses Official Meta Graph API v22.0
 *
 * Sends OTP via the `otp_template1` authentication template.
 *
 * Env vars required:
 *   WHATSAPP_TOKEN           – Meta permanent/temporary access token
 *   WHATSAPP_PHONE_NUMBER_ID – Phone Number ID from Meta dashboard
 */

const API_VERSION = 'v22.0';

/**
 * Ensure phone is in international format: 91xxxxxxxxxx (no +, no spaces, no dashes)
 * If no country code detected, defaults to India (+91).
 */
function formatToInternational(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length > 10) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Generate a random 4-digit OTP (1000–9999).
 */
function generateOTP() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Send an OTP to the given phone number via the otp_template1 authentication template.
 * Returns { success, otp, messageId } on success or { success: false, error } on failure.
 *
 * The OTP is passed in both the body and the button component as required by Meta
 * authentication templates.
 */
export async function sendOTP(phoneNumber) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = formatToInternational(phoneNumber);
  const otp = generateOTP();

  console.log('\n========== [WHATSAPP] SEND OTP ==========');
  console.log('[WHATSAPP] Formatted phone:', to);
  console.log('[WHATSAPP] Generated OTP:', otp);

  if (!token || !phoneNumberId || token === 'YOUR_META_ACCESS_TOKEN_HERE') {
    console.log('[WHATSAPP] MOCK MODE — no valid credentials. Skipping real API call.');
    return { success: true, mock: true, otp, messageId: 'mock-' + Date.now() };
  }

  const apiUrl = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;

  const messageBody = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'otp_template1',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: otp }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: otp }],
        },
      ],
    },
  };

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    });

    const data = await res.json();

    if (res.ok) {
      const messageId = data.messages?.[0]?.id;
      console.log(`[WHATSAPP] OTP sent successfully: ${otp} | msgId: ${messageId}`);
      return { success: true, otp, messageId };
    }

    console.error('[WHATSAPP] OTP send failed:', JSON.stringify(data.error || data, null, 2));
    return { success: false, error: data.error?.message || `HTTP ${res.status}` };
  } catch (error) {
    // Log Meta's error details but DO NOT crash the server or stop the order flow
    console.error('[WHATSAPP] Network/fetch error:', error.message);
    if (error.response?.data) {
      console.error('[WHATSAPP] Meta error data:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}
