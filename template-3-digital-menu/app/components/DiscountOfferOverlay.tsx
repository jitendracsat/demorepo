"use client";

import { useState, useEffect } from "react";

export interface DiscountOffer {
  id: string;
  title: string;
  discountPercentage: number;
  minOrderValue: number;
  benefits: string[];
}

export interface DiscountOfferOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  offer: DiscountOffer | null;
}

export default function DiscountOfferOverlay({ isOpen, onClose, offer }: DiscountOfferOverlayProps) {
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset success state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setIsSuccess(false), 300);
    }
  }, [isOpen]);

  if (!isOpen || !offer) return null;

  const handleStartOrdering = () => {
    setIsSuccess(true);
  };

  const handleGotIt = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    // ✨ FIX: Changed max-w-[393px] to sm:max-w-[393px] exactly like Combo!
    <div className={`fixed inset-0 z-[200] w-full sm:max-w-[393px] mx-auto flex flex-col justify-end pointer-events-none ${isSuccess ? 'justify-center items-center p-4' : ''}`}>
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity pointer-events-auto"
        onClick={onClose}
      />
      
      {!isSuccess ? (
        // ==========================================
        // 1. CONSISTENT DISCOUNT UI (BOTTOM SHEET)
        // ==========================================
        <div className="relative w-full bg-[#FAF7F2] rounded-t-[24px] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl overflow-hidden box-border pointer-events-auto">
          
          {/* Drag Handle (Fixed at top - Exact BOGO match) */}
          <div className="flex-shrink-0 w-full flex justify-center pt-3 pb-2 bg-[#FAF7F2] z-10">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 w-full overflow-y-auto px-6 pb-6 no-scrollbar bg-[#FAF7F2] box-border">
            
            {/* Dynamic Title */}
            <div className="pt-4 pb-6 text-center">
              <h2 className="font-playfair font-bold text-[28px] text-[#333333] leading-tight mx-auto max-w-[85%]">
                {offer.title}
              </h2>
            </div>

            {/* Benefits List */}
            <div className="flex flex-col w-full">
              {offer.benefits.map((benefit, index) => (
                <div key={index} className="flex flex-col w-full">
                  <div className="flex items-start gap-4 py-4 w-full">
                    {/* Checkmark Icon (Fixed width so text doesn't squeeze it) */}
                    <div className="w-[22px] h-[22px] bg-[#6B8EAE] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    
                    {/* Benefit Text - Fixed wrap logic instead of truncate */}
                    <span className="text-[14px] text-gray-600 font-inter font-medium flex-1 leading-relaxed break-words">
                      {benefit}
                    </span>
                  </div>
                  
                  {/* Subtle Divider (Except for the last item) */}
                  {index !== offer.benefits.length - 1 && (
                    <div className="w-full h-[1px] bg-gray-200/70"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Bottom Action Bar (Padding matched with BOGO) */}
          <div className="flex-shrink-0 w-full bg-[#FAF7F2] px-6 pb-6 pt-3 z-10 border-t border-gray-200/60 box-border">
            <button 
              onClick={handleStartOrdering}
              className="w-full bg-[#0B4F6C] text-white font-inter font-semibold py-[14px] rounded-full hover:bg-[#062F41] active:scale-95 transition-all shadow-md"
            >
              Start ordering
            </button>
          </div>

        </div>
      ) : (
        // ==========================================
        // 2. SUCCESS MODAL (CENTERED)
        // ==========================================
        <div className="relative w-[85%] max-w-[320px] bg-white rounded-[24px] shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 pointer-events-auto mx-auto mb-auto mt-auto box-border">
          
          {/* Tag Icon */}
          <div className="w-16 h-16 bg-[#E6EDF3] rounded-full flex items-center justify-center mb-5 shadow-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6Z" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 10H15M9 14H13" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Text Content */}
          <h2 className="text-xl font-bold text-gray-900 mb-2 font-inter">Offer Active!</h2>
          <p className="text-[13px] text-gray-500 mb-8 leading-relaxed px-2">
            {offer.discountPercentage}% discount will be auto-applied when your cart exceeds ₹{offer.minOrderValue}
          </p>

          {/* Action Button */}
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