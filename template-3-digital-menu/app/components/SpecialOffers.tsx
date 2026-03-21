"use client";

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
}

interface SpecialOffersProps {
  onComboClick?: () => void;
  onBogoClick?: () => void;
  onDiscountClick?: () => void;
}

const mockOffers: SpecialOffer[] = [
  {
    id: "1",
    title: "Combo Meal",
    description: "Burger + Fries + Coke at just ₹250! Perfect lunch deal for you.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    buttonText: "Add combo"
  },
  {
    id: "2",
    title: "2-for-1 Special",
    description: "Choose any two starters and pay for only one. The perfect way to begin your feast.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    buttonText: "View offer"
  },
  {
    id: "3",
    title: "Family Feast",
    description: "Feed the whole family with our large pizza + garlic bread + drink.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
    buttonText: "Order now"
  },
  {
    id: "4",
    title: "Get 10% off",
    description: "Save 10% on orders above ₹500. Valid on all items today.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
    buttonText: "Avail offer"
  }
];

export default function SpecialOffers({ onComboClick, onBogoClick, onDiscountClick }: SpecialOffersProps) {
  return (
    // Pura section w-full rahega
    <section className="mt-8 mb-6 w-full max-w-[393px] mx-auto overflow-hidden">
      {/* Section Title */}
      <h2 className="font-playfair font-bold text-xl text-[#0B4F6C] mb-4 px-[21px]">
        Special Offers
      </h2>
      
      {/* Carousel Container - Yahan overflow set kiya hai */}
      <div className="flex gap-4 overflow-x-auto overflow-y-hidden no-scrollbar w-full px-[21px] pb-4">
        {mockOffers.map((offer) => (
          <div
            key={offer.id}
            className="flex-shrink-0 w-[160px] bg-white rounded-xl shadow-md border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Image Section */}
            <div className="h-[90px] w-full">
              <img 
                src={offer.image} 
                alt={offer.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Content Section */}
            <div className="p-3 flex flex-col flex-1 bg-[#FAF7F2]">
              <h3 className="font-inter font-bold text-sm text-[#0B4F6C] mb-1 line-clamp-1">
                {offer.title}
              </h3>
              <p className="font-inter text-[11px] text-[#0B4F6C] opacity-70 leading-snug line-clamp-2 flex-1 mb-3">
                {offer.description}
              </p>
              
              <button 
                onClick={
                  offer.id === "2" ? onBogoClick :
                  offer.id === "4" ? onDiscountClick :
                  onComboClick
                }
                className="w-full py-[6px] bg-[#0B4F6C] text-white text-[12px] font-bold rounded-full active:scale-95 transition-transform"
              >
                {offer.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}