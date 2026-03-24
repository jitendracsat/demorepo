# CLAUDE.md — Project Brain

> This file is the single source of truth for all architectural decisions, data contracts, and development conventions for this project. Read this before touching any code.

---

## 1. What This Project Is

A **decoupled, real-time restaurant ordering system** built in three layers:

| Layer | Technology | Hosting | Purpose |
|---|---|---|---|
| Frontend (Guest UI) | Next.js 16 + TypeScript + Tailwind CSS | Vercel | Digital menu, cart, payment, e-receipt |
| Backend (API Server) | Node.js + Express 5 + Socket.io | Render | REST API, real-time KDS events, POS payload generation |
| Database | PostgreSQL (Prisma ORM) | Neon (serverless) | Persistent order storage |

The Guest opens the **digital menu** on their phone, adds items to the cart, places the order, and gets a live receipt with real-time kitchen status updates. Simultaneously, the **Kitchen Display System (KDS)** receives the order in real-time via WebSocket.

---

## 2. Monorepo Structure

```
csat1/
├── backend/                     # Express + Socket.io API server
│   ├── index.js                 # Entry point — wraps Express in HTTP server, attaches Socket.io
│   ├── socket.js                # Socket.io initializer and singleton getter
│   ├── config/
│   │   └── prisma.js            # PrismaClient singleton
│   ├── controllers/
│   │   └── orderController.js   # All order business logic (createOrder, updateStatus, etc.)
│   ├── routes/
│   │   └── orderRoutes.js       # Route → controller mapping
│   ├── services/
│   │   └── whatsapp.js          # Meta WhatsApp API (falls back to mock if creds missing)
│   ├── prisma/
│   │   └── schema.prisma        # DB schema: Order + OrderItem models
│   └── test-socket-flow.js      # Isolated Socket.io integration test (11/11 passing)
│
└── template-3-digital-menu/     # Next.js frontend (Guest-facing)
    ├── app/
    │   ├── page.tsx             # Root page — hosts entire single-page app state machine
    │   ├── lib/
    │   │   └── socket.ts        # Socket.io-client singleton (connects to backend via env var)
    │   ├── components/
    │   │   ├── LandingView.tsx        # Welcome screen
    │   │   ├── CartOverlay.tsx        # Cart drawer — computes bill, calls onPlaceOrder
    │   │   ├── OrderSummaryView.tsx   # Summary before payment
    │   │   ├── PaymentView.tsx        # Payment method selection (Table / UPI)
    │   │   ├── OrderSuccessView.tsx   # Post-order countdown timer + bill summary
    │   │   └── DigitalReceipt.tsx     # Static receipt component
    │   └── bill/[id]/
    │       ├── page.tsx               # Server component — e-receipt page
    │       └── OrderStatusTracker.tsx # Client component — listens for ORDER_STATUS_UPDATED
    ├── src/services/
    │   └── api.ts               # CSAT external menu API client (proxied via Next.js rewrites)
    └── next.config.ts           # Rewrites: /api/csat/* → http://apiconnectnow.csatspl.com/api/*
```

---

## 3. Decoupled Architecture Rules

### 3.1 Frontend ↔ Backend Communication

The frontend NEVER hardcodes `localhost`. It uses an environment variable:

```
NEXT_PUBLIC_API_BASE_URL=https://your-render-backend.onrender.com
```

- **REST calls**: `POST /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/status`
- **WebSocket**: Singleton in `app/lib/socket.ts` connects to `NEXT_PUBLIC_API_BASE_URL`

```typescript
// app/lib/socket.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(API_BASE_URL, { transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
};
```

### 3.2 CSAT External API Proxy

The frontend proxies the external POS menu API to avoid CORS issues:

```typescript
// next.config.ts
rewrites: [{ source: '/api/csat/:path*', destination: 'http://apiconnectnow.csatspl.com/api/:path*' }]
```

The frontend calls `/api/csat/Menu/GetMenuJson?outletId=...` and Next.js transparently forwards it.

### 3.3 Backend Environment Variables

File: `backend/.env`

