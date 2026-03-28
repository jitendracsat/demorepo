'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '../../lib/socket';

// All possible statuses from backend
type OrderStatus =
  | 'RECEIVED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'FOOD_READY'
  | 'ORDER_READY'
  | 'DELIVERED';

// The 5 steps in the successful lifecycle progress bar
const STEPS: { key: string; label: string; description: string }[] = [
  { key: 'RECEIVED',    label: 'Order Placed',    description: 'Your order has been placed' },
  { key: 'ACCEPTED',    label: 'Order Accepted',  description: 'Restaurant accepted your order' },
  { key: 'FOOD_READY',  label: 'Food Ready',      description: 'The kitchen has finished preparing' },
  { key: 'ORDER_READY', label: 'Order Ready',     description: 'Your order is ready to be served' },
  { key: 'DELIVERED',   label: 'Delivered',        description: 'Enjoy your meal!' },
];

// Map every status to its progress step index
const STATUS_INDEX: Record<string, number> = {
  RECEIVED:    0,
  ACCEPTED:    1,
  PREPARING:   1, // PREPARING maps to same step as ACCEPTED
  FOOD_READY:  2,
  ORDER_READY: 3,
  DELIVERED:   4,
};

export default function OrderStatusTracker({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const isRejected = status === 'REJECTED';
  const currentStep = isRejected ? -1 : (STATUS_INDEX[status] ?? 0);

  useEffect(() => {
    const socket = getSocket();

    console.log('--- [STAGE 4] FRONTEND (Bill Tracker): Listening for status events | orderId:', orderId);

    const handleUpdate = (data: { id?: string; orderId?: string; dbId?: string; status?: string }) => {
      const incomingId = data.id || data.dbId || '';
      const incomingOrderId = data.orderId || '';
      const newStatus = String(data.status || '') as OrderStatus;

      console.log('[STAGE 4] Status event received:', JSON.stringify(data));
      console.log('[STAGE 4] Comparing — ours:', orderId, '| incoming id:', incomingId, '| incoming orderId:', incomingOrderId);

      if (incomingId === orderId || incomingOrderId === orderId) {
        console.log('[STAGE 4] Status MATCHED! Updating to:', newStatus);
        setStatus(newStatus);
      }
    };

    // Listen to BOTH events
    socket.on('ORDER_STATUS_UPDATED', handleUpdate);
    socket.on('ORDER_STATUS_CHANGED', handleUpdate);

    return () => {
      socket.off('ORDER_STATUS_UPDATED', handleUpdate);
      socket.off('ORDER_STATUS_CHANGED', handleUpdate);
    };
  }, [orderId]);

  // ── REJECTED STATE ──
  if (isRejected) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-300 p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Order Status</h3>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-lg font-bold text-red-600">Order Rejected</p>
          <p className="text-sm text-gray-500 text-center">
            Sorry, the restaurant cannot fulfill your order right now. Please try again or contact staff.
          </p>
        </div>

        {/* Red progress bar — stopped at step 0 */}
        <div className="relative mt-4">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
            <div className="h-full bg-red-500 transition-all duration-700" style={{ width: '0%' }} />
          </div>
          <div className="relative flex justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.key} className="flex flex-col items-center gap-2 w-20 text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                    idx === 0
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {idx === 0 ? '!' : idx + 1}
                </div>
                <p className={`text-xs font-semibold ${idx === 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {idx === 0 ? 'Rejected' : step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── NORMAL PROGRESS BAR ──
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-5">Order Status</h3>

      <div className="relative">
        {/* Progress bar track */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-700"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step, idx) => {
            const done = idx <= currentStep;
            const active = idx === currentStep;
            return (
              <div key={step.key} className="flex flex-col items-center gap-2 w-20 text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                    done
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  } ${active ? 'ring-4 ring-blue-100' : ''}`}
                >
                  {done && idx < currentStep ? '✓' : idx + 1}
                </div>
                <p className={`text-xs font-semibold ${done ? 'text-blue-700' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-gray-500 leading-tight">{step.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
