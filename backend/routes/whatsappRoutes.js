import express from 'express';

const router = express.Router();

/**
 * GET /api/whatsapp/webhook
 * Meta Webhook Verification — called once when you register the webhook URL in Meta dashboard.
 * Meta sends: ?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE_STRING
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WHATSAPP WEBHOOK] Verification successful');
    return res.status(200).send(challenge);
  }

  console.warn('[WHATSAPP WEBHOOK] Verification failed — token mismatch');
  return res.status(403).json({ error: 'Verification failed' });
});

/**
 * POST /api/whatsapp/webhook
 * Receives incoming message statuses (delivered, read, etc.) from Meta.
 * Immediately responds with 200 OK so Meta doesn't retry.
 */
router.post('/webhook', (req, res) => {
  // Immediately respond 200 so Meta doesn't retry
  res.sendStatus(200);

  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    return;
  }

  const entries = body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value || {};

      // Status updates (sent / delivered / read / failed)
      const statuses = value.statuses || [];
      for (const status of statuses) {
        console.log(`[WHATSAPP WEBHOOK] Status received: ${status.status} | msgId: ${status.id} | recipient: ${status.recipient_id}`);

        if (status.status === 'failed') {
          const errInfo = status.errors?.[0] || {};
          console.error(`[WHATSAPP WEBHOOK] Failed — code: ${errInfo.code} | title: ${errInfo.title}`);
        }
      }

      // Incoming messages (for future use)
      const messages = value.messages || [];
      for (const msg of messages) {
        console.log(`[WHATSAPP WEBHOOK] Incoming message from: ${msg.from} | type: ${msg.type}`);
      }
    }
  }
});

export default router;
