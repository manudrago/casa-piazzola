'use client';

import { useMemo, useState } from 'react';
import { fill, type Dictionary } from '@/lib/i18n';
import { formatMoney } from '@/lib/pricing';
import { formatDate, toUTCDate, toISODate, todayUTC, addDays, monthName, daysInMonth, firstWeekdayOffset, weekdayLabels, nightsOf } from '@/lib/dates';
import { BOOKING_STATUS, PAYMENT_STATUS } from '@/lib/constants';

export type AdminBooking = {
  id: string;
  reference: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  country: string | null;
  message: string | null;
  total: number;
  refundedAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export type AdminBlocked = { date: string; reason: string | null };

export type AdminMessage = {
  id: string;
  thread: string;
  author: string;
  name: string | null;
  email: string;
  phone: string | null;
  subject: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
};

type Tab = 'bookings' | 'calendar' | 'messages';

/**
 * The host's whole world in one page: who is coming, what the calendar looks
 * like, and what needs answering. Deliberately plain — it is a working tool,
 * not a showpiece, and it borrows the site's type and palette so it does not
 * feel bolted on.
 */
export default function AdminDashboard({
  d,
  locale,
  bookings,
  blocked,
  messages,
}: {
  d: Dictionary;
  locale: string;
  bookings: AdminBooking[];
  blocked: AdminBlocked[];
  messages: AdminMessage[];
}) {
  const [tab, setTab] = useState<Tab>('bookings');
  const [busy, setBusy] = useState<string | null>(null);

  const today = toISODate(todayUTC());
  const confirmed = bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED);
  const upcoming = confirmed.filter((b) => b.checkOut >= today);
  const past = confirmed.filter((b) => b.checkOut < today).reverse();

  const stats = useMemo(() => {
    const year = today.slice(0, 4);
    const thisYear = confirmed.filter((b) => b.checkIn.startsWith(year));
    return {
      revenue: thisYear.reduce((s, b) => s + b.total - b.refundedAmount, 0),
      nights: thisYear.reduce((s, b) => s + b.nights, 0),
      next: upcoming[0] ?? null,
      unread: messages.filter((m) => m.author === 'GUEST' && !m.readAt).length,
    };
  }, [confirmed, upcoming, messages, today]);

  async function call(path: string, body: unknown) {
    setBusy(path);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) window.location.reload();
      else alert('That did not work. Check the server logs.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="pb-32" style={{ paddingTop: 'calc(var(--header-h) + 3rem)' }}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Casa Piazzola</p>
            <h1 className="mt-3 text-display-sm font-light">{d.admin.title}</h1>
          </div>
          <button
            type="button"
            onClick={() => call('/api/admin/session/end', {})}
            className="link-rule font-sans text-[0.7rem] uppercase tracking-[0.18em] text-muted"
          >
            {d.admin.signOut}
          </button>
        </div>

        <dl className="mt-12 grid gap-px border border-stone bg-stone sm:grid-cols-4">
          <Stat label={d.admin.revenue} value={formatMoney(stats.revenue, locale)} hint={today.slice(0, 4)} />
          <Stat label={d.admin.occupancy} value={String(stats.nights)} hint={today.slice(0, 4)} />
          <Stat
            label={d.admin.nextArrival}
            value={stats.next ? formatDate(toUTCDate(stats.next.checkIn), locale) : '—'}
            hint={stats.next?.guestName}
          />
          <Stat label={d.admin.tabs.messages} value={String(stats.unread)} hint={d.admin.unread} />
        </dl>

        <div role="tablist" className="mt-14 flex gap-8 border-b border-stone">
          {(['bookings', 'calendar', 'messages'] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b pb-3 font-sans text-[0.7rem] uppercase tracking-[0.2em] transition-colors ${
                tab === t ? 'border-charcoal text-charcoal' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {d.admin.tabs[t]}
            </button>
          ))}
        </div>

        <div className="mt-12">
          {tab === 'bookings' && (
            <Bookings
              d={d}
              locale={locale}
              upcoming={upcoming}
              past={past}
              busy={busy}
              onCancel={(id) =>
                confirm(d.admin.confirmCancel) && call('/api/admin/bookings/cancel', { id })
              }
              onRefund={(b) =>
                confirm(
                  fill(d.admin.confirmRefund, {
                    amount: formatMoney(b.total - b.refundedAmount, locale),
                  }),
                ) && call('/api/admin/bookings/refund', { id: b.id })
              }
            />
          )}

          {tab === 'calendar' && (
            <CalendarAdmin
              d={d}
              locale={locale}
              bookings={confirmed}
              blocked={blocked}
              busy={busy}
              onBlock={(from, to, reason) => call('/api/admin/block', { from, to, reason })}
              onUnblock={(date) => call('/api/admin/block', { from: date, to: date, unblock: true })}
            />
          )}

          {tab === 'messages' && (
            <Messages
              d={d}
              locale={locale}
              messages={messages}
              busy={busy}
              onReply={(email, body) => call('/api/admin/messages/reply', { email, body })}
              onMarkRead={(id) => call('/api/admin/messages/read', { id })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string | null }) {
  return (
    <div className="bg-ivory p-6">
      <dt className="font-sans text-[0.58rem] uppercase tracking-[0.2em] text-muted">{label}</dt>
      <dd className="mt-2 font-display text-[1.7rem] leading-none text-charcoal">{value}</dd>
      {hint && <p className="mt-2 text-[0.72rem] text-muted">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Bookings({
  d,
  locale,
  upcoming,
  past,
  busy,
  onCancel,
  onRefund,
}: {
  d: Dictionary;
  locale: string;
  upcoming: AdminBooking[];
  past: AdminBooking[];
  busy: string | null;
  onCancel: (id: string) => void;
  onRefund: (b: AdminBooking) => void;
}) {
  return (
    <div className="space-y-16">
      <section>
        <h2 className="eyebrow">{d.admin.upcoming}</h2>
        {upcoming.length === 0 ? (
          <p className="mt-6 text-[0.95rem] text-muted">{d.admin.noBookings}</p>
        ) : (
          <ul className="mt-6 space-y-px bg-stone">
            {upcoming.map((b) => (
              <BookingRow
                key={b.id}
                b={b}
                d={d}
                locale={locale}
                busy={busy}
                onCancel={onCancel}
                onRefund={onRefund}
              />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="eyebrow">{d.admin.past}</h2>
          <ul className="mt-6 space-y-px bg-stone">
            {past.slice(0, 30).map((b) => (
              <BookingRow key={b.id} b={b} d={d} locale={locale} busy={busy} past />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function BookingRow({
  b,
  d,
  locale,
  busy,
  past,
  onCancel,
  onRefund,
}: {
  b: AdminBooking;
  d: Dictionary;
  locale: string;
  busy: string | null;
  past?: boolean;
  onCancel?: (id: string) => void;
  onRefund?: (b: AdminBooking) => void;
}) {
  const [open, setOpen] = useState(false);
  const refundable = b.paymentStatus === PAYMENT_STATUS.PAID && b.refundedAmount < b.total;

  return (
    <li className="bg-ivory">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid w-full grid-cols-2 items-center gap-4 p-5 text-left transition-colors hover:bg-paper sm:grid-cols-12"
      >
        <span className="font-sans text-[0.72rem] uppercase tracking-[0.14em] text-muted sm:col-span-2">
          {b.reference}
        </span>
        <span className="font-display text-[1.15rem] text-charcoal sm:col-span-3">
          {b.guestName}
        </span>
        <span className="col-span-2 text-[0.88rem] text-ink/85 sm:col-span-3">
          {formatDate(toUTCDate(b.checkIn), locale)} → {formatDate(toUTCDate(b.checkOut), locale)}
        </span>
        <span className="text-[0.85rem] text-muted sm:col-span-1">
          {b.nights}n · {b.guests}p
        </span>
        <span className="text-right font-display text-[1.15rem] text-charcoal sm:col-span-2">
          {formatMoney(b.total, locale)}
        </span>
        <span className="text-right sm:col-span-1">
          <StatusPill status={b.paymentStatus} bookingStatus={b.status} />
        </span>
      </button>

      {open && (
        <div className="border-t border-stone bg-paper p-6">
          <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-3">
            <Detail label={d.common.email} value={b.guestEmail} href={`mailto:${b.guestEmail}`} />
            {b.guestPhone && <Detail label="Phone" value={b.guestPhone} href={`tel:${b.guestPhone}`} />}
            {b.country && <Detail label={d.booking.country} value={b.country} />}
            <Detail label={d.admin.status} value={b.status} />
            <Detail label={d.admin.payment} value={b.paymentStatus} />
            {b.refundedAmount > 0 && (
              <Detail label={d.admin.refund} value={formatMoney(b.refundedAmount, locale)} />
            )}
          </dl>

          {b.message && (
            <div className="mt-6 border-l-2 border-olive/50 pl-4">
              <p className="text-[0.92rem] leading-relaxed text-ink/85">{b.message}</p>
            </div>
          )}

          {!past && (
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={`mailto:${b.guestEmail}`} className="btn-ghost !px-6 !py-2.5 !text-[0.68rem]">
                {d.admin.messageGuest}
              </a>
              {refundable && onRefund && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => onRefund(b)}
                  className="btn-ghost !px-6 !py-2.5 !text-[0.68rem]"
                >
                  {d.admin.refundFull}
                </button>
              )}
              {b.status === BOOKING_STATUS.CONFIRMED && onCancel && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => onCancel(b.id)}
                  className="btn-ghost !px-6 !py-2.5 !text-[0.68rem]"
                >
                  {d.admin.cancel}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="font-sans text-[0.58rem] uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className="mt-1 text-[0.95rem] text-charcoal">
        {href ? (
          <a href={href} className="link-rule break-all">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function StatusPill({ status, bookingStatus }: { status: string; bookingStatus: string }) {
  const cancelled = bookingStatus === BOOKING_STATUS.CANCELLED;
  const tone = cancelled
    ? 'text-muted'
    : status === PAYMENT_STATUS.PAID
      ? 'text-olive-deep'
      : status.includes('REFUND')
        ? 'text-lake-deep'
        : 'text-sand';
  return (
    <span className={`font-sans text-[0.58rem] uppercase tracking-[0.14em] ${tone}`}>
      {cancelled ? bookingStatus : status}
    </span>
  );
}

/* ------------------------------------------------------------------ */

function CalendarAdmin({
  d,
  locale,
  bookings,
  blocked,
  busy,
  onBlock,
  onUnblock,
}: {
  d: Dictionary;
  locale: string;
  bookings: AdminBooking[];
  blocked: AdminBlocked[];
  busy: string | null;
  onBlock: (from: string, to: string, reason: string) => void;
  onUnblock: (date: string) => void;
}) {
  const today = todayUTC();
  const [cursor, setCursor] = useState({ year: today.getUTCFullYear(), month: today.getUTCMonth() });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');

  const bookedNights = useMemo(() => {
    const map = new Map<string, AdminBooking>();
    for (const b of bookings) {
      for (const n of nightsOf(toUTCDate(b.checkIn), toUTCDate(b.checkOut))) {
        map.set(toISODate(n), b);
      }
    }
    return map;
  }, [bookings]);

  const blockedSet = useMemo(() => new Map(blocked.map((b) => [b.date, b.reason])), [blocked]);
  const wk = weekdayLabels(locale);

  return (
    <div className="grid gap-14 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="mb-7 flex items-center gap-5">
          <button
            type="button"
            onClick={() =>
              setCursor(({ year, month }) => {
                const m = month - 1;
                return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
              })
            }
            className="flex h-9 w-9 items-center justify-center border border-stone hover:border-charcoal"
            aria-label={d.booking.monthPrev}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() =>
              setCursor(({ year, month }) => {
                const m = month + 1;
                return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
              })
            }
            className="flex h-9 w-9 items-center justify-center border border-stone hover:border-charcoal"
            aria-label={d.booking.monthNext}
          >
            ›
          </button>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          {[0, 1].map((offset) => {
            const m = cursor.month + offset;
            const year = cursor.year + Math.floor(m / 12);
            const month = ((m % 12) + 12) % 12;
            const pad = firstWeekdayOffset(year, month);

            return (
              <div key={`${year}-${month}`}>
                <h3 className="mb-4 font-display text-[1.25rem] font-light">
                  {monthName(month, locale)} <span className="text-muted">{year}</span>
                </h3>
                <div className="mb-1 grid grid-cols-7 gap-1">
                  {wk.map((w) => (
                    <div key={w} className="text-center text-[0.55rem] uppercase tracking-[0.12em] text-muted">
                      {w}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: pad }, (_, i) => (
                    <div key={`p${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth(year, month) }, (_, i) => {
                    const iso = toISODate(new Date(Date.UTC(year, month, i + 1)));
                    const booking = bookedNights.get(iso);
                    const isBlocked = blockedSet.has(iso);
                    return (
                      <button
                        key={iso}
                        type="button"
                        title={
                          booking
                            ? `${booking.reference} · ${booking.guestName}`
                            : isBlocked
                              ? blockedSet.get(iso) ?? d.admin.blocked
                              : d.admin.free
                        }
                        onClick={() => (isBlocked ? onUnblock(iso) : setFrom(iso))}
                        disabled={busy !== null || Boolean(booking)}
                        className={`flex aspect-square items-center justify-center text-[0.78rem] transition-colors ${
                          booking
                            ? 'bg-olive-deep text-ivory'
                            : isBlocked
                              ? 'bg-sand/60 text-charcoal line-through'
                              : 'text-ink hover:bg-stone/60'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-x-7 gap-y-2 border-t border-stone pt-5 text-[0.62rem] uppercase tracking-[0.14em] text-muted">
          <span className="flex items-center gap-2">
            <span className="block h-3 w-3 bg-olive-deep" />
            {d.admin.booked}
          </span>
          <span className="flex items-center gap-2">
            <span className="block h-3 w-3 bg-sand/60" />
            {d.admin.blocked}
          </span>
          <span className="normal-case tracking-normal">
            Click a booked day to see the guest; click a blocked day to release it.
          </span>
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="border border-stone bg-paper p-7">
          <h3 className="eyebrow">{d.admin.blockDates}</h3>
          <div className="mt-6 space-y-5">
            <div>
              <label className="field-label" htmlFor="block-from">
                {d.admin.blockFrom}
              </label>
              <input
                id="block-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="block-to">
                {d.admin.blockTo}
              </label>
              <input
                id="block-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="block-reason">
                {d.admin.blockReason}
              </label>
              <input
                id="block-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="field"
              />
            </div>
            <button
              type="button"
              disabled={!from || busy !== null}
              onClick={() => onBlock(from, to || from, reason)}
              className="btn-solid w-full"
            >
              {d.admin.block}
            </button>
          </div>

          {blocked.length > 0 && (
            <ul className="mt-9 space-y-2 border-t border-stone pt-6">
              {blocked.slice(0, 20).map((b) => (
                <li key={b.date} className="flex items-center justify-between gap-4 text-[0.85rem]">
                  <span className="text-charcoal">
                    {formatDate(toUTCDate(b.date), locale)}
                    {b.reason && <span className="ml-2 text-muted">{b.reason}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUnblock(b.date)}
                    disabled={busy !== null}
                    className="link-rule text-[0.7rem] uppercase tracking-[0.12em] text-muted"
                  >
                    {d.admin.unblock}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Messages({
  d,
  locale,
  messages,
  busy,
  onReply,
  onMarkRead,
}: {
  d: Dictionary;
  locale: string;
  messages: AdminMessage[];
  busy: string | null;
  onReply: (email: string, body: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const threads = useMemo(() => {
    const map = new Map<string, AdminMessage[]>();
    for (const m of [...messages].reverse()) {
      const list = map.get(m.thread) ?? [];
      list.push(m);
      map.set(m.thread, list);
    }
    return [...map.entries()].sort(
      (a, b) =>
        new Date(b[1][b[1].length - 1].createdAt).getTime() -
        new Date(a[1][a[1].length - 1].createdAt).getTime(),
    );
  }, [messages]);

  const [active, setActive] = useState<string | null>(threads[0]?.[0] ?? null);
  const [draft, setDraft] = useState('');

  if (threads.length === 0) {
    return <p className="text-[0.95rem] text-muted">{d.admin.noMessages}</p>;
  }

  const thread = threads.find(([email]) => email === active)?.[1] ?? [];

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <ul className="space-y-px bg-stone lg:col-span-4">
        {threads.map(([email, list]) => {
          const latest = list[list.length - 1];
          const unread = list.some((m) => m.author === 'GUEST' && !m.readAt);
          return (
            <li key={email}>
              <button
                type="button"
                onClick={() => setActive(email)}
                className={`w-full bg-ivory p-5 text-left transition-colors hover:bg-paper ${
                  active === email ? 'bg-paper' : ''
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-[1.1rem] text-charcoal">
                    {latest.name ?? email}
                  </span>
                  {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-olive-deep" />}
                </div>
                <p className="mt-1.5 line-clamp-2 text-[0.85rem] leading-snug text-muted">
                  {latest.body}
                </p>
                <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-muted/70">
                  {formatDate(new Date(latest.createdAt), locale)}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="lg:col-span-8">
        <div className="space-y-5">
          {thread.map((m) => (
            <article
              key={m.id}
              className={`border p-6 ${
                m.author === 'HOST' ? 'border-olive/30 bg-paper ml-0 lg:ml-16' : 'border-stone bg-ivory'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="font-display text-[1.1rem] text-charcoal">
                    {m.author === 'HOST' ? 'Casa Piazzola' : (m.name ?? m.email)}
                  </p>
                  {m.subject && <p className="mt-0.5 text-[0.78rem] text-muted">{m.subject}</p>}
                </div>
                <p className="text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                  {formatDate(new Date(m.createdAt), locale)}
                </p>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink/90">
                {m.body}
              </p>
              {m.author === 'GUEST' && !m.readAt && (
                <button
                  type="button"
                  onClick={() => onMarkRead(m.id)}
                  disabled={busy !== null}
                  className="link-rule mt-4 text-[0.68rem] uppercase tracking-[0.12em] text-muted"
                >
                  {d.admin.markRead}
                </button>
              )}
            </article>
          ))}
        </div>

        {active && (
          <div className="mt-8 border-t border-stone pt-7">
            <label className="field-label" htmlFor="reply">
              {d.admin.reply}
            </label>
            <textarea
              id="reply"
              rows={4}
              value={draft}
              placeholder={d.admin.replyPlaceholder}
              onChange={(e) => setDraft(e.target.value)}
              className="field resize-none"
            />
            <button
              type="button"
              disabled={!draft.trim() || busy !== null}
              onClick={() => onReply(active, draft.trim())}
              className="btn-solid mt-5"
            >
              {d.admin.send}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
