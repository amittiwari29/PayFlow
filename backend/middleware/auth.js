const jwt = require('jsonwebtoken');
const { createError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'payflow-access-secret-change-in-prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'payflow-refresh-secret-change-in-prod';

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) throw createError(401, 'Access denied. No token provided.');

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(createError(401, 'Access token expired. Please refresh.'));
    if (err.name === 'JsonWebTokenError') return next(createError(403, 'Invalid access token.'));
    next(err);
  }
};

const requireApiKey = (req, res, next) => {
  try {
    const key = req.headers['x-api-key'];
    if (!key) throw createError(401, 'Missing X-Api-Key header.');
    const db = require('../db');
    const keyRecord = db.apiKeys[key];
    if (!keyRecord) throw createError(401, 'Invalid or revoked API key.');
    req.apiKeyRecord = keyRecord;
    req.user = { id: keyRecord.userId };
    next();
  } catch (err) { next(err); }
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);

module.exports = { authenticateToken, requireApiKey, generateTokens, verifyRefreshToken };
