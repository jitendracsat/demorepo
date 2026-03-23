'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../lib/socket';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  modifiers: string[];
}

interface Order {
  id: string;
  orderId: string;
  tableNumber: string;
  guestName: string;
  status: 'RECEIVED' | 'PREPARING' | 'SERVED';
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_CONFIG = {
  RECEIVED: {
    label: 'New Order',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  PREPARING: {
    label: 'Preparing',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
  SERVED: {
    label: 'Served',
    bg: 'bg-green-50',
    border: 'border-green-400',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
  },
} as const;

function ElapsedTime({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (diff < 60) setElapsed(`${diff}s ago`);
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ago`);
      else setElapsed(`${Math.floor(diff / 3600)}h ago`);
    };
    update();
    const t = setInterval(update, 10000);
    return () => clearInterval(t);
  }, [createdAt]);

  return <span className="text-xs text-gray-400">{elapsed}</span>;
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.RECEIVED;

  const handleAction = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onStatusChange(order.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5 flex flex-col gap-4 shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-sm font-semibold text-gray-500">
            {order.orderId || order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            Table {order.tableNumber}
          </p>
          {order.guestName && (
            <p className="text-sm text-gray-500 mt-0.5">{order.guestName}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <ElapsedTime createdAt={order.createdAt} />
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-1.5">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">{item.quantity}×</span>{' '}
              {item.itemName}
              {item.modifiers?.length > 0 && (
                <span className="text-gray-400 ml-1">({item.modifiers.join(', ')})</span>
              )}
            </span>
            <span className="text-gray-500">₹{item.totalPrice?.toFixed(0)}</span>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-auto">
        <p className="text-sm font-bold text-gray-900">
          ₹{order.totalAmount?.toFixed(0)}
        </p>
        {order.status === 'RECEIVED' && (
          <button
            onClick={() => handleAction('PREPARING')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Updating…' : 'Start Preparing'}
          </button>
        )}
        {order.status === 'PREPARING' && (
          <button
            onClick={() => handleAction('SERVED')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Updating…' : 'Mark Served'}
          </button>
        )}
        {order.status === 'SERVED' && (
          <span className="text-green-700 text-sm font-semibold">✓ Served</span>
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/orders`)
      .then((r) => r.json())
      .then((data: Order[]) => {
        const sorted = [...data].sort((a, b) => {
          const priority = { RECEIVED: 0, PREPARING: 1, SERVED: 2 };
          const diff = (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
          if (diff !== 0) return diff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setOrders(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = useCallback((id: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus as Order['status'] } : o))
    );
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('NEW_ORDER_RECEIVED', (order: Order) => {
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    });

    socket.on('ORDER_STATUS_UPDATED', ({ id, status }: { id: string; status: Order['status'] }) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('NEW_ORDER_RECEIVED');
      socket.off('ORDER_STATUS_UPDATED');
    };
  }, []);

  const active = orders.filter((o) => o.status !== 'SERVED');
  const served = orders.filter((o) => o.status === 'SERVED');

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kitchen Display System</h1>
          <p className="text-gray-400 text-sm">Live order queue</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-300">{connected ? 'Live' : 'Reconnecting…'}</span>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-24 text-gray-400">Loading orders…</div>
        ) : (
          <>
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Active Orders ({active.length})
              </h2>
              {active.length === 0 ? (
                <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                  No active orders. Waiting…
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {active.map((order) => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              )}
            </section>

            {served.length > 0 && (
              <section className="mt-10">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Served Today ({served.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60">
                  {served.map((order) => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
