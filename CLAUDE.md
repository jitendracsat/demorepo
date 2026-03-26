# CLAUDE.md — Agent Rulebook
This file is the absolute instruction set for the AI agent. These rules OVERRIDE default behaviors. Violations are considered critical bugs.

## 1. BOUNDARIES & TECH STACK (ENFORCED)
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind. NEVER suggest React Router, CRA, or Vite.
- **Backend:** Node.js, Express 5, Socket.io. NEVER suggest separate ports; Express and Socket.io MUST share the same `httpServer`.
- **Database:** PostgreSQL on Neon via Prisma. NEVER suggest MongoDB or Firebase.
- **Networking:** Use native `fetch`. NEVER use axios. NEVER hardcode `localhost`; strictly use `process.env.NEXT_PUBLIC_API_BASE_URL`.

## 2. CRITICAL CODING RULES
- **Strict ID Coercion:** All `itemId` or `id` variables MUST be coerced to `String(id)` BEFORE any comparison, `.includes()`, Set operations, or DB lookups. (Prevents JSON number vs. Input string mismatches).
- **Dynamic Tax Engine:** NEVER hardcode tax rates (e.g., `* 0.09`). Taxes MUST be calculated per-item extracting `gst_details.cgst` and `gst_details.sgst` from the raw CSAT API JSON.
- **Module System:** Strict ES6 modules (`import`/`export`). No `require()`, no `var`.

## 3. DATA CONTRACTS
- **POS Payload:** Must strictly match CSAT external API (fields: `outletId`, `restaurantid`, `OrderId`, `OrderDate`, `guest`, `subtotal`, `taxAmount`, `totalAmount`, `items`). Do not hallucinate extra fields.
- **Order Status:** Only allowed enums: `RECEIVED` | `PREPARING` | `SERVED`.

## 4. REAL-TIME ARCHITECTURE (Socket.io)
- **Stock-Out (In-Memory Set):** - `TOGGLE_STOCK`: Client -> Server `{ itemId: string, isSoldOut: boolean }`
  - `INITIAL_STOCK_STATE`: Server -> Client (Sends `string[]` on connect)
  - `STOCK_UPDATED`: Server -> All Clients (Broadcasts `string[]` on change)
- **Order Flow:**
  - `NEW_ORDER_RECEIVED`: Broadcasts full Order object on DB save.
  - `ORDER_STATUS_UPDATED`: Broadcasts `{ id, status }` on DB update.

## 5. DO NOT TOUCH — PERFECTLY WORKING CODE
- **Backend controllers, routes, WhatsApp service, and POS integration are fully tested and production-ready.** DO NOT modify, refactor, format, or touch any backend files (`backend/controllers/`, `backend/routes/`, `backend/services/`, `backend/socket.js`, `backend/index.js`).
- **Frontend POS sync now goes directly to the proxy at `https://proxy.csatspl.com/api/syncorder`.** The proxy handles forwarding to the backend. Do not revert this to a direct backend call.

## 6. AGENT BEHAVIOR & GUARDRAILS

- **Dependency Installs:** Briefly explain WHY a package is needed before running `npm install`. No silent installs.
- **Prisma Edits:** If `schema.prisma` is modified, you MUST remind the user to run `npx prisma generate` and `npx prisma db push`.
- **File Edits:** Prefer editing existing files. Do not create new files unless architecturally required.
- **NEVER touch `.env` files.** The user manages environment variables themselves. Do not edit, overwrite, or suggest changes to `.env` files.

## 7. CUSTOM CLI COMMANDS
- `/sync-db`: Remind user to run `cd backend && npx prisma generate && npx prisma db push`.
- `/audit-socket`: Verify `backend/socket.js` and frontend listeners match the event contracts exactly.