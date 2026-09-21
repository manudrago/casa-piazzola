'use client';

import { useMemo, useState } from 'react';
import { fill, type Dictionary } from '@/lib/i18n';
import { formatMoney, nightlyRate } from '@/lib/pricing';
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
  couponCode: string | null;
  couponDiscount: number;
  refundedAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export type AdminBlocked = { date: string; reason: string | null };

export type AdminOverride = { date: string; amount: number };

export type AdminTier = { minNights: number; percent: number };

export type AdminCoupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  validFrom: string | null;
  validTo: string | null;
  minNights: number | null;
  maxUses: number | null;
  uses: number;
  active: boolean;
};

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

type Tab = 'bookings' | 'calendar' | 'prices' | 'discounts' | 'messages';

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
  overrides,
  cleaningFee,
  defaultCleaningFee,
  tiers,
  coupons,
}: {
  d: Dictionary;
  locale: string;
  bookings: AdminBooking[];
  blocked: AdminBlocked[];
  messages: AdminMessage[];
  overrides: AdminOverride[];
  cleaningFee: number;
  defaultCleaningFee: number;
  tiers: AdminTier[];
  coupons: AdminCoupon[];
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
          {(['bookings', 'calendar', 'prices', 'discounts', 'messages'] as Tab[]).map((t) => (
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

          {tab === 'prices' && (
            <PricesAdmin
              d={d}
              locale={locale}
              overrides={overrides}
              cleaningFee={cleaningFee}
              defaultCleaningFee={defaultCleaningFee}
              busy={busy}
              onSetPrice={(from, to, amount) => call('/api/admin/rates', { from, to, amount })}
              onReset={(from, to) => call('/api/admin/rates', { from, to, clear: true })}
              onSaveCleaning={(amount) => call('/api/admin/settings', { cleaningFee: amount })}
            />
          )}

          {tab === 'discounts' && (
            <DiscountsAdmin
              d={d}
              locale={locale}
              tiers={tiers}
              coupons={coupons}
              busy={busy}
              onSaveTiers={(next) => call('/api/admin/discounts', { tiers: next })}
              onToggle={(id) => call('/api/admin/coupons', { action: 'toggle', id })}
              onDelete={(c) =>
                confirm(fill(d.admin.confirmDeleteCoupon, { code: c.code })) &&
                call('/api/admin/coupons', { action: 'delete', id: c.id })
              }
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
            {b.couponCode && (
              <Detail
                label={d.booking.coupon}
                value={`${b.couponCode} · − ${formatMoney(b.couponDiscount, locale)}`}
              />
            )}
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

/* ------------------------------------------------------------------ */

/** "120", "120,50", "€ 95.5" → cents. Anything else → null. */
function parseEuros(input: string): number | null {
  const cleaned = input.replace(/[€\s]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}

/**
 * Nightly prices and the cleaning fee. Every day shows what a guest would pay
 * for that night right now: the host's own price where one is set, otherwise
 * the seasonal price from src/lib/pricing.ts. Custom prices are marked, so the
 * host can see at a glance which nights they have touched.
 */
function PricesAdmin({
  d,
  locale,
  overrides,
  cleaningFee,
  defaultCleaningFee,
  busy,
  onSetPrice,
  onReset,
  onSaveCleaning,
}: {
  d: Dictionary;
  locale: string;
  overrides: AdminOverride[];
  cleaningFee: number;
  defaultCleaningFee: number;
  busy: string | null;
  onSetPrice: (from: string, to: string, amount: number) => void;
  onReset: (from: string, to: string) => void;
  onSaveCleaning: (amount: number) => void;
}) {
  const today = todayUTC();
  const todayISO = toISODate(today);
  const [cursor, setCursor] = useState({ year: today.getUTCFullYear(), month: today.getUTCMonth() });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState(String(cleaningFee / 100));
  const [error, setError] = useState<string | null>(null);

  const overrideMap = useMemo(() => new Map(overrides.map((o) => [o.date, o.amount])), [overrides]);
  const wk = weekdayLabels(locale);
  const end = to || from;

  function pick(iso: string) {
    setError(null);
    if (!from || to || iso < from) {
      setFrom(iso);
      setTo('');
    } else {
      setTo(iso);
    }
  }

  function apply() {
    const cents = parseEuros(price);
    if (cents === null || cents <= 0) return setError(d.admin.invalidAmount);
    onSetPrice(from, end, cents);
  }

  function saveFee() {
    const cents = parseEuros(fee);
    if (cents === null) return setError(d.admin.invalidAmount);
    onSaveCleaning(cents);
  }

  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const m = month + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });

  return (
    <div className="grid gap-14 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="mb-7 flex items-center gap-5">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="flex h-9 w-9 items-center justify-center border border-stone hover:border-charcoal"
            aria-label={d.booking.monthPrev}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
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
                    const date = new Date(Date.UTC(year, month, i + 1));
                    const iso = toISODate(date);
                    const past = iso < todayISO;
                    const custom = overrideMap.get(iso);
                    const amount = custom ?? nightlyRate(date);
                    const inRange = from && iso >= from && iso <= end;
                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={past || busy !== null}
                        onClick={() => pick(iso)}
                        title={`${formatDate(date, locale)} · ${formatMoney(amount, locale)} · ${
                          custom != null ? d.admin.customPrice : d.admin.seasonalPrice
                        }`}
                        className={`flex aspect-square flex-col items-center justify-center leading-tight transition-colors ${
                          past
                            ? 'text-muted/50'
                            : inRange
                              ? 'bg-charcoal text-ivory'
                              : custom != null
                                ? 'bg-sand/60 text-charcoal hover:bg-sand'
                                : 'text-ink hover:bg-stone/60'
                        }`}
                      >
                        <span className="text-[0.72rem]">{i + 1}</span>
                        {!past && (
                          <span className={`text-[0.58rem] ${inRange ? 'text-ivory/80' : 'text-muted'}`}>
                            {Math.round(amount / 100)}
                          </span>
                        )}
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
            <span className="block h-3 w-3 border border-stone" />
            {d.admin.seasonalPrice}
          </span>
          <span className="flex items-center gap-2">
            <span className="block h-3 w-3 bg-sand/60" />
            {d.admin.customPrice}
          </span>
          <span className="flex items-center gap-2">
            <span className="block h-3 w-3 bg-charcoal" />
            {d.admin.selected}
          </span>
        </div>
      </div>

      <div className="space-y-8 lg:col-span-4">
        <div className="border border-stone bg-paper p-7">
          <h3 className="eyebrow">{d.admin.setPrice}</h3>
          <p className="mt-4 text-[0.82rem] leading-relaxed text-muted">{d.admin.pricesHint}</p>
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="price-from">
                  {d.admin.blockFrom}
                </label>
                <input
                  id="price-from"
                  type="date"
                  min={todayISO}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="price-to">
                  {d.admin.blockTo}
                </label>
                <input
                  id="price-to"
                  type="date"
                  min={from || todayISO}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="field"
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="price-amount">
                {d.admin.pricePerNight}
              </label>
              <input
                id="price-amount"
                inputMode="decimal"
                placeholder="120"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setError(null);
                }}
                className="field"
              />
            </div>
            {error && <p className="text-[0.82rem] text-lake-deep">{error}</p>}
            <button
              type="button"
              disabled={!from || !price || busy !== null}
              onClick={apply}
              className="btn-solid w-full"
            >
              {d.admin.applyPrice}
            </button>
            <button
              type="button"
              disabled={!from || busy !== null}
              onClick={() => onReset(from, end)}
              className="link-rule w-full text-center text-[0.7rem] uppercase tracking-[0.14em] text-muted"
            >
              {d.admin.resetPrice}
            </button>
          </div>
        </div>

        <div className="border border-stone bg-paper p-7">
          <label className="eyebrow block" htmlFor="cleaning-fee">
            {d.admin.cleaningFeeLabel}
          </label>
          <p className="mt-4 text-[0.82rem] leading-relaxed text-muted">
            {fill(d.admin.cleaningFeeHint, { amount: formatMoney(defaultCleaningFee, locale) })}
          </p>
          <div className="mt-5 flex gap-3">
            <input
              id="cleaning-fee"
              inputMode="decimal"
              value={fee}
              onChange={(e) => {
                setFee(e.target.value);
                setError(null);
              }}
              className="field flex-1"
            />
            <button
              type="button"
              disabled={busy !== null || parseEuros(fee) === cleaningFee}
              onClick={saveFee}
              className="btn-solid shrink-0 !px-6"
            >
              {d.admin.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Long-stay tiers and discount codes. Tiers are edited as a small table and
 * saved together; codes are created one at a time and can be switched off
 * (keeps the history) or deleted.
 */
function DiscountsAdmin({
  d,
  locale,
  tiers,
  coupons,
  busy,
  onSaveTiers,
  onToggle,
  onDelete,
}: {
  d: Dictionary;
  locale: string;
  tiers: AdminTier[];
  coupons: AdminCoupon[];
  busy: string | null;
  onSaveTiers: (tiers: AdminTier[]) => void;
  onToggle: (id: string) => void;
  onDelete: (coupon: AdminCoupon) => void;
}) {
  const [rows, setRows] = useState(tiers.map((t) => ({ n: String(t.minNights), p: String(t.percent) })));
  const [tierError, setTierError] = useState<string | null>(null);

  const empty = { code: '', type: 'PERCENT', value: '', validFrom: '', validTo: '', minNights: '', maxUses: '' };
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function saveTiers() {
    const parsed: AdminTier[] = [];
    for (const r of rows) {
      if (!r.n.trim() && !r.p.trim()) continue;
      const n = Number(r.n);
      const p = Number(r.p.replace(',', '.'));
      if (!Number.isInteger(n) || n < 2 || !Number.isInteger(p) || p < 1 || p > 90) {
        return setTierError(d.admin.invalidAmount);
      }
      parsed.push({ minNights: n, percent: p });
    }
    onSaveTiers(parsed);
  }

  const int = (s: string) => (s.trim() ? Number(s) : null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const value =
      form.type === 'FIXED' ? parseEuros(form.value) : /^\d+$/.test(form.value.trim()) ? Number(form.value) : null;
    if (value === null || value <= 0 || (form.type === 'PERCENT' && value > 100)) {
      return setFormError(d.admin.invalidAmount);
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          code: form.code,
          type: form.type,
          value,
          validFrom: form.validFrom || null,
          validTo: form.validTo || null,
          minNights: int(form.minNights),
          maxUses: int(form.maxUses),
        }),
      });
      if (res.ok) return window.location.reload();
      const json = await res.json().catch(() => ({}));
      setFormError(json.error === 'CODE_TAKEN' ? d.admin.codeTaken : d.admin.invalidAmount);
    } finally {
      setCreating(false);
    }
  }

  const describe = (c: AdminCoupon) =>
    c.type === 'FIXED' ? `− ${formatMoney(c.value, locale)}` : `− ${c.value}%`;
  const dateText = (iso: string | null) => (iso ? formatDate(toUTCDate(iso), locale) : '…');

  return (
    <div className="grid gap-14 lg:grid-cols-12">
      {/* Codes */}
      <div className="lg:col-span-8">
        <h3 className="eyebrow">{d.admin.couponsTitle}</h3>
        <p className="mt-3 max-w-prose text-[0.82rem] leading-relaxed text-muted">{d.admin.couponsHint}</p>

        {coupons.length === 0 ? (
          <p className="mt-8 text-[0.9rem] text-muted">{d.admin.noCoupons}</p>
        ) : (
          <ul className="mt-8 divide-y divide-stone border-y border-stone">
            {coupons.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-8 gap-y-2 py-4">
                <span className={`font-mono text-[0.95rem] tracking-wide ${c.active ? 'text-charcoal' : 'text-muted line-through'}`}>
                  {c.code}
                </span>
                <span className="text-[0.9rem] text-olive-deep">{describe(c)}</span>
                <span className="text-[0.78rem] text-muted">
                  {(c.validFrom || c.validTo) && `${dateText(c.validFrom)} → ${dateText(c.validTo)} · `}
                  {c.minNights ? `≥ ${c.minNights} ${d.booking.nights} · ` : ''}
                  {d.admin.uses} {c.uses}
                  {c.maxUses ? ` / ${c.maxUses}` : ''}
                </span>
                <span className="ml-auto flex gap-5">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => onToggle(c.id)}
                    className="link-rule text-[0.7rem] uppercase tracking-[0.12em] text-muted"
                  >
                    {c.active ? d.admin.deactivate : d.admin.activate}
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => onDelete(c)}
                    className="link-rule text-[0.7rem] uppercase tracking-[0.12em] text-muted"
                  >
                    {d.admin.deleteCoupon}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={create} className="mt-10 border border-stone bg-paper p-7">
          <h4 className="eyebrow">{d.admin.newCoupon}</h4>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="c-code">{d.admin.code}</label>
              <input
                id="c-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                placeholder="ESTATE10"
                className="field font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="c-type">{d.admin.discountType}</label>
              <select
                id="c-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="field"
              >
                <option value="PERCENT">{d.admin.typePercent}</option>
                <option value="FIXED">{d.admin.typeFixed}</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="c-value">
                {d.admin.discountValue} ({form.type === 'FIXED' ? '€' : '%'})
              </label>
              <input
                id="c-value"
                inputMode="decimal"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === 'FIXED' ? '30' : '10'}
                className="field"
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="c-from">
                {d.admin.validFrom} <span className="normal-case tracking-normal text-muted">({d.admin.optional})</span>
              </label>
              <input id="c-from" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="c-to">
                {d.admin.validTo} <span className="normal-case tracking-normal text-muted">({d.admin.optional})</span>
              </label>
              <input id="c-to" type="date" min={form.validFrom || undefined} value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} className="field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="c-min">{d.admin.minNightsLabel}</label>
                <input id="c-min" inputMode="numeric" value={form.minNights} onChange={(e) => setForm({ ...form, minNights: e.target.value.replace(/\D/g, '') })} className="field" />
              </div>
              <div>
                <label className="field-label" htmlFor="c-max">{d.admin.maxUsesLabel}</label>
                <input id="c-max" inputMode="numeric" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value.replace(/\D/g, '') })} className="field" />
              </div>
            </div>
          </div>
          {formError && <p className="mt-5 text-[0.82rem] text-lake-deep">{formError}</p>}
          <button type="submit" disabled={creating || busy !== null || !form.code || !form.value} className="btn-solid mt-7">
            {d.admin.createCoupon}
          </button>
        </form>
      </div>

      {/* Long-stay tiers */}
      <div className="lg:col-span-4">
        <div className="border border-stone bg-paper p-7">
          <h3 className="eyebrow">{d.admin.longStayTitle}</h3>
          <p className="mt-4 text-[0.82rem] leading-relaxed text-muted">{d.admin.longStayHint}</p>
          <div className="mt-6 grid grid-cols-[1fr_1fr_auto] items-end gap-x-4 gap-y-3">
            <span className="field-label">{d.admin.fromNights}</span>
            <span className="field-label">{d.admin.percentOff}</span>
            <span />
            {rows.map((r, i) => (
              <div key={i} className="contents">
                <input
                  aria-label={d.admin.fromNights}
                  inputMode="numeric"
                  value={r.n}
                  onChange={(e) => {
                    setTierError(null);
                    setRows(rows.map((x, j) => (j === i ? { ...x, n: e.target.value.replace(/\D/g, '') } : x)));
                  }}
                  className="field"
                />
                <input
                  aria-label={d.admin.percentOff}
                  inputMode="numeric"
                  value={r.p}
                  onChange={(e) => {
                    setTierError(null);
                    setRows(rows.map((x, j) => (j === i ? { ...x, p: e.target.value.replace(/\D/g, '') } : x)));
                  }}
                  className="field"
                />
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className="pb-2 text-[1.1rem] leading-none text-muted hover:text-charcoal"
                  aria-label={d.admin.remove}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRows([...rows, { n: '', p: '' }])}
            className="link-rule mt-5 text-[0.7rem] uppercase tracking-[0.14em] text-muted"
          >
            + {d.admin.addTier}
          </button>
          {tierError && <p className="mt-4 text-[0.82rem] text-lake-deep">{tierError}</p>}
          <button type="button" disabled={busy !== null} onClick={saveTiers} className="btn-solid mt-7 w-full">
            {d.admin.save}
          </button>
        </div>
      </div>
    </div>
  );
}
