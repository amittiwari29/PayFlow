import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-logo">Pay<span>Flow</span></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started →</Link>
        </div>
      </nav>

      <div className="landing-hero">
        <div className="landing-badge">⚡ Built on Stripe-grade Architecture</div>
        <h1 className="landing-title">
          The <span>Developer Portal</span><br />for Fintech Engineers
        </h1>
        <p className="landing-desc">
          Process payments with idempotency-key protection, ACID double-entry accounting,
          and real-time webhook events. Built to demonstrate the exact systems Stripe uses internally.
        </p>
        <div className="landing-cta">
          <Link to="/register" className="btn btn-primary btn-lg">Start Building Free →</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </div>

      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">🔑</div>
          <div className="feature-title">API Key Management</div>
          <p className="feature-desc">Generate <code style={{color:'var(--accent-light)'}}>sk_live_...</code> secret keys, list them masked, and revoke with one click — exactly like the Stripe Dashboard.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚛️</div>
          <div className="feature-title">Idempotent Charges</div>
          <p className="feature-desc">Every charge requires an <code style={{color:'var(--accent-light)'}}>Idempotency-Key</code> header. Duplicate requests return the cached response — preventing double charges on retries.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📒</div>
          <div className="feature-title">Double-Entry Ledger</div>
          <p className="feature-desc">Every charge creates 3 balanced ledger entries. A real-time integrity check verifies Total Debits === Total Credits at all times.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔔</div>
          <div className="feature-title">Webhook System</div>
          <p className="feature-desc">Register HTTPS endpoints to receive <code style={{color:'var(--accent-light)'}}>charge.succeeded</code> and <code style={{color:'var(--accent-light)'}}>charge.refunded</code> events in real-time.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💸</div>
          <div className="feature-title">Refunds & Reversals</div>
          <p className="feature-desc">Issue full or partial refunds. Each refund automatically reverses the original ledger entries, keeping your books balanced.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <div className="feature-title">Enterprise Security</div>
          <p className="feature-desc">Helmet.js security headers, rate limiting, JWT + Refresh token rotation, and bcrypt password hashing — production-grade from day one.</p>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="landing-nav-logo" style={{ fontSize: 18 }}>Pay<span style={{ color: 'var(--accent)' }}>Flow</span></div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Built for Stripe Software Engineer Intern Application · 2026</p>
      </footer>
    </div>
  );
}
