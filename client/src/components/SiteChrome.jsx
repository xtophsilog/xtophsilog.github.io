import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CommandPalette from './CommandPalette.jsx';

const SECTIONS = ['about', 'skills', 'experience', 'projects', 'contact'];

export function Nav({ profile = {}, projects = [] }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const initials = (profile.name || 'Portfolio').split(' ').map((w) => w[0]).join('').slice(0, 2);

  return (
    <>
      <header className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link to="/" className="nav-logo mono" aria-label="Home">
            <span className="accent">&gt;_</span> {initials.toLowerCase()}
          </Link>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
            {SECTIONS.map((s, i) => (
              <a key={s} href={`/#${s}`}>
                <span className="mono dim">0{i + 1}</span> {s}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <button type="button" className="kbd-button" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </button>
            <button type="button" className="menu-toggle" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} projects={projects} profile={profile} />
    </>
  );
}

export function Footer({ profile = {} }) {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="mono dim">
          © {new Date().getFullYear()} {profile.name} — built with React, Node.js & SQLite
        </span>
        <span className="mono dim">
          press <kbd>⌘</kbd>
          <kbd>K</kbd> to navigate
        </span>
      </div>
    </footer>
  );
}
