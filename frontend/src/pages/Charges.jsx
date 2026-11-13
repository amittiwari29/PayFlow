import React, { useEffect, useState } from 'react';
import { Sidebar } from './Dashboard';
import { API } from '../context/AuthContext';

export default function Charges() {
  const [charges, setCharges] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCharges = (p = 1, status = '') => {
    setLoading(true);
    API.get(`/v1/charges?page=${p}&limit=15${status ? `&status=${status}` : ''}`)
      .then(r => { setCharges(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCharges(page, statusFilter); }, [page, statusFilter]);

  const fmt = (n) => `$${Number(n / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="layout">
      <Sidebar active="charges" />
      <div className="main-content fade-in">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Charges</h1>
              <p className="page-subtitle">All payment transactions · {pagination.total || 0} total</p>
            </div>
            <div className="header-actions">
              <select className="form-input" style={{ width: 'auto', padding: '8px 14px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="succeeded">Succeeded</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>
        <div className="page-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Charge ID</th><th>Amount</th><th>Net</th><th>Status</th><th>Customer</th><th>Source</th><th>Date</th></tr>
              </thead>
              <tbody>
                {charges.map(c => (
                  <tr key={c.id}>
                    <td><span className="mono" style={{ fontSize: 12, color: 'var(--accent-light)' }}>{c.id}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(c.amount)}</td>
                    <td style={{ color: 'var(--green)' }}>{c.netAmount ? fmt(c.netAmount) : '—'}</td>
                    <td><span className={`badge badge-${c.status === 'succeeded' ? 'green' : c.status === 'failed' ? 'red' : 'yellow'}`}>{c.status}</span></td>
                    <td><span className="mono" style={{ fontSize: 12 }}>{c.customer || '—'}</span></td>
                    <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.source?.slice(-12)}</span></td>
                    <td>{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
                {!loading && charges.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No charges found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span style={{ padding: '6px 16px', color: 'var(--text-secondary)', fontSize: 14 }}>Page {pagination.page} of {pagination.totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
