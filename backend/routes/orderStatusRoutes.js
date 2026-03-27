import express from 'express';
import { inboundOrderStatus } from '../controllers/orderController.js';

const router = express.Router();

// GET/POST /api/order/status?restaurantId=X&outletId=X&orderId=X&status=X
// Partner POS calls this to push status updates via query params
router.get('/status', inboundOrderStatus);
router.post('/status', inboundOrderStatus);

export default router;
