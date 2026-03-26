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
  guestPhone?: string;
}): Promise<ApiResponse<OrderData>> {
  try {
    console.log('Creating order with data:', orderData);

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('API Response:', result);

    return result;
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
}

// Sync order to POS via proxy
export async function syncOrderToProxy(orderData: {
  cartItems: (OrderItem & { gst_details?: { cgst: number; sgst: number; igst?: number; inclusive?: boolean } })[];
  billDetails: {
    total: number;
    subtotal: number;
    taxAmount: number;
    discount: number;
  };
  tableNumber?: string;
  guestPhone?: string;
}): Promise<ApiResponse<OrderData>> {
  try {
    const now = new Date();
    // Keep OrderId short (max 10 chars) to fit POS database column constraints
    const shortId = String(Date.now()).slice(-8);
    const orderId = `W${shortId}`;

    const posPayload = {
      outletId: "010",
      restaurantid: "210014",
      PosCode: "001",
      OrderId: orderId,
      OrderDate: now.toISOString(),
      TblNo: orderData.tableNumber || "12",
      guest: {
        phone: orderData.guestPhone || "",
      },
      subtotal: orderData.billDetails.subtotal,
      discountAmount: orderData.billDetails.discount,
      taxAmount: orderData.billDetails.taxAmount,
      totalAmount: orderData.billDetails.total,
      paymentMethod: "",
      currency: "INR",
      items: orderData.cartItems.map((item) => ({
        itemId: String(item.id),
        itemName: item.itemName,
        category: "",
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        modifiers: [],
        discountApplied: 0.0,
      })),
    };

    console.log("[FRONTEND] Syncing order to proxy via Next.js route:", JSON.stringify(posPayload, null, 2));

    const response = await fetch("/api/syncorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(posPayload),
    });

    console.log("[FRONTEND] Proxy response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("[FRONTEND] Proxy response:", JSON.stringify(result, null, 2));

    return { success: true, data: result };
  } catch (error) {
    console.error("[FRONTEND] Proxy sync error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync order to POS",
    };
  }
}
