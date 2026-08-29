'use client';

import { useState } from 'react';
import type { Dictionary } from '@/lib/i18n';

export default function AdminSignIn({ d }: { d: Dictionary }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="shell flex min-h-[70svh] items-center justify-center py-32">
      <form onSubmit={submit} className="w-full max-w-sm border border-stone bg-paper p-9">
        <p className="eyebrow">Casa Piazzola</p>
        <h1 className="mt-4 font-display text-[2rem] font-light text-charcoal">{d.admin.title}</h1>

        <label className="field-label mt-9" htmlFor="admin-password">
          {d.admin.password}
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          required
        />

        {error && <p className="mt-4 text-[0.88rem] text-lake-deep">{d.admin.wrongPassword}</p>}

        <button type="submit" disabled={busy} className="btn-solid mt-8 w-full">
          {busy ? d.common.loading : d.admin.signIn}
        </button>
      </form>
    </div>
  );
}
