"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

      const result = await fetch('/api/demo-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      const data = await result.json();
      
      console.log('🔍 Full API Result:', data);
      console.log('🔍 Success check:', data.success);
      console.log('🔍 Order data:', data.orderData);
      
      // ✅ FIXED: Check for data.success and data.orderId
      if (data.success && data.orderId) {
        const newOrderId = data.orderId;
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
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Order Creation</h2>
          
          {!orderId ? (
            <div>
              <p className="text-gray-600 mb-4">
                Click the button below to create a test order. You'll be automatically redirected to view the digital receipt.
              </p>
              
              <button
                onClick={handleCreateTestOrder}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? "Creating Order & Redirecting..." : "Create Test Order"}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                <p className="text-green-600 text-sm">Order created successfully!</p>
                <p className="text-xs text-gray-600 mt-1">Order ID: {orderId}</p>
              </div>
              
              <a
                href={`/bill/${orderId}`}
                target="_blank"
                className="block w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
              >
                View Digital Receipt
              </a>
              
              <button
                onClick={() => setOrderId("")}
                className="w-full mt-3 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Create Another Order
              </button>
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
