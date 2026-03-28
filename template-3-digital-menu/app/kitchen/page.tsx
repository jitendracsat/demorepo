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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // Quick Inventory Manager state
  const [itemId, setItemId] = useState('');
  const [soldOutItems, setSoldOutItems] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/orders`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((data: Order[]) => {
        const sorted = [...data].sort((a, b) => {
          const priority = { RECEIVED: 0, PREPARING: 1, SERVED: 2 };
          const diff = (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
          if (diff !== 0) return diff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setOrders(sorted);
      })
      .catch((err: Error) => {
        console.error('KDS fetch error:', err);
        setFetchError(`Cannot reach backend at ${API_BASE_URL}. ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const createTestOrder = async () => {
    setTestLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: [
            { id: '1059', name: 'Butter Chicken', price: 650, quantity: 2, category: 'Main Course' },
            { id: '1060', name: 'Garlic Naan',    price: 60,  quantity: 3, category: 'Breads' },
          ],
          billDetails: {
            subtotal: 1480,
            taxAmount: 133.2,
            discountAmount: 100,
            total: 1513.2,
          },
          tableNumber: 'T-12',
          paymentMethod: 'CASH',
          outletId: '020',
          restaurantId: '240018',
          posCode: 'REST',
          guestName: 'Test Guest',
          guestPhone: '9876543210',
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      // Order will appear via the NEW_ORDER_RECEIVED socket event automatically
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Test order failed: ${msg}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleStatusChange = useCallback((id: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus as Order['status'] } : o))
    );
  }, []);

  // Stock toggle functions — coerce to String for strict ID matching
  const toggleStock = (isSoldOut: boolean) => {
    if (!itemId.trim()) return;

    const socket = getSocket();
    socket.emit('TOGGLE_STOCK', { itemId: String(itemId.trim()), isSoldOut });
    setItemId('');
  };

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

    // Stock state listeners — keep KDS in sync with sold-out items
    socket.on('INITIAL_STOCK_STATE', (items: string[]) => setSoldOutItems(items));
    socket.on('STOCK_UPDATED', (items: string[]) => setSoldOutItems(items));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('NEW_ORDER_RECEIVED');
      socket.off('ORDER_STATUS_UPDATED');
      socket.off('INITIAL_STOCK_STATE');
      socket.off('STOCK_UPDATED');
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
        <div className="flex items-center gap-4">
          <button
            onClick={createTestOrder}
            disabled={testLoading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {testLoading ? 'Sending…' : '+ Create Test Order'}
          </button>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-300">{connected ? 'Live' : 'Reconnecting…'}</span>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Quick Inventory Manager */}
        <section className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Inventory Manager</h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              placeholder="Enter Item ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => toggleStock(true)}
              disabled={!itemId.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-md transition-colors"
            >
              Mark Sold Out
            </button>
            <button
              onClick={() => toggleStock(false)}
              disabled={!itemId.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-md transition-colors"
            >
              Mark Available
            </button>
          </div>
          {soldOutItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-red-600 mb-1">Sold Out ({soldOutItems.length}):</p>
              <div className="flex flex-wrap gap-1.5">
                {soldOutItems.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-xs font-mono rounded-md border border-red-200">
                    {id}
                    <button onClick={() => { const s = getSocket(); s.emit('TOGGLE_STOCK', { itemId: String(id), isSoldOut: false }); }} className="text-red-400 hover:text-red-600 ml-0.5" title="Restore">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {loading ? (
          <div className="text-center py-24 text-gray-400">Loading orders…</div>
        ) : fetchError ? (
          <div className="text-center py-24">
            <p className="text-red-500 font-semibold text-lg mb-2">Failed to load orders</p>
            <p className="text-gray-500 text-sm font-mono">{fetchError}</p>
            <p className="text-gray-400 text-sm mt-4">Make sure the backend is running and <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_API_BASE_URL</code> is set correctly in <code className="bg-gray-200 px-1 rounded">.env.local</code></p>
          </div>
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
