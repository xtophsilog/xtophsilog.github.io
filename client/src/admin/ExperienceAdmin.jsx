import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatMonth } from '../components/Sections.jsx';
import { Field, ListInput, PageHeader, fieldErrors, useToast } from './ui.jsx';

const BLANK = { role: '', company: '', location: '', startDate: '', endDate: '', description: '', highlights: [], sortOrder: 0 };

export default function ExperienceAdmin() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // item being edited, or BLANK for new
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const load = () => api.get('/experience').then(setItems);
  useEffect(() => { load(); }, []);

  const set = (k) => (v) => setEditing((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const save = async (e) => {
    e.preventDefault();
    const { id, ...body } = editing;
    body.highlights = body.highlights.filter((h) => h.trim());
    body.sortOrder = Number(body.sortOrder) || 0;
    try {
      if (id) await api.put(`/experience/${id}`, body);
      else await api.post('/experience', body);
      toast('Experience saved');
      setEditing(null);
      setErrors({});
      load();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(err.message, 'error');
    }
  };

  const remove = async (item) => {
    if (!confirm(`Delete ${item.role} at ${item.company}?`)) return;
    await api.del(`/experience/${item.id}`);
    load();
  };

  if (!items) return <p className="dim">Loading…</p>;

  return (
    <>
      <PageHeader title="Experience" subtitle="Your work history timeline.">
        <button className="btn btn-primary btn-sm" onClick={() => { setEditing(BLANK); setErrors({}); }}>+ Add role</button>
      </PageHeader>

      {editing && (
        <form className="card panel form-stack" onSubmit={save}>
          <h2>{editing.id ? 'Edit role' : 'New role'}</h2>
          <div className="field-row">
            <Field label="Role" error={errors.role}><input value={editing.role} onChange={set('role')} required /></Field>
            <Field label="Company" error={errors.company}><input value={editing.company} onChange={set('company')} required /></Field>
          </div>
          <div className="field-row three">
            <Field label="Location"><input value={editing.location || ''} onChange={set('location')} /></Field>
            <Field label="Start" error={errors.startDate}><input type="month" value={editing.startDate} onChange={set('startDate')} required /></Field>
            <Field label="End" error={errors.endDate} hint="Leave empty if current"><input type="month" value={editing.endDate || ''} onChange={set('endDate')} /></Field>
          </div>
          <Field label="Description"><textarea rows={3} value={editing.description} onChange={set('description')} /></Field>
          <div className="field">
            <span className="field-label mono">Highlights</span>
            <ListInput value={editing.highlights} onChange={set('highlights')} placeholder="An achievement, with impact" />
          </div>
          <Field label="Sort order" hint="Lower numbers appear first"><input type="number" value={editing.sortOrder} onChange={set('sortOrder')} /></Field>
          <div className="page-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary btn-sm">Save</button>
          </div>
        </form>
      )}

      <div className="stack">
        {items.map((item) => (
          <div key={item.id} className="card panel exp-row">
            <div>
              <strong>{item.role}</strong> <span className="accent">@ {item.company}</span>
              <div className="mono dim small">{formatMonth(item.startDate)} — {formatMonth(item.endDate)} · {item.highlights.length} highlights</div>
            </div>
            <div className="row-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing({ ...item, location: item.location || '', endDate: item.endDate || '' }); setErrors({}); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
              <button className="btn btn-ghost btn-sm danger" onClick={() => remove(item)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
