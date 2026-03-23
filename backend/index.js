import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './socket.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "Zinda hu bhai! 🚀", message: "MVC Backend is running!" });
});

// API Routes Mounting
app.use('/api/orders', orderRoutes);

// Wrap Express with HTTP server and attach Socket.io
const httpServer = createServer(app);
initSocket(httpServer);

// Server Start
httpServer.listen(PORT, () => {
  console.log(`🚀 MVC Server is running on http://localhost:${PORT}`);
});