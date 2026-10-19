import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Markdown from '../components/Markdown.jsx';
import { STATUS_LABEL } from '../components/Sections.jsx';
import { Toggle } from './ProjectsAdmin.jsx';
import { Field, ImageUpload, PageHeader, TagInput, fieldErrors, useToast } from './ui.jsx';

const EMPTY = {
  title: '', slug: '', summary: '', description: '', tech: [], imageUrl: '', liveUrl: '', repoUrl: '',
  status: 'in_progress', featured: false, visible: true, sortOrder: 0,
};

export default function ProjectEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!isNew) api.get(`/projects/${id}`).then((p) => setForm({ ...EMPTY, ...p, imageUrl: p.imageUrl || '', liveUrl: p.liveUrl || '', repoUrl: p.repoUrl || '' }));
  }, [id, isNew]);

  if (!form) return <p className="dim">Loading…</p>;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const { id: _id, createdAt, updatedAt, ...body } = form;
    body.sortOrder = Number(body.sortOrder) || 0;
    try {
      const saved = isNew ? await api.post('/projects', body) : await api.put(`/projects/${id}`, body);
      toast(isNew ? 'Project created' : 'Project saved');
      if (isNew) navigate(`/admin/projects/${saved.id}`, { replace: true });
      else setForm({ ...EMPTY, ...saved, imageUrl: saved.imageUrl || '', liveUrl: saved.liveUrl || '', repoUrl: saved.repoUrl || '' });
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <PageHeader title={isNew ? 'New project' : form.title || 'Edit project'} subtitle={<Link to="/admin/projects">← All projects</Link>}>
        {!isNew && <a href={`/projects/${form.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View ↗</a>}
        <button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </PageHeader>

      <div className="editor-grid">
        <div className="card panel form-stack">
          <Field label="Title" error={errors.title}>
            <input value={form.title} onChange={set('title')} required />
          </Field>
          <Field label="Slug" error={errors.slug} hint="Used in the URL. Leave blank to generate from the title.">
            <input value={form.slug} onChange={set('slug')} placeholder="my-project" />
          </Field>
          <Field label="Summary" error={errors.summary} hint={`${form.summary.length}/280 — shown on project cards`}>
            <textarea rows={2} value={form.summary} onChange={set('summary')} maxLength={280} />
          </Field>
          <div className="field">
            <div className="field-label-row">
              <span className="field-label mono">Description (Markdown)</span>
              <button type="button" className="link-btn" onClick={() => setPreview((p) => !p)}>{preview ? 'Edit' : 'Preview'}</button>
            </div>
            {preview ? (
              <div className="md-preview"><Markdown source={form.description} /></div>
            ) : (
              <textarea rows={14} value={form.description} onChange={set('description')} placeholder={'## Overview\nWhat it is…\n\n## Highlights\n- Feature one'} />
            )}
          </div>
          <Field label="Tech stack" error={errors.tech}>
            <TagInput value={form.tech} onChange={set('tech')} />
          </Field>
        </div>

        <div className="form-stack">
          <div className="card panel form-stack">
            <Field label="Status">
              <select value={form.status} onChange={set('status')}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <div className="toggle-row"><span>Featured</span><Toggle checked={form.featured} onChange={set('featured')} label="Featured" /></div>
            <div className="toggle-row"><span>Visible on site</span><Toggle checked={form.visible} onChange={set('visible')} label="Visible" /></div>
            <Field label="Sort order" hint="Lower numbers appear first">
              <input type="number" value={form.sortOrder} onChange={set('sortOrder')} />
            </Field>
          </div>
          <div className="card panel form-stack">
            <Field label="Live URL" error={errors.liveUrl}>
              <input value={form.liveUrl} onChange={set('liveUrl')} placeholder="https://" />
            </Field>
            <Field label="Repository URL" error={errors.repoUrl}>
              <input value={form.repoUrl} onChange={set('repoUrl')} placeholder="https://github.com/…" />
            </Field>
          </div>
          <div className="card panel">
            <span className="field-label mono">Cover image</span>
            <ImageUpload value={form.imageUrl} onChange={set('imageUrl')} />
          </div>
        </div>
      </div>
    </form>
  );
}
