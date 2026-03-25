/**
 * WhatsApp Business API Service
 * Uses Official Meta Graph API v18.0
 *
 * Env vars required:
 *   WHATSAPP_TOKEN          – Meta permanent/temporary access token
 *   WHATSAPP_PHONE_NUMBER_ID – Phone Number ID from Meta dashboard
 */

const API_VERSION = 'v18.0';

/**
 * Ensure phone is in international format: 91xxxxxxxxxx (no +, no spaces, no dashes)
 * If no country code detected, defaults to India (+91).
 */
function formatToInternational(phone) {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, '');

  // Already has country code (10+ digits starting with non-zero)
  if (digits.length > 10) return digits;

  // Indian 10-digit number → prepend 91
  if (digits.length === 10) return `91${digits}`;

  // Return as-is if it's some other format
  return digits;
}

/**
 * Send a template-based WhatsApp message (order confirmation).
 * Falls back to mock if credentials are missing.
 *
 * @param {string} phoneNumber  – Customer phone (any format, will be normalised)
 * @param {object} orderDetails – { orderId, totalAmount, tableNumber, itemCount }
 */
export async function sendOrderConfirmation(phoneNumber, orderDetails) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const to = formatToInternational(phoneNumber);

  if (!token || !phoneNumberId || token === 'YOUR_META_ACCESS_TOKEN_HERE') {
    console.log(`[WhatsApp Mock] Order confirmation to ${to} | Order: ${orderDetails.orderId}`);
    return { success: true, mock: true, messageId: 'mock-' + Date.now() };
  }

  const apiUrl = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;

  // Template message — uses a pre-approved template on your WABA.
  // If you haven't created one yet, we fall back to a plain text message.
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

    if (!res.ok) {
      // If template not found, retry with plain text
      if (data.error?.code === 132000 || data.error?.message?.includes('template')) {
        console.log('[WhatsApp] Template not found, falling back to text message');
        return sendTextMessage(to, orderDetails);
      }
      console.error('[WhatsApp] API Error:', data.error);
      return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    }

    const messageId = data.messages?.[0]?.id;
    console.log(`[WhatsApp] Order confirmation sent to ${to} | msgId: ${messageId}`);
    return { success: true, messageId };
  } catch (error) {
    console.error('[WhatsApp] Network error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback: Send a plain text message if the template isn't approved yet.
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

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[WhatsApp] Text fallback error:', data.error);
      return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    }

    const messageId = data.messages?.[0]?.id;
    console.log(`[WhatsApp] Text message sent to ${to} | msgId: ${messageId}`);
    return { success: true, messageId };
  } catch (error) {
    console.error('[WhatsApp] Text fallback network error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Legacy export — kept for backward compat with orderController.js
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
