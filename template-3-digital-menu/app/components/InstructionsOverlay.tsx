"use client";

import { useState, useEffect } from "react";

export interface InstructionsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onSave: (instructions: string) => void;
  initialInstructions?: string;
}

export default function InstructionsOverlay({ isOpen, onClose, itemName, onSave, initialInstructions = "" }: InstructionsOverlayProps) {
  const [text, setText] = useState(initialInstructions);

  // Reset textarea when overlay opens
  useEffect(() => {
    if (isOpen) {
      setText(initialInstructions);
    }
  }, [isOpen, initialInstructions]);

  if (!isOpen) return null;

  const quickOptions = ["Extra spicy", "Less oil", "No garlic"];

  const handleAddQuickOption = (option: string) => {
    // Append the quick option with a comma if text already exists
    setText((prev) => prev ? `${prev}, ${option}` : option);
  };

  return (
    // Z-index 400 so it appears above the Cart Overlay (which is 300)
    <div className="fixed inset-0 z-[400] w-full sm:max-w-[393px] mx-auto flex flex-col justify-end pointer-events-none">
      
      {/* Dark Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="relative w-full bg-[#FAF7F2] rounded-t-[24px] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl pointer-events-auto box-border p-6 pb-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[14px] font-bold text-gray-500 uppercase tracking-wide">SPECIAL INSTRUCTIONS</h2>
          <button 
            onClick={onClose} 
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Dynamic Subtitle */}
        <p className="text-[13px] text-[#0B4F6C] opacity-80 mb-5 leading-relaxed font-inter">
          Any special preferences? Let our chef know how'd you like your <span className="font-semibold">{itemName}</span> prepared.
        </p>

        {/* Text Area */}
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g., make it extra spicy, No onions, well done....."
          className="w-full min-h-[120px] bg-white border border-gray-300 rounded-[16px] p-4 text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0B4F6C] focus:ring-1 focus:ring-[#0B4F6C] resize-none mb-5 shadow-sm font-inter"
        />

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {quickOptions.map((option) => (
            <button 
              key={option}
              onClick={() => handleAddQuickOption(option)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-[12px] text-gray-500 hover:border-[#0B4F6C] hover:text-[#0B4F6C] active:scale-95 transition-all shadow-sm font-inter"
            >
              {option}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              onSave(text);
              onClose();
            }}
            className="w-full bg-[#0B4F6C] text-white font-inter font-semibold py-[14px] rounded-full hover:bg-[#062F41] active:scale-95 transition-all shadow-md"
          >
            Save instructions
          </button>
          
          <button 
            onClick={onClose}
            className="w-full bg-white text-[#0B4F6C] font-inter font-semibold py-[14px] rounded-full border border-[#0B4F6C] hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            Cancel
          </button>
        </div>
        
      </div>
    </div>
  );
}