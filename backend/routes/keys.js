const express = require('express');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const db = require('../db');

const router = express.Router();
router.use(authenticateToken);

// GET /api/v1/keys - List all API keys for user
router.get('/', (req, res) => {
  const userKeys = Object.entries(db.apiKeys)
    .filter(([, v]) => v.userId === req.user.id)
    .map(([key, v]) => ({
      id: v.id,
      name: v.name,
      prefix: key.substring(0, 12) + '...',
      isActive: v.isActive,
      lastUsed: v.lastUsed,
      createdAt: v.createdAt,
    }));
  res.json({ success: true, data: userKeys, count: userKeys.length });
});

// POST /api/v1/keys - Generate new API key
router.post('/', (req, res, next) => {
  try {
    const { name = 'Secret Key' } = req.body;
    const keyId = 'key_' + crypto.randomBytes(8).toString('hex');
    const rawKey = 'sk_live_' + crypto.randomBytes(24).toString('hex');

    db.apiKeys[rawKey] = {
      id: keyId,
      userId: req.user.id,
      name,
      isActive: true,
      lastUsed: null,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      message: 'Save this key securely — it will not be shown again.',
      data: { id: keyId, name, key: rawKey, createdAt: db.apiKeys[rawKey].createdAt },
    });
  } catch (err) { next(err); }
});

// DELETE /api/v1/keys/:id - Revoke an API key
router.delete('/:id', (req, res, next) => {
  try {
    const entry = Object.entries(db.apiKeys).find(([, v]) => v.id === req.params.id && v.userId === req.user.id);
    if (!entry) throw createError(404, 'API key not found.');
    db.apiKeys[entry[0]].isActive = false;
    res.json({ success: true, message: 'API key revoked successfully.', data: { id: req.params.id } });
  } catch (err) { next(err); }
});

module.exports = router;
