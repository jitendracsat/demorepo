import { NextRequest, NextResponse } from 'next/server';

// Mock order counter for generating sequential test IDs
let orderCounter = 12345;

export async function POST(request: NextRequest) {
  try {
    // Parse the request body (optional, just for demo purposes)
    const body = await request.json();
    console.log('🧪 Mock API: Received order request:', body);

    // Generate a mock order ID
    const orderId = `test-ord-${orderCounter++}`;
    
    // Simulate SMS gateway trigger
    const receiptUrl = `http://localhost:3000/bill/${orderId}`;
    const dummyPhoneNumber = '+91-98765-43210';
    
    console.log('📱 Simulating SMS Gateway Trigger:');
    console.log(`   To: ${dummyPhoneNumber}`);
    console.log(`   Message: Your digital receipt is ready! View your order details: ${receiptUrl}`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log('✅ SMS sent successfully (simulated)');

    // Simulate some processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return success response with the generated order ID
    return NextResponse.json({
      success: true,
      orderId: orderId,
      message: 'Test order created successfully',
      timestamp: new Date().toISOString(),
      // Include some mock order data for testing
      orderData: {
        id: orderId,
        status: 'RECEIVED',
        totalAmount: body.billDetails?.total || 25.98,
        itemCount: body.cartItems?.length || 1,
        tableNumber: body.tableNumber || 'Table-01'
      }
    });

  } catch (error) {
    console.error('❌ Mock API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create test order',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: Add GET method for testing the API endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Demo Order API is working!',
    usage: 'Send a POST request to create a test order',
    endpoint: '/api/demo-order',
    method: 'POST'
  });
}
