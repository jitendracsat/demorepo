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
  console.log('[WHATSAPP DEBUG] formatToInternational — raw input:', phone, '| digits only:', digits, '| length:', digits.length);
  if (digits.length > 10) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Generate a random 4-digit OTP (1000–9999).
 */
function generateOTP() {
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  console.log('[WHATSAPP DEBUG] Generated OTP:', otp);
  return otp;
}

/**
 * Send an OTP to the given phone number via the otp_template1 authentication template.
 */
export async function sendOTP(phoneNumber, otpOverride) {
  console.log('\n============================================================');
  console.log('[WHATSAPP] >>>  sendOTP() CALLED  <<<');
  console.log('[WHATSAPP] Timestamp:', new Date().toISOString());
  console.log('[WHATSAPP] Input phoneNumber:', phoneNumber);
  console.log('[WHATSAPP] otpOverride provided:', !!otpOverride);
  console.log('============================================================');

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = formatToInternational(phoneNumber);
  const otp = otpOverride ? String(otpOverride).trim() : generateOTP();
  console.log('[WHATSAPP] Using OTP:', otp, otpOverride ? '(from caller)' : '(self-generated)');

  // --- ENV VAR DEBUG ---
  console.log('[WHATSAPP DEBUG] ENV CHECK:');
  console.log('  WHATSAPP_TOKEN present:', !!token);
  console.log('  WHATSAPP_TOKEN length:', token?.length || 0);
  console.log('  WHATSAPP_TOKEN first 20 chars:', token?.substring(0, 20) || '(empty)');
  console.log('  WHATSAPP_TOKEN last 10 chars:', token?.slice(-10) || '(empty)');
  console.log('  WHATSAPP_PHONE_NUMBER_ID:', phoneNumberId || '(NOT SET)');
  console.log('  Formatted "to" phone:', to);

  if (!token || !phoneNumberId || token === 'YOUR_META_ACCESS_TOKEN_HERE') {
    console.log('[WHATSAPP] MOCK MODE — no valid credentials. Skipping real API call.');
    console.log('[WHATSAPP] Reason:', !token ? 'TOKEN missing' : !phoneNumberId ? 'PHONE_NUMBER_ID missing' : 'TOKEN is placeholder');
    return { success: true, mock: true, otp, messageId: 'mock-' + Date.now() };
  }

  const apiUrl = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;
  console.log('[WHATSAPP DEBUG] API URL:', apiUrl);

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

  console.log('[WHATSAPP DEBUG] Full request payload:', JSON.stringify(messageBody, null, 2));

  try {
    console.log('[WHATSAPP] Calling Meta Graph API...');
    const startTime = Date.now();

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    });

    const elapsed = Date.now() - startTime;
    const data = await res.json();

    console.log('[WHATSAPP DEBUG] Meta API responded in', elapsed, 'ms');
    console.log('[WHATSAPP DEBUG] HTTP status:', res.status);
    console.log('[WHATSAPP DEBUG] Response body:', JSON.stringify(data, null, 2));

    if (res.ok) {
      const messageId = data.messages?.[0]?.id;
      console.log('[WHATSAPP] OTP sent successfully:', otp, '| msgId:', messageId, '| to:', to);
      return { success: true, otp, messageId };
    }

    // --- FAILURE DETAIL ---
    console.error('[WHATSAPP] OTP send FAILED');
    console.error('[WHATSAPP] HTTP status:', res.status);
    console.error('[WHATSAPP] Error code:', data.error?.code);
    console.error('[WHATSAPP] Error subcode:', data.error?.error_subcode);
    console.error('[WHATSAPP] Error message:', data.error?.message);
    console.error('[WHATSAPP] Error type:', data.error?.type);
    console.error('[WHATSAPP] fbtrace_id:', data.error?.fbtrace_id);
    console.error('[WHATSAPP] Full error JSON:', JSON.stringify(data, null, 2));

    return { success: false, error: data.error?.message || `HTTP ${res.status}` };
  } catch (error) {
    // Log Meta's error details but DO NOT crash the server or stop the order flow
    console.error('[WHATSAPP] NETWORK/FETCH ERROR (server NOT crashed):');
    console.error('[WHATSAPP] Error name:', error.name);
    console.error('[WHATSAPP] Error message:', error.message);
    console.error('[WHATSAPP] Error stack:', error.stack);
    if (error.response?.data) {
      console.error('[WHATSAPP] error.response.data:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}
