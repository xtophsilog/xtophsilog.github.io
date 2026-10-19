import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader, useToast } from './ui.jsx';

export default function MessagesAdmin() {
  const [messages, setMessages] = useState(null);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const params = new URLSearchParams({ filter, ...(q ? { q } : {}) });
    const t = setTimeout(() => api.get(`/messages?${params}`).then(setMessages), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [filter, q]);

  useEffect(() => {
    if (messages) window.dispatchEvent(new CustomEvent('admin:unread', { detail: messages.filter((m) => !m.isRead).length }));
  }, [messages]);

  const setRead = async (m, isRead) => {
    const updated = await api.patch(`/messages/${m.id}`, { isRead });
    setMessages((list) => list.map((x) => (x.id === m.id ? updated : x)));
    if (selected?.id === m.id) setSelected(updated);
  };

  const open = (m) => {
    setSelected(m);
    if (!m.isRead) setRead(m, true);
  };

  const remove = async (m) => {
    if (!confirm('Delete this message?')) return;
    await api.del(`/messages/${m.id}`);
    setMessages((list) => list.filter((x) => x.id !== m.id));
    setSelected(null);
    toast('Message deleted');
  };

  return (
    <>
      <PageHeader title="Messages" subtitle="Inquiries from your contact form." />
      <div className="toolbar">
        <input className="search" placeholder="Search name, email or text…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="segmented">
          {['all', 'unread', 'read'].map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="inbox">
        <ul className="card inbox-list">
          {!messages && <li className="dim empty">Loading…</li>}
          {messages?.length === 0 && <li className="dim empty">No messages.</li>}
          {messages?.map((m) => (
            <li key={m.id}>
              <button className={`inbox-item ${selected?.id === m.id ? 'active' : ''} ${m.isRead ? '' : 'unread'}`} onClick={() => open(m)}>
                <div className="inbox-item-top">
                  <strong>{m.name}</strong>
                  <span className="mono dim small">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="truncate">{m.subject || 'No subject'}</div>
                <div className="dim small truncate">{m.body}</div>
              </button>
            </li>
          ))}
        </ul>

        <div className="card panel inbox-detail">
          {selected ? (
            <>
              <div className="inbox-detail-head">
                <div>
                  <h2>{selected.subject || 'No subject'}</h2>
                  <p className="dim">
                    {selected.name} · <a href={`mailto:${selected.email}`}>{selected.email}</a> · {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="message-body">{selected.body}</p>
              <div className="page-actions">
                <a className="btn btn-primary btn-sm" href={`mailto:${selected.email}?subject=${encodeURIComponent('Re: ' + (selected.subject || 'Your message'))}`}>Reply by email</a>
                <button className="btn btn-ghost btn-sm" onClick={() => setRead(selected, !selected.isRead)}>Mark as {selected.isRead ? 'unread' : 'read'}</button>
                <button className="btn btn-ghost btn-sm danger" onClick={() => remove(selected)}>Delete</button>
              </div>
            </>
          ) : (
            <p className="dim empty">Select a message to read it.</p>
          )}
        </div>
      </div>
    </>
  );
}
