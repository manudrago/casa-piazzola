/**
 * PRICING — commercial settings, not property facts.
 *
 * ► Everything in `rates` is a starting point you should replace with your own
 *   numbers. Nothing here comes from the Idealista listing, which is a sale
 *   listing (€75,000) and says nothing about nightly rates.
 *
 * ► TOURIST TAX: the imposta di soggiorno is set by the Comune. Confirm the
 *   current Lovere rate, the exemptions (typically under-14s) and the maximum
 *   number of taxable nights with the Comune di Lovere before you take money.
 *   The default below is a placeholder.
 *
 * All amounts are in EUR cents.
 */

import { toISODate } from './dates';

export const CURRENCY = 'eur';

export const rates = {
  /** Fallback rate for any night not covered by a season below. */
  baseNightly: 9500, // €95

  /**
   * Seasons are matched by month (0 = January). Later entries win, so put the
   * most specific ranges last.
   */
  seasons: [
    { label: 'Low season', months: [10, 11, 0, 1], nightly: 8500 }, // Nov–Feb €85
    { label: 'Shoulder', months: [2, 3, 9], nightly: 9500 }, // Mar, Apr, Oct €95
    { label: 'High season', months: [4, 5, 8], nightly: 12500 }, // May, Jun, Sep €125
    { label: 'Peak summer', months: [6, 7], nightly: 14500 }, // Jul, Aug €145
  ],

  /** Friday and Saturday nights carry a surcharge outside the low season. */
  weekendSurcharge: 1000, // €10

  /** Specific dates that override everything (holidays, local events). */
  dateOverrides: {
    // '2026-12-31': 18000,
  } as Record<string, number>,

  cleaningFee: 4500, // €45, charged once per stay
  /** Per person, per night. Verify with the Comune — see the note above. */
  touristTaxPerPersonPerNight: 150, // €1.50
  /** Nights beyond this are not taxed. Many comuni cap at 5–7. Verify. */
  touristTaxMaxNights: 5,
  /** Age below which guests are exempt. Verify. */
  touristTaxExemptUnder: 14,

  /** Stays of this length or longer get a discount. */
  weeklyDiscountFrom: 7,
  weeklyDiscountPct: 8,
  monthlyDiscountFrom: 28,
  monthlyDiscountPct: 20,
} as const;

export type NightRate = { date: string; amount: number };

export type Quote = {
  nights: number;
  guests: number;
  checkIn: string;
  checkOut: string;
  nightly: NightRate[];
  /** Sum of nightly rates before any discount. */
  accommodationGross: number;
  discountLabel: string | null;
  discount: number;
  /** After discount — what the guest is charged for the nights. */
  accommodation: number;
  cleaningFee: number;
  touristTax: number;
  total: number;
  averageNightly: number;
  currency: string;
};

/** The published rate for a single night, before discounts. */
export function nightlyRate(date: Date, overrides: Record<string, number> = {}): number {
  const iso = toISODate(date);
  if (overrides[iso] != null) return overrides[iso];
  if (rates.dateOverrides[iso] != null) return rates.dateOverrides[iso];

  const month = date.getUTCMonth();
  let amount: number = rates.baseNightly;
  let isLow = false;
  for (const season of rates.seasons) {
    if ((season.months as readonly number[]).includes(month)) {
      amount = season.nightly;
      isLow = season.label === 'Low season';
    }
  }

  const weekday = date.getUTCDay(); // 5 = Fri, 6 = Sat
  if (!isLow && (weekday === 5 || weekday === 6)) amount += rates.weekendSurcharge;

  return amount;
}

/**
 * Build a complete, itemised quote. This is the ONLY place a price is
 * calculated — the client displays it, the Stripe session is built from it,
 * and it is recalculated server-side before payment so a tampered client
 * cannot buy a cheap stay.
 */
export function buildQuote(
  nights: Date[],
  guests: number,
  overrides: Record<string, number> = {},
): Omit<Quote, 'checkIn' | 'checkOut'> {
  const nightly: NightRate[] = nights.map((d) => ({
    date: toISODate(d),
    amount: nightlyRate(d, overrides),
  }));

  const accommodationGross = nightly.reduce((sum, n) => sum + n.amount, 0);

  let discount = 0;
  let discountLabel: string | null = null;
  if (nights.length >= rates.monthlyDiscountFrom) {
    discount = Math.round((accommodationGross * rates.monthlyDiscountPct) / 100);
    discountLabel = `${rates.monthlyDiscountPct}%`;
  } else if (nights.length >= rates.weeklyDiscountFrom) {
    discount = Math.round((accommodationGross * rates.weeklyDiscountPct) / 100);
    discountLabel = `${rates.weeklyDiscountPct}%`;
  }

  const accommodation = accommodationGross - discount;
  const taxedNights = Math.min(nights.length, rates.touristTaxMaxNights);
  const touristTax = rates.touristTaxPerPersonPerNight * guests * taxedNights;
  const cleaningFee = rates.cleaningFee;

  return {
    nights: nights.length,
    guests,
    nightly,
    accommodationGross,
    discount,
    discountLabel,
    accommodation,
    cleaningFee,
    touristTax,
    total: accommodation + cleaningFee + touristTax,
    averageNightly: nights.length ? Math.round(accommodation / nights.length) : 0,
    currency: CURRENCY,
  };
}

/** €1.234,00 in Italian, €1,234.00 in English — cents in, string out. */
export function formatMoney(cents: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** The "from €x" figure used in the hero and nav. */
export function fromNightly(): number {
  return Math.min(rates.baseNightly, ...rates.seasons.map((s) => s.nightly));
}
