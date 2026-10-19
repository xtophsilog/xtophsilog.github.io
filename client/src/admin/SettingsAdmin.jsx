import { useState } from 'react';
import { api } from '../api.js';
import { Field, PageHeader, fieldErrors, useToast } from './ui.jsx';

export default function SettingsAdmin() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return setErrors({ confirm: 'Passwords do not match' });
    try {
      await api.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setErrors({});
      toast('Password updated');
    } catch (err) {
      setErrors({ ...fieldErrors(err), currentPassword: err.details ? undefined : err.message });
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Account and security." />
      <form className="card panel form-stack narrow-panel" onSubmit={onSubmit}>
        <h2>Change password</h2>
        <Field label="Current password" error={errors.currentPassword}>
          <input type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" required />
        </Field>
        <Field label="New password" error={errors.newPassword} hint="At least 8 characters">
          <input type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" required minLength={8} />
        </Field>
        <Field label="Confirm new password" error={errors.confirm}>
          <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required />
        </Field>
        <button className="btn btn-primary btn-sm">Update password</button>
      </form>
    </>
  );
}
