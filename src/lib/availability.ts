import { prisma } from './db';
import { PENDING_HOLD_MINUTES, BOOKING_STATUS } from './constants';
import { addDays, nightsOf, toISODate, todayUTC, toUTCDate, nightsBetween } from './dates';
import { property } from './property';
import { buildQuote, type Quote } from './pricing';

/**
 * A night is unavailable if it is inside a CONFIRMED booking, inside a PENDING
 * booking that is still holding (someone is at the Stripe page right now), or
 * blocked by the host.
 *
 * Everything the calendar shows and everything the server enforces comes from
 * this one function, so the UI can never disagree with the database.
 */
export async function unavailableDates(from: Date, to: Date): Promise<Set<string>> {
  const holdCutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60_000);

  const [bookings, blocked] = await Promise.all([
    prisma.booking.findMany({
      where: {
        checkIn: { lt: to },
        checkOut: { gt: from },
        OR: [
          { status: BOOKING_STATUS.CONFIRMED },
          { status: BOOKING_STATUS.PENDING, createdAt: { gt: holdCutoff } },
        ],
      },
      select: { checkIn: true, checkOut: true },
    }),
    prisma.blockedDate.findMany({
      where: { date: { gte: from, lt: to } },
      select: { date: true },
    }),
  ]);

  const taken = new Set<string>();
  for (const b of bookings) {
    for (const night of nightsOf(b.checkIn, b.checkOut)) taken.add(toISODate(night));
  }
  for (const b of blocked) taken.add(toISODate(b.date));
  return taken;
}

/** Host-set nightly overrides, as an ISO-date → cents map. */
export async function rateOverrides(from: Date, to: Date): Promise<Record<string, number>> {
  const rows = await prisma.rateOverride.findMany({
    where: { date: { gte: from, lt: to } },
    select: { date: true, amount: true },
  });
  return Object.fromEntries(rows.map((r) => [toISODate(r.date), r.amount]));
}

/** What the public calendar endpoint returns. */
export type CalendarData = {
  from: string;
  to: string;
  unavailable: string[];
  rates: Record<string, number>;
  minNights: number;
  maxNights: number;
  maxGuests: number;
  today: string;
  firstBookable: string;
};

export async function calendar(monthsAhead = 14): Promise<CalendarData> {
  const from = todayUTC();
  const to = addDays(from, monthsAhead * 31);

  const [unavailable, overrides] = await Promise.all([
    unavailableDates(from, to),
    rateOverrides(from, to),
  ]);

  // Publish the price of every bookable night so the calendar can show it
  // without a round trip per hover.
  const { nightlyRate } = await import('./pricing');
  const rates: Record<string, number> = {};
  for (let d = from; d < to; d = addDays(d, 1)) {
    rates[toISODate(d)] = nightlyRate(d, overrides);
  }

  const h = property.hostConfigurable;
  return {
    from: toISODate(from),
    to: toISODate(to),
    unavailable: [...unavailable].sort(),
    rates,
    minNights: h.minNights,
    maxNights: h.maxNights,
    maxGuests: h.maxGuests,
    today: toISODate(from),
    firstBookable: toISODate(addDays(from, h.leadTimeDays)),
  };
}

export type QuoteResult =
  | { ok: true; quote: Quote }
  | { ok: false; error: 'PAST' | 'MIN_NIGHTS' | 'MAX_NIGHTS' | 'GUESTS' | 'UNAVAILABLE' | 'RANGE' };

/**
 * Validate a requested stay and price it. Called by the quote endpoint for
 * display AND by the checkout endpoint immediately before creating a Stripe
 * session, so the amount charged is always the server's own number.
 */
export async function quoteStay(
  checkInISO: string,
  checkOutISO: string,
  guests: number,
): Promise<QuoteResult> {
  const checkIn = toUTCDate(checkInISO);
  const checkOut = toUTCDate(checkOutISO);
  const h = property.hostConfigurable;

  const nights = nightsBetween(checkIn, checkOut);
  if (!Number.isFinite(nights) || nights <= 0) return { ok: false, error: 'RANGE' };
  if (checkIn < addDays(todayUTC(), h.leadTimeDays)) return { ok: false, error: 'PAST' };
  if (nights < h.minNights) return { ok: false, error: 'MIN_NIGHTS' };
  if (nights > h.maxNights) return { ok: false, error: 'MAX_NIGHTS' };
  if (!Number.isInteger(guests) || guests < 1 || guests > h.maxGuests) {
    return { ok: false, error: 'GUESTS' };
  }

  const [taken, overrides] = await Promise.all([
    unavailableDates(checkIn, checkOut),
    rateOverrides(checkIn, checkOut),
  ]);

  const stayNights = nightsOf(checkIn, checkOut);
  if (stayNights.some((n) => taken.has(toISODate(n)))) {
    return { ok: false, error: 'UNAVAILABLE' };
  }

  return {
    ok: true,
    quote: {
      ...buildQuote(stayNights, guests, overrides),
      checkIn: checkInISO,
      checkOut: checkOutISO,
    },
  };
}

/** LOV-7Q4M2K — short, unambiguous when read aloud, no confusable characters. */
export function bookingReference(): string {
  const alphabet = '23456789ACDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `LOV-${out}`;
}
