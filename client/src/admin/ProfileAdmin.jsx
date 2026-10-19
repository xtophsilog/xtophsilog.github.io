import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Toggle } from './ProjectsAdmin.jsx';
import { Field, ImageUpload, PageHeader, fieldErrors, useToast } from './ui.jsx';

const SOCIALS = ['github', 'linkedin', 'twitter', 'website'];

export default function ProfileAdmin() {
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/profile').then((p) => setForm({ stats: [], socials: {}, ...p }));
  }, []);

  if (!form) return <p className="dim">Loading…</p>;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const setSocial = (k) => (e) => setForm((f) => ({ ...f, socials: { ...f.socials, [k]: e.target.value } }));
  const setStat = (i, k) => (e) => setForm((f) => ({ ...f, stats: f.stats.map((s, j) => (j === i ? { ...s, [k]: e.target.value } : s)) }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await api.put('/profile', { ...form, stats: form.stats.filter((s) => s.label && s.value) });
      setForm({ stats: [], socials: {}, ...saved });
      setErrors({});
      toast('Profile saved');
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <PageHeader title="Profile" subtitle="Your name, bio and links shown across the site.">
        <button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </PageHeader>
      <div className="editor-grid">
        <div className="card panel form-stack">
          <div className="field-row">
            <Field label="Name" error={errors.name}><input value={form.name} onChange={set('name')} required /></Field>
            <Field label="Title" error={errors.title}><input value={form.title} onChange={set('title')} required /></Field>
          </div>
          <Field label="Tagline" error={errors.tagline}><input value={form.tagline} onChange={set('tagline')} /></Field>
          <Field label="Bio" hint="Separate paragraphs with a blank line"><textarea rows={8} value={form.bio} onChange={set('bio')} /></Field>
          <div className="field-row">
            <Field label="Location"><input value={form.location} onChange={set('location')} /></Field>
            <Field label="Public email" error={errors.email}><input type="email" value={form.email} onChange={set('email')} /></Field>
          </div>
          <Field label="Résumé URL"><input value={form.resumeUrl} onChange={set('resumeUrl')} placeholder="https://…/resume.pdf" /></Field>
          <div className="field">
            <span className="field-label mono">Hero stats</span>
            {form.stats.map((s, i) => (
              <div key={i} className="list-input-row">
                <input placeholder="Value (e.g. 5+)" value={s.value} onChange={setStat(i, 'value')} className="narrow" />
                <input placeholder="Label (e.g. Years experience)" value={s.label} onChange={setStat(i, 'label')} />
                <button type="button" className="icon-btn" aria-label="Remove" onClick={() => set('stats')(form.stats.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {form.stats.length < 6 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('stats')([...form.stats, { label: '', value: '' }])}>+ Add stat</button>
            )}
          </div>
        </div>
        <div className="form-stack">
          <div className="card panel form-stack">
            <div className="toggle-row"><span>Available for work</span><Toggle checked={form.available} onChange={set('available')} label="Available" /></div>
          </div>
          <div className="card panel">
            <span className="field-label mono">Avatar</span>
            <ImageUpload value={form.avatarUrl} onChange={set('avatarUrl')} />
          </div>
          <div className="card panel form-stack">
            {SOCIALS.map((k) => (
              <Field key={k} label={k} error={errors.socials}>
                <input value={form.socials[k] || ''} onChange={setSocial(k)} placeholder="https://" />
              </Field>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
