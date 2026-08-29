import Stripe from 'stripe';

/**
 * Payments use Stripe Checkout — a hosted page on Stripe's own domain.
 * Card details are entered there and never reach this application, this
 * server or this database. We only ever see a session id, a payment intent
 * id and a status.
 */

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Copy .env.example to .env and add your Stripe keys.',
    );
  }
  // Omitting apiVersion pins to the version the installed SDK was built for,
  // which is what you want: upgrading the API becomes a deliberate act of
  // bumping the package, not something that happens to you overnight.
  cached = new Stripe(key);
  return cached;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
