"use client";

interface LandingViewProps {
  onStepInsideAction: () => void;
}

export default function LandingView({ onStepInsideAction }: LandingViewProps) {
  return (
    <div className="pb-32 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex justify-center pt-8 pb-4">
        <div className="flex justify-center py-6">
          <img src="/logo.png" alt="CSAT" className="h-12" />
        </div>
      </header>

      {/* Curated for you Section */}
      <section className="px-[21px] mt-4 max-w-[400px] mx-auto">
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="font-playfair text-[25px] font-medium leading-[33px] tracking-[0.045em] text-[#0B4F6C]">
            Curated for you
          </h2>
          <p className="font-roboto text-[12px] leading-[17px] text-[rgba(11,79,108,0.8)]">
            Handpicked pairings and exclusive deals for your perfect restobar experience.
          </p>
        </div>

        {/* Featured Card */}
        <div className="w-full h-[254px] bg-[#FAF7F2] border border-[rgba(11,79,108,0.8)] rounded-[10px] shadow-[3px_4px_4px_rgba(27,42,65,0.26)] relative p-[15px] flex flex-col justify-between">
          <div className="relative w-full h-[146px] rounded-[10px] overflow-hidden drop-shadow-[2px_2px_4px_rgba(0,0,0,0.25)]">
            <img
              src="https://momentos.co.nz/wp-content/uploads/2024/10/tapas-near-me.png"
              alt="Cocktail & Tapas combo"
              className="w-full h-full object-cover"
            />
            {/* 20% OFF Badge */}
            <div className="absolute top-[5px] right-[5px] w-[53px] h-[53px] bg-[#E5533D] rounded-full flex items-center justify-center text-white font-inter font-semibold text-[12.5px] text-center leading-[16px] border border-[rgba(0,0,0,0.4)] shadow-[2px_3px_5px_rgba(224,107,60,0.3)] z-10 transition-transform hover:scale-105 active:scale-95 cursor-default">
              20%<br/>OFF
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-playfair font-semibold text-[20px] leading-[27px] text-[#0B4F6C]">
              Cocktail & Tapas combo
            </h3>
            <p className="font-roboto italic text-[12px] leading-[16px] text-[rgba(11,79,108,0.8)]">
              Combination of mixed fruit cocktail and spanish tapas.
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="relative font-inter font-medium text-[15px] leading-[18px] text-[#0B4F6C]">
                ₹1140
                <span className="absolute left-0 top-[9px] w-full border-b-2 border-[#0B4F6C]"></span>
              </span>
              <span className="font-inter font-medium text-[15px] leading-[18px] text-[#0B4F6C] font-bold">
                ₹980
              </span>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          <div className="w-[8px] h-[8px] rounded-full bg-[#0B4F6C]"></div>
          <div className="w-[8px] h-[8px] rounded-full bg-[#BBB7B7]"></div>
          <div className="w-[8px] h-[8px] rounded-full bg-[#BBB7B7]"></div>
        </div>
      </section>

      {/* Specials & Offers Section */}
      <section className="px-[21px] mt-8 mb-24 max-w-[400px] mx-auto">
        <h2 className="font-playfair text-[25px] font-medium leading-[33px] tracking-[0.045em] text-[#0B4F6C] mb-8">
          Specials & Offers
        </h2>

        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-5 w-full transition-all hover:translate-x-1">
            <div className="flex-1 flex flex-col gap-2.5">
              <h3 className="font-playfair font-medium text-[22px] leading-[26px] text-[#0B4F6C]">
                2-for-1 Special
              </h3>
              <p className="font-inter text-[12px] leading-[18px] tracking-[0.02em] text-[rgba(11,79,108,0.8)]">
                Choose for any two starters and pay for only one. The perfect way to begin your feast.
              </p>
            </div>
            <div>
               <img
                 src="/food.png"
                 alt="2-for-1 Special"
                 className="w-full h-full object-cover"
               />
            </div>
          </div>

          <div className="flex items-center gap-5 w-full transition-all hover:-translate-x-1">
            <div>
               <div>
                 <img
                   src="/cake.png"
                   alt="Buy 1, get 1 special"
                   className="w-full h-full object-cover"
               />
               </div>
            </div>
            <div className="flex-1 flex flex-col gap-2.5">
              <h3 className="font-playfair font-medium text-[22px] leading-[26px] text-[#0B4F6C]">
                Buy 1, get 1 special
              </h3>
              <p className="font-inter text-[12px] leading-[18px] tracking-[0.02em] text-[rgba(11,79,108,0.8)]">
                Buy a cocktail of above ₹250, and get another cocktails for absolutely free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating CTA Button */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={onStepInsideAction}
          className="w-[220px] h-[55px] bg-[#0B4F6C] border border-[rgba(44,73,127,0.8)] shadow-[0_4px_12px_rgba(11,79,108,0.4)] rounded-[50px] flex items-center justify-center gap-[8px] text-white transition-all hover:bg-[#0d5d7e] hover:shadow-[0_6px_16px_rgba(11,79,108,0.5)] active:scale-95 group"
        >
          <span className="font-inter font-semibold text-[19px] leading-[22px]">Step inside</span>
          <svg className="transition-transform group-hover:translate-x-1" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5L16 12L9 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
