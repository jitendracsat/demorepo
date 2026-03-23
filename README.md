# Digital Menu & Order Management System

A cloud-native restaurant ordering platform. Guests browse a live digital menu, place orders, receive a WhatsApp receipt, and the order is punched to the POS — all in a single flow.

---

## Architecture at a Glance

| Layer | Stack | Hosting |
|---|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS | Vercel |
| Backend | Node.js + Express 5 (ESM) | Render |
| Database | PostgreSQL + Prisma ORM | Neon (serverless) |
| Menu Data | CSAT REST API | External |
| Notifications | Meta WhatsApp Cloud API v18.0 | External |

For the full architecture breakdown, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## Repository Structure

```
csat1/
├── backend/                        # Node.js / Express API server
│   ├── controllers/
│   │   └── orderController.js      # Order intake, POS payload assembly
│   ├── routes/
│   │   └── orderRoutes.js
│   ├── services/
│   │   └── whatsapp.js             # Meta WhatsApp Cloud API integration
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   ├── config/
│   │   └── prisma.js               # Singleton Prisma client
│   └── index.js                    # Server entry point
│
├── template-3-digital-menu/        # Next.js frontend
│   ├── app/
│   │   ├── components/             # React UI components
│   │   ├── bill/[id]/page.tsx      # Digital receipt (server component)
│   │   ├── demo/page.tsx           # Order creation test harness
│   │   └── utils/api.ts            # Backend HTTP client
│   ├── src/services/api.ts         # CSAT menu API client
│   └── next.config.ts              # API rewrites, image hosts
│
└── docs/
    ├── ARCHITECTURE.md             # System design and deployment guide
    └── POS_PAYLOAD.md              # POS integration payload specification
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon pooled endpoint) |
| `PORT` | Yes | Port the Express server listens on (e.g., `5000`) |
| `META_ACCESS_TOKEN` | No | Meta Graph API token for WhatsApp receipts. Falls back to mock mode if absent |
| `META_PHONE_NUMBER_ID` | No | Meta WhatsApp sender phone number ID. Falls back to mock mode if absent |

**Example:**
```env
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=5000
META_ACCESS_TOKEN=EAAxxxxx
META_PHONE_NUMBER_ID=123456789012345
```

### Frontend (`template-3-digital-menu/.env.local` or Vercel environment)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Base URL of the Node.js backend on Render |

**Example:**
```env
NEXT_PUBLIC_API_BASE_URL=https://your-service.onrender.com
```

---

## Getting Started

### Backend

```bash
cd backend
npm install
npx prisma migrate deploy   # apply schema to Neon
node index.js               # or: npm run dev (nodemon)
```

### Frontend

```bash
cd template-3-digital-menu
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the menu.

Use [http://localhost:3000/demo](http://localhost:3000/demo) to fire a test order end-to-end.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/orders` | Create order and punch to POS |
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/:id` | Fetch a single order by UUID |

The frontend calls `/api/csat/*` which Next.js rewrites to the external CSAT menu API at `http://apiconnectnow.csatspl.com/api/*`.

---

## Documentation

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Full system architecture, component breakdown, request flow, and deployment guide |
| [docs/POS_PAYLOAD.md](./docs/POS_PAYLOAD.md) | Exact POS JSON payload format, field-by-field specification, and field casing contract |

---

## Deployment

- **Frontend** — connect `template-3-digital-menu/` to a Vercel project. Set `NEXT_PUBLIC_API_BASE_URL` in Vercel environment settings.
- **Backend** — connect `backend/` to a Render web service. Set `DATABASE_URL`, `PORT`, and WhatsApp credentials in Render environment settings. Start command: `node index.js`.
- **Database** — provision a Neon project, copy the pooled connection string, run `npx prisma migrate deploy`.
