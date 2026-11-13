const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const db = require('../db');

const router = express.Router();
router.use(authenticateToken);

// GET /api/v1/webhooks
router.get('/', (req, res) => {
  const userWebhooks = db.webhooks.filter(w => w.userId === req.user.id);
  res.json({ success: true, data: userWebhooks, count: userWebhooks.length });
});

// POST /api/v1/webhooks — register a new webhook endpoint
router.post('/', [
  body('url').isURL().withMessage('Valid URL required'),
  body('events').isArray({ min: 1 }).withMessage('At least one event type required'),
], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { url, events, description = '' } = req.body;
    const allowedEvents = ['charge.succeeded', 'charge.failed', 'charge.refunded'];
    const invalidEvents = events.filter(e => !allowedEvents.includes(e));
    if (invalidEvents.length > 0) throw createError(400, `Invalid event types: ${invalidEvents.join(', ')}. Allowed: ${allowedEvents.join(', ')}`);

    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');
    const webhook = {
      id: 'wh_' + crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      url, events, description,
      secret,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.webhooks.push(webhook);

    res.status(201).json({
      success: true,
      message: 'Save the signing secret now — it will not be shown again.',
      data: webhook,
    });
  } catch (err) { next(err); }
});

// DELETE /api/v1/webhooks/:id — deactivate webhook
router.delete('/:id', (req, res, next) => {
  try {
    const wh = db.webhooks.find(w => w.id === req.params.id && w.userId === req.user.id);
    if (!wh) throw createError(404, 'Webhook not found.');
    wh.isActive = false;
    res.json({ success: true, message: 'Webhook deactivated.', data: { id: wh.id } });
  } catch (err) { next(err); }
});

// GET /api/v1/webhooks/events — view fired webhook events
router.get('/events', (req, res) => {
  const events = [...db.webhookEvents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
  res.json({ success: true, data: events, count: events.length });
});

module.exports = router;
