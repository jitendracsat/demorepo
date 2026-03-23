# System Architecture

## Overview

This project is a **digital menu and order management system** for restaurants, built on a decoupled, cloud-native architecture. The system captures guest orders from a self-service digital menu, punches them to a POS system, sends a WhatsApp receipt, stores structured order data for CSAT analytics, and broadcasts real-time status updates to a Kitchen Display System (KDS) and the guest's live bill page via WebSockets.

---

## Infrastructure

| Layer | Technology | Hosting | Purpose |
|---|---|---|---|
| Frontend | Next.js 16 (TypeScript) | Vercel | Digital menu UI, guest-facing order flow, KDS |
| Backend | Node.js + Express 5 + Socket.io | Render | Order processing, POS integration, WhatsApp API, WebSocket server |
| Database | PostgreSQL + Prisma ORM | Neon (serverless) | Persistent order and guest data |
| Menu Source | CSAT REST API | External (`apiconnectnow.csatspl.com`) | Live menu items, categories, pricing |
| Notifications | Meta WhatsApp Cloud API | External (Meta Graph v18.0) | Digital receipt delivery |
| Real-time | Socket.io | Render (same process) | Live order status push to KDS and guest bill page |

---

## Component Breakdown

### Frontend — Next.js on Vercel

**Location:** `template-3-digital-menu/`

The frontend is a Next.js application using the App Router. It serves as the guest-facing interface and handles the complete order lifecycle from menu browsing to payment confirmation.

**Key responsibilities:**
- Fetches live menu data from the CSAT API via a Next.js API rewrite (`/api/csat/*` → `http://apiconnectnow.csatspl.com/api/*`)
- Manages cart state client-side
- Collects guest information (name, phone, email, DOB, anniversary)
- Submits the complete order payload to the Node.js backend
- Renders a digital bill page at `/bill/[id]` using the order UUID

**Key files:**

| File | Role |
|---|---|
| `app/components/MenuView.tsx` | Main menu component; fetches live menu, manages filters and cart |
| `app/components/CartOverlay.tsx` | Cart drawer with item controls and bill summary |
| `app/components/PaymentView.tsx` | Payment method selection (table / UPI apps) |
| `app/components/OrderSuccessView.tsx` | Post-order confirmation screen |
| `app/bill/[id]/page.tsx` | Server-rendered digital receipt page |
| `app/utils/api.ts` | Centralised HTTP client; reads `NEXT_PUBLIC_API_BASE_URL` |
| `src/services/api.ts` | CSAT API client for menu data |
| `next.config.ts` | API rewrite rules and remote image hosts |

**Environment variables required:**

```
NEXT_PUBLIC_API_BASE_URL=https://<your-render-service>.onrender.com
```

---

### Backend — Node.js / Express on Render

**Location:** `backend/`

The backend is an Express 5 ESM application that acts as the system's orchestration layer. It validates incoming orders, writes them to PostgreSQL, constructs the POS-formatted payload, and dispatches WhatsApp receipts.

**Key responsibilities:**
- Accepts order payloads from the frontend
- Generates a sequential external order ID (`ORD000001`, `ORD000002`, …)
- Writes normalised order and line-item records to PostgreSQL via Prisma
- Constructs and logs the POS-formatted payload (see [`POS_PAYLOAD.md`](./POS_PAYLOAD.md))
- Calls the Meta WhatsApp Cloud API to deliver a digital receipt link
- Falls back gracefully to mock mode when WhatsApp credentials are absent

**API surface:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/orders` | Create order — full order intake and POS punch |
| `GET` | `/api/orders` | Retrieve all orders |
| `GET` | `/api/orders/:id` | Retrieve a single order by UUID |

**Key files:**

| File | Role |
|---|---|
| `index.js` | Server entry point, CORS config, route mounting |
| `routes/orderRoutes.js` | Route definitions |
| `controllers/orderController.js` | Business logic — order creation, POS payload assembly |
| `services/whatsapp.js` | Meta WhatsApp Cloud API integration |
| `config/prisma.js` | Singleton Prisma client |
| `prisma/schema.prisma` | Database schema |

**Environment variables required:**

```
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
PORT=5000
META_ACCESS_TOKEN=<meta-token>          # optional — mock mode if absent
META_PHONE_NUMBER_ID=<phone-number-id>  # optional — mock mode if absent
```

---

### Database — PostgreSQL on Neon

Neon provides serverless PostgreSQL with connection pooling. The schema is managed entirely through Prisma Migrate.

**Core tables:**

#### `Order`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key, auto-generated |
| `restaurantId` | `String` | Maps to POS `restaurantid` field |
| `outletId` | `String` | Maps to POS `outletId` field |
| `posCode` | `String` | POS terminal code |
| `orderId` | `String` | External sequential order ID (`ORD000001`) |
| `orderDate` | `DateTime` | Timestamp of order creation |
| `guestId` | `String` | Guest phone used as CRM identifier |
| `guestName` | `String` | Guest display name |
| `guestPhone` | `String` | Guest mobile number |
| `guestEmail` | `String` | Guest email address |
| `guestDob` | `String` | Date of birth (DD/MM/YYYY) |
| `guestAnniversary` | `String` | Anniversary date |
| `subtotal` | `Float` | Pre-tax, pre-discount total |
| `discountAmount` | `Float` | Total discount applied |
| `taxAmount` | `Float` | Tax component |
| `totalAmount` | `Float` | Final payable amount |
| `currency` | `String` | Default: `INR` |
| `tableNumber` | `String` | Restaurant table identifier |
| `paymentMethod` | `String` | e.g., `CASH`, `UPI` |
| `status` | `String` | Default: `RECEIVED` |
| `csatSyncStatus` | `Boolean` | Whether synced to CSAT platform |
| `createdAt` | `DateTime` | Record creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

#### `OrderItem`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `orderId` | `String` | Foreign key → `Order.id` |
| `itemId` | `String` | POS menu item ID |
| `itemName` | `String` | Display name |
| `category` | `String` | Menu category |
| `quantity` | `Float` | Ordered quantity |
| `unitPrice` | `Float` | Price per unit |
| `totalPrice` | `Float` | `quantity × unitPrice` |
| `discountApplied` | `Float` | Item-level discount |
| `modifiers` | `Json` | Array of modifier objects |

---

## Request Flow

```
Guest (browser)
    │
    │  HTTP GET /api/csat/Menu/GetMenuJson (via Next.js rewrite)
    ▼
