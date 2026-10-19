import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export const STATUS_LABEL = { planning: 'Planning', in_progress: 'In progress', completed: 'Shipped', archived: 'Archived' };

export const formatMonth = (ym) => {
  if (!ym) return 'Present';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

function SectionHeading({ index, title, kicker }) {
  return (
    <div className="section-heading">
      <span className="mono accent">{String(index).padStart(2, '0')}</span>
      <h2>{title}</h2>
      {kicker && <p className="dim">{kicker}</p>}
    </div>
  );
}

/** Cycles through phrases with a typewriter effect. */
function Typewriter({ words }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[i % words.length];
    const done = !deleting && text === word;
    const cleared = deleting && text === '';
    const t = setTimeout(
      () => {
        if (done) setDeleting(true);
        else if (cleared) { setDeleting(false); setI((n) => n + 1); }
        else setText(word.slice(0, text.length + (deleting ? -1 : 1)));
      },
      done ? 1800 : deleting ? 35 : 70,
    );
    return () => clearTimeout(t);
  }, [text, deleting, i, words]);

  return <span className="typewriter">{text}</span>;
}

export function Hero({ profile, skills }) {
  const words = useMemo(() => {
    const top = skills.slice().sort((a, b) => b.level - a.level).slice(0, 4).map((s) => s.name.toLowerCase());
    return top.length ? top : ['clean code'];
  }, [skills]);

  return (
    <section className="hero">
      <div className="hero-grid" aria-hidden="true" />
      <div className="container">
        {profile.available && (
          <p className="pill">
            <span className="pulse" /> Available for new opportunities
          </p>
        )}
        <h1 className="hero-title">
          {profile.name}
          <span className="hero-title-sub">{profile.title}</span>
        </h1>
        <p className="hero-tagline">{profile.tagline}</p>
        <p className="mono hero-terminal">
          <span className="dim">~/portfolio $</span> building with <span className="accent"><Typewriter words={words} /></span>
          <span className="caret" />
        </p>
        <div className="hero-actions">
          <a href="#projects" className="btn btn-primary">View my work</a>
          <a href="#contact" className="btn btn-ghost">Get in touch</a>
          {profile.resumeUrl && <a href={profile.resumeUrl} className="btn btn-ghost" target="_blank" rel="noreferrer">Résumé ↗</a>}
        </div>
        {profile.stats?.length > 0 && (
          <dl className="hero-stats">
            {profile.stats.map((s) => (
              <div key={s.label}>
                <dt className="dim">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export function About({ profile }) {
  return (
    <section id="about" className="section">
      <div className="container about">
        <SectionHeading index={1} title="About" />
        <div className="about-body">
          {profile.avatarUrl ? (
            <img className="avatar" src={profile.avatarUrl} alt={profile.name} />
          ) : (
            <div className="avatar avatar-fallback mono" aria-hidden="true">
              {(profile.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </div>
          )}
          <div>
            {(profile.bio || '').split(/\n\n+/).map((p, i) => <p key={i} className="lead">{p}</p>)}
            <ul className="meta-list mono">
              {profile.location && <li><span className="dim">location</span> {profile.location}</li>}
              {profile.email && <li><span className="dim">email</span> <a href={`mailto:${profile.email}`}>{profile.email}</a></li>}
              {Object.entries(profile.socials || {}).filter(([, v]) => v).map(([k, v]) => (
                <li key={k}><span className="dim">{k}</span> <a href={v} target="_blank" rel="noreferrer">{v.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Skills({ skills }) {
  const groups = useMemo(() => {
    const g = {};
    skills.forEach((s) => (g[s.category] ??= []).push(s));
    return Object.entries(g);
  }, [skills]);

  return (
    <section id="skills" className="section">
      <div className="container">
        <SectionHeading index={2} title="Skills" kicker="Tools I reach for, and how well I know them." />
        <div className="skills-grid">
          {groups.map(([category, items]) => (
            <div key={category} className="card skill-group">
              <h3 className="mono">{category}</h3>
              <ul>
                {items.map((s) => (
                  <li key={s.id}>
                    <div className="skill-row">
                      <span>{s.name}</span>
                      <span className="mono dim">{s.level}%</span>
                    </div>
                    <div className="meter" role="meter" aria-valuenow={s.level} aria-valuemin={0} aria-valuemax={100} aria-label={s.name}>
                      {Array.from({ length: 10 }, (_, i) => <span key={i} className={i < Math.round(s.level / 10) ? 'on' : ''} />)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Experience({ experience }) {
  return (
    <section id="experience" className="section">
      <div className="container">
        <SectionHeading index={3} title="Experience" kicker="Where I've been building." />
        <ol className="timeline">
          {experience.map((e) => (
            <li key={e.id} className="timeline-item">
              <div className="timeline-date mono dim">
                {formatMonth(e.startDate)} — {formatMonth(e.endDate)}
              </div>
              <div className="timeline-body">
                <h3>
                  {e.role} <span className="accent">@ {e.company}</span>
                </h3>
                {e.location && <p className="mono dim small">{e.location}</p>}
                {e.description && <p>{e.description}</p>}
                {e.highlights.length > 0 && (
                  <ul className="highlights">
                    {e.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ProjectCard({ project, index }) {
  return (
    <Link to={`/projects/${project.slug}`} className="card project-card">
      <div className="project-media">
        {project.imageUrl ? (
          <img src={project.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="project-placeholder mono" aria-hidden="true">
            {project.title.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className={`status status-${project.status}`}>{STATUS_LABEL[project.status]}</span>
      </div>
      <div className="project-body">
        <span className="mono dim small">{String(index + 1).padStart(2, '0')}</span>
        <h3>{project.title} <span className="arrow">↗</span></h3>
        <p className="dim">{project.summary}</p>
        <ul className="tags">
          {project.tech.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </Link>
  );
}

export function Projects({ projects }) {
  const [filter, setFilter] = useState('All');
  const techs = useMemo(() => {
    const counts = {};
    projects.forEach((p) => p.tech.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return ['All', ...Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 8)];
  }, [projects]);
  const shown = filter === 'All' ? projects : projects.filter((p) => p.tech.includes(filter));

  return (
    <section id="projects" className="section">
      <div className="container">
        <SectionHeading index={4} title="Projects" kicker="Selected work — click any card for the full story." />
        <div className="filters" role="tablist" aria-label="Filter projects by technology">
          {techs.map((t) => (
            <button key={t} role="tab" aria-selected={filter === t} className={`chip ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="projects-grid">
          {shown.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
          {shown.length === 0 && <p className="dim">No projects with that technology yet.</p>}
        </div>
      </div>
    </section>
  );
}

const EMPTY_FORM = { name: '', email: '', subject: '', body: '', website: '' };

export function Contact({ profile }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [message, setMessage] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Please enter a valid email';
    if (form.body.trim().length < 10) errs.body = 'Message should be at least 10 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setState('sending');
    try {
      await api.post('/contact', form);
      setState('sent');
      setForm(EMPTY_FORM);
    } catch (err) {
      setState('error');
      setMessage(err.message);
      if (err.details) setErrors(Object.fromEntries(Object.entries(err.details).map(([k, v]) => [k, v[0]])));
    }
  };

  return (
    <section id="contact" className="section">
      <div className="container contact">
        <div>
          <SectionHeading index={5} title="Let's build something" />
          <p className="lead">
            Have a project in mind, a role to fill, or just want to say hi? Send a message — it lands straight in my inbox and I usually reply within a day or two.
          </p>
          {profile.email && (
            <p className="mono">
              <span className="dim">or email</span> <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </p>
          )}
        </div>

        {state === 'sent' ? (
          <div className="card contact-success" role="status">
            <span className="mono accent big">✓</span>
            <h3>Message sent</h3>
            <p className="dim">Thanks for reaching out — I'll get back to you soon.</p>
            <button className="btn btn-ghost" onClick={() => setState('idle')}>Send another</button>
          </div>
        ) : (
          <form className="card contact-form" onSubmit={onSubmit} noValidate>
            <div className="field-row">
              <Field label="Name" error={errors.name}>
                <input value={form.name} onChange={set('name')} autoComplete="name" />
              </Field>
              <Field label="Email" error={errors.email}>
                <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
              </Field>
            </div>
            <Field label="Subject (optional)" error={errors.subject}>
              <input value={form.subject} onChange={set('subject')} />
            </Field>
            <Field label="Message" error={errors.body}>
              <textarea rows={6} value={form.body} onChange={set('body')} />
            </Field>
            {/* Honeypot: hidden from people, tempting for bots. */}
            <input className="hp" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />
            {state === 'error' && <p className="form-error" role="alert">{message}</p>}
            <button className="btn btn-primary" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Send message →'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label mono">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
