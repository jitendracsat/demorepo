// API utility functions for the digital menu

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demorepo-63lo.onrender.com";

console.log('[API] ENV CHECK:', {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '(NOT SET — using fallback)',
  API_BASE_URL_RESOLVED: API_BASE_URL,
});

export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  instruction?: string;
}

export interface OrderData {
  id: string;
  restaurantId?: string;
  outletId?: string;
  tableNumber?: string;
  totalAmount: number;
  paymentMethod?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  bill?: T;
  order?: T;
  orderId?: string;           // DB UUID (from createOrder response)
  externalOrderId?: string;   // POS-facing Order ID (e.g. B0644259)
  posPayload?: any;
  error?: string;
}

// Fetch bill by order ID
export async function fetchBill(orderId: string): Promise<ApiResponse<OrderData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bill'
    };
  }
}

// Health check
export async function healthCheck(): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

// Verify OTP for an order
export async function verifyOtp(orderId: string, userOtp: string): Promise<ApiResponse<OrderData>> {
  try {
    const url = `${API_BASE_URL}/api/orders/verify-otp`;
    const body = JSON.stringify({ orderId, userOtp });

    console.log('[API] >>> verifyOtp() REQUEST <<<');
    console.log('[API] URL:', url);
    console.log('[API] Body:', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const result = await response.json();

    console.log('[API] >>> verifyOtp() RESPONSE <<<');
    console.log('[API] HTTP status:', response.status);
    console.log('[API] Body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      return { success: false, error: result.message || `HTTP ${response.status}` };
    }

    return result;
  } catch (error) {
    console.error('[API] verifyOtp() ERROR:', error instanceof Error ? error.message : error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify OTP'
    };
  }
}

// Create a new order
export async function createOrder(orderData: {
  cartItems: OrderItem[];
  billDetails: {
    total: number;
    subtotal: number;
    taxAmount: number;
    discount: number;
  };
  tableNumber?: string;
  paymentMethod?: string;
  restaurantId?: string;
  outletId?: string;
  guestPhone?: string;
}): Promise<ApiResponse<OrderData>> {
  try {
    const url = `${API_BASE_URL}/api/orders`;
    const body = JSON.stringify(orderData);

    console.log('[API] ============================================');
    console.log('[API] >>> createOrder() REQUEST <<<');
    console.log('[API] URL:', url);
    console.log('[API] Method: POST');
    console.log('[API] Request body:', body);
    console.log('[API] ============================================');

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    const elapsed = Date.now() - startTime;
    const result = await response.json();

    console.log('[API] ============================================');
    console.log('[API] >>> createOrder() RESPONSE <<<');
    console.log('[API] HTTP status:', response.status);
    console.log('[API] Response time:', elapsed, 'ms');
    console.log('[API] Response body:', JSON.stringify(result, null, 2));
    console.log('[API] ============================================');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('[API] createOrder() ERROR:', error instanceof Error ? error.message : error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
}
