export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const MESSAGE_AUTHOR = { GUEST: 'GUEST', HOST: 'HOST' } as const;
export type MessageAuthor = (typeof MESSAGE_AUTHOR)[keyof typeof MESSAGE_AUTHOR];

/**
 * A PENDING booking holds its dates for this long while the guest is on the
 * Stripe Checkout page. After that the nights are released again.
 */
export const PENDING_HOLD_MINUTES = 30;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
