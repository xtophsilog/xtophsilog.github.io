import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader, useToast } from './ui.jsx';

const BLANK = { name: '', category: '', level: 70, sortOrder: 0 };

/** Inline-editable table: every row saves independently. */
export default function SkillsAdmin() {
  const [skills, setSkills] = useState(null);
  const [draft, setDraft] = useState(BLANK);
  const toast = useToast();

  useEffect(() => {
    api.get('/skills').then(setSkills);
  }, []);

  if (!skills) return <p className="dim">Loading…</p>;

  const categories = [...new Set(skills.map((s) => s.category))];

  const edit = (id, k, v) => setSkills((list) => list.map((s) => (s.id === id ? { ...s, [k]: v, dirty: true } : s)));

  const save = async (s) => {
    try {
      const { id, dirty, ...body } = s;
      const saved = await api.put(`/skills/${id}`, { ...body, level: Number(body.level), sortOrder: Number(body.sortOrder) });
      setSkills((list) => list.map((x) => (x.id === id ? saved : x)));
      toast(`Saved ${saved.name}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    await api.del(`/skills/${s.id}`);
    setSkills((list) => list.filter((x) => x.id !== s.id));
  };

  const add = async (e) => {
    e.preventDefault();
    try {
      const created = await api.post('/skills', { ...draft, category: draft.category || 'General', level: Number(draft.level), sortOrder: Number(draft.sortOrder) });
      setSkills((list) => [...list, created]);
      setDraft({ ...BLANK, category: draft.category });
      toast('Skill added');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader title="Skills" subtitle="Grouped by category on the public site." />
      <datalist id="skill-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>

      <form className="card panel inline-form" onSubmit={add}>
        <input placeholder="Skill name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
        <input placeholder="Category" list="skill-categories" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        <label className="range-field">
          <input type="range" min={0} max={100} value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })} />
          <span className="mono">{draft.level}%</span>
        </label>
        <button className="btn btn-primary btn-sm">+ Add skill</button>
      </form>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Category</th><th>Level</th><th>Order</th><th /></tr>
          </thead>
          <tbody>
            {skills.map((s) => (
              <tr key={s.id}>
                <td><input className="cell-input" value={s.name} onChange={(e) => edit(s.id, 'name', e.target.value)} /></td>
                <td><input className="cell-input" list="skill-categories" value={s.category} onChange={(e) => edit(s.id, 'category', e.target.value)} /></td>
                <td>
                  <label className="range-field">
                    <input type="range" min={0} max={100} value={s.level} onChange={(e) => edit(s.id, 'level', e.target.value)} />
                    <span className="mono">{s.level}%</span>
                  </label>
                </td>
                <td><input className="cell-input narrow" type="number" value={s.sortOrder} onChange={(e) => edit(s.id, 'sortOrder', e.target.value)} /></td>
                <td className="row-actions">
                  <button className="btn btn-primary btn-sm" disabled={!s.dirty} onClick={() => save(s)}>Save</button>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => remove(s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
