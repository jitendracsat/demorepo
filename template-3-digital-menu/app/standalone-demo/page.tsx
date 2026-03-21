"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StandaloneDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateTestOrder = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: [
            {
              id: "1",
              itemName: "Butter Chicken",
              price: 12.99,
              quantity: 2,
              instruction: "Extra spicy"
            }
          ],
          billDetails: { total: 25.98 },
          tableNumber: "Table-01",
          paymentMethod: "PENDING"
        }),
      });

      const result = await response.json();
      
      if (result.success && result.orderId) {
        // Redirect to the bill page with the generated order ID
        router.push(`/bill/${result.orderId}`);
      } else {
        console.error('Order creation failed:', result);
        alert('Order creation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error creating test order:', error);
      alert('Error creating test order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Digital Receipt Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the digital receipt functionality with our standalone demo environment
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1: Test Order Creation */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Test Order Creation
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Click the button below to create a test order and automatically generate a digital receipt. 
                This simulates the complete order flow without requiring a real backend or payment processing.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>What happens:</strong> A mock order ID will be generated, and you'll be redirected 
                to the digital receipt page to view the result.
              </p>
            </div>

            <button
              onClick={handleCreateTestOrder}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Test Order...
                </>
              ) : (
                'Create Test Order'
              )}
            </button>
          </div>

          {/* Card 2: Manual Test */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Manual Test
              </h2>
              <p className="text-gray-600 leading-relaxed">
                You can also manually test the digital receipt by navigating directly to a bill URL. 
                This is useful for testing different order IDs and edge cases.
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Example routes to test:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><code className="bg-gray-200 px-2 py-1 rounded">/bill/test-ord-12345</code></li>
                <li><code className="bg-gray-200 px-2 py-1 rounded">/bill/demo-order-67890</code></li>
                <li><code className="bg-gray-200 px-2 py-1 rounded">/bill/any-custom-id</code></li>
              </ul>
            </div>

            <div className="text-sm text-gray-500">
              <p>Simply type these URLs in your browser address bar to test the receipt display functionality.</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">
            🧪 Testing Environment Info
          </h3>
          <p className="text-amber-800 text-sm leading-relaxed">
            This is a standalone testing environment that simulates the digital receipt functionality. 
            The mock API generates test order IDs and simulates the complete flow without requiring 
            real database connections or external services.
          </p>
        </div>
      </div>
    </div>
  );
}
