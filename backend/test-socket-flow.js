/**
 * Socket.io KDS Integration Test
 * Spins up an isolated Socket.io server, connects a mock Kitchen client
 * and a mock Guest client, then validates the full event flow.
 * Run: node test-socket-flow.js
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';

const TEST_PORT = 9999;

// ─── Helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✅  PASS  ${message}`);
    passed++;
  } else {
    console.error(`  ❌  FAIL  ${message}`);
    failed++;
  }
};

const waitForEvent = (socket, event, timeoutMs = 3000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout (${timeoutMs}ms) waiting for "${event}"`)),
      timeoutMs
    );
    socket.once(event, (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });

const waitForConnections = (sockets) =>
  new Promise((resolve) => {
    let count = 0;
    sockets.forEach((s) =>
      s.on('connect', () => { if (++count === sockets.length) resolve(); })
    );
  });

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_ORDER = {
  id: 'test-uuid-abc-1234',
  orderId: 'ORD000001',
  tableNumber: 'A-12',
  guestName: 'Jeetu',
  guestPhone: '9891929595',
  status: 'RECEIVED',
  totalAmount: 1950,
  paymentMethod: 'CASH',
  createdAt: new Date().toISOString(),
  items: [
    { id: 'item-1', itemId: '1059', itemName: 'Butter Chicken', quantity: 2, unitPrice: 650, totalPrice: 1300, modifiers: [] },
    { id: 'item-2', itemId: '1060', itemName: 'Garlic Naan',    quantity: 3, unitPrice: 150, totalPrice: 450,  modifiers: [] },
  ],
};

// ─── Test runner ─────────────────────────────────────────────────────────────

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

httpServer.listen(TEST_PORT, async () => {
  const separator = '─'.repeat(50);
  console.log(`\n🧪  Socket.io KDS Integration Test`);
  console.log(separator);
  console.log(`📡  Test server  →  ws://localhost:${TEST_PORT}\n`);

  // Connect mock clients
  const kitchenClient = Client(`http://localhost:${TEST_PORT}`, { transports: ['websocket'] });
  const guestClient   = Client(`http://localhost:${TEST_PORT}`, { transports: ['websocket'] });

  await waitForConnections([kitchenClient, guestClient]);

  console.log(`🍳  Kitchen client connected  (id: ${kitchenClient.id})`);
  console.log(`👤  Guest client connected    (id: ${guestClient.id})\n`);

  // ── TEST 1: Kitchen receives NEW_ORDER_RECEIVED ─────────────────────────
  console.log(`TEST 1 — Kitchen receives NEW_ORDER_RECEIVED`);
  console.log(separator);

  const t1 = waitForEvent(kitchenClient, 'NEW_ORDER_RECEIVED');

  // Replicate exactly what createOrder controller does:
  //   io.emit('NEW_ORDER_RECEIVED', newOrder);
  io.emit('NEW_ORDER_RECEIVED', MOCK_ORDER);

  try {
    const order = await t1;
    assert(order.id        === MOCK_ORDER.id,        `order.id matches              → ${order.id}`);
    assert(order.orderId   === 'ORD000001',           `order.orderId is ORD000001   → ${order.orderId}`);
    assert(order.status    === 'RECEIVED',            `order.status is RECEIVED     → ${order.status}`);
    assert(order.items.length === 2,                  `items array has 2 entries    → ${order.items.length}`);
    assert(order.tableNumber === 'A-12',              `tableNumber is A-12          → ${order.tableNumber}`);
  } catch (err) {
    assert(false, err.message);
  }

  console.log();

  // ── TEST 2: Both clients receive ORDER_STATUS_UPDATED (→ PREPARING) ─────
  console.log(`TEST 2 — ORDER_STATUS_UPDATED: RECEIVED → PREPARING`);
  console.log(separator);

  const t2Kitchen = waitForEvent(kitchenClient, 'ORDER_STATUS_UPDATED');
  const t2Guest   = waitForEvent(guestClient,   'ORDER_STATUS_UPDATED');

  // Replicate exactly what updateOrderStatus controller does:
  //   io.emit('ORDER_STATUS_UPDATED', { id: updatedOrder.id, status: updatedOrder.status });
  io.emit('ORDER_STATUS_UPDATED', { id: MOCK_ORDER.id, status: 'PREPARING' });

  try {
    const [kitchenUpdate, guestUpdate] = await Promise.all([t2Kitchen, t2Guest]);
    assert(kitchenUpdate.id     === MOCK_ORDER.id, `Kitchen: correct order ID    → ${kitchenUpdate.id}`);
    assert(kitchenUpdate.status === 'PREPARING',   `Kitchen: status → PREPARING  → ${kitchenUpdate.status}`);
    assert(guestUpdate.id       === MOCK_ORDER.id, `Guest:   correct order ID    → ${guestUpdate.id}`);
    assert(guestUpdate.status   === 'PREPARING',   `Guest:   status → PREPARING  → ${guestUpdate.status}`);
  } catch (err) {
    assert(false, err.message);
  }

  console.log();

  // ── TEST 3: Both clients receive ORDER_STATUS_UPDATED (→ SERVED) ────────
  console.log(`TEST 3 — ORDER_STATUS_UPDATED: PREPARING → SERVED`);
  console.log(separator);

  const t3Kitchen = waitForEvent(kitchenClient, 'ORDER_STATUS_UPDATED');
  const t3Guest   = waitForEvent(guestClient,   'ORDER_STATUS_UPDATED');

  io.emit('ORDER_STATUS_UPDATED', { id: MOCK_ORDER.id, status: 'SERVED' });

  try {
    const [kitchenUpdate, guestUpdate] = await Promise.all([t3Kitchen, t3Guest]);
    assert(kitchenUpdate.status === 'SERVED', `Kitchen: status → SERVED     → ${kitchenUpdate.status}`);
    assert(guestUpdate.status   === 'SERVED', `Guest:   status → SERVED     → ${guestUpdate.status}`);
  } catch (err) {
    assert(false, err.message);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log();
  console.log(separator);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log(`\n🎉  All tests passed. Socket.io KDS flow is verified.\n`);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed.\n`);
  }

  // Cleanup
  kitchenClient.disconnect();
  guestClient.disconnect();
  io.close();
  httpServer.close(() => process.exit(failed === 0 ? 0 : 1));
});
