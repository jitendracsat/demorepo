"use client";

export interface FoodItemProps {
  id?: string;
  title: string;
  price: number;
  time: string;
  desc: string;
  img: string;
  isVeg: boolean;
  isNonVeg: boolean;
  tag?: string;
  onClick?: () => void;
  // ✨ FIX: Controlled Props from MenuView
  quantity?: number; 
  onAdd?: (e: React.MouseEvent) => void;
  onIncrement?: (e: React.MouseEvent) => void;
  onDecrement?: (e: React.MouseEvent) => void;
}

export default function FoodItem({ 
  title, price, time, desc, img, isVeg, isNonVeg, tag, onClick, 
  quantity = 0, onAdd, onIncrement, onDecrement 
}: FoodItemProps) {
  
  return (
    <div 
      className="bg-white rounded-[16px] p-4 flex gap-[14px] shadow-sm cursor-pointer border border-[#E6EDF3] hover:shadow-md transition-shadow relative"
      onClick={onClick}
    >
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {isVeg && (
            <div className="w-[14px] h-[14px] border border-green-600 flex items-center justify-center rounded-sm">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            </div>
          )}
          {isNonVeg && (
            <div className="w-[14px] h-[14px] border border-red-600 flex items-center justify-center rounded-sm">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            </div>
          )}
          {tag && (
            <span className="bg-[#E6EDF3] text-[#0B4F6C] px-2 py-0.5 rounded-[4px] text-[10px] font-semibold tracking-wide">
              {tag}
            </span>
          )}
        </div>
        <h3 className="font-playfair text-[18px] font-bold text-[#0B4F6C] leading-tight mb-1">{title}</h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-inter text-[15px] font-bold text-[#333333]">₹{price}</span>
          <div className="flex items-center gap-1 text-[#555555]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="text-[12px]">{time}</span>
          </div>
        </div>
        <p className="font-inter text-[13px] text-[#555555] opacity-80 leading-snug line-clamp-2 pr-2">{desc}</p>
      </div>

      <div className="relative w-[110px] h-[110px] flex-shrink-0">
        <div className="w-full h-full rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <img src={img} alt={title} className="w-full h-full object-cover" />
        </div>
        
        {/* ✨ Controlled Dynamic Add Button */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[85%] z-10">
          {quantity === 0 ? (
            <button 
              onClick={onAdd}
              className="w-full bg-white text-[#0B4F6C] font-bold text-[14px] py-1.5 rounded-xl border border-[#E6EDF3] shadow-md hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              Add <span className="text-[16px] font-medium">+</span>
            </button>
          ) : (
            <div className="w-full bg-white text-[#0B4F6C] font-bold text-[14px] rounded-xl border border-[#E6EDF3] shadow-md flex items-center justify-between overflow-hidden">
              <button onClick={onDecrement} className="w-8 py-1.5 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <span className="text-[18px] leading-none mb-[2px]">-</span>
              </button>
              <span className="flex-1 text-center font-inter font-bold text-[#333333]">{quantity}</span>
              <button onClick={onIncrement} className="w-8 py-1.5 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <span className="text-[18px] leading-none mb-[2px]">+</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}