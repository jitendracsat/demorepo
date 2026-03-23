"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "../utils/api";

export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleCreateTestOrder = async () => {
    setLoading(true);
    setError("");
    
    try {
      const orderData = {
        cartItems: [
          {
            id: "1",
            itemId: "1",
            itemName: "Butter Chicken",
            price: 12.99,
            quantity: 2,
            instructions: "Extra spicy"
          },
          {
            id: "2",
            itemId: "2", 
            itemName: "Garlic Naan",
            price: 3.99,
            quantity: 4,
            instructions: ""
          }
        ],
        billDetails: {
          total: 41.94
        },
        tableNumber: "A-12",
        paymentMethod: "CASH",
        restaurantId: "REST001",
        outletId: "OUT001"
      };

      const data = await createOrder(orderData);
      
      console.log('🔍 Full API Result:', data);
      console.log('🔍 Success check:', data.success);
      console.log('🔍 Order data:', data.order);
      
      // ✅ FIXED: Check for data.success and data.order.id
      if (data.success && data.order) {
        const newOrderId = data.order.id;
        console.log('✅ Order created successfully with ID:', newOrderId);
        setOrderId(newOrderId);
        
        // 🚀 AUTO-REDIRECT: Immediately redirect to bill page
        console.log('🚀 Redirecting to:', `/bill/${newOrderId}`);
        router.push(`/bill/${newOrderId}`);
      } else {
        console.log('❌ Order creation failed:', data);
        setError(data.error || "Failed to create order");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Digital Receipt Demo</h1>
        
        {/* Test Order Creation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Test Order</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to create a test order and see the digital receipt system in action.
          </p>
          <button
            onClick={handleCreateTestOrder}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Creating Order...' : 'Create Test Order'}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {orderId && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              <p className="font-semibold">Order Created Successfully!</p>
              <p className="text-sm">Order ID: {orderId}</p>
              <p className="text-sm">You should be redirected automatically...</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Test</h2>
          <p className="text-gray-600 mb-4">
            Or manually visit: <code className="bg-gray-100 px-2 py-1 rounded text-sm">/bill/[order-id]</code>
          </p>
          <p className="text-xs text-gray-500">
            Use the order ID from the test above or any valid order ID from your database.
          </p>
        </div>
      </div>
    </div>
  );
}
