"use client";

import { useState, useEffect } from "react";

interface SearchOverlayProps {
  isOpen: boolean;
  onCloseAction: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  suggestions: string[];
}

export default function SearchOverlay({ isOpen, onCloseAction, searchQuery, setSearchQuery, suggestions }: SearchOverlayProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setSearchQuery(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion);
    setSearchQuery(suggestion);
    onCloseAction();
  };

  return (
    <div className="fixed inset-0 z-[150] w-full sm:max-w-[393px] mx-auto flex flex-col justify-start pointer-events-none">
      <div className="absolute inset-0 bg-[#E6EDF3] opacity-70 pointer-events-auto" onClick={onCloseAction} />
      
      <div className="relative w-full bg-[#FAF7F2] rounded-t-[15px] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden box-border pointer-events-auto">
        
        <div className="px-[21px] py-[24px] flex justify-between items-center bg-[#FAF7F2] border-b border-[#B6B4B1]">
          <h2 className="font-inter font-semibold text-[20px] text-[#555555]">Search</h2>
          <button onClick={onCloseAction} className="w-[24px] h-[24px] bg-[#F8F1ED] rounded-full flex items-center justify-center text-[#555555] active:scale-90 transition-transform">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 p-[20px] overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-3 mb-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#0B4F6C]">
              <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21L16.65 16.65" stroke="#0B4F6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              value={localQuery}
              onChange={handleInputChange}
              placeholder="Search for dishes..."
              className="flex-1 bg-transparent outline-none text-[16px] text-[#0B4F6C] placeholder-[#0B4F6C]/50 font-inter"
              autoFocus
            />
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-inter text-[14px] text-[#555555] font-medium">Suggestions</h3>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-3 bg-white rounded-lg border border-[#E6EDF3] hover:bg-[#0B4F6C]/5 transition-colors"
                >
                  <span className="font-inter text-[14px] text-[#0B4F6C]">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
