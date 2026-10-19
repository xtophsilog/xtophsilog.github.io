import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ToastProvider } from './ui.jsx';
import '../styles/admin.css';

const LINKS = [
  ['/admin', 'Dashboard', '◧', true],
  ['/admin/projects', 'Projects', '▦'],
  ['/admin/skills', 'Skills', '◈'],
  ['/admin/experience', 'Experience', '◷'],
  ['/admin/messages', 'Messages', '✉'],
  ['/admin/profile', 'Profile', '◉'],
  ['/admin/settings', 'Settings', '⚙'],
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Refresh the unread badge whenever the admin navigates.
  useEffect(() => {
    api.get('/stats').then((s) => setUnread(s.unread)).catch(() => {});
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onChange = (e) => setUnread(e.detail);
    window.addEventListener('admin:unread', onChange);
    return () => window.removeEventListener('admin:unread', onChange);
  }, []);

  return (
    <ToastProvider>
      <div className="admin">
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          <Link to="/admin" className="sidebar-logo mono">
            <span className="accent">&gt;_</span> admin
          </Link>
          <nav>
            {LINKS.map(([to, label, icon, end]) => (
              <NavLink key={to} to={to} end={end}>
                <span className="nav-icon" aria-hidden="true">{icon}</span>
                {label}
                {label === 'Messages' && unread > 0 && <span className="badge">{unread}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">
            <a href="/" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View site ↗</a>
            <div className="mono dim small truncate" title={user?.email}>{user?.email}</div>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
          </div>
        </aside>
        <div className="admin-main">
          <button className="sidebar-toggle btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)}>☰ Menu</button>
          <Outlet />
        </div>
      </div>
    </ToastProvider>
  );
}
