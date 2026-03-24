// API utility functions for the digital menu

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://demorepo-63lo.onrender.com";

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
  posPayload?: any; // POS payload from backend
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
}): Promise<ApiResponse<OrderData>> {
  try {
    console.log('🚀 Creating order with data:', orderData);
    
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📦 API Response:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
}
