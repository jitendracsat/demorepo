import express from 'express';
import verifyProxySecret from '../middleware/verifyProxySecret.js';
import { syncOrder } from '../controllers/syncOrderController.js';

const router = express.Router();

// POST /api/syncorder — Webhook from CSAT proxy, protected by X-Proxy-Secret
router.post('/', verifyProxySecret, syncOrder);

export default router;
