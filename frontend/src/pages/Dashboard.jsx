import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

const NavItem = ({ icon, label, to, active }) => (
  <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
    <span style={{ fontSize: 18 }}>{icon}</span> {label}
  </Link>
);

export const Sidebar = ({ active }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="sidebar">
      <div className="sidebar-logo">💳 Pay<span>Flow</span></div>
      <nav className="sidebar-nav">
        <div className="nav-section">Overview</div>
        <NavItem icon="🏠" label="Dashboard" to="/dashboard" active={active === 'dashboard'} />
        <div className="nav-section">Payments</div>
        <NavItem icon="⚡" label="Charges" to="/charges" active={active === 'charges'} />
        <NavItem icon="📒" label="Ledger" to="/ledger" active={active === 'ledger'} />
        <div className="nav-section">Developer</div>
        <NavItem icon="🔑" label="API Keys" to="/keys" active={active === 'keys'} />
        <NavItem icon="🔔" label="Webhooks" to="/webhooks" active={active === 'webhooks'} />
      </nav>
      <div className="sidebar-footer">
        <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-card)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{user?.firstName} {user?.lastName}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user?.email}</p>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Sign Out</button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [charges, setCharges] = useState([]);

  useEffect(() => {
    API.get('/api/v1/ledger/summary').then(r => setSummary(r.data.data)).catch(() => {});
    API.get('/v1/charges?limit=5').then(r => setCharges(r.data.data)).catch(() => {});
  }, []);

  const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="layout">
      <Sidebar active="dashboard" />
      <div className="main-content fade-in">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your financial overview at a glance</p>
        </div>
        <div className="page-body">
          {summary ? (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>💰</div>
                  <div className="stat-label">Gross Volume</div>
                  <div className="stat-value">{fmt(summary.grossVolume)}</div>
                  <div className="stat-change text-green">↑ All time</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>📈</div>
                  <div className="stat-label">Net Volume</div>
                  <div className="stat-value">{fmt(summary.netVolume)}</div>
                  <div className="stat-change text-green">After {fmt(summary.totalFees)} fees</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>⚡</div>
                  <div className="stat-label">Total Charges</div>
                  <div className="stat-value">{summary.chargeCount}</div>
                  <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>{summary.succeededCount} succeeded</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div>
                  <div className="stat-label">Success Rate</div>
                  <div className="stat-value">{summary.successRate}%</div>
                  <div className="stat-change text-green">↑ Excellent</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="card">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Recent Charges</h3>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>ID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {charges.map(c => (
                          <tr key={c.id}>
                            <td><span className="mono" style={{ fontSize: 12 }}>{c.id}</span></td>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(c.amount / 100)}</td>
                            <td><span className={`badge badge-${c.status === 'succeeded' ? 'green' : c.status === 'failed' ? 'red' : 'yellow'}`}>{c.status}</span></td>
                            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {charges.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No charges yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 16 }}><Link to="/charges" className="btn btn-secondary btn-sm">View All Charges →</Link></div>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Ledger Integrity</h3>
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>{summary.integrityCheck?.balanced ? '✅' : '⚠️'}</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: summary.integrityCheck?.balanced ? 'var(--green)' : 'var(--red)', marginBottom: 8 }}>
                      {summary.integrityCheck?.balanced ? 'Books Balanced' : 'Imbalance Detected'}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Debits === Credits</p>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Debits</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>{fmt(summary.integrityCheck?.totalDebits)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Credits</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{fmt(summary.integrityCheck?.totalCredits)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Loading dashboard...</div>
          )}
        </div>
      </div>
    </div>
  );
}
