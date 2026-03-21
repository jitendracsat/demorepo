"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, CheckCircle, Store, Table, Receipt, ArrowLeft } from "lucide-react";
import { fetchBill, type OrderData } from "../utils/api";

export default function DigitalReceipt() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBillData = async () => {
      try {
        setLoading(true);
        const result = await fetchBill(orderId);
        
        if (result.success && result.bill) {
          setOrderData(result.bill);
        } else {
          throw new Error(result.error || result.message || 'Failed to fetch bill');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchBillData();
    }
  }, [orderId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Receipt Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load your receipt'}</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-md mx-auto">
        {/* Receipt Container */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Receipt Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Store className="h-6 w-6" />
                <span className="text-sm font-medium">Digital Receipt</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-sm text-green-300">Paid</span>
              </div>
            </div>
            
            {/* Restaurant & Outlet Info */}
            <div className="space-y-2 text-sm">
              {orderData.restaurantId && (
                <div className="flex justify-between">
                  <span className="text-blue-100">Restaurant ID:</span>
                  <span className="font-mono">{orderData.restaurantId}</span>
                </div>
              )}
              {orderData.outletId && (
                <div className="flex justify-between">
                  <span className="text-blue-100">Outlet ID:</span>
                  <span className="font-mono">{orderData.outletId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Table className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Table: {orderData.tableNumber || 'Takeaway'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatDate(orderData.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Order ID</div>
              <div className="font-mono text-sm text-gray-700">{orderData.id}</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
            <div className="space-y-3">
              {orderData.items.map((item, index) => (
                <div key={item.id || index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.itemName}</div>
                    <div className="text-sm text-gray-500">
                      {item.quantity} × {formatCurrency(item.price)}
                    </div>
                    {item.instruction && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        Note: {item.instruction}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(item.quantity * item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Section */}
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">{formatCurrency(orderData.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="text-gray-900">—</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {formatCurrency(orderData.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 p-6 text-center">
            <div className="mb-4">
              <div className="text-green-600 font-semibold text-lg mb-2">Thank You!</div>
              <div className="text-sm text-gray-600">Visit us again soon</div>
            </div>
            
            <div className="text-xs text-gray-400 space-y-1">
              <div>This is a digitally generated receipt</div>
              <div>Generated on {formatDate(new Date().toISOString())}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button 
            onClick={() => window.print()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Receipt className="h-5 w-5" />
            <span>Print Receipt</span>
          </button>
          
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
