import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { api } from './api.js';
import { RequireAuth } from './auth.jsx';
import Home from './pages/Home.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import NotFound from './pages/NotFound.jsx';

// The admin area is split into its own bundle so visitors never download it.
const Login = lazy(() => import('./admin/Login.jsx'));
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./admin/Dashboard.jsx'));
const ProjectsAdmin = lazy(() => import('./admin/ProjectsAdmin.jsx'));
const ProjectEditor = lazy(() => import('./admin/ProjectEditor.jsx'));
const SkillsAdmin = lazy(() => import('./admin/SkillsAdmin.jsx'));
const ExperienceAdmin = lazy(() => import('./admin/ExperienceAdmin.jsx'));
const MessagesAdmin = lazy(() => import('./admin/MessagesAdmin.jsx'));
const ProfileAdmin = lazy(() => import('./admin/ProfileAdmin.jsx'));
const SettingsAdmin = lazy(() => import('./admin/SettingsAdmin.jsx'));

function usePageViews() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/admin')) api.post('/track', { path: pathname }).catch(() => {});
  }, [pathname]);
}

export default function App() {
  usePageViews();
  return (
    <Suspense fallback={<div className="admin-loading">Loading…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/:slug" element={<ProjectPage />} />
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="projects/new" element={<ProjectEditor />} />
          <Route path="projects/:id" element={<ProjectEditor />} />
          <Route path="skills" element={<SkillsAdmin />} />
          <Route path="experience" element={<ExperienceAdmin />} />
          <Route path="messages" element={<MessagesAdmin />} />
          <Route path="profile" element={<ProfileAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
