import React, { useEffect, useState } from 'react';
import { Sidebar } from './Dashboard';
import { API } from '../context/AuthContext';

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ url: '', events: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allEvents = ['charge.succeeded', 'charge.failed', 'charge.refunded'];
  const fetchData = () => {
    API.get('/api/v1/webhooks').then(r => setWebhooks(r.data.data));
    API.get('/api/v1/webhooks/events').then(r => setEvents(r.data.data));
  };
  useEffect(() => { fetchData(); }, []);

  const toggleEvent = (e) => setForm(f => ({ ...f, events: f.events.includes(e) ? f.events.filter(x=>x!==e) : [...f.events, e] }));

  const register = async () => {
    setError(''); setLoading(true);
    try {
      await API.post('/api/v1/webhooks', form);
      setSuccess('Webhook registered successfully!');
      setForm({ url: '', events: [] });
      fetchData();
    } catch(err) { setError(err.response?.data?.error?.message || 'Failed to register webhook'); }
    finally { setLoading(false); setTimeout(() => setSuccess(''), 3000); }
  };

  const deactivate = async (id) => {
    await API.delete(`/api/v1/webhooks/${id}`);
    fetchData();
  };

  return (
    <div className="layout">
      <Sidebar active="webhooks" />
      <div className="main-content fade-in">
        <div className="page-header">
          <h1 className="page-title">Webhooks</h1>
          <p className="page-subtitle">Receive real-time events when charges are processed</p>
        </div>
        <div className="page-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card" style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Register Endpoint</h3>
            <div className="form-group">
              <label className="form-label">Endpoint URL</label>
              <input className="form-input" placeholder="https://your-server.com/webhooks" value={form.url} onChange={e => setForm({...form, url: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Events to Listen For</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                {allEvents.map(ev => (
                  <button key={ev} onClick={() => toggleEvent(ev)}
                    className={`btn btn-sm ${form.events.includes(ev) ? 'btn-primary' : 'btn-secondary'}`}>
                    {ev}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={register} disabled={loading || !form.url || form.events.length === 0}>
              {loading ? 'Registering...' : '+ Register Webhook'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Registered Endpoints</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>URL</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {webhooks.map(w => (
                      <tr key={w.id}>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</td>
                        <td><span className={`badge badge-${w.isActive ? 'green' : 'red'}`}>{w.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>{w.isActive && <button className="btn btn-danger btn-sm" onClick={() => deactivate(w.id)}>Disable</button>}</td>
                      </tr>
                    ))}
                    {webhooks.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No webhooks registered</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Event Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                {events.map(ev => (
                  <div key={ev.id} style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="badge badge-purple">{ev.type}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(ev.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.id}</span>
                  </div>
                ))}
                {events.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No events fired yet</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
