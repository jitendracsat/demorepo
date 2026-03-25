"use client";

import { useState, useEffect } from "react";

export interface OrderSuccessProps {
  cartItems: any[];
  billDetails: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  };
  // Naya prop add kiya hai jisse backend se time set kar sako (default 20 mins)
  estimatedTimeMinutes?: number; 
  onBackToMenu: () => void;
  onViewBill: () => void;
}

export default function OrderSuccessView({ 
  cartItems, 
  billDetails, 
  estimatedTimeMinutes = 20, 
  onBackToMenu, 
  onViewBill 
}: OrderSuccessProps) {
  
  // Dynamic Timer Logic
  const [timeLeft, setTimeLeft] = useState(estimatedTimeMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayMinutes = String(minutes).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[400] bg-[#F2F7F9] overflow-y-auto">
      <div className="min-h-screen w-full max-w-[393px] mx-auto px-6 py-8 flex flex-col">
        
        {/* Top Section - Success & Timer */}
        <div className="flex flex-col items-center mb-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-[#0B4F6C] rounded-full flex items-center justify-center mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-[#0B4F6C] mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 text-center">Your order is sent to our kitchen!</p>
        </div>

        {/* Timer Card - DYNAMIC */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <p className="text-sm text-gray-600 text-center mb-4 font-semibold tracking-wider">ESTIMATED TO BE READY IN</p>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-blue-50 rounded-lg p-4 min-w-[80px] text-center border border-blue-100">
              <p className="text-3xl font-bold text-[#0B4F6C]">{displayMinutes}</p>
              <p className="text-[10px] text-gray-500 font-bold mt-1">MINUTES</p>
            </div>
            <span className="text-2xl font-bold text-[#0B4F6C] animate-pulse">:</span>
            <div className="bg-blue-50 rounded-lg p-4 min-w-[80px] text-center border border-blue-100">
              <p className="text-3xl font-bold text-[#0B4F6C]">{displaySeconds}</p>
              <p className="text-[10px] text-gray-500 font-bold mt-1">SECONDS</p>
            </div>
          </div>
        </div>

        {/* Order Details Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-500 tracking-widest">ORDER DETAILS</h2>
            <span className="text-xs font-bold text-[#0B4F6C] bg-blue-50 px-2 py-1 rounded">#ORD-8831</span>
          </div>
          
          <div className="space-y-3">
            {cartItems.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-3 flex items-center gap-4 shadow-sm border border-gray-100">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-[#4A4A4A]">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <div className="text-sm font-bold text-[#0B4F6C]">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- RESTORED: Bill Details Section --- */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-500 tracking-widest mb-4">BILL SUMMARY</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="font-bold text-[#4A4A4A]">₹{billDetails.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Taxes & Charges</span>
                <span className="font-bold text-[#4A4A4A]">₹{billDetails.taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Total Savings</span>
                <span className="font-bold text-green-600">₹{billDetails.discountAmount.toFixed(2)}</span>
              </div>
              
              {/* Dashed Divider for a receipt feel */}
              <div className="border-t border-dashed border-gray-200 my-3"></div>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#4A4A4A]">Total Amount</span>
                <span className="text-lg font-black text-[#0B4F6C]">₹{billDetails.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        {/* Footer Buttons */}
        <div className="flex gap-4 mt-4">
          <button 
            onClick={onBackToMenu}
            className="flex-1 bg-white text-[#0B4F6C] py-4 rounded-xl font-bold border-2 border-[#0B4F6C] hover:bg-blue-50 transition-colors shadow-sm"
          >
            Back to menu
          </button>
          
          <button 
            onClick={onViewBill}
            className="flex-1 bg-[#0B4F6C] text-white py-4 rounded-xl font-bold hover:bg-[#093d52] transition-colors shadow-md"
          >
            View Bill
          </button>
        </div>
      </div>
    </div>
  );
}