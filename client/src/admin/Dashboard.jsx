import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABEL } from '../components/Sections.jsx';
import { PageHeader } from './ui.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then(setStats).catch(() => {});
  }, []);

  if (!stats) return <p className="dim">Loading…</p>;

  const max = Math.max(1, ...stats.views.map((v) => v.views));
  const last7 = stats.views.slice(-7).reduce((s, v) => s + v.views, 0);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="An overview of your portfolio.">
        <Link to="/admin/projects/new" className="btn btn-primary btn-sm">+ New project</Link>
      </PageHeader>

      <div className="stat-grid">
        <StatCard label="Projects" value={stats.projects} to="/admin/projects" />
        <StatCard label="Unread messages" value={stats.unread} sub={`${stats.messages} total`} to="/admin/messages" highlight={stats.unread > 0} />
        <StatCard label="Views · 7 days" value={last7} sub={`${stats.totalViews} all time`} />
        <StatCard label="Skills · Roles" value={`${stats.skills} · ${stats.experience}`} to="/admin/skills" />
      </div>

      <div className="dash-grid">
        <section className="card panel">
          <h2>Page views — last 14 days</h2>
          <div className="bar-chart" role="img" aria-label="Page views per day">
            {stats.views.map((v) => (
              <div key={v.day} className="bar-col" title={`${v.day}: ${v.views} views`}>
                <div className="bar" style={{ height: `${(v.views / max) * 100}%` }} />
                <span className="mono dim">{v.day.slice(8)}</span>
              </div>
            ))}
          </div>
          {stats.topPaths.length > 0 && (
            <>
              <h3 className="mono dim small">Top pages · 30 days</h3>
              <ul className="simple-list">
                {stats.topPaths.map((p) => (
                  <li key={p.path}><span className="mono">{p.path}</span><span className="dim">{p.views}</span></li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="card panel">
          <h2>Recent messages</h2>
          {stats.recentMessages.length === 0 && <p className="dim">No messages yet.</p>}
          <ul className="simple-list">
            {stats.recentMessages.map((m) => (
              <li key={m.id}>
                <Link to="/admin/messages">
                  {!m.isRead && <span className="dot" aria-label="unread" />}
                  <strong>{m.name}</strong> <span className="dim">{m.subject || 'No subject'}</span>
                </Link>
                <span className="mono dim small">{new Date(m.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt">Projects by status</h2>
          <ul className="simple-list">
            {stats.projectsByStatus.map((s) => (
              <li key={s.status}><span className={`status status-${s.status}`}>{STATUS_LABEL[s.status]}</span><span>{s.n}</span></li>
            ))}
          </ul>
          {!stats.mailEnabled && (
            <p className="notice small">Email notifications are off — set <code>SMTP_HOST</code> and <code>MAIL_TO</code> in <code>server/.env</code> to get new messages by email.</p>
          )}
        </section>
      </div>
    </>
  );
}

function StatCard({ label, value, sub, to, highlight }) {
  const body = (
    <>
      <span className="mono dim small">{label}</span>
      <strong className={highlight ? 'accent' : ''}>{value}</strong>
      {sub && <span className="dim small">{sub}</span>}
    </>
  );
  return to ? <Link to={to} className="card stat-card">{body}</Link> : <div className="card stat-card">{body}</div>;
}
