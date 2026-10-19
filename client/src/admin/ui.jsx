import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { api } from '../api.js';

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`field ${error ? 'has-error' : ''} ${className}`}>
      <span className="field-label mono">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="dim">{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}

/** Chip-style input for string arrays (tech stack, highlights…). */
export function TagInput({ value = [], onChange, placeholder = 'Type and press Enter' }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };
  return (
    <div className="tag-input">
      {value.map((t) => (
        <span key={t} className="tag">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>×</button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
          if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
      />
    </div>
  );
}

/** Editable list of longer strings, one per row. */
export function ListInput({ value = [], onChange, placeholder }) {
  const update = (i, v) => onChange(value.map((x, j) => (j === i ? v : x)));
  return (
    <div className="list-input">
      {value.map((item, i) => (
        <div key={i} className="list-input-row">
          <input value={item} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} />
          <button type="button" className="icon-btn" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...value, ''])}>+ Add</button>
    </div>
  );
}

export function ImageUpload({ value, onChange }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const { url } = await api.upload(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };
  return (
    <div className="image-upload">
      {value ? <img src={value} alt="" /> : <div className="image-empty mono dim">no image</div>}
      <div className="image-upload-actions">
        <input ref={ref} type="file" accept="image/*" hidden onChange={onFile} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => ref.current.click()} disabled={busy}>
          {busy ? 'Uploading…' : 'Upload image'}
        </button>
        {value && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>Remove</button>}
        <input className="url-input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image URL" />
        {error && <span className="field-error">{error}</span>}
      </div>
    </div>
  );
}

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((text, type = 'ok') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast toast-${t.type}`}>{t.text}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** Map API validation details ({field: [msg]}) to {field: msg}. */
export const fieldErrors = (err) =>
  Object.fromEntries(Object.entries(err?.details || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
