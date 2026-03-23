'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '../../lib/socket';

type OrderStatus = 'RECEIVED' | 'PREPARING' | 'SERVED';

const STEPS: { key: OrderStatus; label: string; description: string }[] = [
  { key: 'RECEIVED',  label: 'Order Received',  description: 'Your order has been confirmed' },
  { key: 'PREPARING', label: 'Preparing',        description: 'The kitchen is preparing your food' },
  { key: 'SERVED',    label: 'Served',           description: 'Your order is on the way to your table' },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  RECEIVED: 0,
  PREPARING: 1,
  SERVED: 2,
};

export default function OrderStatusTracker({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const currentStep = STATUS_INDEX[status] ?? 0;

  useEffect(() => {
    const socket = getSocket();

    socket.on(
      'ORDER_STATUS_UPDATED',
      ({ id, status: newStatus }: { id: string; status: OrderStatus }) => {
        if (id === orderId) setStatus(newStatus);
      }
    );

    return () => {
      socket.off('ORDER_STATUS_UPDATED');
    };
  }, [orderId]);

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
              <div key={step.key} className="flex flex-col items-center gap-2 w-24 text-center">
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
