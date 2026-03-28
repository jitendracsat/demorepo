import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:5000';

// Test order data
const testOrder = {
  cartItems: [
    {
      id: "ITEM001",
      itemName: "Test Burger",
      category: "Food",
      quantity: 1,
      price: 299
    }
  ],
  billDetails: {
    subtotal: 299,
    discount: 0,
    taxAmount: 54,
    total: 353
  },
  tableNumber: "T1",
  paymentMethod: "CASH",
  outletId: "020",
  restaurantId: "240018",
  posCode: "REST",
  guestId: "GUEST001",
  guestName: "Test User",
  guestPhone: "6395905793",
  guestEmail: "test@example.com"
};

async function testOrderFlow() {
  console.log('🚀 Starting webhook test...\n');

  try {
    // Step 1: Create order
    console.log('📝 Step 1: Creating test order...');
    const createResponse = await fetch(`${BACKEND_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder)
    });
    
    const createData = await createResponse.json();
    console.log('✅ Order created:', JSON.stringify(createData, null, 2));
    
    if (!createData.success) {
      throw new Error('Failed to create order');
    }

    const orderId = createData.orderId;
    const externalOrderId = createData.externalOrderId;
    
    console.log(`📋 Order ID (UUID): ${orderId}`);
    console.log(`📋 External Order ID (POS): ${externalOrderId}\n`);

    // Step 2: Verify OTP
    console.log('🔐 Step 2: Verifying OTP (0000)...');
    const verifyResponse = await fetch(`${BACKEND_URL}/api/orders/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        userOtp: '0000'
      })
    });
    
    const verifyData = await verifyResponse.json();
    console.log('✅ OTP verified:', JSON.stringify(verifyData, null, 2));
    
    if (!verifyData.success) {
      throw new Error('Failed to verify OTP');
    }

    // Step 3: Wait a bit then test webhook
    console.log('\n⏳ Waiting 2 seconds before webhook test...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Test webhook status update (Query params method)
    console.log('🔄 Step 4: Testing webhook status update (Query params)...');
    console.log(`📤 Sending: ${BACKEND_URL}/api/order/status?orderId=${externalOrderId}&status=1`);
    
    const webhookResponse = await fetch(`${BACKEND_URL}/api/order/status?orderId=${externalOrderId}&status=1`, {
      method: 'GET'
    });
    
    const webhookData = await webhookResponse.json();
    console.log('✅ Webhook response:', JSON.stringify(webhookData, null, 2));

    // Step 5: Test JSON body webhook method
    console.log('\n🔄 Step 5: Testing webhook status update (JSON body)...');
    
    const jsonWebhookResponse = await fetch(`${BACKEND_URL}/api/orders/status-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        OrderId: externalOrderId,
        Status: 2 // REJECTED
      })
    });
    
    const jsonWebhookData = await jsonWebhookResponse.json();
    console.log('✅ JSON Webhook response:', JSON.stringify(jsonWebhookData, null, 2));

    console.log('\n🎉 Test completed! Check the backend logs for socket emissions.');
    console.log('🔍 Look for: "[WEBHOOK] Emitting ORDER_STATUS_CHANGED:" messages');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOrderFlow();
