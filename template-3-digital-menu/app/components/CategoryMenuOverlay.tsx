"use client";

interface Category {
  name: string;
  icon?: React.ReactNode;
  img?: string;
}

interface CategoryMenuOverlayProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSelectCategoryAction: (category: string) => void;
  currentCategory: string;
}

export default function CategoryMenuOverlay({ isOpen, onCloseAction, onSelectCategoryAction, currentCategory }: CategoryMenuOverlayProps) {
  if (!isOpen) return null;

  const isDrinks = currentCategory === "Drinks";

  const foodCategories: Category[] = [
    { 
      name: "Starters", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 21V7M7 21H5M7 21H9M7 7V3M7 7H5M7 7H9M3 7H21M17 21V7M17 21H15M17 21H19M17 7V3M17 7H15M17 7H19" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) 
    },
    { 
      name: "Mains", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="#0B4F6C" strokeWidth="2"/>
          <path d="M12 7V17M7 12H17" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) 
    },
    { 
      name: "Desserts", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 10H3M21 14H3M21 18H3M21 6H3M12 2L9 6H15L12 2Z" fill="#0B4F6C"/>
        </svg>
      ) 
    },
    { 
      name: "Salads", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM12 19C8.13 19 5 15.87 5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12C19 15.87 15.87 19 12 19Z" fill="#0B4F6C"/>
          <circle cx="12" cy="12" r="3" fill="#0B4F6C"/>
        </svg>
      ) 
    },
    { 
      name: "Soups", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 10H21C21 14.42 16.97 18 12 18C7.03 18 3 14.42 3 10Z" fill="#0B4F6C"/>
          <path d="M8 6V3M12 6V3M16 6V3" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) 
    },
    { 
      name: "Burgers", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 15H21V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V15ZM3 9H21V11C21 12.1 20.1 13 19 13H5C3.9 13 3 12.1 3 11V9ZM19 7C19 4.24 15.87 2 12 2C8.13 2 5 4.24 5 7V8H19V7Z" fill="#0B4F6C"/>
        </svg>
      ) 
    },
    { 
      name: "Wraps", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 21H21L12 2ZM12 6L18 19H6L12 6Z" fill="#0B4F6C"/>
        </svg>
      ) 
    },
    { 
      name: "Barbeque", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C12 2 12 6 10 8C8 10 4 10 4 10C4 10 8 10 10 12C12 14 12 18 12 18C12 18 12 14 14 12C16 10 20 10 20 10C20 10 16 10 14 8C12 6 12 2 12 2Z" fill="#0B4F6C"/>
        </svg>
      ) 
    },
    { 
      name: "Grills", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 3H20V5H4V3ZM4 19H20V21H4V19ZM4 11V13H20V11H4ZM4 7V9H20V7H4ZM4 15V17H20V15H4Z" fill="#0B4F6C"/>
        </svg>
      ) 
    },
    { 
      name: "Pizza", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L1 21H23L12 2ZM12 6.5L19.5 19H4.5L12 6.5Z" fill="#0B4F6C"/>
          <circle cx="12" cy="14" r="2.5" fill="#0B4F6C"/>
        </svg>
      ) 
    },
  ];

  const drinkCategories: Category[] = [
    { name: "Cocktails", img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
    { name: "Brewed drinks", img: "https://images.unsplash.com/photo-1513558111299-2cad06fd9f43?w=400&q=80" },
    { name: "Wine", img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
    { name: "Hard liquor", img: "https://images.unsplash.com/photo-1527281473228-394f22867416?w=400&q=80" },
    { name: "Beer", img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
    { name: "Shots", img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
    { name: "Aperitifs", img: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80" },
  ];

  const currentCategories = isDrinks ? drinkCategories : foodCategories;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-end overflow-hidden">
      {/* Dimmed Background */}
      <div 
        className="absolute inset-0 bg-[#E6EDF3] opacity-70"
        onClick={onCloseAction}
      />
      
      {/* Right-side Category Sheet - 70-80% width, slide from right */}
      <div className={`relative mt-auto w-[80%] max-w-[300px] h-full bg-[#FAF7F2] rounded-l-[30px] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden`}>
        
        {/* Title */}
        <h2 className="mt-[51px] font-playfair font-medium text-[35px] leading-[47px] text-black">
          {isDrinks ? "Drink categories" : "Our menu"}
        </h2>
        
        {/* Category Grid */}
        <div className={`mt-[35px] w-[314px] px-[10px] grid ${isDrinks ? "grid-cols-2 gap-x-[15px] gap-y-[20px]" : "grid-cols-2 gap-x-[30px] gap-y-[35px]"} overflow-y-auto no-scrollbar pb-32`}>
          {currentCategories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectCategoryAction(cat.name);
                onCloseAction();
              }}
              className={`relative group active:opacity-70 transition-all ${isDrinks ? "w-[137px] h-[105px] rounded-[10px] overflow-hidden" : "flex items-center gap-[8px] hover:scale-105"}`}
            >
              {isDrinks ? (
                <>
                  <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2 text-center">
                    <span className="font-playfair font-bold text-[18px] leading-[22px] text-white drop-shadow-md">{cat.name}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                    {cat.icon}
                  </div>
                  <span className="font-playfair font-medium text-[20px] leading-[27px] text-[#0B4F6C]">{cat.name}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button 
          onClick={onCloseAction}
          className="absolute bottom-[40px] w-[48px] h-[48px] bg-white rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.25)] hover:scale-110 active:scale-90 transition-all z-10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B4F6C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
