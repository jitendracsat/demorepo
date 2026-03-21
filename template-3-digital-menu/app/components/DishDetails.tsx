"use client";

interface DishDetailsProps {
  isOpen: boolean;
  onCloseAction: () => void;
  dish: {
    title: string;
    price: string;
    time: string;
    tag: string;
    desc: string;
    img: string;
    isVeg?: boolean;
    isNonVeg?: boolean;
    calories?: string;
    ingredients?: string[];
  } | null;
}

export default function DishDetails({ isOpen, onCloseAction, dish }: DishDetailsProps) {
  if (!isOpen || !dish) return null;

  // Default ingredients if not provided
  const ingredients = dish.ingredients || [
    "Minced lamb meat",
    "Raw papaya paste",
    "Kebab chinni",
    "Ghee & saffron"
  ];

  // Default calories if not provided
  const calories = dish.calories || "450";

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#E6EDF3] opacity-70"
        onClick={onCloseAction}
      />
      
      {/* Right-side Drawer - anchored to right edge */}
      <div className="fixed inset-y-0 right-0 w-full max-w-[320px] h-full bg-[#FAF7F2] rounded-l-[30px] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        
        {/* Header (Frame 110) */}
        <div className="px-[23px] pt-[35px] pb-[10px] flex justify-between items-center bg-[#FAF7F2]">
          <button 
            onClick={onCloseAction}
            className="w-[32px] h-[32px] bg-white rounded-full flex items-center justify-center shadow-[0px_2px_4px_rgba(0,0,0,0.25)] active:scale-90 transition-transform"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          {/* Calories tag */}
          <div className="h-[29px] px-3 bg-[rgba(11,79,108,0.8)] border border-[rgba(11,79,108,0.6)] rounded-[5px] flex items-center justify-center gap-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.3C13.8 20.3 15.3 19.3 16.5 18.2C17.7 17.1 18.5 16.1 18.9 15.1C19.3 14.1 19.5 13.1 19.5 12.1C19.5 9.7 18.7 7.7 17.1 6.1C15.5 4.5 13.5 3.7 11.1 3.7C8.7 3.7 6.7 4.5 5.1 6.1C3.5 7.7 2.7 9.7 2.7 12.1C2.7 13.1 2.9 14.1 3.3 15.1C3.7 16.1 4.5 17.1 5.7 18.2C6.9 19.3 8.4 20.3 10.2 21.3L11.1 21.8L12 21.3Z" stroke="white" strokeWidth="1.2"/>
              <path d="M11.1 13.7V10.7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="text-[14px] font-roboto font-medium text-white">{calories} kcal</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth px-[23px] pb-32">
          
          {/* Dish Image (image 28) */}
          <div className="mt-[32px] w-[208px] mx-auto h-[180px] rounded-[10px] overflow-hidden border-[0.5px] border-[rgba(169,113,47,0.2)] mb-6">
            <img 
              src={dish.img} 
              alt={dish.title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Dish Info (Frame 104) */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex items-center gap-[5px]">
              <h2 className="font-playfair font-medium text-[30px] leading-[36px] text-[#0B4F6C]">{dish.title}</h2>
              {/* Veg/Non-veg indicator */}
              {dish.isVeg && (
                <div className="w-[16px] h-[16px] border border-[#14AE5C] flex items-center justify-center p-[2px]">
                  <div className="w-[8px] h-[8px] rounded-full bg-[#14AE5C]"></div>
                </div>
              )}
              {dish.isNonVeg && (
                <div className="w-[16px] h-[16px] border border-[#E6423C] flex items-center justify-center p-[2px]">
                  <div className="w-[8px] h-[8px] rounded-full bg-[#E6423C]"></div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-[25px]">
              <span className="font-roboto font-normal text-[16px] leading-[19px] text-[#7A8D3D]">₹{dish.price}</span>
              <div className="flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#7A8D3D" strokeWidth="1.2"/>
                  <path d="M12 6V12L16 14" stroke="#7A8D3D" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span className="font-roboto font-normal text-[16px] leading-[19px] text-[#7A8D3D]">{dish.time}</span>
              </div>
            </div>
          </div>

          {/* Description (Frame 106) */}
          <div className="flex flex-col gap-[12px] mb-6">
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6.253V13L16.2 15.426" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12C21 16.55 17.16 20.25 12.5 20.25C11.46 20.25 10.46 20.07 9.53 19.74L6 21L7.26 17.77C6.48 16.76 6 15.44 6 14C6 9.45 9.84 5.75 14.5 5.75C19.16 5.75 23 9.45 23 14H21Z" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 14H8.02" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14H12.02" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 14H16.02" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className="font-playfair font-medium text-[20px] leading-[24px] text-[#0B4F6C]">Description</h3>
            </div>
            <p className="font-inter font-normal text-[12px] leading-[18px] text-justify text-[#555555]">
              {dish.desc}
            </p>
          </div>

          {/* Add-ons Section (Frame 117) */}
          <div className="flex flex-col gap-[12px] mb-6">
            <div className="flex items-center gap-2">
              <div className="w-[22px] h-[22px] rounded-full bg-[#0B4F6C] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-playfair font-medium text-[20px] leading-[24px] text-[#0B4F6C]">Add-ons</h3>
            </div>
            
            <div className="flex flex-col gap-[8px]">
              {[
                { name: "Cut Onions", price: "5", img: "https://images.unsplash.com/photo-1618213837799-25d5552820a3?w=100&q=80" },
                { name: "Lemon wedges", price: "5", img: "https://images.unsplash.com/photo-1591147138988-5f9661f00843?w=100&q=80" },
                { name: "Mint dip", price: "5", img: "https://images.unsplash.com/photo-1510629954389-c1e137130145?w=100&q=80" }
              ].map((addon) => (
                <div key={addon.name} className="flex items-center gap-[8px] h-[40px]">
                  <div className="w-[35px] h-[35px] rounded-full border-[1px] border-[rgba(11,79,108,0.3)] p-[2px] bg-white">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img src={addon.img} alt={addon.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-inter font-normal text-[13px] leading-[16px] text-[#555555]">{addon.name}</span>
                    <span className="font-inter font-normal text-[13px] leading-[16px] text-[#555555]">+₹{addon.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Ingredients (Frame 107) */}
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className="font-playfair font-medium text-[20px] leading-[24px] text-[#0B4F6C]">Main ingredients</h3>
            </div>
            <ul className="flex flex-col gap-[6px]">
              {ingredients.map((ingredient) => (
                <li key={ingredient} className="flex items-center gap-2">
                  <div className="w-[3px] h-[3px] rounded-full bg-[#555555]"></div>
                  <span className="font-inter font-light text-[12px] leading-[18px] text-justify text-[#555555]">
                    {ingredient}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}