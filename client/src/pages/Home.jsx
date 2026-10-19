import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { About, Contact, Experience, Hero, Projects, Skills } from '../components/Sections.jsx';
import { Footer, Nav } from '../components/SiteChrome.jsx';

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { hash } = useLocation();

  useEffect(() => {
    api.get('/portfolio').then(setData).catch(setError);
  }, []);

  useEffect(() => {
    if (data) document.title = `${data.profile.name} — ${data.profile.title}`;
    if (data && hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [data, hash]);

  if (error) return <div className="screen-center"><p>Couldn't load the portfolio. Is the API running?</p></div>;
  if (!data) return <div className="screen-center mono dim">loading<span className="caret" /></div>;

  const { profile, skills, experience, projects } = data;
  return (
    <>
      <Nav profile={profile} projects={projects} />
      <main>
        <Hero profile={profile} skills={skills} />
        <About profile={profile} />
        <Skills skills={skills} />
        <Experience experience={experience} />
        <Projects projects={projects} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />
    </>
  );
}
