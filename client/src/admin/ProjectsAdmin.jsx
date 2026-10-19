import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABEL } from '../components/Sections.jsx';
import { PageHeader, useToast } from './ui.jsx';

export default function ProjectsAdmin() {
  const [projects, setProjects] = useState(null);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const toast = useToast();

  useEffect(() => {
    api.get('/projects').then(setProjects);
  }, []);

  const patch = async (p, changes) => {
    const updated = await api.patch(`/projects/${p.id}`, changes);
    setProjects((list) => list.map((x) => (x.id === p.id ? updated : x)));
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    await api.del(`/projects/${p.id}`);
    setProjects((list) => list.filter((x) => x.id !== p.id));
    toast('Project deleted');
  };

  if (!projects) return <p className="dim">Loading…</p>;

  const shown = projects.filter(
    (p) => (status === 'all' || p.status === status) && `${p.title} ${p.tech.join(' ')}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Projects" subtitle={`${projects.length} total · ${projects.filter((p) => p.visible).length} public`}>
        <Link to="/admin/projects/new" className="btn btn-primary btn-sm">+ New project</Link>
      </PageHeader>

      <div className="toolbar">
        <input className="search" placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="segmented">
          {['all', ...Object.keys(STATUS_LABEL)].map((s) => (
            <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Public</th>
              <th>Order</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/admin/projects/${p.id}`} className="row-title">{p.title}</Link>
                  <div className="dim small truncate">{p.tech.join(' · ')}</div>
                </td>
                <td>
                  <select className="inline-select" value={p.status} onChange={(e) => patch(p, { status: e.target.value })} aria-label="Status">
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td><Toggle checked={p.featured} onChange={(v) => patch(p, { featured: v })} label="Featured" /></td>
                <td><Toggle checked={p.visible} onChange={(v) => patch(p, { visible: v })} label="Public" /></td>
                <td className="mono">{p.sortOrder}</td>
                <td className="row-actions">
                  <a href={`/projects/${p.slug}`} target="_blank" rel="noreferrer" className="icon-btn" title="View">↗</a>
                  <Link to={`/admin/projects/${p.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={6} className="dim empty">No projects match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}