```env
DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=5000
# Optional — WhatsApp falls back to mock if missing:
META_ACCESS_TOKEN=...
META_PHONE_NUMBER_ID=...
```

---

## 4. Database Schema (Prisma)

Two models: `Order` (header) → `OrderItem` (line items, cascade delete).

```prisma
model Order {
  id              String      @id @default(uuid())
  restaurantId    String?     // POS field: "restaurantid"
  outletId        String?     // POS field: "outletId"
  posCode         String?     // POS field: "PosCode"
  orderId         String?     // External sequential ID e.g. "ORD012345"
  orderDate       DateTime?
  guestId         String?
  guestName       String?
  guestPhone      String?
  guestEmail      String?
  guestDob        String?
  guestAnniversary String?
  subtotal        Float?
  discountAmount  Float?
  taxAmount       Float?
  totalAmount     Float?
  tableNumber     String?
  paymentMethod   String?
  currency        String?
  status          String      @default("RECEIVED")   // RECEIVED | PREPARING | SERVED
  csatSyncStatus  Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  items           OrderItem[]
}

model OrderItem {
  id              String   @id @default(uuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  itemId          String
  itemName        String
  category        String?
  quantity        Float
  unitPrice       Float?
  totalPrice      Float?
  discountApplied Float?
  modifiers       Json?    // Array of modifier objects
  price           Float?   // Legacy field
  instruction     String?  // Legacy field
}
```

---

## 5. POS Payload — Exact JSON Contract

When `POST /api/orders` is called, the backend saves to DB then constructs and logs this exact payload for the POS system:

```json
{
  "outletId": "010",
  "restaurantid": "210014",
  "OrderId": "ORD012345",
  "OrderDate": "2024-01-15T10:30:00.000Z",
  "PosCode": "001",
  "TblNo": "A-12",
  "guest": {
    "guestId": "G001",
    "name": "Jeetu Sharma",
    "phone": "9876543210",
    "email": "jeetu@example.com",
    "dateOfBirth": "1990-01-01",
    "anniversary": "2015-06-15"
  },
  "subtotal": 1500.00,
  "discountAmount": 0.00,
  "taxAmount": 135.00,
  "totalAmount": 1635.00,
  "paymentMethod": "CASH",
  "currency": "INR",
  "items": [
    {
      "itemId": "1059",
      "itemName": "Butter Chicken",
      "category": "Main Course",
      "quantity": 2,
      "unitPrice": 650.00,
      "totalPrice": 1300.00,
      "modifiers": [],
      "discountApplied": 0
    }
  ]
}
```

**Key mapping rules** (frontend → backend → DB → POS):
- `cartItems[n].id` OR `cartItems[n].itemId` → `OrderItem.itemId`
- `cartItems[n].itemName` OR `cartItems[n].name` → `OrderItem.itemName`
- `billDetails.subtotal` → `Order.subtotal`
- `billDetails.total` → `Order.totalAmount`
- `orderId` is auto-generated as `ORD` + zero-padded 6-digit counter (in-memory, resets on restart)
- `currency` is always `"INR"` (hardcoded default)
- `status` starts as `"RECEIVED"` on creation

The payload is logged with `console.log("🔥 EXACT POS PAYLOAD GENERATED:\n", JSON.stringify(posPayload, null, 2))` and also returned in the API response as `posPayload`.

---

## 6. REST API Endpoints

Base URL (backend): `http://localhost:5000` in dev, `NEXT_PUBLIC_API_BASE_URL` in prod.

| Method | Path | Controller | Purpose |
|---|---|---|---|
| GET | `/api/health` | inline | Health check |
| POST | `/api/orders` | `createOrder` | Place new order → emits `NEW_ORDER_RECEIVED` |
| GET | `/api/orders` | `getAllOrders` | Fetch all orders (desc by createdAt) |
| GET | `/api/orders/:id` | `getBillById` | Fetch single order with items for e-receipt |
| PATCH | `/api/orders/:id/status` | `updateOrderStatus` | Update KDS status → emits `ORDER_STATUS_UPDATED` |

