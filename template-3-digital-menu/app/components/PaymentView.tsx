"use client";

import { useState, useEffect } from "react";

export interface PaymentViewProps {
  isOpen: boolean;
  cartItems: any[];
  billDetails: any;
  onBack: () => void;
  onPaymentComplete: () => void;
}

export default function PaymentView({ isOpen, cartItems, billDetails, onBack, onPaymentComplete }: PaymentViewProps) {
  const [selectedMethod, setSelectedMethod] = useState<'table' | 'upi' | null>(null);
  // Naya state: UPI ke andar kaunsi app select ki hai
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'paytm' | 'phonepe' | null>(null);
  
  const [currentScreen, setCurrentScreen] = useState<'selection' | 'steward' | 'success'>('selection');

  // Sequential Transitions Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (currentScreen === 'steward') {
      timer = setTimeout(() => {
        setCurrentScreen('success');
      }, 3000);
    } else if (currentScreen === 'success') {
      timer = setTimeout(() => {
        onPaymentComplete();
      }, 3000);
    }

    return () => clearTimeout(timer);
  }, [currentScreen, onPaymentComplete]);

  if (!isOpen) return null;

  // --- SCREEN 1: Steward Message ---
  if (currentScreen === 'steward') {
    return (
      <div className="fixed inset-0 z-[500] bg-gradient-to-b from-[#5B899E] via-[#356175] to-[#0B4F6C] flex items-center justify-center p-10 text-center animate-in fade-in duration-500">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            A steward will collect payment shortly.
          </h2>
          <p className="text-white/80 text-sm font-medium">
            Thank you for ordering with us. See you again!
          </p>
        </div>
      </div>
    );
  }

  // --- SCREEN 2: Payment Success ---
  if (currentScreen === 'success') {
    return (
      <div className="fixed inset-0 z-[500] bg-gradient-to-b from-[#5B899E] via-[#356175] to-[#0B4F6C] flex items-center justify-center p-10 text-center animate-in fade-in duration-500">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Your payment is successful!
          </h2>
          <p className="text-white/80 text-sm font-medium">
            Thank you for ordering with us. See you again!
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN SCREEN: Payment Selection ---
  return (
    <div className="fixed inset-0 z-[400] bg-[#FAF7F2] overflow-y-auto">
      <div className="w-full max-w-[393px] mx-auto min-h-screen flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5">
          <button onClick={onBack} className="p-1 hover:bg-gray-200/50 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#4A4A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#4A4A4A] tracking-tight uppercase">PAYMENTS</h1>
        </div>

        <div className="flex-1 px-4 py-4">
          {/* Total Payable Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 flex justify-between items-center shadow-sm">
            <span className="text-gray-500 font-medium text-sm">Total Payable</span>
            <span className="text-[#0B4F6C] font-extrabold text-lg">
              ₹{billDetails?.total?.toFixed(2) || '0.00'}
            </span>
          </div>

          <h3 className="text-gray-500 font-bold text-xs tracking-widest uppercase mb-4 px-2">
            CHOOSE PAYMENT METHOD
          </h3>

          <div className="space-y-3">
            {/* Pay at Table */}
            <div 
              onClick={() => setSelectedMethod('table')}
              className={`bg-white rounded-xl border p-5 transition-all cursor-pointer ${
                selectedMethod === 'table' ? 'border-[#0B4F6C] ring-1 ring-[#0B4F6C]' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F0F5F7] rounded-lg flex items-center justify-center text-[#0B4F6C]">
                     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#4A4A4A] text-sm">Pay at Table</p>
                    <p className="text-[10px] text-gray-400">Cash / UPI - Handled by our staff</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'table' ? 'border-[#0B4F6C]' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'table' && <div className="w-2.5 h-2.5 rounded-full bg-[#0B4F6C]"></div>}
                </div>
              </div>
            </div>

            {/* Pay via UPI - Ab ye box expand hoga */}
            <div 
              onClick={() => setSelectedMethod('upi')}
              className={`bg-white rounded-xl border transition-all cursor-pointer overflow-hidden ${
                selectedMethod === 'upi' ? 'border-[#0B4F6C] ring-1 ring-[#0B4F6C]' : 'border-gray-200'
              }`}
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F0F5F7] rounded-lg flex items-center justify-center text-[#0B4F6C]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M12 18V6M6 12h12"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#4A4A4A] text-sm">Pay via UPI</p>
                    <p className="text-[10px] text-gray-400">Complete payment using your preferred app</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'upi' ? 'border-[#0B4F6C]' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-[#0B4F6C]"></div>}
                </div>
              </div>

              {/* UPI Sub-options (Drop-down effect) */}
              {selectedMethod === 'upi' && (
                <div className="px-5 pb-5 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="pt-3 border-t border-gray-100 space-y-2 mt-1">
                    
                    {/* Google Pay */}
                    <div 
                      onClick={(e) => { e.stopPropagation(); setSelectedUpiApp('gpay'); }}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${selectedUpiApp === 'gpay' ? 'border-[#0B4F6C] bg-[#F0F5F7]' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white shadow-sm border border-gray-100 flex items-center justify-center text-lg font-bold">
                           <span className="text-blue-500">G</span>
                        </div>
                        <span className="text-sm font-bold text-[#4A4A4A]">Google Pay</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedUpiApp === 'gpay' ? 'border-[#0B4F6C]' : 'border-gray-300'}`}>
                        {selectedUpiApp === 'gpay' && <div className="w-2 h-2 rounded-full bg-[#0B4F6C]"></div>}
                      </div>
                    </div>

                    {/* Paytm */}
                    <div 
                      onClick={(e) => { e.stopPropagation(); setSelectedUpiApp('paytm'); }}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${selectedUpiApp === 'paytm' ? 'border-[#0B4F6C] bg-[#F0F5F7]' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#002970] shadow-sm flex items-center justify-center">
                           <span className="text-white text-[9px] font-bold">Paytm</span>
                        </div>
                        <span className="text-sm font-bold text-[#4A4A4A]">Paytm</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedUpiApp === 'paytm' ? 'border-[#0B4F6C]' : 'border-gray-300'}`}>
                        {selectedUpiApp === 'paytm' && <div className="w-2 h-2 rounded-full bg-[#0B4F6C]"></div>}
                      </div>
                    </div>

                    {/* PhonePe */}
                    <div 
                      onClick={(e) => { e.stopPropagation(); setSelectedUpiApp('phonepe'); }}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${selectedUpiApp === 'phonepe' ? 'border-[#0B4F6C] bg-[#F0F5F7]' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#5f259f] shadow-sm flex items-center justify-center">
                           <span className="text-white text-[12px] font-bold">Pe</span>
                        </div>
                        <span className="text-sm font-bold text-[#4A4A4A]">PhonePe</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedUpiApp === 'phonepe' ? 'border-[#0B4F6C]' : 'border-gray-300'}`}>
                        {selectedUpiApp === 'phonepe' && <div className="w-2 h-2 rounded-full bg-[#0B4F6C]"></div>}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 pb-10 bg-[#FAF7F2]">
          <button 
            // Button tabhi enable hoga jab ya toh 'table' select ho, ya UPI ke andar koi app select ki gayi ho
            disabled={!selectedMethod || (selectedMethod === 'upi' && !selectedUpiApp)}
            onClick={() => {
              if (selectedMethod === 'table') {
                setCurrentScreen('steward');
              } else {
                // Yahan Razorpay ka logic aayega future mein
                console.log("Selected UPI App:", selectedUpiApp); 
                setCurrentScreen('success'); 
              }
            }}
            className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-md active:scale-95 ${
              (selectedMethod === 'table' || (selectedMethod === 'upi' && selectedUpiApp))
                ? 'bg-[#0B4F6C] text-white hover:bg-[#093d52]' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}