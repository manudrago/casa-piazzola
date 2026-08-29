'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  daysInMonth,
  firstWeekdayOffset,
  monthName,
  toISODate,
  toUTCDate,
  weekdayLabels,
} from '@/lib/dates';
import type { Dictionary } from '@/lib/i18n';

export type CalendarProps = {
  locale: string;
  d: Dictionary;
  unavailable: Set<string>;
  rates: Record<string, number>;
  firstBookable: string;
  lastBookable: string;
  minNights: number;
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  /** Show the nightly price inside each day cell. Off on narrow screens. */
  showPrices?: boolean;
  months?: number;
};

/**
 * Availability calendar with range selection.
 *
 * The rules it enforces are the same ones the server enforces:
 *  - a night that is taken can never be selected, and
 *  - a range may not jump over a taken night, so the "next unavailable date
 *    after check-in" caps how far a departure can be dragged.
 *
 * Departure day is exclusive: the day someone leaves is bookable as an arrival,
 * which is why a check-out may land on the first unavailable night.
 */
export default function Calendar({
  locale,
  d,
  unavailable,
  rates,
  firstBookable,
  lastBookable,
  minNights,
  checkIn,
  checkOut,
  onChange,
  showPrices = true,
  months = 2,
}: CalendarProps) {
  const start = useMemo(() => toUTCDate(firstBookable), [firstBookable]);
  const [cursor, setCursor] = useState(() => ({
    year: start.getUTCFullYear(),
    month: start.getUTCMonth(),
  }));
  const [hover, setHover] = useState<string | null>(null);

  const last = useMemo(() => toUTCDate(lastBookable), [lastBookable]);

  /** The first taken night at or after check-in — the range may not cross it. */
  const blockAfterCheckIn = useMemo(() => {
    if (!checkIn || checkOut) return null;
    let cur = addDays(toUTCDate(checkIn), 1);
    for (let i = 0; i < 400; i++) {
      const iso = toISODate(cur);
      if (unavailable.has(iso)) return iso;
      cur = addDays(cur, 1);
    }
    return null;
  }, [checkIn, checkOut, unavailable]);

  function selectable(iso: string): boolean {
    const day = toUTCDate(iso);
    if (day < start || day > last) return false;

    // Choosing an arrival: the night itself must be free.
    if (!checkIn || checkOut) return !unavailable.has(iso);

    // Choosing a departure: must be after arrival, and may not cross a taken
    // night. Landing exactly on the first taken night is allowed — that night
    // is not part of the stay.
    if (iso <= checkIn) return false;
    if (blockAfterCheckIn && iso > blockAfterCheckIn) return false;
    return true;
  }

  function pick(iso: string) {
    if (!selectable(iso)) return;
    if (!checkIn || checkOut) {
      onChange(iso, null);
      setHover(null);
      return;
    }
    onChange(checkIn, iso);
  }

  const previewEnd = checkOut ?? (checkIn && hover && hover > checkIn ? hover : null);

  function inRange(iso: string): boolean {
    if (!checkIn || !previewEnd) return false;
    return iso > checkIn && iso < previewEnd;
  }

  const canGoBack =
    cursor.year > start.getUTCFullYear() ||
    (cursor.year === start.getUTCFullYear() && cursor.month > start.getUTCMonth());

  const lastAllowed = { year: last.getUTCFullYear(), month: last.getUTCMonth() };
  const canGoForward =
    cursor.year < lastAllowed.year ||
    (cursor.year === lastAllowed.year && cursor.month + months - 1 < lastAllowed.month);

  function shift(delta: number) {
    setCursor(({ year, month }) => {
      const m = month + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  const wk = weekdayLabels(locale);

  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          aria-label={d.booking.monthPrev}
          className="flex h-10 w-10 items-center justify-center border border-stone text-charcoal
                     transition-colors duration-300 hover:border-charcoal disabled:opacity-25 disabled:hover:border-stone"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M9 1L3 7l6 6" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </button>

        <p className="font-sans text-[0.68rem] uppercase tracking-[0.22em] text-muted">
          {d.booking.legendTitle}
        </p>

        <button
          type="button"
          onClick={() => shift(1)}
          disabled={!canGoForward}
          aria-label={d.booking.monthNext}
          className="flex h-10 w-10 items-center justify-center border border-stone text-charcoal
                     transition-colors duration-300 hover:border-charcoal disabled:opacity-25 disabled:hover:border-stone"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M5 1l6 6-6 6" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </button>
      </div>

      <div
        className={`grid gap-x-10 gap-y-10 ${months > 1 ? 'sm:grid-cols-2' : ''}`}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: months }, (_, offset) => {
          const m = cursor.month + offset;
          const year = cursor.year + Math.floor(m / 12);
          const month = ((m % 12) + 12) % 12;
          const pad = firstWeekdayOffset(year, month);
          const count = daysInMonth(year, month);

          return (
            <div key={`${year}-${month}`} className={offset > 0 ? 'hidden sm:block' : ''}>
              <h3 className="mb-5 font-display text-[1.35rem] font-light text-charcoal">
                {monthName(month, locale)}{' '}
                <span className="text-muted">{year}</span>
              </h3>

              <div className="mb-2 grid grid-cols-7 gap-1">
                {wk.map((label) => (
                  <div
                    key={label}
                    className="py-1 text-center font-sans text-[0.58rem] uppercase tracking-[0.14em] text-muted"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: pad }, (_, i) => (
                  <div key={`pad-${i}`} />
                ))}

                {Array.from({ length: count }, (_, i) => {
                  const day = new Date(Date.UTC(year, month, i + 1));
                  const iso = toISODate(day);
                  const taken = unavailable.has(iso);
                  const usable = selectable(iso);
                  const isStart = iso === checkIn;
                  const isEnd = iso === checkOut;
                  const middle = inRange(iso);
                  const price = rates[iso];

                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={!usable && !isStart}
                      onClick={() => pick(iso)}
                      onMouseEnter={() => setHover(iso)}
                      aria-label={`${i + 1} ${monthName(month, locale)} ${year}${
                        taken ? ` — ${d.booking.unavailable}` : ''
                      }`}
                      aria-pressed={isStart || isEnd}
                      className={[
                        'relative flex aspect-square flex-col items-center justify-center transition-colors duration-200',
                        'font-sans text-[0.82rem]',
                        isStart || isEnd
                          ? 'bg-charcoal text-ivory'
                          : middle
                            ? 'bg-stone/70 text-charcoal'
                            : taken
                              ? 'text-sand line-through decoration-sand/70 decoration-[0.5px]'
                              : usable
                                ? 'text-ink hover:bg-stone/50'
                                : 'text-sand/60',
                        !usable && !isStart && !isEnd ? 'cursor-not-allowed' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      <span className="leading-none">{i + 1}</span>
                      {showPrices && price != null && !taken && (
                        <span
                          className={`mt-1 hidden text-[0.52rem] leading-none lg:block ${
                            isStart || isEnd ? 'text-ivory/60' : 'text-muted'
                          }`}
                        >
                          {Math.round(price / 100)}
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

      <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-stone pt-5 text-[0.65rem] uppercase tracking-[0.14em] text-muted">
        <span className="flex items-center gap-2">
          <span className="block h-3 w-3 border border-stone bg-ivory" />
          {d.booking.available}
        </span>
        <span className="flex items-center gap-2">
          <span className="block h-3 w-3 bg-charcoal" />
          {d.booking.selected}
        </span>
        <span className="flex items-center gap-2">
          <span className="block h-3 w-3 bg-stone/60" />
          <span className="line-through decoration-sand">{d.booking.unavailable}</span>
        </span>
        {checkIn && !checkOut && (
          <span className="normal-case tracking-normal text-olive-deep">{d.booking.pickCheckOut}</span>
        )}
      </div>
    </div>
  );
}
