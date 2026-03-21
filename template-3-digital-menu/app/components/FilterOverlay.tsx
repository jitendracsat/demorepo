"use client";

import { useState } from "react";

interface FilterOverlayProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onApplyAction: (filters: any, count: number) => void; // ✨ Added count argument
  onClearAction: () => void;
  category: string;
}

export default function FilterOverlay({ isOpen, onCloseAction, onApplyAction, onClearAction, category }: FilterOverlayProps) {
  const isDrinks = category === "Drinks";
  const defaultTab = isDrinks ? "Price range" : "Price";
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [priceRange, setPriceRange] = useState(2000);
  const [sortOrder, setSortOrder] = useState("low-to-high");
  const [prepTime, setPrepTime] = useState("Quick bites");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietTypes, setDietTypes] = useState<string[]>([]);
  const [prepPrefs, setPrepPrefs] = useState<string[]>([]);

  // Drink specific states
  const [drinkPrice, setDrinkPrice] = useState("Mid range");
  const [servingType, setServingType] = useState("By glass");
  const [occasion, setOccasion] = useState("Party picks");

  if (!isOpen) return null;

  const foodTabs = ["Price", "Prep time", "Allergies", "Diet & preparation"];
  const drinkTabs = ["Price range", "Serving type", "Occasion"];
  const tabs = isDrinks ? drinkTabs : foodTabs;

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev => prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]);
  };

  const toggleDietType = (type: string) => {
    setDietTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const togglePrepPref = (pref: string) => {
    setPrepPrefs(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]);
  };

  // ✨ Logic to calculate active filters
  const handleApply = () => {
    let count = 0;
    if (isDrinks) {
      if (drinkPrice !== "Mid range") count++;
      if (servingType !== "By glass") count++;
      if (occasion !== "Party picks") count++;
      onApplyAction({ drinkPrice, servingType, occasion }, count);
    } else {
      if (priceRange !== 2000) count++;
      if (sortOrder !== "low-to-high") count++;
      if (prepTime !== "Quick bites") count++;
      count += allergies.length + dietTypes.length + prepPrefs.length;
      onApplyAction({ priceRange, sortOrder, prepTime, allergies, dietTypes, prepPrefs }, count);
    }
  };

  // ✨ Logic to reset all states on Clear
  const handleClear = () => {
    setPriceRange(2000);
    setSortOrder("low-to-high");
    setPrepTime("Quick bites");
    setAllergies([]);
    setDietTypes([]);
    setPrepPrefs([]);
    setDrinkPrice("Mid range");
    setServingType("By glass");
    setOccasion("Party picks");
    onClearAction();
  };

  return (
    <div className="fixed inset-0 z-[150] w-full sm:max-w-[393px] mx-auto flex flex-col justify-end pointer-events-none">
      
      <div className="absolute inset-0 bg-[#E6EDF3] opacity-70 pointer-events-auto" onClick={onCloseAction} />
      
      <div className="relative w-full bg-[#FAF7F2] rounded-t-[15px] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col h-[435px] animate-in slide-in-from-bottom duration-500 overflow-hidden box-border pointer-events-auto">
        
        <div className="px-[21px] py-[24px] flex justify-between items-center bg-[#FAF7F2] border-b border-[#B6B4B1]">
          <h2 className="font-inter font-semibold text-[20px] text-[#555555]">Filters</h2>
          <button onClick={onCloseAction} className="w-[24px] h-[24px] bg-[#F8F1ED] rounded-full flex items-center justify-center text-[#555555] active:scale-90 transition-transform">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[120px] bg-[#FAF7F2] border-r border-[#B6B4B1]">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full h-[50px] px-[15px] flex items-center text-left font-inter text-[14px] leading-tight transition-all border-b border-[#B6B4B1] ${activeTab === tab ? "bg-[#7A8D3D] text-[#FAF7F2]" : "text-[#555555]"}`}>{tab}</button>
            ))}
          </div>

          <div className="flex-1 p-[20px] overflow-y-auto no-scrollbar pb-24">
            {!isDrinks && activeTab === "Price" && (
              <div className="flex flex-col gap-[30px]">
                <div className="flex flex-col gap-[10px]">
                  <h3 className="font-inter font-medium text-[15px] text-[#555555]">Select your price range</h3>
                  <div className="flex flex-col gap-1 items-center">
                    <span className="font-inter font-medium text-[14px] text-[#7A8D3D]">₹0 - ₹{priceRange}</span>
                    <input type="range" min="0" max="2000" value={priceRange} onChange={(e) => setPriceRange(parseInt(e.target.value))} className="w-full accent-[#7A8D3D] opacity-70" />
                    <div className="w-full flex justify-between text-[12px] text-[#7A8D3D]"><span>₹0</span><span>₹2000</span></div>
                  </div>
                </div>
                <div className="flex flex-col gap-[15px]">
                  {["Low to high", "High to low"].map((sort) => (
                    <label key={sort} className="flex items-center justify-between cursor-pointer group">
                      <span className="font-inter text-[13px] text-[#555555]">{sort}</span>
                      <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${sortOrder === (sort === "Low to high" ? "low-to-high" : "high-to-low") ? "border-[#7A8D3D]" : "border-[#B6B4B1]"}`}>
                        {sortOrder === (sort === "Low to high" ? "low-to-high" : "high-to-low") && <div className="w-[10px] h-[10px] bg-[#7A8D3D] rounded-full" />}
                        <input type="radio" className="hidden" onChange={() => setSortOrder(sort === "Low to high" ? "low-to-high" : "high-to-low")} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {isDrinks && activeTab === "Price range" && (
              <div className="flex flex-col gap-[20px]">
                {["Mid range", "Premium", "Luxury"].map((p) => (
                  <label key={p} className="flex items-center justify-between cursor-pointer group" onClick={() => setDrinkPrice(p)}>
                    <span className="font-inter text-[13px] text-[#555555]">{p}</span>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${drinkPrice === p ? "border-[#7A8D3D]" : "border-[#B6B4B1]"}`}>
                      {drinkPrice === p && <div className="w-[10px] h-[10px] bg-[#7A8D3D] rounded-full" />}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {isDrinks && activeTab === "Serving type" && (
              <div className="flex flex-col gap-[20px]">
                {["By glass", "By bottle", "Pitcher"].map((s) => (
                  <label key={s} className="flex items-center justify-between cursor-pointer group" onClick={() => setServingType(s)}>
                    <span className="font-inter text-[13px] text-[#555555]">{s}</span>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${servingType === s ? "border-[#7A8D3D]" : "border-[#B6B4B1]"}`}>
                      {servingType === s && <div className="w-[10px] h-[10px] bg-[#7A8D3D] rounded-full" />}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {isDrinks && activeTab === "Occasion" && (
              <div className="flex flex-col gap-[20px]">
                {["Party picks", "Casual", "Celebrations"].map((o) => (
                  <label key={o} className="flex items-center justify-between cursor-pointer group" onClick={() => setOccasion(o)}>
                    <span className="font-inter text-[13px] text-[#555555]">{o}</span>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${occasion === o ? "border-[#7A8D3D]" : "border-[#B6B4B1]"}`}>
                      {occasion === o && <div className="w-[10px] h-[10px] bg-[#7A8D3D] rounded-full" />}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {!isDrinks && activeTab === "Prep time" && (
              <div className="flex flex-col gap-[20px]">
                {["Quick bites", "5-10 mins", "10-15 mins", "15+ mins"].map((time) => (
                  <label key={time} className="flex items-center justify-between cursor-pointer group" onClick={() => setPrepTime(time)}>
                    <span className="font-inter text-[13px] text-[#555555]">{time}</span>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${prepTime === time ? "border-[#7A8D3D]" : "border-[#B6B4B1]"}`}>
                      {prepTime === time && <div className="w-[10px] h-[10px] bg-[#7A8D3D] rounded-full" />}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {!isDrinks && activeTab === "Allergies" && (
              <div className="flex flex-col gap-[15px]">
                <h3 className="font-inter font-medium text-[15px] text-[#555555]">Choose allergies to avoid</h3>
                <div className="flex flex-col gap-[12px]">
                  {["Milk/diary", "Peanuts", "Eggs", "Soy", "Shellfish", "Fish", "Sesame"].map((allergy) => (
                    <label key={allergy} className="flex items-center justify-between cursor-pointer group">
                      <span className="font-inter text-[13px] text-[#555555]">{allergy}</span>
                      <input type="checkbox" checked={allergies.includes(allergy)} onChange={() => toggleAllergy(allergy)} className="w-[15px] h-[15px] accent-[#7A8D3D] rounded-sm" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {!isDrinks && activeTab === "Diet & preparation" && (
              <div className="flex flex-col gap-[25px]">
                <div className="flex flex-col gap-[12px]">
                  <h3 className="font-inter font-medium text-[15px] text-[#555555]">Diet type</h3>
                  {["Eggetarian", "Vegan", "Gluten-free"].map((type) => (
                    <label key={type} className="flex items-center justify-between cursor-pointer group">
                      <span className="font-inter text-[13px] text-[#555555]">{type}</span>
                      <input type="checkbox" checked={dietTypes.includes(type)} onChange={() => toggleDietType(type)} className="w-[15px] h-[15px] accent-[#7A8D3D] rounded-sm" />
                    </label>
                  ))}
                </div>
                <div className="flex flex-col gap-[12px]">
                  <h3 className="font-inter font-medium text-[15px] text-[#555555]">Preparation preferences</h3>
                  {["Less oil", "No onion, no garlic", "Baked"].map((pref) => (
                    <label key={pref} className="flex items-center justify-between cursor-pointer group">
                      <span className="font-inter text-[13px] text-[#555555]">{pref}</span>
                      <input type="checkbox" checked={prepPrefs.includes(pref)} onChange={() => togglePrepPref(pref)} className="w-[15px] h-[15px] accent-[#7A8D3D] rounded-sm" />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full px-[21px] py-[20px] pb-6 bg-[#FAF7F2] border-t border-[#B6B4B1] flex justify-center gap-[20px] z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] box-border">
          {/* ✨ Replaced onClick logic with our custom handlers */}
          <button onClick={handleClear} className="w-[114px] h-[30px] border border-[#555555] rounded-[2px] font-inter font-medium text-[14px] text-[#555555] active:bg-[#555555] active:text-white transition-all">Clear All</button>
          <button onClick={handleApply} className="w-[114px] h-[30px] bg-[#7A8D3D] rounded-[2px] font-inter font-medium text-[14px] text-[#FAF7F2] active:scale-95 transition-all">Apply filter</button>
        </div>
      </div>
    </div>
  );
}