Next.js on Vercel ──────────────────────────────► CSAT API (external)
    │                                              (returns menu JSON)
    │  Guest browses menu, builds cart,
    │  enters details, confirms payment
    │
    │  POST /api/orders
    ▼
Node.js on Render
    ├── Validate & map request body
    ├── Generate external order ID
    ├── INSERT Order + OrderItems via Prisma
    ├── Construct POS payload (see POS_PAYLOAD.md)
    ├── POST to WhatsApp API (Meta Graph v18.0)
    └── Return { success, order, posPayload, receiptUrl }
    │
    ▼
PostgreSQL on Neon
    (order persisted for CSAT analytics)

Guest browser
    │
    │  Redirect to /bill/{orderId}
    ▼
Next.js on Vercel
    │  GET /api/orders/{orderId}
    ▼
Node.js on Render ──► PostgreSQL ──► Return order record
    │
    ▼
Render digital bill (server component)
```

---

## Deployment

### Frontend (Vercel)

1. Connect the `template-3-digital-menu/` directory as the Vercel project root.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your Render service URL in Vercel environment variables.
3. Deploy — Vercel handles build and CDN distribution automatically.

### Backend (Render)

1. Connect the `backend/` directory as the Render service root.
2. Set `DATABASE_URL`, `PORT`, and optionally `META_ACCESS_TOKEN` / `META_PHONE_NUMBER_ID` in Render environment variables.
3. Set the start command to `node index.js`.

### Database (Neon)

1. Create a Neon project and copy the connection string (pooled endpoint recommended).
2. Set `DATABASE_URL` in the backend environment.
3. Run `npx prisma migrate deploy` from `backend/` to apply the schema.

---

## Real-time Layer (WebSockets / Socket.io)

### Overview

Socket.io is co-hosted with the Express server in the same Node.js process on Render. The HTTP server is upgraded to support WebSocket connections — no separate service or port is required.

### Server-side setup

**`backend/socket.js`** holds the Socket.io singleton:

```
initSocket(httpServer)  →  attaches Socket.io to the HTTP server, returns io instance
getIO()                 →  returns the live io instance for use in controllers
```

**`backend/index.js`** wraps Express with `http.createServer(app)` and calls `initSocket(httpServer)` before `.listen()`.

### Events

| Event | Direction | Emitter | Payload | Consumers |
|---|---|---|---|---|
| `NEW_ORDER_RECEIVED` | Server → Client | `createOrder` controller (on successful DB write) | Full `Order` object (with `items`) | Kitchen Display System (`/kitchen`) |
| `ORDER_STATUS_UPDATED` | Server → Client | `updateOrderStatus` controller (on `PATCH /api/orders/:id/status`) | `{ id: string, status: string }` | KDS + Guest bill page (`/bill/[id]`) |

### Status lifecycle

```
RECEIVED  →  PREPARING  →  SERVED
```

The KDS drives status transitions. Each button click fires `PATCH /api/orders/:id/status`, the backend updates the database and broadcasts `ORDER_STATUS_UPDATED` to all connected clients.

### Client-side setup

**`app/lib/socket.ts`** — singleton socket client. Lazily creates one `socket.io-client` connection to `NEXT_PUBLIC_API_BASE_URL` and reuses it across components.

**`app/kitchen/page.tsx`** — Kitchen Display System:
- Loads all orders from `GET /api/orders` on mount (sorted: RECEIVED → PREPARING → SERVED)
- Subscribes to `NEW_ORDER_RECEIVED` to insert arriving orders without a page reload
- Subscribes to `ORDER_STATUS_UPDATED` to keep card states in sync when another KDS terminal makes a change
- Shows a live connection indicator (green = connected, red = reconnecting)

**`app/bill/[id]/OrderStatusTracker.tsx`** — Guest-facing tracker embedded in the bill page:
- Receives `initialStatus` as a prop (from the server-rendered page)
- Subscribes to `ORDER_STATUS_UPDATED` and advances the progress bar when the order ID matches
- Three-step visual progress bar: Order Received → Preparing → Served

### WebSocket request flow

```
Kitchen staff clicks "Start Preparing"
    │
    │  PATCH /api/orders/:id/status  { status: "PREPARING" }
    ▼
Node.js on Render
    ├── prisma.order.update({ status: "PREPARING" })
    └── io.emit("ORDER_STATUS_UPDATED", { id, status: "PREPARING" })
         │
         ├──► KDS page (/kitchen)         → card updates to blue "Preparing"
         └──► Guest bill page (/bill/:id) → progress bar advances to step 2
```

### Deployment note

Render's free tier uses a single instance, so Socket.io works without any adapter. If the service is scaled to multiple instances, a Redis adapter (`@socket.io/redis-adapter`) must be introduced so events broadcast across all instances.
