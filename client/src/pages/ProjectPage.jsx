import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Markdown from '../components/Markdown.jsx';
import { STATUS_LABEL } from '../components/Sections.jsx';
import { Footer, Nav } from '../components/SiteChrome.jsx';

export default function ProjectPage() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [profile, setProfile] = useState({});
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setProject(null);
    setMissing(false);
    api.get(`/projects/slug/${encodeURIComponent(slug)}`).then(setProject).catch(() => setMissing(true));
    api.get('/profile').then(setProfile).catch(() => {});
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (project) document.title = `${project.title} — ${profile.name || 'Portfolio'}`;
  }, [project, profile]);

  return (
    <>
      <Nav profile={profile} />
      <main className="container project-page">
        <Link to="/#projects" className="mono dim back-link">← back to projects</Link>
        {missing && <h1>Project not found</h1>}
        {!project && !missing && <p className="mono dim">loading<span className="caret" /></p>}
        {project && (
          <article>
            <header className="project-header">
              <span className={`status status-${project.status}`}>{STATUS_LABEL[project.status]}</span>
              <h1>{project.title}</h1>
              <p className="lead">{project.summary}</p>
              <ul className="tags">
                {project.tech.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <div className="hero-actions">
                {project.liveUrl && <a className="btn btn-primary" href={project.liveUrl} target="_blank" rel="noreferrer">Live demo ↗</a>}
                {project.repoUrl && <a className="btn btn-ghost" href={project.repoUrl} target="_blank" rel="noreferrer">Source code ↗</a>}
              </div>
            </header>
            {project.imageUrl && <img className="project-cover" src={project.imageUrl} alt={`${project.title} screenshot`} />}
            <Markdown source={project.description} />
          </article>
        )}
      </main>
      <Footer profile={profile} />
    </>
  );
}
