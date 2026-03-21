import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BillPage({ params }: PageProps) {
  const { id } = await params;

  // Validate the order ID format (basic validation)
  if (!id || typeof id !== 'string' || id.length < 3) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Digital Receipt
          </h1>
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Order Confirmed
          </div>
        </div>

        {/* Main Receipt Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Receipt Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Digital E-Receipt</h2>
                <p className="text-blue-100">Thank you for your order!</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Order ID</p>
                <p className="text-xl font-mono font-bold">{id}</p>
              </div>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-8">
            {/* Order Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Order Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-mono font-semibold text-gray-900">{id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-semibold text-green-600">Confirmed</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-semibold text-gray-900">{new Date().toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Table</p>
                  <p className="font-semibold text-gray-900">Table-01</p>
                </div>
              </div>
            </div>

            {/* Mock Order Items */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Order Items
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">Butter Chicken</p>
                    <p className="text-sm text-gray-500">Qty: 2 | Extra spicy</p>
                  </div>
                  <p className="font-semibold text-gray-900">₹25.98</p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">₹25.98</p>
              </div>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                This is a demo digital receipt for testing purposes
              </p>
              <p className="text-xs text-gray-400">
                Generated: {new Date().toISOString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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

        {/* Debug Info */}
        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">
            🧪 Demo Environment Info
          </h3>
          <div className="text-sm text-amber-800 space-y-1">
            <p><strong>Order ID:</strong> {id}</p>
            <p><strong>Route:</strong> /bill/[id]</p>
            <p><strong>Page Type:</strong> Server Component</p>
            <p><strong>Data Source:</strong> Mock/Static</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for common test IDs
export async function generateStaticParams() {
  return [
    { id: 'test-ord-12345' },
    { id: 'demo-order-67890' },
    { id: 'sample-order-11111' },
  ];
}
