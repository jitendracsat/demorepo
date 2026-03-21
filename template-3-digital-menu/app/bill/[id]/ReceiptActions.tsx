'use client';

export default function ReceiptActions() {
  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={() => window.print()}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        🖨️ Print Receipt
      </button>
      <button
        onClick={() => window.location.href = '/demo'}
        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        ← Back to Demo
      </button>
    </div>
  );
}
