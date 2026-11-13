const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();
router.use(authenticateToken);

// GET /api/v1/ledger/accounts — list all accounts
router.get('/accounts', (req, res) => {
  const accounts = Object.values(db.accounts).map(a => ({
    ...a,
    balance: a.balance / 100, // convert cents to dollars
  }));
  res.json({ success: true, data: accounts, count: accounts.length });
});

// GET /api/v1/ledger/accounts/:id — single account + balance
router.get('/accounts/:id', (req, res) => {
  const account = db.accounts[req.params.id];
  if (!account) return res.status(404).json({ success: false, error: { message: 'Account not found.' } });

  const entries = db.ledgerEntries.filter(e => e.account === req.params.id);
  const totalDebits = entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredits = entries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);

  res.json({
    success: true,
    data: {
      ...account,
      balance: account.balance / 100,
      stats: {
        totalDebits: totalDebits / 100,
        totalCredits: totalCredits / 100,
        entryCount: entries.length,
      },
    },
  });
});

// GET /api/v1/ledger/entries — all double-entry records
router.get('/entries', (req, res) => {
  const { account, type, page = 1, limit = 20 } = req.query;
  let results = [...db.ledgerEntries];

  if (account) results = results.filter(e => e.account === account);
  if (type) results = results.filter(e => e.type === type);

  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pageNum = parseInt(page), limitNum = parseInt(limit);
  const total = results.length;
  const data = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

// GET /api/v1/ledger/summary — financial summary
router.get('/summary', (req, res) => {
  const succeeded = db.charges.filter(c => c.status === 'succeeded');
  const failed = db.charges.filter(c => c.status === 'failed');
  const refunded = db.charges.filter(c => c.status === 'refunded' || c.status === 'partially_refunded');

  const grossVolume = succeeded.reduce((s, c) => s + c.amount, 0);
  const totalFees = succeeded.reduce((s, c) => s + (c.fee || 0), 0);
  const netVolume = grossVolume - totalFees;
  const refundVolume = refunded.reduce((s, c) => s + (c.refundAmount || 0), 0);

  // Balance sheet: verify debits == credits (accounting integrity check)
  const totalDebits = db.ledgerEntries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredits = db.ledgerEntries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);

  res.json({
    success: true,
    data: {
      grossVolume: grossVolume / 100,
      netVolume: netVolume / 100,
      totalFees: totalFees / 100,
      refundVolume: refundVolume / 100,
      chargeCount: db.charges.length,
      succeededCount: succeeded.length,
      failedCount: failed.length,
      refundedCount: refunded.length,
      successRate: db.charges.length > 0 ? parseFloat(((succeeded.length / db.charges.length) * 100).toFixed(2)) : 0,
      integrityCheck: {
        totalDebits: totalDebits / 100,
        totalCredits: totalCredits / 100,
        balanced: totalDebits === totalCredits,
      },
    },
  });
});

module.exports = router;
