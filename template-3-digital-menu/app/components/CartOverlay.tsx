"use client";

import { useState } from "react";
import InstructionsOverlay from "./InstructionsOverlay"; 

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description?: string;
  isOffer?: boolean;
  hasCustomizations?: boolean;
  instructions?: string;
  discountApplied?: number; // POS item-level discount
  gst_details?: {
    cgst: number;
    sgst: number;
    igst?: number;
    inclusive?: boolean;
  };
}

export interface CartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  // ✨ FIX: Accept cart items & updater from parent
  cartItems: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  handleSaveInstructions: (id: string, text: string) => void;
  onPlaceOrder: (items: any[], bill: any) => void;
}

export default function CartOverlay({ 
  isOpen, onClose, cartItems, updateQuantity, handleSaveInstructions, onPlaceOrder 
}: CartOverlayProps) {
  const [activeInstructionItem, setActiveInstructionItem] = useState<CartItem | null>(null);

  // Bill Calculations
  console.log('Current Cart Items with Tax Info:', cartItems);
  const itemSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Dynamic tax calculation based on GST details
  const taxesAndCharges = cartItems.reduce((totalTax, item) => {
    const itemTaxPercent = (item.gst_details?.cgst || 0) + (item.gst_details?.sgst || 0) + (item.gst_details?.igst || 0);
    const itemTaxAmount = (item.price * item.quantity) * (itemTaxPercent / 100);
    return totalTax + itemTaxAmount;
  }, 0);
  
  // Calculate discount from real POS data (item-level discounts)
  const discount = cartItems.reduce((totalDiscount, item) => {
    const itemDiscount = item.discountApplied || 0;
    return totalDiscount + itemDiscount;
  }, 0);
  const totalSavings = discount;
  const totalAmount = itemSubtotal > 0 ? Math.max(0, itemSubtotal + taxesAndCharges - discount) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] w-full sm:max-w-[393px] mx-auto flex flex-col justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/60 transition-opacity pointer-events-auto" onClick={onClose} />
      <div className="relative w-full bg-[#FAF7F2] rounded-t-[24px] shadow-2xl animate-in slide-in-from-bottom-full duration-300 h-[90vh] flex flex-col box-border overflow-hidden pointer-events-auto">
        
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-200/60 bg-[#FAF7F2] rounded-t-[24px] flex-shrink-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[18px] font-bold text-[#333333] tracking-wide">YOUR CART</h1>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 active:scale-95 transition-all">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="#333333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E6EDF3] rounded-full">
             <span className="text-[11px] font-semibold text-[#0B4F6C]">Table No. 12</span>
          </div>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar bg-[#FAF7F2] pb-6 px-5 pt-4">
          <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">SELECTED ITEMS</h2>
          <div className="flex flex-col gap-3">
            {cartItems.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 font-inter">Your cart is empty</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="relative">
                  {item.isOffer && (
                    <div className="absolute -top-2 left-4 px-3 py-0.5 bg-[#D4E4D4] rounded-t-lg border border-[#C5D5C5] border-b-0 z-10">
                      <span className="text-[10px] font-bold text-[#4A644A]">Your offer</span>
                    </div>
                  )}
                  <div className={`relative p-3 rounded-xl border shadow-sm ${item.isOffer ? 'bg-[#F2F7F9] border-[#D0E3EA] mt-1.5' : 'bg-white border-gray-100'}`}>
                    <div className="flex gap-3">
                      <div className="w-[60px] h-[60px] rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <h3 className="font-bold text-[14px] text-[#0B4F6C] leading-tight truncate">{item.name}</h3>
                          <div className="flex items-center gap-3 px-2 py-1 bg-white rounded-full border border-gray-200 shadow-sm flex-shrink-0">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-[#0B4F6C] hover:text-black">-</button>
                            <span className="text-[12px] font-bold text-[#333333] min-w-[8px] text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-[#0B4F6C] hover:text-black">+</button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="font-bold text-[13px] text-[#333333]">₹{item.price}</span>
                        </div>
                        {item.description && <p className="text-[11px] text-[#0B4F6C] opacity-70 leading-snug line-clamp-2">{item.description}</p>}
                        {item.instructions && (
                          <div className="mt-1.5 p-2 bg-[#FAF7F2] rounded-lg border border-dashed border-gray-300">
                            <span className="text-[10px] text-[#0B4F6C] font-semibold block mb-0.5">Instructions:</span>
                            <p className="text-[11px] text-gray-600 line-clamp-2 italic">"{item.instructions}"</p>
                          </div>
                        )}
                        {item.hasCustomizations && (
                          <div className="mt-2">
                            <div className="flex gap-2 mt-1.5">
                              <button onClick={() => setActiveInstructionItem(item)} className="flex-1 py-1.5 bg-[#F4F4F4] rounded-full text-[10px] font-semibold text-gray-500">📝 Instructions</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Summary */}
          {totalSavings > 0 && cartItems.length > 0 && (
            <div className="mt-5 mb-2 flex justify-center">
              <div className="px-5 py-2.5 bg-[#D5E3E9] rounded-lg border border-[#B8D0DB]">
                <span className="text-[13px] font-bold text-[#0B4F6C]">You saved ₹{totalSavings.toFixed(2)} on this order!</span>
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-200/80">
            <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-4">BILL SUMMARY</h2>
            <div className="space-y-3 font-inter">
              <div className="flex justify-between items-center text-[13px]"><span className="text-[#0B4F6C] opacity-80">Item subtotal</span><span className="text-gray-900 font-medium">₹{itemSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-[13px]"><span className="text-[#0B4F6C] opacity-80">Taxes & Charges</span><span className="text-gray-900 font-medium">₹{taxesAndCharges.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-[13px]"><span className="text-[#0B4F6C] opacity-80">Discount offer</span><span className="text-gray-900 font-medium">-₹{discount.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-[13px]"><span className="text-[#7A8D3D] font-bold">Total Savings</span><span className="text-[#7A8D3D] font-bold">-₹{totalSavings.toFixed(2)}</span></div>
              <div className="w-full border-t border-gray-200/80 my-1"></div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm"><span className="font-bold text-[14px] text-[#0B4F6C]">Total Amount</span><span className="font-bold text-[16px] text-gray-900">₹{totalAmount.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex-shrink-0 w-full bg-[#FAF7F2] p-5 pt-2 border-t border-gray-200/60 z-10 box-border">
          <div className="bg-[#0B4F6C] rounded-[16px] p-4 flex items-center justify-between shadow-lg">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white/70 tracking-wider mb-0.5">TOTAL AMOUNT</span>
              <span className="text-[18px] font-bold text-white leading-tight">₹{totalAmount.toFixed(2)}</span>
            </div>
            <button 
              disabled={cartItems.length === 0}
              onClick={() => onPlaceOrder(cartItems, { subtotal: itemSubtotal, taxAmount: taxesAndCharges, discountAmount: discount, total: totalAmount })}
              className={`px-5 py-2.5 rounded-full flex items-center gap-1.5 transition-all shadow-sm ${cartItems.length > 0 ? 'bg-white active:scale-95' : 'bg-gray-300 opacity-50'}`}
            >
              <span className={`font-bold text-[14px] ${cartItems.length > 0 ? 'text-[#0B4F6C]' : 'text-gray-500'}`}>Place Order</span>
            </button>
          </div>
        </div>
      </div>

      {activeInstructionItem && (
        <InstructionsOverlay 
          isOpen={!!activeInstructionItem} 
          onClose={() => setActiveInstructionItem(null)} 
          itemName={activeInstructionItem.name} 
          initialInstructions={activeInstructionItem.instructions || ""}
          onSave={(text) => {
            handleSaveInstructions(activeInstructionItem.id, text);
            setActiveInstructionItem(null);
          }} 
        />
      )}
    </div>
  );
}