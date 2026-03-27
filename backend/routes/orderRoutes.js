import express from 'express';
import { createOrder, verifyOTP, getAllOrders, getBillById, updateOrderStatus, posStatusWebhook } from '../controllers/orderController.js';

const router = express.Router();

// Routes definitions
router.post('/', createOrder);                          // POST  /api/orders
router.post('/verify-otp', verifyOTP);                  // POST  /api/orders/verify-otp
router.get('/', getAllOrders);                           // GET   /api/orders
router.post('/status-update', posStatusWebhook);         // POST  /api/orders/status-update (inbound POS webhook)
router.get('/:id', getBillById);                         // GET   /api/orders/:id
router.patch('/:id/status', updateOrderStatus);          // PATCH /api/orders/:id/status (KDS)

export default router;