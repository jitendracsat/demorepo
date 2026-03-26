/**
 * WhatsApp Business API Service
 * Uses Official Meta Graph API v22.0
 *
 * Env vars required:
 *   WHATSAPP_TOKEN          – Meta permanent/temporary access token
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
 * Send a template-based WhatsApp message (order confirmation).
 * Uses otp_template1 authentication template with a generated OTP code.
 */
export async function sendOrderConfirmation(phoneNumber, orderDetails) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = formatToInternational(phoneNumber);

  // Generate a 4-digit OTP
  const otp = String(Math.floor(1000 + Math.random() * 9000));

  console.log('\n========== [WHATSAPP SERVICE] SEND OTP CONFIRMATION ==========');
  console.log('[WA] Raw phone input:', phoneNumber);
  console.log('[WA] Formatted phone (to):', to);
  console.log('[WA] WHATSAPP_PHONE_NUMBER_ID:', phoneNumberId);
  console.log('[WA] WHATSAPP_TOKEN present:', !!token, '| length:', token?.length || 0);
  console.log('[WA] API_VERSION:', API_VERSION);
  console.log('[WA] OTP generated:', otp);
  console.log('[WA] Order details:', JSON.stringify(orderDetails));

  if (!token || !phoneNumberId || token === 'YOUR_META_ACCESS_TOKEN_HERE') {
    console.log('[WA] MOCK MODE — no valid credentials. Skipping real API call.');
    return { success: true, mock: true, messageId: 'mock-' + Date.now() };
  }

  const apiUrl = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;
  console.log('[WA] API URL:', apiUrl);

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
          parameters: [
            { type: 'text', text: otp },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            { type: 'text', text: otp },
          ],
        },
      ],
    },
  };

  console.log('[WA] Sending otp_template1...');
  console.log('[WA] Exact JSON payload:', JSON.stringify(messageBody, null, 2));

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
    console.log(`[WA] Response — HTTP ${res.status}`);
    console.log('[WA] Full response body:', JSON.stringify(data, null, 2));

    if (res.ok) {
      const messageId = data.messages?.[0]?.id;
      console.log(`[WA] ✅ otp_template1 SENT to ${to} | msgId: ${messageId}`);
      return { success: true, messageId, otp };
    }

    console.error('[WA] ❌ otp_template1 FAILED. Full error:', JSON.stringify(data, null, 2));
    return { success: false, error: data.error?.message || `HTTP ${res.status}`, fullError: data };
  } catch (error) {
    console.error('[WA] ❌ Network/fetch error:', error.message);
    console.error('[WA] Error stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Legacy export — kept for backward compat
 */
export async function sendWhatsAppReceipt(phoneNumber, receiptUrl) {
  return sendOrderConfirmation(phoneNumber, {
    orderId: 'N/A',
    totalAmount: 0,
    tableNumber: '',
    itemCount: 0,
    receiptUrl,
  });
}
