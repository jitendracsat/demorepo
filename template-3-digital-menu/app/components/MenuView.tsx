"use client";

import { useState, useEffect, useMemo } from "react";
import { getSocket } from "../lib/socket";
import FoodItem from "./FoodItem";
import SpecialOffers from "./SpecialOffers";
import CategoryMenuOverlay from "./CategoryMenuOverlay";
import FilterOverlay from "./FilterOverlay";
import SearchOverlay from "./SearchOverlay";
import DishDetails from "./DishDetails";
import ComboOfferOverlay from "./ComboOfferOverlay";
import BogoOfferOverlay, { BogoOffer } from "./BogoOfferOverlay";
import DiscountOfferOverlay, { DiscountOffer } from "./DiscountOfferOverlay";
import CartOverlay, { CartItem } from "./CartOverlay";
import OrderSummaryView from "./OrderSummaryView";
import PaymentView from "./PaymentView";
import OrderSuccessView from "./OrderSuccessView";
import { createOrder } from "../utils/api";

// Nayi API service import kar li (Path apne hisaab se adjust kar lena agar services folder bahar hai)
import { csatApi } from "../../src/services/api"; 

// ... (Baaki saare purane imports same rahenge)
import { foodData } from "../data/food/data";
import { drinksData } from "../data/drinks/data";
import { categoriesConfig, popularSearchesByCat, mainCategories } from "../data/categories";

interface MenuViewProps {
  onBackAction: () => void;
}

