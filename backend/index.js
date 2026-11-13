const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const keysRoutes = require('./routes/keys');
const chargesRoutes = require('./routes/charges');
const ledgerRoutes = require('./routes/ledger');
const webhooksRoutes = require('./routes/webhooks');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many auth attempts.' } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, message: { error: 'API rate limit exceeded.' } });

app.use(globalLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/keys', keysRoutes);
app.use('/v1/charges', apiLimiter, chargesRoutes);
app.use('/api/v1/ledger', ledgerRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: { status: 404, message: 'Route not found', path: req.originalUrl } });
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`💳 PayFlow API v1.0.0 running on port ${PORT}`);
  console.log(`🔐 Health: http://localhost:${PORT}/health`);
});

module.exports = app;
