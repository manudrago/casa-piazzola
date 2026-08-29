'use client';

import { useState } from 'react';
import type { Dictionary } from '@/lib/i18n';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/**
 * The guest → host message form.
 *
 * The same endpoint serves pre-booking enquiries, arrival questions and
 * questions during a stay; the subject and optional booking reference are what
 * tell the host which is which. Threads are keyed by email server-side, so a
 * guest who writes twice does not create two conversations.
 */
export default function ContactForm({
  d,
  locale,
  defaultReference = '',
  defaultSubject = 'general',
}: {
  d: Dictionary;
  locale: string;
  defaultReference?: string;
  defaultSubject?: keyof Dictionary['contact']['subjects'];
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: defaultSubject as string,
    body: '',
    reference: defaultReference,
    // Honeypot: a field no human sees. Bots fill it, and we drop those quietly.
    website: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          subject: d.contact.subjects[form.subject as keyof typeof d.contact.subjects] ?? form.subject,
          locale,
        }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-stone bg-paper p-9">
        <h3 className="font-display text-[1.9rem] font-light text-charcoal">{d.contact.sent}</h3>
        <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-ink/85">
          {d.contact.sentBody}
        </p>
        <button
          type="button"
          onClick={() => {
            setForm({ ...form, body: '', subject: 'general' });
            setStatus('idle');
          }}
          className="btn-ghost mt-8"
        >
          {d.contact.another}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
      <Input
        label={d.contact.name}
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        autoComplete="name"
        required
      />
      <Input
        label={d.contact.email}
        type="email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        autoComplete="email"
        required
      />
      <Input
        label={d.contact.phone}
        type="tel"
        value={form.phone}
        onChange={(v) => setForm({ ...form, phone: v })}
        autoComplete="tel"
      />
      <Input
        label={d.contact.reference}
        value={form.reference}
        onChange={(v) => setForm({ ...form, reference: v })}
      />

      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="contact-subject">
          {d.contact.subject}
        </label>
        <select
          id="contact-subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="field appearance-none rounded-none bg-[right_0.2rem_center] bg-no-repeat pr-8"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236E675C' fill='none'/%3E%3C/svg%3E\")",
          }}
        >
          {Object.entries(d.contact.subjects).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="contact-body">
          {d.contact.message}
        </label>
        <textarea
          id="contact-body"
          rows={5}
          required
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="field resize-none"
        />
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </div>

      <div className="sm:col-span-2">
        <button type="submit" disabled={status === 'sending'} className="btn-solid">
          {status === 'sending' ? d.contact.sending : d.contact.send}
        </button>
        {status === 'error' && (
          <p className="mt-4 text-[0.9rem] text-lake-deep">{d.contact.error}</p>
        )}
        <p className="mt-5 text-[0.78rem] text-muted">{d.contact.responseNote}</p>
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const id = `c-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </div>
  );
}
