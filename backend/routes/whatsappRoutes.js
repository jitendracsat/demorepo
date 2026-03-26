import express from 'express';

const router = express.Router();

/**
 * GET /api/whatsapp/webhook
 * Meta Webhook Verification — called once when you register the webhook URL in Meta dashboard.
 */
router.get('/webhook', (req, res) => {
  console.log('\n------------------------------------------------------------');
  console.log('[WHATSAPP WEBHOOK] GET /webhook hit');
  console.log('[WHATSAPP WEBHOOK] Timestamp:', new Date().toISOString());
  console.log('[WHATSAPP WEBHOOK] Query params:', JSON.stringify(req.query));
  console.log('------------------------------------------------------------');

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  console.log('[WHATSAPP WEBHOOK] hub.mode:', mode);
  console.log('[WHATSAPP WEBHOOK] hub.verify_token received:', token);
  console.log('[WHATSAPP WEBHOOK] WHATSAPP_VERIFY_TOKEN from env:', verifyToken || '(NOT SET)');
  console.log('[WHATSAPP WEBHOOK] Tokens match?', token === verifyToken);
  console.log('[WHATSAPP WEBHOOK] hub.challenge:', challenge);

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WHATSAPP WEBHOOK] Verification SUCCESS — returning challenge');
    return res.status(200).send(challenge);
  }

  console.warn('[WHATSAPP WEBHOOK] Verification FAILED — token mismatch or wrong mode');
  return res.status(403).json({ error: 'Verification failed' });
});

/**
 * POST /api/whatsapp/webhook
 * Receives incoming message statuses (delivered, read, etc.) from Meta.
 */
router.post('/webhook', (req, res) => {
  // Immediately respond 200 so Meta doesn't retry
  res.sendStatus(200);

  const body = req.body;

  console.log('\n============================================================');
  console.log('[WHATSAPP WEBHOOK] POST /webhook hit');
  console.log('[WHATSAPP WEBHOOK] Timestamp:', new Date().toISOString());
  console.log('[WHATSAPP WEBHOOK] body.object:', body.object);
  console.log('[WHATSAPP WEBHOOK] Full body:', JSON.stringify(body, null, 2));
  console.log('============================================================');

  if (body.object !== 'whatsapp_business_account') {
    console.log('[WHATSAPP WEBHOOK] IGNORED — not whatsapp_business_account');
    return;
  }

  const entries = body.entry || [];
  console.log('[WHATSAPP WEBHOOK] Entries count:', entries.length);

  for (const entry of entries) {
    const changes = entry.changes || [];
    console.log('[WHATSAPP WEBHOOK] Entry id:', entry.id, '| changes count:', changes.length);

    for (const change of changes) {
      const value = change.value || {};
      console.log('[WHATSAPP WEBHOOK] Change field:', change.field);

      // Status updates (sent / delivered / read / failed)
      const statuses = value.statuses || [];
      for (const status of statuses) {
        console.log(`[WHATSAPP WEBHOOK] Status received: ${status.status} | msgId: ${status.id} | recipient: ${status.recipient_id} | timestamp: ${status.timestamp}`);

        if (status.status === 'failed') {
          const errInfo = status.errors?.[0] || {};
          console.error(`[WHATSAPP WEBHOOK] FAILED detail — code: ${errInfo.code} | title: ${errInfo.title} | message: ${errInfo.message}`);
        }
      }

      // Incoming messages
      const messages = value.messages || [];
      for (const msg of messages) {
        console.log(`[WHATSAPP WEBHOOK] Incoming message — from: ${msg.from} | type: ${msg.type} | text: ${msg.text?.body || '(no text)'} | msgId: ${msg.id}`);
      }
    }
  }
});

export default router;
