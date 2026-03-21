import express from 'express';
import { createOrder, getAllOrders, getBillById } from '../controllers/orderController.js';

const router = express.Router();

// Routes definitions
router.post('/', createOrder);          // API: POST /api/orders
router.get('/', getAllOrders);          // API: GET /api/orders
router.get('/:id', getBillById);        // API: GET /api/orders/:id (Digital Bill Link)

export default router;