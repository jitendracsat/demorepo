"use client";

export interface OrderSummaryProps {
  isOpen: boolean;
  cartItems: any[];
  billDetails: any;
  onBack: () => void; // Goes back to cart/menu
  onEdit: () => void; // Optional: goes back to cart
  onProceedToPay: () => void; // Goes to final success screen
}

export default function OrderSummaryView({ isOpen, cartItems, billDetails, onBack, onEdit, onProceedToPay }: OrderSummaryProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[350] bg-white overflow-y-auto">
      <div className="w-full max-w-[393px] mx-auto min-h-screen animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">ORDER SUMMARY</h1>
        </div>

        {/* YOUR ITEMS Section */}
        <div className="px-6 py-4">
          <div className="border-2 border-dotted border-blue-300 rounded-xl p-4 bg-blue-50/30">
            <h2 className="text-sm font-bold text-gray-900 mb-4">YOUR ITEMS</h2>
            
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  {/* Item Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                    {item.hasCustomizations && (
                      <p className="text-xs text-blue-600 mt-1">Add-ons: Cut Onions</p>
                    )}
                  </div>
                  
                  {/* Edit Button */}
                  <button 
                    onClick={onEdit}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Edit</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BILL SUMMARY Section */}
        <div className="px-6 py-4">
          <h2 className="text-sm font-bold text-gray-900 mb-4">BILL SUMMARY</h2>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Item subtotal</span>
                <span className="text-gray-900">₹{billDetails?.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxes & Charges</span>
                <span className="text-gray-900">₹{billDetails?.taxes?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Add-on charges</span>
                <span className="text-gray-900">₹0.00</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Savings</span>
                <span className="text-green-600 font-medium">₹{billDetails?.discount?.toFixed(2) || '0.00'}</span>
              </div>
              
              {/* Dotted Divider */}
              <div className="border-t-2 border-dotted border-gray-300 my-3"></div>
              
              {/* Total Amount */}
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-bold text-gray-900">₹{billDetails?.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
          <div className="w-full max-w-[393px] mx-auto px-6 py-4">
            <div className="bg-[#0B4F6C] rounded-xl p-4 flex items-center justify-between">
              {/* Left Side - Total */}
              <div>
                <p className="text-xs text-white/80 mb-1">TOTAL AMOUNT</p>
                <p className="text-xl font-bold text-white">₹{billDetails?.total?.toFixed(2) || '0.00'}</p>
              </div>
              
              {/* Right Side - Proceed to Pay Button */}
              <button 
                onClick={onProceedToPay}
                className="px-6 py-3 bg-white rounded-full flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-[#0B4F6C]">Proceed to pay</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#555c5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
