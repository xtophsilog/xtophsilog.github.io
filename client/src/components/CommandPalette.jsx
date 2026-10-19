import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** ⌘K / Ctrl+K quick navigation across sections, projects and links. */
export default function CommandPalette({ open, onClose, projects = [], profile = {} }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const goSection = (id) => () => {
    navigate('/');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const commands = useMemo(() => {
    const list = [
      { group: 'Navigate', label: 'About', run: goSection('about') },
      { group: 'Navigate', label: 'Skills', run: goSection('skills') },
      { group: 'Navigate', label: 'Experience', run: goSection('experience') },
      { group: 'Navigate', label: 'Projects', run: goSection('projects') },
      { group: 'Navigate', label: 'Contact', run: goSection('contact') },
      ...projects.map((p) => ({ group: 'Projects', label: p.title, hint: p.tech.slice(0, 3).join(' · '), run: () => navigate(`/projects/${p.slug}`) })),
    ];
    if (profile.email) list.push({ group: 'Actions', label: 'Copy email address', hint: profile.email, run: () => navigator.clipboard?.writeText(profile.email) });
    if (profile.resumeUrl) list.push({ group: 'Actions', label: 'Open résumé', run: () => window.open(profile.resumeUrl, '_blank') });
    Object.entries(profile.socials || {}).forEach(([k, v]) => v && list.push({ group: 'Links', label: k[0].toUpperCase() + k.slice(1), hint: v, run: () => window.open(v, '_blank') }));
    list.push({ group: 'Actions', label: 'Admin dashboard', run: () => navigate('/admin') });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, profile]);

  const results = commands.filter((c) => `${c.label} ${c.hint || ''} ${c.group}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const runAt = (i) => {
    results[i]?.run();
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') runAt(active);
    else if (e.key === 'Escape') onClose();
  };

  let lastGroup = null;
  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" role="dialog" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <span className="mono accent">&gt;</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            aria-label="Search commands"
          />
          <kbd>esc</kbd>
        </div>
        <ul className="palette-list" role="listbox">
          {results.length === 0 && <li className="palette-empty">No results</li>}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? (lastGroup = c.group) : null;
            return (
              <li key={`${c.group}-${c.label}`}>
                {header && <div className="palette-group">{header}</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? 'active' : ''}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runAt(i)}
                >
                  <span>{c.label}</span>
                  {c.hint && <span className="palette-hint">{c.hint}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
