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

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'csat_whatsapp_verify_2024';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Verification successful');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp Webhook] Verification failed — token mismatch');
  return res.status(403).json({ error: 'Verification failed' });
});

/**
 * POST /api/whatsapp/webhook
 * Receives status updates from Meta (sent, delivered, read, failed).
 * Also receives incoming messages if configured.
 */
router.post('/webhook', (req, res) => {
  const body = req.body;

  console.log('\n========== [WEBHOOK] INCOMING WHATSAPP WEBHOOK ==========');
  console.log('[WEBHOOK] Timestamp:', new Date().toISOString());
  console.log('[WEBHOOK] Full body:', JSON.stringify(body, null, 2));

  // Meta always sends object with "object": "whatsapp_business_account"
  if (body.object !== 'whatsapp_business_account') {
    console.log('[WEBHOOK] Ignored — not a whatsapp_business_account object');
    return res.sendStatus(404);
  }

  // Process each entry
  const entries = body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value || {};

      // Status updates (sent / delivered / read / failed)
      const statuses = value.statuses || [];
      for (const status of statuses) {
        console.log(`[WhatsApp Status] msgId: ${status.id} | status: ${status.status} | recipient: ${status.recipient_id}`);

        if (status.status === 'failed') {
          const errInfo = status.errors?.[0] || {};
          console.error(`[WhatsApp Failed] code: ${errInfo.code} | title: ${errInfo.title}`);
        }
      }

      // Incoming messages (if you want to handle customer replies later)
      const messages = value.messages || [];
      for (const msg of messages) {
        console.log(`[WhatsApp Incoming] from: ${msg.from} | type: ${msg.type} | text: ${msg.text?.body || ''}`);
      }
    }
  }

  // Meta requires a 200 response within 5 seconds
  return res.sendStatus(200);
});

export default router;