Valid status values for PATCH: `RECEIVED`, `PREPARING`, `SERVED`.

---

## 7. Real-time KDS Architecture (Socket.io)

### 7.1 Server Setup (`backend/socket.js`)

```javascript
// Singleton pattern — one io instance for the entire server lifetime
let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] } });
  io.on('connection', (socket) => {
    console.log(`🔌 KDS client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`🔌 KDS client disconnected: ${socket.id}`));
  });
  return io;
};

export const getIO = () => io;  // Used inside controllers to emit events
```

Socket.io is attached to the same HTTP server as Express — critical for single-port deployment on Render.

### 7.2 Events Emitted by Backend

#### `NEW_ORDER_RECEIVED`
Emitted by `createOrder` controller immediately after DB save.

```javascript
// backend/controllers/orderController.js
const io = getIO();
if (io) io.emit('NEW_ORDER_RECEIVED', newOrder); // Full Prisma Order object with items[]
```

**Payload**: The full `Order` object including nested `items[]` array.

#### `ORDER_STATUS_UPDATED`
Emitted by `updateOrderStatus` controller after DB update.

```javascript
if (io) io.emit('ORDER_STATUS_UPDATED', { id: updatedOrder.id, status: updatedOrder.status });
```

**Payload**: `{ id: string, status: 'RECEIVED' | 'PREPARING' | 'SERVED' }`

### 7.3 Client Listeners (Frontend)

#### KDS / Kitchen Screen
Listens for `NEW_ORDER_RECEIVED` to display incoming orders in real-time.
*(KDS screen to be built as a separate `/kds` route — uses `getSocket()` singleton)*

#### Guest Bill Page (`app/bill/[id]/OrderStatusTracker.tsx`)
Listens for `ORDER_STATUS_UPDATED` and filters by `orderId` to update the live progress bar.

```typescript
useEffect(() => {
  const socket = getSocket();
  socket.on('ORDER_STATUS_UPDATED', ({ id, status: newStatus }) => {
    if (id === orderId) setStatus(newStatus);  // Only update if this order's ID matches
  });
  return () => { socket.off('ORDER_STATUS_UPDATED'); };
}, [orderId]);
```

### 7.4 Full KDS Flow (End-to-End)

```
Guest places order
      │
      ▼
POST /api/orders
      │
      ├─► Prisma saves to Neon PostgreSQL
      │
      ├─► io.emit('NEW_ORDER_RECEIVED', fullOrder)
      │         │
      │         └─► Kitchen Display receives order card in real-time
      │
      └─► Response 201 { order, posPayload, orderId, receiptUrl }
                │
                └─► Guest lands on /bill/:id page
                          │
                          └─► OrderStatusTracker connects via WebSocket
                                    │
                                    ▼
                          Kitchen updates status via PATCH /api/orders/:id/status
                                    │
                                    ├─► Prisma updates DB
                                    └─► io.emit('ORDER_STATUS_UPDATED', { id, status })
                                                │
                                                ├─► Guest bill page progress bar advances
                                                └─► All KDS screens reflect new status
```

---

## 8. Frontend Bill Calculation Logic

Computed in `CartOverlay.tsx` before calling `onPlaceOrder`:

```typescript
const itemSubtotal    = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
const taxesAndCharges = itemSubtotal * 0.09;          // 9% tax
const discount        = itemSubtotal > 0 ? 100 : 0;   // ₹100 flat discount if cart non-empty
const totalAmount     = itemSubtotal > 0 ? itemSubtotal + taxesAndCharges - discount : 0;
```

These map to the API request body as:
- `billDetails.subtotal` = `itemSubtotal`
- `billDetails.taxAmount` = `taxesAndCharges`
- `billDetails.discountAmount` = `discount`
- `billDetails.total` = `totalAmount`

---

## 9. WhatsApp Receipt Service

`backend/services/whatsapp.js` uses the Meta Graph API.

- If `META_ACCESS_TOKEN` and `META_PHONE_NUMBER_ID` env vars are **missing** → logs mock message, returns `{ success: true, messageId: 'mock-message-id' }`. **No crash.**
- If credentials are present → calls `https://graph.facebook.com/v18.0/{PHONE_ID}/messages`
- The `createOrder` controller calls this after DB save but does not fail the order if WhatsApp fails (result is logged and ignored for response purposes).