export default function MenuView({ onBackAction }: MenuViewProps) {
  // ✨ API States
  const [apiMenuData, setApiMenuData] = useState<any[]>([]);
  const [dynamicTabs, setDynamicTabs] = useState<string[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  
  // Real-time stock state
  const [soldOutItems, setSoldOutItems] = useState<string[]>([]);

  // Existing States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isComboOverlayOpen, setIsComboOverlayOpen] = useState(false);
  const [bogoOfferState, setBogoOfferState] = useState<{isOpen: boolean, offer: BogoOffer | null}>({isOpen: false, offer: null});
  const [discountOfferState, setDiscountOfferState] = useState<{isOpen: boolean, offer: DiscountOffer | null}>({isOpen: false, offer: null});
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [orderData, setOrderData] = useState<{items: any[], bill: any} | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'summary' | 'payment' | 'success' | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Enhanced State Management for High-Performance Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState(""); // For group filtering (e.g., 'GRP_0001')
  const [dietPreference, setDietPreference] = useState("ALL"); // 'ALL', 'VEG', 'NON-VEG'
  const [activeCategory, setActiveCategory] = useState(""); // For category filtering (e.g., '05')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]); // [min, max]
  const [sortOrder, setSortOrder] = useState("LH"); // 'LH' or 'HL'
  
  const [category, setCategory] = useState("Food"); // Legacy support
  const [filter, setFilter] = useState("ALL"); // Legacy support
  const [tab, setTab] = useState(""); // Legacy support
  const [selectedDish, setSelectedDish] = useState<any>(null);

  // Advanced filter states (for legacy FilterOverlay compatibility)
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [hasCustomFilters, setHasCustomFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const [globalCart, setGlobalCart] = useState<CartItem[]>([]);

  // 🔥 THE MAGIC: Hitting the CSAT API 🔥
  useEffect(() => {
    const fetchLiveMenu = async () => {
      try {
        // API Service ko call kiya
        const payload = await csatApi.getMenu("013", "230216", "001");
       console.log(payload); 
        const rawItems = payload.menu?.entity?.items || [];
        const rawCategories = payload.menu?.entity?.main_categories || [];
        const rawGroups = payload.menu?.entity?.groups || [];

        // Smart Mapping
        const normalizedData = rawItems.map((item: any) => {
          // Find Category Name
          const catObj = rawCategories.find((c: any) => c.id === item.category_id);
          const catName = catObj ? catObj.name : "Others";
          
          // Find if it's FOOD or DRINK based on groupcode
          const groupObj = rawGroups.find((g: any) => g.groupcode === catObj?.groupcode);
          const isDrink = groupObj?.groupname === 'BEVERAGE' || groupObj?.groupname === 'LIQUOR';
          const topLevelCategory = isDrink ? "Drinks" : "Food";

          // Fallback Image
          const imgUrl = isDrink 
            ? "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150&q=80" // Drink Image
            : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&q=80"; // Food Image

          return {
            id: String(item.id),  // Strict ID matching: always store as String
            title: item.name,
            price: Number(item.price || 0),
            desc: item.description?.trim() || "",
            img: imgUrl,
            isVeg: item.is_veg === true,
            isNonVeg: item.is_veg === false,
            category: catName, // e.g., "Starters", "Pizza", "Aperitif & Liqueur"
            mainCategory: topLevelCategory,
            gst_details: item.gst_details || {
              cgst: Number(item.cgst) || 0,
              sgst: Number(item.sgst) || 0,
              igst: Number(item.igst) || 0,
              inclusive: item.inclusive || false
            }
          };
        });

        if(normalizedData.length > 0) {
          setApiMenuData(normalizedData);
        }
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchLiveMenu();
  }, []);

  // Socket listeners for real-time stock updates
  useEffect(() => {
    const socket = getSocket();
    
    // Listen for initial stock state when connecting
    socket.on('INITIAL_STOCK_STATE', (stockItems: string[]) => {
      setSoldOutItems(stockItems);
    });
    
    // Listen for real-time stock updates
    socket.on('STOCK_UPDATED', (stockItems: string[]) => {
      console.log('Menu received sold out items:', stockItems);
      setSoldOutItems(stockItems);
    });
    
    return () => {
      socket.off('INITIAL_STOCK_STATE');
      socket.off('STOCK_UPDATED');
    };
  }, []);

  // Update Dynamic Tabs when Data or Category (Food/Drinks) changes
  useEffect(() => {
    if (apiMenuData.length > 0) {
      // Find unique categories for selected Food or Drinks
      const relevantItems = apiMenuData.filter(i => i.mainCategory === category);
      const uniqueCats = Array.from(new Set(relevantItems.map(i => i.category))) as string[];
      setDynamicTabs(uniqueCats);
      if (uniqueCats.length > 0) {
        setTab(uniqueCats[0]); // Select first tab automatically
      }
    }
  }, [apiMenuData, category]);

  const handleUpdateQuantity = (id: string, delta: number, itemDetails?: any) => {
    setGlobalCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) {
        const newQ = existing.quantity + delta;
        if (newQ <= 0) return prev.filter(i => i.id !== id);
        return prev.map(i => i.id === id ? { ...i, quantity: newQ } : i);
      }
      if (delta > 0 && itemDetails) {
        console.log('Adding item to cart with GST details:', itemDetails);
        return [...prev, {
          id,
          name: itemDetails.title,
          price: Number(itemDetails.price),
          quantity: 1,
          image: itemDetails.img,
          description: itemDetails.desc,
          gst_details: itemDetails.gst_details
        }];
      }
      return prev;
    });
  };

  const handleSaveGlobalInstructions = (id: string, newInst: string) => {
    setGlobalCart(prev => prev.map(i => i.id === id ? { ...i, instructions: newInst } : i));
  };

  const totalCartItems = globalCart.reduce((sum, item) => sum + item.quantity, 0);

  // Offers dummy data
  const dummyBogoOffer: BogoOffer = { title: "BOGO Pasta Deal", subtitle: "Buy any pasta and get a Mojito free", price: 250, mainCategoryName: "Pasta", freeCategoryName: "Mojito", mainItems: [{ id: "p1", name: "Alfredo", img: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=150&q=80" }, { id: "p2", name: "Carbonara", img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=150&q=80" }, { id: "p3", name: "Pesto", img: "https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=150&q=80" }], freeItems: [{ id: "m1", name: "Mint", img: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=150&q=80" }, { id: "m2", name: "Berry", img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150&q=80" }] };
  const dummyDiscountOffer: DiscountOffer = { id: "d1", title: "10% off on orders above ₹500", discountPercentage: 10, minOrderValue: 500, benefits: ["Minimum order of ₹500", "10% discount", "Valid on all items", "Auto applied at checkout"] };

  const currentConfig = categoriesConfig[category] || categoriesConfig["Food"];
  
  // 🔄 THE RENDER LOGIC
  const currentData = apiMenuData.length > 0 ? apiMenuData : (category === "Drinks" ? drinksData : foodData);
  const activeTabs = apiMenuData.length > 0 ? dynamicTabs : currentConfig.tabs;
  
  const currentPopularSearches = popularSearchesByCat[category] || popularSearchesByCat["Food"];

  // 🔥 HIGH-PERFORMANCE FILTERING WITH useMemo
  const filteredItems = useMemo(() => {
    let items = [...currentData];
    
    // 1. Search filter - Case-insensitive match on item.name
    if (searchQuery) {
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 2. Group/Category filter - Match item.category_id or parent group
    if (activeGroup) {
      items = items.filter(item => 
        item.category_id === activeGroup || 
        item.category?.includes(activeGroup)
      );
    }
    
    // 3. Diet preference filter - If 'VEG', only show item.isVeg === true
    if (dietPreference === "VEG") {
      items = items.filter(item => item.isVeg);
    } else if (dietPreference === "NON-VEG") {
      items = items.filter(item => item.isNonVeg);
    }
    
    // 4. Category filter - Match activeCategory
    if (activeCategory) {
      items = items.filter(item => item.category === activeCategory);
    }
    
    // 5. Price filter - item.price must be within priceRange [min, max]
    items = items.filter(item => 
      item.price >= priceRange[0] && item.price <= priceRange[1]
    );
    
    // 6. Sort order - Apply sortOrder (Low to High / High to Low)
    if (sortOrder === "HL") {
      items.sort((a, b) => b.price - a.price); // High to Low
    } else {
      items.sort((a, b) => a.price - b.price); // Low to High
    }
    
    // Legacy filter compatibility
    items = items.filter(item => item.mainCategory === category);
    
    if (tab) {
      items = items.filter(item => item.category === tab);
    }
    
    if (category === "Food") {
      if (filter === "VEG") {
        items = items.filter(item => item.isVeg);
      } else if (filter === "NON-VEG") {
        items = items.filter(item => item.isNonVeg);
      }
    }
    
    // Advanced filters legacy compatibility
    if (appliedFilters.priceRange !== undefined) {
      items = items.filter(item => item.price <= appliedFilters.priceRange);
    }
    
    if (appliedFilters.sortOrder === "high-to-low") {
      items.sort((a, b) => b.price - a.price);
    }
    
    return items;
  }, [currentData, searchQuery, activeGroup, dietPreference, activeCategory, priceRange, sortOrder, category, tab, filter, appliedFilters]);

  const getFilteredSuggestions = () => {
    if (!searchQuery) return currentPopularSearches;
    return filteredItems.map(item => item.title).slice(0, 5);
  };

  return (
    <div className="pb-32 relative animate-in fade-in slide-in-from-bottom-4 duration-500 w-full sm:max-w-[393px] mx-auto min-h-screen bg-[#E6EDF3] overflow-x-hidden">
      {/* ... Headers & Search Overlays remain same ... */}
      {isSearchOpen && <div className="fixed inset-0 bg-[#E6EDF3] opacity-70 z-40 transition-opacity" onClick={() => setIsSearchOpen(false)} />}
      <header className="w-full h-[303px] absolute top-0 left-0 bg-[#E6EDF3] z-10 pointer-events-none"></header>

      <div className="px-[20.5px] pt-[30px] flex justify-between items-center relative z-30">
        <img src="/logo.png" alt="CSAT" className="w-[89px] h-[31px] cursor-pointer active:scale-95 transition-transform pointer-events-auto" onClick={onBackAction} />
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-[94px] h-[35px] bg-white rounded-[40px] flex items-center justify-center border border-[#E6EDF3] shadow-sm">
            <div className="flex items-center gap-[8px] relative">
              <button onClick={() => setIsSearchOpen(true)} className="hover:scale-110 active:scale-90 transition-transform cursor-pointer"><svg width="18.5" height="18.5" viewBox="0 0 24 24" fill="none"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 21L16.65 16.65" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              <div className="w-[1px] h-[16px] bg-gray-200"></div>
              <div className="relative">
                <button onClick={() => setIsFilterOpen(true)} className="hover:scale-110 active:scale-90 transition-transform cursor-pointer flex items-center justify-center p-1"><svg width="14.45" height="14.45" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                {filterCount > 0 && (
                  <div className="absolute -top-[10px] -right-[6px] w-[12px] h-[12px] bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-[#0B4F6C] text-[10px] font-roboto font-normal">{filterCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button className="w-[35px] h-[35px] bg-white rounded-full flex items-center justify-center border border-[#E6EDF3] shadow-sm hover:bg-gray-50 active:scale-95 transition-all"><svg width="16" height="16" viewBox="0 0 24 24" fill="#0B4F6C"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" /></svg></button>
        </div>
      </div>

      <section className="flex justify-center gap-[25px] mt-[25px] px-[21px] relative z-20">
        {mainCategories.map((cat) => (
          <div key={cat.name} onClick={() => { 
            setCategory(cat.name); 
            setFilter(categoriesConfig[cat.name].filters[0]); 
            setActiveGroup(""); 
            setDietPreference("ALL");
          }} className={`w-[80px] h-[100px] flex flex-col items-center justify-center gap-[5px] rounded-[8px] transition-all cursor-pointer hover:shadow-md border-[0.5px] ${category === cat.name ? "bg-[#0B4F6C] border-[#0B4F6C] shadow-md" : "bg-white border-[rgba(11,79,108,0.3)] shadow-sm"}`}>
            <div className="w-[50px] h-[50px] rounded-full overflow-hidden shadow-[1px_2px_4px_rgba(0,0,0,0.15)]"><img src={cat.img} alt={cat.name} className="w-full h-full object-cover" /></div>
            <h3 className={`font-inter text-[12px] leading-[15px] font-semibold text-center ${category === cat.name ? "text-white" : "text-[#0B4F6C]"}`}>{cat.name}</h3>
          </div>
        ))}
      </section>

      <section className="mx-auto w-[351px] h-[36px] mt-[15px] flex justify-between bg-white border-[0.6px] border-[rgba(11,79,108,0.2)] rounded-[50px] shadow-sm p-[3px] items-center relative z-20 overflow-hidden">
        {currentConfig.filters.map((f) => {
          const isActive = filter === f;
          return (<button key={f} onClick={() => { 
            setFilter(f); 
            setDietPreference(f === "VEG" ? "VEG" : f === "NON-VEG" ? "NON-VEG" : "ALL");
          }} className={`flex-1 h-full flex items-center justify-center rounded-[50px] font-inter font-semibold text-[14px] leading-[17px] transition-all uppercase ${isActive ? "bg-[#0B4F6C] text-white shadow-md" : "text-[#0B4F6C]"}`}>{f}</button>);
        })}
      </section>

      {/* ✨ DYNAMIC TABS SECTION ✨ */}
      <section className="mt-[30px] border-b border-[rgba(11,79,108,0.15)] relative z-20 overflow-x-auto no-scrollbar">
        <div className="flex px-[21px] gap-[30px] min-w-max pb-[2px]">
          {activeTabs.map((t) => {
            const isActive = tab === t || activeCategory === t;
            return (
              <div key={t} onClick={() => { 
                setTab(t); 
                setActiveCategory(t);
              }} className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
                <span className={`font-inter text-[16px] leading-[19px] mb-2 transition-colors uppercase ${isActive ? "font-bold text-[#0B4F6C]" : "text-[rgba(11,79,108,0.4)] group-hover:text-[#0B4F6C]"}`}>{t}</span>
                {isActive && <div className="w-full border-b-[4px] border-[#0B4F6C] h-0"></div>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-[25px] mx-auto w-full max-w-[393px] h-full overflow-y-auto no-scrollbar scroll-smooth relative z-20 pb-20 pointer-events-auto">
        <div className="flex flex-col items-center">
          
          {isLoadingMenu && (
            <div className="w-[347px] mb-4 p-4 bg-white/50 backdrop-blur rounded-xl border border-blue-100 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#0B4F6C] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-[#0B4F6C]">Fetching Live Menu from CSAT...</p>
            </div>
          )}

          <div className="flex flex-col gap-4 w-[347px]">
            {filteredItems.map((item, idx) => {
              const itemId = item.id || `${item.title}-${idx}`;
              const cartItem = globalCart.find(i => i.id === itemId);
              const isSoldOut = soldOutItems.includes(String(itemId));
              
              return (
                <FoodItem 
                  key={itemId}
                  title={item.title}
                  price={item.price}
                  time={item.time || "20-30 min"}
                  desc={item.desc}
                  img={item.img}
                  isVeg={item.isVeg || false}
                  isNonVeg={item.isNonVeg || false}
                  isSoldOut={isSoldOut}
                  onClick={() => setSelectedDish(item)}
                  quantity={cartItem ? cartItem.quantity : 0}
                  onAdd={(e) => { 
                    console.log('The REAL ID of this clicked item is:', itemId, 'Type:', typeof itemId);
                    e.stopPropagation(); 
                    handleUpdateQuantity(itemId, 1, item); 
                  }}
                  onIncrement={(e) => { e.stopPropagation(); handleUpdateQuantity(itemId, 1); }}
                  onDecrement={(e) => { e.stopPropagation(); handleUpdateQuantity(itemId, -1); }}
                />
              )
            })}
          </div>

          <div className="w-[347px] mt-4 z-30 relative pointer-events-auto">
            <SpecialOffers onComboClick={() => setIsComboOverlayOpen(true)} onBogoClick={() => setBogoOfferState({isOpen: true, offer: dummyBogoOffer})} onDiscountClick={() => setDiscountOfferState({isOpen: true, offer: dummyDiscountOffer})} />
          </div>
        </div>
      </section>

      {/* ... Footer and Modals remain same ... */}
      <div className="fixed inset-x-0 bottom-8 z-[100] mx-auto w-full max-w-[393px] pointer-events-none h-[80px]">
        {totalCartItems > 0 && (
          <button onClick={() => setIsCartOpen(true)} className="absolute bottom-2 left-6 px-5 py-3 bg-white shadow-lg rounded-full pointer-events-auto active:scale-95 transition-all border border-gray-100">
            <span className="text-[13px] font-bold text-[#0B4F6C]">{totalCartItems} Item{totalCartItems > 1 ? 's' : ''} added | view cart &gt;</span>
          </button>
        )}
        <button onClick={() => setIsCategoryMenuOpen(true)} className="absolute bottom-0 right-5 w-[75px] h-[75px] pointer-events-auto rounded-full bg-[#0B4F6C] shadow-2xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all border-[3px] border-[#E6EDF3]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 8L5 12M5 16L5 20M19 8L19 12M19 16L19 20M10 2V10M14 2V10M10 10H14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 10H14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 10V22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-white text-[12px] font-bold mt-0.5">Menu</span>
        </button>
      </div>

      <CategoryMenuOverlay isOpen={isCategoryMenuOpen} onCloseAction={() => setIsCategoryMenuOpen(false)} onSelectCategoryAction={(cat) => setTab(cat)} currentCategory={category} />
      
      <SearchOverlay isOpen={isSearchOpen} onCloseAction={() => setIsSearchOpen(false)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} suggestions={getFilteredSuggestions()} />
      
      <FilterOverlay isOpen={isFilterOpen} onCloseAction={() => setIsFilterOpen(false)} category={category} onApplyAction={(filters, count) => { setAppliedFilters(filters); setHasCustomFilters(true); setFilterCount(count); setIsFilterOpen(false); }} onClearAction={() => { setAppliedFilters({}); setHasCustomFilters(false); setFilterCount(0); setIsFilterOpen(false); }} />
      
      <DishDetails isOpen={!!selectedDish} dish={selectedDish} onCloseAction={() => setSelectedDish(null)} />
      <ComboOfferOverlay isOpen={isComboOverlayOpen} onClose={() => setIsComboOverlayOpen(false)} />
      <BogoOfferOverlay isOpen={bogoOfferState.isOpen} offer={bogoOfferState.offer} onClose={() => setBogoOfferState({isOpen: false, offer: null})} />
      <DiscountOfferOverlay isOpen={discountOfferState.isOpen} offer={discountOfferState.offer} onClose={() => setDiscountOfferState({isOpen: false, offer: null})} />
      
      <CartOverlay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={globalCart} updateQuantity={handleUpdateQuantity} handleSaveInstructions={handleSaveGlobalInstructions} onPlaceOrder={async (items, bill, guestPhone) => {
        if (isPlacingOrder) return;
        setIsPlacingOrder(true);
        try {
          const result = await createOrder({
            cartItems: items.map(item => ({
              id: String(item.id),
              itemId: String(item.id),
              itemName: item.name,
              quantity: item.quantity,
              price: item.price,
              instruction: item.instructions || "",
            })),
            billDetails: { subtotal: bill.subtotal, taxAmount: bill.taxAmount, discount: bill.discountAmount, total: bill.total },
            tableNumber: "12",
            guestPhone,
          });
          if (result.success) {
            console.log("Order created, WhatsApp sent to:", guestPhone);
          } else {
            console.error("Order creation failed:", result.error);
          }
        } catch (err) {
          console.error("Order API error:", err);
        } finally {
          setIsPlacingOrder(false);
        }
        setOrderData({items, bill});
        setCheckoutStep('success');
        setIsCartOpen(false);
        setGlobalCart([]);
      }} />
      
      {checkoutStep === 'success' && (
        <OrderSuccessView cartItems={orderData?.items || []} billDetails={orderData?.bill || {}} onBackToMenu={() => { setCheckoutStep(null); setOrderData(null); }} onViewBill={() => setCheckoutStep('summary')} />
      )}
      
      <OrderSummaryView isOpen={checkoutStep === 'summary'} cartItems={orderData?.items || []} billDetails={orderData?.bill || {}} onBack={() => setCheckoutStep('success')} onEdit={() => { setCheckoutStep(null); }} onProceedToPay={() => setCheckoutStep('payment')} />
      <PaymentView isOpen={checkoutStep === 'payment'} cartItems={orderData?.items || []} billDetails={orderData?.bill || {}} onBack={() => setCheckoutStep('summary')} onPaymentComplete={() => { setCheckoutStep(null); setOrderData(null); }} />
    </div>
  );
}
