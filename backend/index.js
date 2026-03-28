import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './socket.js';
import orderRoutes from './routes/orderRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import orderStatusRoutes from './routes/orderStatusRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.FRONTEND_URL,        // set this on Render: e.g. https://your-app.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Exact match
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow all Vercel preview deployments (*.vercel.app)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Proxy-Secret'],
}));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "Zinda hu bhai! 🚀", message: "MVC Backend is running!" });
});

// API Routes Mounting
app.use('/api/orders', orderRoutes);
app.use('/api/syncorder', syncRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/order', orderStatusRoutes);

// Wrap Express with HTTP server and attach Socket.io
const httpServer = createServer(app);
initSocket(httpServer);

// Server Start
httpServer.listen(PORT, () => {
  console.log('\n============================================================');
  console.log('  SERVER STARTED');
  console.log('  Port:', PORT);
  console.log('  Timestamp:', new Date().toISOString());
  console.log('  WHATSAPP_TOKEN present:', !!process.env.WHATSAPP_TOKEN, '| length:', process.env.WHATSAPP_TOKEN?.length || 0);
  console.log('  WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID || '(NOT SET)');
  console.log('  WHATSAPP_VERIFY_TOKEN:', process.env.WHATSAPP_VERIFY_TOKEN || '(NOT SET)');
  console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || '(NOT SET)');
  console.log('  POS_API_URL:', process.env.POS_API_URL || '(NOT SET)');
  console.log('  BACKEND_BASE_URL:', process.env.BACKEND_BASE_URL || '(NOT SET)');
  console.log('  CSAT_PROXY_URL:', process.env.CSAT_PROXY_URL || '(NOT SET)');
  console.log('  Routes: /api/orders, /api/syncorder, /api/whatsapp, /api/order/status');
  console.log('============================================================\n');
});