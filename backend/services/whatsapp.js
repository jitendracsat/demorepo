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
 * Falls back to hello_world → plain text if template not found.
 */
export async function sendOrderConfirmation(phoneNumber, orderDetails) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = formatToInternational(phoneNumber);

  console.log('\n========== [WHATSAPP SERVICE] SEND ORDER CONFIRMATION ==========');
  console.log('[WA] Raw phone input:', phoneNumber);
  console.log('[WA] Formatted phone (to):', to);
  console.log('[WA] WHATSAPP_PHONE_NUMBER_ID:', phoneNumberId);
  console.log('[WA] WHATSAPP_TOKEN present:', !!token, '| length:', token?.length || 0);
  console.log('[WA] API_VERSION:', API_VERSION);
  console.log('[WA] Order details:', JSON.stringify(orderDetails));

  if (!token || !phoneNumberId || token === 'YOUR_META_ACCESS_TOKEN_HERE') {
    console.log('[WA] MOCK MODE — no valid credentials. Skipping real API call.');
    return { success: true, mock: true, messageId: 'mock-' + Date.now() };
  }

  const apiUrl = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;
  console.log('[WA] API URL:', apiUrl);

  // Step 1: Try order_confirmation template
  const messageBody = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'order_confirmation',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(orderDetails.orderId) },
            { type: 'text', text: String(orderDetails.itemCount || 0) },
            { type: 'text', text: `INR ${Number(orderDetails.totalAmount || 0).toFixed(2)}` },
            { type: 'text', text: String(orderDetails.tableNumber || 'Takeaway') },
          ],
        },
      ],
    },
  };

  console.log('[WA] STEP 1: Sending order_confirmation template...');
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
    console.log(`[WA] STEP 1 Response — HTTP ${res.status}`);
    console.log('[WA] STEP 1 Full response body:', JSON.stringify(data, null, 2));

    if (res.ok) {
      const messageId = data.messages?.[0]?.id;
      console.log(`[WA] ✅ order_confirmation SENT to ${to} | msgId: ${messageId}`);
      return { success: true, messageId };
    }

    // Template not found (132000, 132001) or any template error → try hello_world
    const errCode = data.error?.code;
    if (errCode === 132000 || errCode === 132001 || data.error?.message?.includes('template')) {
      console.log(`[WA] order_confirmation failed (code ${errCode}). Falling back to hello_world...`);
      return sendHelloWorld(to, apiUrl, token);
    }

    console.error('[WA] ❌ STEP 1 FAILED. Full error:', JSON.stringify(data, null, 2));
    return { success: false, error: data.error?.message || `HTTP ${res.status}`, fullError: data };
  } catch (error) {
    console.error('[WA] ❌ STEP 1 Network/fetch error:', error.message);
    console.error('[WA] Error stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback 1: hello_world template (pre-approved on every WABA).
 */
async function sendHelloWorld(to, apiUrl, token) {
  const messageBody = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' },
    },
  };

  console.log('\n[WA] STEP 2: Sending hello_world template...');
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
    console.log(`[WA] STEP 2 Response — HTTP ${res.status}`);
    console.log('[WA] STEP 2 Full response body:', JSON.stringify(data, null, 2));

    if (res.ok) {
      const messageId = data.messages?.[0]?.id;
      console.log(`[WA] ✅ hello_world SENT to ${to} | msgId: ${messageId}`);
      return { success: true, messageId, fallback: 'hello_world' };
    }

    console.error('[WA] ❌ STEP 2 hello_world FAILED. Trying plain text...');
    return sendTextMessage(to, { orderId: 'N/A', itemCount: 0, totalAmount: 0, tableNumber: '' });
  } catch (error) {
    console.error('[WA] ❌ STEP 2 Network/fetch error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback 2: Plain text message (only works within 24h conversation window).
 */
async function sendTextMessage(to, orderDetails) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiUrl = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;

  const text = [
    `Order Confirmed! #${orderDetails.orderId}`,
    `Items: ${orderDetails.itemCount}`,
    `Total: INR ${Number(orderDetails.totalAmount || 0).toFixed(2)}`,
    `Table: ${orderDetails.tableNumber || 'Takeaway'}`,
    '',
    'Thank you for your order!',
  ].join('\n');

  const messageBody = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };

  console.log('\n[WA] STEP 3: Sending plain text fallback...');
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
    console.log(`[WA] STEP 3 Response — HTTP ${res.status}`);
    console.log('[WA] STEP 3 Full response body:', JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error('[WA] ❌ STEP 3 text fallback FAILED. Full error:', JSON.stringify(data, null, 2));
      return { success: false, error: data.error?.message || `HTTP ${res.status}`, fullError: data };
    }

    const messageId = data.messages?.[0]?.id;
    console.log(`[WA] ✅ Text message SENT to ${to} | msgId: ${messageId}`);
    return { success: true, messageId };
  } catch (error) {
    console.error('[WA] ❌ STEP 3 Network/fetch error:', error.message);
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
