const { v4: uuidv4 } = require('uuid');

const db = {
  users: [],
  refreshTokens: new Set(),
  apiKeys: {},        // key -> { id, userId, name, createdAt, lastUsed, isActive }
  accounts: {},       // accountId -> { id, userId, name, balance, currency }
  charges: [],        // all charge records
  ledgerEntries: [],  // double-entry bookkeeping records
  webhooks: [],       // registered webhook endpoints
  webhookEvents: [],  // log of dispatched events
  idempotencyStore: new Map(), // key -> { chargeId, response, expiresAt }
};

// Seed default accounts for demo
const seed = () => {
  const systemUserId = 'sys_payflow';
  const accountPairs = [
    { id: 'acct_payflow_reserve',  name: 'PayFlow Reserve',    balance: 10000000 },
    { id: 'acct_payflow_fees',     name: 'PayFlow Fees',       balance: 0 },
    { id: 'acct_merchant_acme',    name: 'Acme Corp',          balance: 250000 },
    { id: 'acct_merchant_nexus',   name: 'Nexus Solutions',    balance: 125000 },
    { id: 'acct_merchant_spark',   name: 'SparkTech',          balance: 75000 },
  ];

  accountPairs.forEach(a => {
    db.accounts[a.id] = { ...a, userId: systemUserId, currency: 'USD', createdAt: new Date().toISOString() };
  });

  // Seed 30 historical charges
  const sources = ['acct_merchant_acme', 'acct_merchant_nexus', 'acct_merchant_spark'];
  const statuses = ['succeeded', 'succeeded', 'succeeded', 'failed'];
  for (let i = 30; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const source = sources[i % sources.length];
    const amount = Math.floor(Math.random() * 50000) + 500;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const chargeId = 'ch_' + uuidv4().replace(/-/g, '').slice(0, 16);

    db.charges.push({
      id: chargeId,
      amount,
      currency: 'USD',
      source,
      destination: 'acct_payflow_reserve',
      status,
      description: `Seed charge #${30 - i + 1}`,
      customer: `cus_${Math.floor(Math.random() * 200)}`,
      fee: Math.floor(amount * 0.029) + 30,
      idempotencyKey: null,
      createdAt: date.toISOString(),
      metadata: {},
    });

    if (status === 'succeeded') {
      db.ledgerEntries.push(
        { id: uuidv4(), chargeId, account: source, type: 'debit', amount, currency: 'USD', createdAt: date.toISOString() },
        { id: uuidv4(), chargeId, account: 'acct_payflow_reserve', type: 'credit', amount, currency: 'USD', createdAt: date.toISOString() }
      );
    }
  }
};

seed();
module.exports = db;
