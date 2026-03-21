/**
 * WhatsApp Business API Service
 * Uses Official Meta Graph API to send digital receipt links
 */

interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
}

export async function sendWhatsAppReceipt(
  phoneNumber: string,
  receiptUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Check if Meta credentials are available
    if (!process.env.META_ACCESS_TOKEN || !process.env.META_PHONE_NUMBER_ID) {
      console.log(`Mock WhatsApp Sent to: ${phoneNumber} Link: ${receiptUrl}`);
      return { success: true, messageId: 'mock-message-id' };
    }

    // Prepare the Meta Graph API request
    const apiUrl = `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID}/messages`;
    
    const messageBody = {
      messaging_product: "whatsapp",
      to: phoneNumber.replace(/[^\d]/g, ''), // Remove non-digit characters
      type: "text",
      text: {
        body: `Here is your digital receipt: ${receiptUrl}`
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('WhatsApp API Error:', errorData);
      return { 
        success: false, 
        error: `WhatsApp API Error: ${response.status} ${response.statusText}` 
      };
    }

    const data: WhatsAppMessageResponse = await response.json();
    
    if (data.messages && data.messages.length > 0) {
      console.log(`✅ WhatsApp message sent successfully to ${phoneNumber}, Message ID: ${data.messages[0].id}`);
      return { 
        success: true, 
        messageId: data.messages[0].id 
      };
    } else {
      console.error('Unexpected WhatsApp API response:', data);
      return { 
        success: false, 
        error: 'Unexpected response from WhatsApp API' 
      };
    }

  } catch (error) {
    console.error('WhatsApp service error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
