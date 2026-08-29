'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Calendar from './Calendar';
import { formatMoney } from '@/lib/pricing';
import { formatDate, toUTCDate } from '@/lib/dates';
import { fill, type Dictionary } from '@/lib/i18n';
import type { Quote } from '@/lib/pricing';
import type { CalendarData } from '@/lib/availability';

type Step = 'dates' | 'details';

/**
 * The booking flow.
 *
 * Step 1  dates and guests → the server prices the stay (never the client)
 * Step 2  guest details    → the server re-prices, creates the booking as
 *                            PENDING and hands back a Stripe Checkout URL
 * Stripe  card entry on Stripe's own domain
 * Webhook marks the booking CONFIRMED and sends the emails
 *
 * The quote shown here is advisory. The amount actually charged is recalculated
 * server-side at checkout, so editing anything in the browser changes nothing.
 */
export default function BookingWidget({
  locale,
  d,
  initial,
}: {
  locale: string;
  d: Dictionary;
  initial: CalendarData;
}) {
  const [data, setData] = useState<CalendarData>(initial);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuests] = useState(Math.min(2, initial.maxGuests));
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('dates');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    message: '',
    terms: false,
  });

  const unavailable = useMemo(() => new Set(data.unavailable), [data.unavailable]);

  // Keep availability fresh: once on mount (in case this HTML came off a CDN)
  // and then every 90 seconds, because someone else may book while the page
  // is open. The server re-checks at checkout regardless — this is only so the
  // calendar does not show nights that have just gone.
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      fetch('/api/availability')
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => alive && json && setData(json))
        .catch(() => {});

    refresh();
    const id = setInterval(refresh, 90_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const errorMessage = useCallback(
    (code: string): string => {
      switch (code) {
        case 'MIN_NIGHTS':
          return fill(d.booking.minNights, { n: data.minNights });
        case 'MAX_NIGHTS':
          return fill(d.booking.maxNights, { n: data.maxNights });
        case 'GUESTS':
          return fill(d.booking.tooManyGuests, { n: data.maxGuests });
        case 'UNAVAILABLE':
          return d.booking.unavailableRange;
        case 'PAST':
          return d.booking.pastDate;
        default:
          return d.booking.errorGeneric;
      }
    },
    [d, data],
  );

  // Price the stay whenever a complete range exists.
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setQuote(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    setError(null);

    fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkIn, checkOut, guests }),
    })
      .then(async (r) => ({ ok: r.ok, json: await r.json() }))
      .then(({ ok, json }) => {
        if (cancelled) return;
        if (ok && json.quote) {
          setQuote(json.quote);
        } else {
          setQuote(null);
          setError(errorMessage(json.error ?? ''));
        }
      })
      .catch(() => !cancelled && setError(d.booking.errorGeneric))
      .finally(() => !cancelled && setQuoting(false));

    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut, guests, d, errorMessage]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!quote || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn,
          checkOut,
          guests,
          locale,
          guestName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          guestEmail: form.email.trim(),
          guestPhone: form.phone.trim() || null,
          country: form.country.trim() || null,
          message: form.message.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        window.location.href = json.url;
        return;
      }
      setError(json.error ? errorMessage(json.error) : d.booking.errorGeneric);
    } catch {
      setError(d.booking.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  const nightsLabel = quote
    ? `${quote.nights} ${quote.nights === 1 ? d.booking.night : d.booking.nights}`
    : null;

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <Steps step={step} d={d} confirmed={false} />

        {step === 'dates' ? (
          <div className="mt-10">
            <Calendar
              locale={locale}
              d={d}
              unavailable={unavailable}
              rates={data.rates}
              firstBookable={data.firstBookable}
              lastBookable={data.to}
              minNights={data.minNights}
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={(ci, co) => {
                setCheckIn(ci);
                setCheckOut(co);
              }}
            />
          </div>
        ) : (
          <form id="guest-details" onSubmit={submit} className="mt-10">
            <h3 className="font-display text-[1.75rem] font-light text-charcoal">
              {d.booking.detailsTitle}
            </h3>
            <p className="mt-2 text-[0.92rem] text-muted">{d.booking.detailsLede}</p>

            <div className="mt-9 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              <Field
                label={d.booking.firstName}
                value={form.firstName}
                onChange={(v) => setForm({ ...form, firstName: v })}
                autoComplete="given-name"
                required
              />
              <Field
                label={d.booking.lastName}
                value={form.lastName}
                onChange={(v) => setForm({ ...form, lastName: v })}
                autoComplete="family-name"
                required
              />
              <div className="sm:col-span-2">
                <Field
                  label={d.booking.email}
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  autoComplete="email"
                  required
                  hint={d.booking.emailNote}
                />
              </div>
              <Field
                label={d.booking.phoneOptional}
                type="tel"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                autoComplete="tel"
              />
              <Field
                label={d.booking.country}
                value={form.country}
                onChange={(v) => setForm({ ...form, country: v })}
                autoComplete="country-name"
              />
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="booking-message">
                  {d.booking.messageLabel}
                </label>
                <textarea
                  id="booking-message"
                  rows={3}
                  value={form.message}
                  placeholder={d.booking.messagePlaceholder}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="field resize-none"
                />
              </div>
            </div>

            <label className="mt-9 flex cursor-pointer items-start gap-3 text-[0.88rem] leading-relaxed text-ink/85">
              <input
                type="checkbox"
                required
                checked={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                className="mt-1 h-4 w-4 shrink-0 border-sand text-charcoal accent-charcoal"
              />
              {d.booking.terms}
            </label>

            <button
              type="button"
              onClick={() => setStep('dates')}
              className="mt-8 link-rule font-sans text-[0.7rem] uppercase tracking-[0.18em] text-muted"
            >
              ← {d.booking.backToDates}
            </button>
          </form>
        )}
      </div>

      {/* Summary — sticky on desktop so the price is always in view. */}
      <aside className="lg:col-span-5">
        <div className="border border-stone bg-paper p-7 lg:sticky lg:top-28 lg:p-9">
          <h3 className="eyebrow">{d.booking.summaryTitle}</h3>

          <dl className="mt-6 space-y-4">
            <div className="flex items-baseline justify-between gap-4 border-b border-stone pb-4">
              <dt className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-muted">
                {d.booking.checkIn}
              </dt>
              <dd className="font-display text-[1.15rem] text-charcoal">
                {checkIn ? formatDate(toUTCDate(checkIn), locale) : '—'}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-stone pb-4">
              <dt className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-muted">
                {d.booking.checkOut}
              </dt>
              <dd className="font-display text-[1.15rem] text-charcoal">
                {checkOut ? formatDate(toUTCDate(checkOut), locale) : '—'}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <label className="field-label" htmlFor="guest-count">
              {d.booking.guests}
            </label>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                disabled={guests <= 1}
                aria-label="−"
                className="flex h-11 w-11 items-center justify-center border border-stone text-lg text-charcoal transition-colors hover:border-charcoal disabled:opacity-25"
              >
                −
              </button>
              <output
                id="guest-count"
                className="min-w-[3ch] text-center font-display text-[1.4rem] text-charcoal"
              >
                {guests}
              </output>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(data.maxGuests, g + 1))}
                disabled={guests >= data.maxGuests}
                aria-label="+"
                className="flex h-11 w-11 items-center justify-center border border-stone text-lg text-charcoal transition-colors hover:border-charcoal disabled:opacity-25"
              >
                +
              </button>
              <span className="text-[0.8rem] text-muted">
                {fill(d.booking.tooManyGuests, { n: data.maxGuests })}
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-stone pt-7">
            {quoting && <p className="text-[0.9rem] text-muted">{d.common.loading}</p>}

            {!quoting && !quote && !error && (
              <p className="text-[0.9rem] leading-relaxed text-muted">{d.booking.lede}</p>
            )}

            {error && <p className="text-[0.9rem] leading-relaxed text-lake-deep">{error}</p>}

            {quote && !quoting && (
              <dl className="space-y-3.5 text-[0.93rem]">
                <Row
                  label={`${nightsLabel} · ${formatMoney(quote.averageNightly, locale)} ${d.booking.perNight}`}
                  value={formatMoney(quote.accommodationGross, locale)}
                />
                {quote.discount > 0 && (
                  <Row
                    label={`${d.booking.discount} (${quote.discountLabel})`}
                    value={`− ${formatMoney(quote.discount, locale)}`}
                    accent
                  />
                )}
                <Row label={d.booking.cleaningFee} value={formatMoney(quote.cleaningFee, locale)} />
                <Row
                  label={d.booking.touristTax}
                  value={formatMoney(quote.touristTax, locale)}
                  hint={d.booking.touristTaxNote}
                />

                <div className="flex items-baseline justify-between gap-4 border-t border-charcoal/25 pt-5">
                  <dt className="font-sans text-[0.66rem] uppercase tracking-[0.2em] text-charcoal">
                    {d.booking.total}
                  </dt>
                  <dd className="font-display text-[2rem] leading-none text-charcoal">
                    {formatMoney(quote.total, locale)}
                  </dd>
                </div>
                <p className="pt-1 text-[0.72rem] text-muted">{d.booking.totalNote}</p>
              </dl>
            )}
          </div>

          {step === 'dates' ? (
            <button
              type="button"
              disabled={!quote || quoting}
              onClick={() => setStep('details')}
              className="btn-solid mt-8 w-full"
            >
              {d.booking.reserve}
            </button>
          ) : (
            <>
              <button
                type="submit"
                form="guest-details"
                disabled={submitting || !quote}
                className="btn-solid mt-8 w-full"
              >
                {submitting ? d.booking.processing : d.booking.continueToPayment}
              </button>
              <p className="mt-4 flex items-start gap-2.5 text-[0.72rem] leading-relaxed text-muted">
                <LockIcon />
                {d.booking.payingWith}
              </p>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-muted">{d.booking.holdNote}</p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className={`text-ink/85 ${accent ? 'text-olive-deep' : ''}`}>
        {label}
        {hint && <span className="mt-0.5 block text-[0.7rem] leading-snug text-muted">{hint}</span>}
      </dt>
      <dd className={`shrink-0 tabular-nums ${accent ? 'text-olive-deep' : 'text-charcoal'}`}>
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  const id = `f-${label.replace(/\W+/g, '-').toLowerCase()}`;
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
      {hint && <p className="mt-2 text-[0.72rem] text-muted">{hint}</p>}
    </div>
  );
}

function Steps({ step, d, confirmed }: { step: Step; d: Dictionary; confirmed: boolean }) {
  const items = [
    { key: 'dates', label: d.booking.stepDates },
    { key: 'details', label: d.booking.stepDetails },
    { key: 'payment', label: d.booking.stepPayment },
    { key: 'confirmed', label: d.booking.stepConfirmed },
  ];
  const activeIndex = confirmed ? 3 : step === 'dates' ? 0 : 1;

  return (
    <ol className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {items.map((s, i) => (
        <li key={s.key} className="flex items-center gap-6">
          <span
            className={`font-sans text-[0.62rem] uppercase tracking-[0.2em] ${
              i === activeIndex ? 'text-charcoal' : i < activeIndex ? 'text-olive-deep' : 'text-sand'
            }`}
          >
            {String(i + 1).padStart(2, '0')} {s.label}
          </span>
          {i < items.length - 1 && <span aria-hidden className="block h-px w-6 bg-stone" />}
        </li>
      ))}
    </ol>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" className="mt-0.5 shrink-0" aria-hidden="true">
      <rect x="0.5" y="5.5" width="11" height="8" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M3 5.5V3.5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="0.8" fill="none" />
    </svg>
  );
}
