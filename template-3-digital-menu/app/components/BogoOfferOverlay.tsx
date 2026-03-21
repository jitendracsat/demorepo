"use client";

import { useState, useEffect } from "react";

export interface BogoItem {
  id: string;
  name: string;
  img: string;
}

export interface BogoOffer {
  title: string;
  subtitle: string;
  price: number;
  mainCategoryName: string;
  freeCategoryName: string;
  mainItems: BogoItem[];
  freeItems: BogoItem[];
}

export interface BogoOfferOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  offer: BogoOffer | null;
}

export default function BogoOfferOverlay({ isOpen, onClose, offer }: BogoOfferOverlayProps) {
  const [selectedMainItem, setSelectedMainItem] = useState<string>("");
  const [selectedFreeItem, setSelectedFreeItem] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (offer && isOpen) {
      setSelectedMainItem(offer.mainItems[0]?.id || "");
      setSelectedFreeItem(offer.freeItems[0]?.id || "");
    }
  }, [offer, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setIsSuccess(false), 300);
    }
  }, [isOpen]);

  if (!isOpen || !offer) return null;

  const handleAddToCart = () => {
    console.log("Added to cart:", {
      mainItem: offer.mainItems.find(item => item.id === selectedMainItem),
      freeItem: offer.freeItems.find(item => item.id === selectedFreeItem),
      totalPrice: offer.price
    });
    setIsSuccess(true);
  };

  const handleGotIt = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    // ✨ FIX: Consistent wrapper width just like Combo (w-full max-w-[393px] mx-auto)
    <div className={`fixed inset-0 z-[200] w-full sm:max-w-[393px] mx-auto flex flex-col justify-end pointer-events-none ${isSuccess ? 'justify-center items-center p-4' : ''}`}>
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity pointer-events-auto"
        onClick={onClose}
      />
      
      {!isSuccess ? (
        // ==========================================
        // 1. REFINED BOGO UI (BOTTOM SHEET)
        // ==========================================
        <div className="relative w-full bg-[#FAF7F2] rounded-t-[24px] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl overflow-hidden box-border pointer-events-auto">
          
          {/* Drag Handle */}
          <div className="flex-shrink-0 w-full flex justify-center pt-3 pb-2 bg-[#FAF7F2] z-10">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 w-full overflow-y-auto px-6 pb-4 no-scrollbar bg-[#FAF7F2] box-border">
            
            {/* Header */}
            <div className="pt-2 pb-4 border-b border-gray-200/70 mb-5">
              <h2 className="font-inter font-bold text-[18px] text-[#333333] mb-1">{offer.title}</h2>
              <p className="font-inter text-[13px] text-[#0B4F6C] opacity-80">{offer.subtitle}</p>
            </div>

            {/* Main Selection Section */}
            <div className="pb-5 w-full">
              <h3 className="font-inter font-bold text-[14px] text-[#333333] mb-4">
                Choose your {offer.mainCategoryName}
              </h3>
              
              <div className="flex gap-5 overflow-x-auto pb-2 px-1 no-scrollbar w-full">
                {offer.mainItems.map((item) => {
                  const isSelected = selectedMainItem === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-center flex-shrink-0 cursor-pointer w-[65px]"
                      onClick={() => setSelectedMainItem(item.id)}
                    >
                      <div className="relative">
                        <div className={`w-[60px] h-[60px] rounded-full overflow-hidden transition-all border ${isSelected ? 'ring-2 ring-[#0B4F6C] ring-offset-2 ring-offset-[#FAF7F2] border-transparent' : 'border-gray-200'}`}>
                          <img 
                            src={item.img} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#0B4F6C] rounded-full flex items-center justify-center border-[1.5px] border-[#FAF7F2] z-10">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-gray-500 mt-3 text-center w-full truncate">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Free Selection Section */}
            <div className="pb-2 w-full">
              <h3 className="font-inter font-bold text-[14px] text-[#333333] mb-4">
                Free {offer.freeCategoryName} <span className="font-normal text-gray-400 text-[12px]">(Choose one of them)</span>
              </h3>
              
              <div className="flex gap-5 overflow-x-auto pb-2 px-1 no-scrollbar w-full">
                {offer.freeItems.map((item) => {
                  const isSelected = selectedFreeItem === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-center flex-shrink-0 cursor-pointer w-[65px]"
                      onClick={() => setSelectedFreeItem(item.id)}
                    >
                      <div className="relative">
                        <div className={`w-[60px] h-[60px] rounded-full overflow-hidden transition-all border ${isSelected ? 'ring-2 ring-[#0B4F6C] ring-offset-2 ring-offset-[#FAF7F2] border-transparent' : 'border-gray-200'}`}>
                          <img 
                            src={item.img} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#0B4F6C] rounded-full flex items-center justify-center border-[1.5px] border-[#FAF7F2] z-10">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-gray-500 mt-3 text-center w-full truncate">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="flex-shrink-0 w-full bg-[#FAF7F2] px-6 pb-6 pt-2 z-10 box-border border-t border-gray-200/60">
            <div className="flex items-center gap-1.5 mb-4 mt-1">
              <span className="text-[14px] text-[#0B4F6C] opacity-80 font-inter">Total Price :</span>
              <span className="text-[16px] font-bold text-[#0B4F6C] font-inter">₹{offer.price}</span>
            </div>
            <button 
              onClick={handleAddToCart}
              className="w-full bg-[#0B4F6C] text-white font-inter font-semibold py-[14px] rounded-full hover:bg-[#062F41] active:scale-95 transition-all shadow-md"
            >
              Add to cart
            </button>
          </div>

        </div>
      ) : (
        // ==========================================
        // 2. SUCCESS MODAL (CENTERED)
        // ==========================================
        <div className="relative w-full bg-white rounded-[24px] shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 pointer-events-auto box-border">
          <div className="w-16 h-16 bg-[#E6EDF3] rounded-full flex items-center justify-center mb-5 shadow-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="#0B4F6C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 font-inter">Offer applied!</h2>
          <p className="text-[13px] text-gray-500 mb-8 leading-relaxed px-2">
            Your choice of <span className="text-[#0B4F6C] font-medium">{offer.mainCategoryName}</span> & Free <span className="text-[#0B4F6C] font-medium">{offer.freeCategoryName}</span> has been successfully added to your order.
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