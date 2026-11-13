import React, { useEffect, useState } from 'react';
import { Sidebar } from './Dashboard';
import { API } from '../context/AuthContext';

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    API.get(`/api/v1/ledger/entries?page=${page}&limit=20`)
      .then(r => { setEntries(r.data.data); setPagination(r.data.pagination); });
    API.get('/api/v1/ledger/accounts').then(r => setAccounts(r.data.data));
  }, [page]);

  const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="layout">
      <Sidebar active="ledger" />
      <div className="main-content fade-in">
        <div className="page-header">
          <h1 className="page-title">Double-Entry Ledger</h1>
          <p className="page-subtitle">Every debit has a matching credit — ACID-compliant accounting</p>
        </div>
        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
            {accounts.map(a => (
              <div key={a.id} className="stat-card">
                <div className="stat-label">{a.name}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: a.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(a.balance)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'JetBrains Mono' }}>{a.currency}</div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Journal Entries</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Entry ID</th><th>Charge ID</th><th>Account</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.id.slice(0,8)}...</span></td>
                    <td><span className="mono" style={{ fontSize: 12, color: 'var(--accent-light)' }}>{e.chargeId}</span></td>
                    <td><span className="mono" style={{ fontSize: 11 }}>{e.account}</span></td>
                    <td><span className={`badge badge-${e.type === 'credit' ? 'green' : 'red'}`}>{e.type.toUpperCase()}</span></td>
                    <td style={{ fontWeight: 700, color: e.type === 'credit' ? 'var(--green)' : 'var(--red)' }}>
                      {e.type === 'credit' ? '+' : '-'}{fmt(e.amount / 100)}
                    </td>
                    <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(p=>p-1)}>← Prev</button>
              <span style={{ padding: '6px 16px', color: 'var(--text-secondary)', fontSize: 14 }}>{pagination.page} / {pagination.totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(p=>p+1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
