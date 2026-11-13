const express = require('express');
const crypto = require('crypto');
const { requireApiKey, authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const db = require('../db');

const router = express.Router();

// POST /v1/charges — Core Stripe-equivalent charge endpoint
// Requires API key in X-Api-Key header + Idempotency-Key header
router.post('/', requireApiKey, (req, res, next) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) throw createError(400, 'Missing required header: Idempotency-Key. All charge requests must include an idempotency key to prevent duplicate processing.');

    // Check idempotency cache
    if (db.idempotencyStore.has(idempotencyKey)) {
      const cached = db.idempotencyStore.get(idempotencyKey);
      if (new Date() < new Date(cached.expiresAt)) {
        return res.status(200).json({
          success: true,
          idempotent: true,
          message: 'Returning cached response for this idempotency key.',
          data: cached.response,
        });
      }
      db.idempotencyStore.delete(idempotencyKey);
    }

    const { amount, currency = 'USD', source, destination, description = '', customer, metadata = {} } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) throw createError(400, 'amount must be a positive integer (in cents).');
    if (!source) throw createError(400, 'source account ID is required.');
    if (!destination) throw createError(400, 'destination account ID is required.');
    if (source === destination) throw createError(400, 'source and destination accounts must be different.');

    const sourceAccount = db.accounts[source];
    const destAccount = db.accounts[destination];

    if (!sourceAccount) throw createError(404, `Source account '${source}' not found.`);
    if (!destAccount) throw createError(404, `Destination account '${destination}' not found.`);

    // Check sufficient balance
    if (sourceAccount.balance < amount) {
      const charge = {
        id: 'ch_' + crypto.randomBytes(8).toString('hex'),
        amount, currency, source, destination, status: 'failed',
        failure_code: 'insufficient_funds',
        failure_message: 'The account has insufficient funds for this charge.',
        description, customer, fee: 0, idempotencyKey, metadata,
        createdAt: new Date().toISOString(),
      };
      db.charges.push(charge);
      return res.status(402).json({ success: false, error: { status: 402, message: charge.failure_message, code: charge.failure_code }, data: { charge } });
    }

    // === ATOMIC DOUBLE-ENTRY BOOKKEEPING ===
    const fee = Math.floor(amount * 0.029) + 30; // 2.9% + 30¢
    const netAmount = amount - fee;

    // Debit source
    db.accounts[source].balance -= amount;
    // Credit destination (net of fees)
    db.accounts[destination].balance += netAmount;
    // Credit fees account
    if (db.accounts['acct_payflow_fees']) db.accounts['acct_payflow_fees'].balance += fee;

    const chargeId = 'ch_' + crypto.randomBytes(8).toString('hex');
    const charge = {
      id: chargeId,
      amount, currency, source, destination, status: 'succeeded',
      description, customer: customer || null, fee, netAmount,
      idempotencyKey, metadata,
      createdAt: new Date().toISOString(),
    };
    db.charges.push(charge);

    // Double-entry ledger records
    const now = new Date().toISOString();
    db.ledgerEntries.push(
      { id: crypto.randomUUID(), chargeId, account: source, type: 'debit', amount, currency, description: `Charge: ${chargeId}`, createdAt: now },
      { id: crypto.randomUUID(), chargeId, account: destination, type: 'credit', amount: netAmount, currency, description: `Net payout: ${chargeId}`, createdAt: now },
      { id: crypto.randomUUID(), chargeId, account: 'acct_payflow_fees', type: 'credit', amount: fee, currency, description: `Fee: ${chargeId}`, createdAt: now }
    );

    // Store idempotency response (24hr expiry)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.idempotencyStore.set(idempotencyKey, { chargeId, response: charge, expiresAt });

    // Fire webhook events (async)
    fireWebhookEvent('charge.succeeded', charge);

    res.status(201).json({ success: true, data: charge });
  } catch (err) { next(err); }
});

// GET /v1/charges — List all charges (requires JWT)
router.get('/', authenticateToken, (req, res) => {
  const { page = 1, limit = 20, status, source, customer, from, to } = req.query;
  let results = [...db.charges];

  if (status) results = results.filter(c => c.status === status);
  if (source) results = results.filter(c => c.source === source);
  if (customer) results = results.filter(c => c.customer === customer);
  if (from) results = results.filter(c => new Date(c.createdAt) >= new Date(from));
  if (to) results = results.filter(c => new Date(c.createdAt) <= new Date(to));

  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pageNum = parseInt(page), limitNum = parseInt(limit);
  const total = results.length;
  const data = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum), hasNext: pageNum * limitNum < total, hasPrev: pageNum > 1 },
  });
});

// GET /v1/charges/:id
router.get('/:id', authenticateToken, (req, res, next) => {
  const charge = db.charges.find(c => c.id === req.params.id);
  if (!charge) return next(createError(404, `Charge '${req.params.id}' not found.`));
  res.json({ success: true, data: charge });
});

// POST /v1/charges/:id/refund
router.post('/:id/refund', requireApiKey, (req, res, next) => {
  try {
    const charge = db.charges.find(c => c.id === req.params.id);
    if (!charge) throw createError(404, `Charge '${req.params.id}' not found.`);
    if (charge.status !== 'succeeded') throw createError(400, `Cannot refund a charge with status '${charge.status}'.`);
    if (charge.refunded) throw createError(400, 'This charge has already been refunded.');

    const refundAmount = req.body.amount || charge.amount;
    if (refundAmount > charge.amount) throw createError(400, 'Refund amount cannot exceed original charge amount.');

    // Reverse the ledger
    db.accounts[charge.source].balance += refundAmount;
    db.accounts[charge.destination].balance -= refundAmount;

    charge.refunded = true;
    charge.refundAmount = refundAmount;
    charge.refundedAt = new Date().toISOString();
    charge.status = refundAmount === charge.amount ? 'refunded' : 'partially_refunded';

    db.ledgerEntries.push(
      { id: crypto.randomUUID(), chargeId: charge.id, account: charge.source, type: 'credit', amount: refundAmount, currency: charge.currency, description: `Refund: ${charge.id}`, createdAt: charge.refundedAt },
      { id: crypto.randomUUID(), chargeId: charge.id, account: charge.destination, type: 'debit', amount: refundAmount, currency: charge.currency, description: `Refund reversal: ${charge.id}`, createdAt: charge.refundedAt }
    );

    fireWebhookEvent('charge.refunded', charge);
    res.json({ success: true, data: charge });
  } catch (err) { next(err); }
});

// Helper: async webhook dispatch
const fireWebhookEvent = (eventType, data) => {
  const event = { id: 'evt_' + crypto.randomBytes(8).toString('hex'), type: eventType, data, createdAt: new Date().toISOString() };
  db.webhookEvents.push(event);
  // Notify registered webhooks (fire and forget)
  db.webhooks.forEach(wh => {
    if (!wh.isActive) return;
    const https = require('http');
    try {
      const payload = JSON.stringify(event);
      // In production, use a proper HTTP client. Here we just log.
      console.log(`[Webhook] Dispatching '${eventType}' to ${wh.url}`);
    } catch (e) {}
  });
};

module.exports = router;
