"use client";

import { useState, useEffect } from "react";
import { getSocket } from "../lib/socket";

export interface OrderSuccessProps {
  cartItems: any[];
  billDetails: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  };
  orderId?: string;
  dbId?: string;
  estimatedTimeMinutes?: number;
  onBackToMenu: () => void;
  onViewBill: () => void;
}

// Status config: icon, colors, title, subtitle, showTimer
const STATUS_CONFIG: Record<string, { bg: string; title: string; subtitle: string; showTimer: boolean; icon: 'spinner' | 'check' | 'cross' | 'bell' }> = {
  '0': {
    bg: 'bg-[#0B4F6C]',
    title: 'Order Placed',
    subtitle: 'Waiting for the restaurant to accept your order...',
    showTimer: true,
    icon: 'spinner',
  },
  '1': {
    bg: 'bg-green-500',
    title: 'Order Accepted!',
    subtitle: 'Your order is sent to our kitchen!',
    showTimer: true,
    icon: 'check',
  },
  '2': {
    bg: 'bg-red-500',
    title: 'Order Rejected',
    subtitle: 'Sorry, the restaurant cannot fulfill your order right now.',
    showTimer: false,
    icon: 'cross',
  },
  '3': {
    bg: 'bg-orange-400',
    title: 'Food is Ready!',
    subtitle: 'The kitchen has finished preparing your order.',
    showTimer: true,
    icon: 'bell',
  },
  '4': {
    bg: 'bg-green-500',
    title: 'Order Ready to Serve!',
    subtitle: 'Your food is ready to be brought to your table.',
    showTimer: false,
    icon: 'check',
  },
  '5': {
    bg: 'bg-green-500',
    title: 'Order Delivered!',
    subtitle: 'Enjoy your meal!',
    showTimer: false,
    icon: 'check',
  },
};

// Normalize both numeric strings ("1") and word strings ("ACCEPTED") to the STATUS_CONFIG keys
function normalizeStatus(raw: string): string {
  const map: Record<string, string> = {
    '0': '0', 'PLACED': '0',
    '1': '1', 'ACCEPTED': '1',
    '2': '2', 'REJECTED': '2',
    '3': '3', 'FOOD_READY': '3',
    '4': '4', 'SERVED': '4',
    '5': '5', 'DELIVERED': '5',
  };
  return map[raw.toUpperCase()] || '0';
}

export default function OrderSuccessView({
  cartItems,
  billDetails,
  orderId = '',
  dbId = '',
  estimatedTimeMinutes = 20,
  onBackToMenu,
  onViewBill
}: OrderSuccessProps) {

  const [currentStatus, setCurrentStatus] = useState("0");

  // Listen for real-time status updates from POS
  useEffect(() => {
    const socket = getSocket();

    const handleStatusChange = (data: { orderId?: string; OrderId?: string; dbId?: string; status?: string }) => {
      const incomingId = data.orderId || data.OrderId || '';
      const incomingDbId = data.dbId || '';
      const incomingStatus = String(data.status || '');

      console.log('--- [STAGE 4] FRONTEND: Received Order Status via Socket ---');
      console.log('[STAGE 4] Raw socket data:', JSON.stringify(data));
      console.log('[STAGE 4] Comparing — ours:', orderId, '(dbId:', dbId, ') | incoming orderId:', incomingId, '| incoming dbId:', incomingDbId);

      const isMatch = incomingId === orderId || incomingDbId === orderId
        || (dbId && (incomingId === dbId || incomingDbId === dbId));
      if (isMatch) {
        const mapped = normalizeStatus(incomingStatus);
        console.log('[STAGE 4] Status MATCHED! Raw:', incomingStatus, '→ Mapped:', mapped);
        setCurrentStatus(mapped);
      } else {
        console.log('[STAGE 4] Status IGNORED — orderId mismatch');
      }
    };

    socket.on('ORDER_STATUS_CHANGED', handleStatusChange);
    console.log('--- [STAGE 4] FRONTEND: Checking Order Status ---');
    console.log('[STAGE 4] Listening for ORDER_STATUS_CHANGED | orderId:', orderId);

    return () => {
      socket.off('ORDER_STATUS_CHANGED', handleStatusChange);
    };
  }, [orderId, dbId]);

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

  // Get current status config
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['0'];

  return (
    <div className="fixed inset-0 z-[400] bg-[#F2F7F9] overflow-y-auto">
      <div className="min-h-screen w-full max-w-[393px] mx-auto px-6 py-8 flex flex-col">

        {/* Top Section - Dynamic Status */}
        <div className="flex flex-col items-center mb-8">
          {/* Status Icon */}
          <div className={`w-20 h-20 ${config.bg} rounded-full flex items-center justify-center mb-4 transition-colors duration-500`}>
            {config.icon === 'spinner' && (
              <svg className="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3" fill="none"/>
                <path d="M12 2C6.48 2 2 6.48 2 12" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
              </svg>
            )}
            {config.icon === 'check' && (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {config.icon === 'cross' && (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {config.icon === 'bell' && (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#0B4F6C] mb-2">{config.title}</h1>
          <p className="text-gray-600 text-center">{config.subtitle}</p>
        </div>

        {/* Timer Card - Only visible for statuses that show timer */}
        {config.showTimer && (
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
        )}

        {/* Order Details Section — UNTOUCHED */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-500 tracking-widest">ORDER DETAILS</h2>
            <span className="text-xs font-bold text-[#0B4F6C] bg-blue-50 px-2 py-1 rounded">#{orderId || 'ORD-0000'}</span>
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

        {/* --- Bill Details Section — UNTOUCHED --- */}
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
