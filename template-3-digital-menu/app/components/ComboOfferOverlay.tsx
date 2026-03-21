"use client";

import { useState, useEffect } from "react";

interface ComboOfferOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComboOfferOverlay({ isOpen, onClose }: ComboOfferOverlayProps) {
  const [selectedDrink, setSelectedDrink] = useState("Coke classic");
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset success state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setIsSuccess(false), 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGotIt = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[200] flex ${isSuccess ? 'items-center justify-center p-4' : 'justify-center items-end'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />
      
      {!isSuccess ? (
        // ==========================================
        // 1. CONSISTENT COMBO UI (BOTTOM SHEET)
        // ==========================================
        // ✨ FIX: Changed `max-w-[393px]` to `w-full sm:max-w-[393px]` 
        // This makes it take 100% width on all mobiles, but caps it on desktop
        <div className="relative w-full sm:max-w-[393px] bg-[#FAF7F2] rounded-t-[24px] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl overflow-hidden box-border">
          
          {/* Drag Handle (Fixed at top) */}
          <div className="flex-shrink-0 w-full flex justify-center pt-3 pb-2 bg-[#FAF7F2] z-10">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 w-full overflow-y-auto px-5 pb-4 no-scrollbar bg-[#FAF7F2] box-border">
            
            {/* Top Combo Image */}
            <div className="w-full h-[180px] rounded-[16px] overflow-hidden shadow-sm mb-4">
              <img 
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" 
                alt="Combo Meal Burger"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Price Row */}
            <div className="flex justify-between items-start mb-2 w-full">
              {/* min-w-0 prevents text from pushing the width out of bounds */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Small Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&q=80" 
                    alt="Combo Icon"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Text Block */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-playfair font-bold text-[18px] text-[#333333] leading-tight mb-0.5 truncate">Combo Meal</h2>
                  <p className="text-[12px] text-[#0B4F6C] opacity-80 leading-snug line-clamp-2">
                    Signature chicken burger, crispy fries and a chilled coke.
                  </p>
                </div>
              </div>
              
              {/* Price Block */}
              <div className="flex flex-col items-end flex-shrink-0 pl-3">
                <span className="font-inter font-bold text-[18px] text-[#0B4F6C]">₹250</span>
                <span className="font-inter text-[12px] text-gray-400 line-through">₹300</span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-gray-200/70 my-4"></div>

            {/* What's included Section */}
            <div className="pb-4 w-full">
              <h3 className="font-inter font-bold text-[14px] text-[#333333] mb-3">What's included</h3>
              
              <div className="w-full flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {/* Card 1 */}
                <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex-shrink-0 w-[140px]">
                  <div className="w-[28px] h-[28px] rounded-full bg-[#FAF7F2] flex items-center justify-center border border-gray-50 shadow-inner flex-shrink-0">
                    <span className="text-[13px]">🍔</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-semibold text-[#333333] truncate">Chicken burger</span>
                    <span className="text-[10px] text-gray-500 truncate">Single patty</span>
                  </div>
                </div>
                
                {/* Card 2 */}
                <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex-shrink-0 w-[140px]">
                  <div className="w-[28px] h-[28px] rounded-full bg-[#FAF7F2] flex items-center justify-center border border-gray-50 shadow-inner flex-shrink-0">
                    <span className="text-[13px]">🍟</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-semibold text-[#333333] truncate">Crispy fries</span>
                    <span className="text-[10px] text-gray-500 truncate">Medium salted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Select Drink Section */}
            <div className="pb-2 w-full">
              <h3 className="font-inter font-bold text-[14px] text-[#333333] mb-3">Select drink</h3>
              
              <div className="flex flex-wrap gap-2.5">
                {["Coke classic", "Diet coke", "Coke zero"].map((drink) => (
                  <button
                    key={drink}
                    onClick={() => setSelectedDrink(drink)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                      selectedDrink === drink
                        ? "bg-[#0B4F6C] text-white shadow-md border border-[#0B4F6C]"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {drink}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="flex-shrink-0 w-full bg-[#FAF7F2] px-5 pb-5 pt-2 z-10 border-t border-gray-200/60 box-border">
            <button 
              onClick={() => setIsSuccess(true)} 
              className="w-full bg-[#0B4F6C] text-white font-inter font-semibold py-[14px] rounded-full hover:bg-[#062F41] active:scale-95 transition-all shadow-md"
            >
              Add combo
            </button>
          </div>

        </div>
      ) : (
        // ==========================================
        // 2. SUCCESS MESSAGE (CENTERED MODAL)
        // ==========================================
        <div className="relative w-full max-w-[320px] bg-white rounded-[24px] shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 box-border">
          
          <div className="w-16 h-16 bg-[#E6EDF3] rounded-full flex items-center justify-center mb-5 shadow-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="#0B4F6C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2 font-inter">Combo offer applied!</h2>
          <p className="text-[13px] text-gray-500 mb-8 leading-relaxed px-2">
            Your combo meal offer of <span className="text-[#0B4F6C] font-medium">Burger, fries & {selectedDrink}</span> has been successfully applied to the order.
          </p>

          <button
            onClick={handleGotIt}
            className="w-full bg-[#0B4F6C] text-white font-inter font-semibold py-3.5 rounded-xl hover:bg-[#062F41] active:scale-95 transition-all shadow-md"
          >
            Got it!
          </button>
        </div>
      )}
    </div>
  );
}