# PayFlow — Double-Entry Ledger & Payments Developer Portal

A **production-grade, full-stack fintech SaaS platform** implementing Stripe-architecture principles: idempotent charge processing, ACID double-entry accounting, API key management, and webhook events — all in a professionally deployed developer portal.

## 🚀 Features

### Core Financial Engine
- **Idempotency-Key enforcement** — Prevents duplicate charges on network retries (the #1 Stripe design principle)
- **ACID Double-Entry Bookkeeping** — Every charge creates balanced debit/credit ledger entries; system-level integrity checks ensure books never go out of balance
- **Automated Fee Calculation** — 2.9% + 30¢ per transaction (mirrors Stripe's pricing model)
- **Refunds with ledger reversal** — Full and partial refunds that correctly reverse the original entries

### Authentication & Security
- **JWT Access + Refresh Token rotation** — 15-minute access tokens, 7-day refresh tokens
- **Dual auth system** — JWT for dashboard access, API Keys (`sk_live_...`) for programmatic access
- **Helmet.js** — XSS, CSRF, clickjacking protection headers
- **Rate limiting** — Global 300 req/15min; Auth 20 req/15min; Charge API 100 req/min
- **Input validation** — express-validator on all endpoints

### Developer Portal Facilities
- **API Key management** — Generate, list (masked), and revoke API keys
- **Webhook system** — Register endpoints, select event types, view event dispatch log
- **Balance sheet integrity check** — Real-time verification that total debits === total credits

## 📋 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | None | Register + auto-create account |
| POST | `/api/v1/auth/login` | None | Login, get tokens |
| POST | `/api/v1/auth/refresh` | Refresh Token | Rotate access token |
| POST | `/api/v1/auth/logout` | None | Invalidate refresh token |
| GET | `/api/v1/auth/me` | JWT | Get current user + accounts |
| GET | `/api/v1/keys` | JWT | List API keys (masked) |
| POST | `/api/v1/keys` | JWT | Generate new API key |
| DELETE | `/api/v1/keys/:id` | JWT | Revoke API key |
| **POST** | **`/v1/charges`** | **API Key + Idempotency-Key** | **Process a charge** |
| GET | `/v1/charges` | JWT | List charges (paginated, filterable) |
| GET | `/v1/charges/:id` | JWT | Get charge detail |
| POST | `/v1/charges/:id/refund` | API Key | Issue refund |
| GET | `/api/v1/ledger/accounts` | JWT | List all accounts with balances |
| GET | `/api/v1/ledger/entries` | JWT | Double-entry journal (paginated) |
| GET | `/api/v1/ledger/summary` | JWT | P&L summary + integrity check |
| POST | `/api/v1/webhooks` | JWT | Register webhook endpoint |
| GET | `/api/v1/webhooks/events` | JWT | View webhook event log |

## 🔐 Making a Charge

```bash
# 1. Login
POST /api/v1/auth/login
{ "email": "you@example.com", "password": "yourpass" }

# 2. Generate API key
POST /api/v1/keys  (Authorization: Bearer <accessToken>)

# 3. Process charge
POST /v1/charges
X-Api-Key: sk_live_...
Idempotency-Key: unique-client-key-123

{
  "amount": 5000,
  "currency": "USD",
  "source": "acct_merchant_acme",
  "destination": "acct_payflow_reserve",
  "description": "Invoice #42",
  "customer": "cus_harshit"
}
```

## 🛠 Tech Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Auth:** JWT (access + refresh) + Bcrypt
- **Security:** Helmet.js, express-rate-limit
- **Validation:** express-validator
- **Logging:** Morgan
- **Frontend:** React + Vite

## 📦 Installation

```bash
cd backend && npm install && node index.js
```

Server starts on `http://localhost:8080`

## 🌐 Deployment
- Backend → [Render.com](https://render.com) (`PORT`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`)
- Frontend → [Vercel](https://vercel.com)
