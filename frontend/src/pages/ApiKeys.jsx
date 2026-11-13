import React, { useEffect, useState } from 'react';
import { Sidebar } from './Dashboard';
import { API } from '../context/AuthContext';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchKeys = () => API.get('/api/v1/keys').then(r => setKeys(r.data.data));
  useEffect(() => { fetchKeys(); }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const r = await API.post('/api/v1/keys', { name: name || 'Secret Key' });
      setNewKey(r.data.data.key);
      setName('');
      fetchKeys();
    } catch(e) {} finally { setLoading(false); }
  };

  const revoke = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
    await API.delete(`/api/v1/keys/${id}`);
    fetchKeys();
  };

  const copy = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="layout">
      <Sidebar active="keys" />
      <div className="main-content fade-in">
        <div className="page-header">
          <h1 className="page-title">API Keys</h1>
          <p className="page-subtitle">Manage your secret keys for programmatic API access</p>
        </div>
        <div className="page-body">
          {newKey && (
            <div style={{ padding: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, marginBottom: 28 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 12 }}>✅ New API Key Generated — Save it now, it won't be shown again!</p>
              <div className="code-block">
                <span className="mono" style={{ fontSize: 13 }}>{newKey}</span>
                <button onClick={copy} className="btn btn-secondary btn-sm">{copied ? '✅ Copied' : '📋 Copy'}</button>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Generate New Key</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input className="form-input" style={{ maxWidth: 320 }} placeholder="Key name (e.g. Production)" value={name} onChange={e => setName(e.target.value)} />
              <button className="btn btn-primary" onClick={generate} disabled={loading}>
                {loading ? 'Generating...' : '+ Generate Key'}
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Key Prefix</th><th>Status</th><th>Last Used</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k.name}</td>
                    <td><span className="mono" style={{ fontSize: 12, color: 'var(--accent-light)' }}>{k.prefix}</span></td>
                    <td><span className={`badge badge-${k.isActive ? 'green' : 'red'}`}>{k.isActive ? 'Active' : 'Revoked'}</span></td>
                    <td>{k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never'}</td>
                    <td>{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td>{k.isActive && <button className="btn btn-danger btn-sm" onClick={() => revoke(k.id)}>Revoke</button>}</td>
                  </tr>
                ))}
                {keys.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No API keys yet</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: 24, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent-light)' }}>How to use your API key</h4>
            <div className="code-block" style={{ marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 12 }}>POST /v1/charges  X-Api-Key: sk_live_your_key  Idempotency-Key: unique-key-123</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>All charge requests require both an X-Api-Key header and an Idempotency-Key to prevent duplicate processing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
