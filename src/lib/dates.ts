/**
 * All availability logic works on *calendar days*, never on instants.
 * A stay is stored and compared as UTC midnights so that a guest in Sydney
 * and a host in Lovere always agree on which nights are taken.
 */

/** "2026-09-14" → Date at 2026-09-14T00:00:00.000Z */
export function toUTCDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Date → "2026-09-14" (UTC calendar day) */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

/** Whole days between two UTC midnights. */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

/** The nights of a stay: check-in inclusive, check-out exclusive. */
export function nightsOf(checkIn: Date, checkOut: Date): Date[] {
  const out: Date[] = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Today as a UTC calendar day. */
export function todayUTC(): Date {
  return toUTCDate(new Date().toISOString().slice(0, 10));
}

export function isValidISODate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toUTCDate(s).getTime());
}

const MONTHS: Record<string, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
};

const WEEKDAYS: Record<string, string[]> = {
  // Weeks start on Monday — European convention, and the one Lovere uses.
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  it: ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'],
};

export function monthName(monthIndex: number, locale = 'en'): string {
  return (MONTHS[locale] ?? MONTHS.en)[monthIndex];
}

export function weekdayLabels(locale = 'en'): string[] {
  return WEEKDAYS[locale] ?? WEEKDAYS.en;
}

/** "Sat 14 Sep 2026" / "sab 14 set 2026" — short, editorial, unambiguous. */
export function formatDate(d: Date, locale = 'en'): string {
  const wk = weekdayLabels(locale)[(d.getUTCDay() + 6) % 7];
  const mon = monthName(d.getUTCMonth(), locale).slice(0, 3);
  return `${wk} ${d.getUTCDate()} ${locale === 'it' ? mon : mon.charAt(0).toUpperCase() + mon.slice(1)} ${d.getUTCFullYear()}`;
}

export function formatLongDate(d: Date, locale = 'en'): string {
  const mon = monthName(d.getUTCMonth(), locale);
  return locale === 'it'
    ? `${d.getUTCDate()} ${mon} ${d.getUTCFullYear()}`
    : `${d.getUTCDate()} ${mon} ${d.getUTCFullYear()}`;
}

/** Monday-first grid offset for the first of a month. */
export function firstWeekdayOffset(year: number, month: number): number {
  return (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}