---

## 10. Build & Run Commands

### Backend

```bash
cd backend

# Development (auto-restart on file change)
npm run dev          # runs: nodemon index.js

# Production
node index.js

# Run Socket.io integration test (no DB needed)
node test-socket-flow.js

# Prisma commands
npx prisma generate  # Regenerate client after schema change
npx prisma migrate dev --name <migration-name>  # Create and apply migration
npx prisma studio    # Open DB GUI in browser
```

### Frontend

```bash
cd template-3-digital-menu

# Development
npm run dev          # runs: next dev  →  http://localhost:3000

# Production build
npm run build        # runs: next build
npm run start        # runs: next start

# Lint
npm run lint
```

### Environment Files

```
backend/.env                           # DATABASE_URL, PORT, META_*
template-3-digital-menu/.env.local     # NEXT_PUBLIC_API_BASE_URL
```

---

## 11. Deployment Architecture

```
┌─────────────────────┐     REST + WebSocket      ┌────────────────────────┐
│   Vercel (Frontend) │ ──────────────────────── ► │  Render (Backend)      │
│   Next.js 16        │                             │  Express 5 + Socket.io │
│   /                 │ ◄────────────────────────   │  Port: 5000 (or $PORT) │
│   /bill/[id]        │    JSON + WS events         └───────────┬────────────┘
└─────────────────────┘                                         │
                                                                │ Prisma
                                                                ▼
                                                   ┌────────────────────────┐
                                                   │  Neon (PostgreSQL)     │
                                                   │  Serverless / pooled   │
                                                   └────────────────────────┘
```

**Critical rule**: The Express HTTP server and Socket.io share the same port. Never run them on separate ports — they must share the `httpServer` instance created in `backend/index.js`.

---

## 12. Key Architectural Decisions & Constraints

| Decision | Why |
|---|---|
| Socket.io attached to Express HTTP server | Single port deployment on Render (free tier only exposes one port) |
| `getIO()` singleton pattern | Avoids passing `io` through every controller import chain |
| `socket.io-client` in backend `package.json` | Used by `test-socket-flow.js` for integration testing without a real server |
| Prisma on Neon with `?sslmode=require&channel_binding=require` | Neon requires SSL; channel binding needed for newer Postgres auth |
| `orderId` counter is in-memory | Resets on server restart — this is intentional for MVP; use a DB sequence for production |
| WhatsApp fallback to mock | Prevents order failures in dev/staging environments without Meta credentials |
| Next.js rewrite for CSAT API | Avoids CORS error when calling `http://apiconnectnow.csatspl.com` from the browser |
| `NEXT_PUBLIC_API_BASE_URL` env var | Zero-hardcoded URLs in frontend — works for both local dev and Vercel production |
| `force-dynamic` on `/bill/[id]` page | Prevents Next.js from statically generating the receipt at build time |

---

## 13. Testing the Full Flow Locally

```bash
# Terminal 1 — Start backend
cd backend && npm run dev
# → Server on http://localhost:5000

# Terminal 2 — Start frontend
cd template-3-digital-menu && npm run dev
# → App on http://localhost:3000

# Terminal 3 — Run Socket.io test (optional)
cd backend && node test-socket-flow.js
# → Expected: 11 passed, 0 failed

# Quick API smoke test (curl)
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "cartItems": [{"id":"1","name":"Butter Chicken","price":650,"quantity":1,"category":"Main"}],
    "billDetails": {"subtotal":650,"taxAmount":58.5,"discountAmount":100,"total":608.5},
    "tableNumber": "T-12",
    "paymentMethod": "CASH",
    "outletId": "010",
    "restaurantId": "210014",
    "posCode": "001"
  }'
# → Expected: 201 { success: true, order: {...}, posPayload: {...} }
```
