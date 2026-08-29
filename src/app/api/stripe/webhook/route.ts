import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { BOOKING_STATUS, PAYMENT_STATUS } from '@/lib/constants';
import { toISODate } from '@/lib/dates';
import { sendBookingConfirmation, sendHostBookingAlert } from '@/lib/email';

export const dynamic = 'force-dynamic';
// The signature is computed over the raw body — never let a framework parse it.
export const runtime = 'nodejs';

/**
 * Stripe webhook. This — not the browser redirect — is what confirms a booking.
 *
 * A guest can close the tab before being redirected back; the webhook still
 * arrives, the booking is still confirmed, and the emails still go out.
 * Every handler is idempotent because Stripe retries.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'no signature' }, { status: 400 });

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    console.error('[webhook] signature verification failed', error);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== 'paid') break;
        await confirmBooking(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Release the held nights — the guest never paid.
        await prisma.booking.deleteMany({
          where: { stripeSessionId: session.id, status: BOOKING_STATUS.PENDING },
        });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const intentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!intentId) break;

        const booking = await prisma.booking.findFirst({
          where: { stripePaymentIntentId: intentId },
        });
        if (!booking) break;

        const refunded = charge.amount_refunded ?? 0;
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            refundedAmount: refunded,
            paymentStatus:
              refunded >= booking.total
                ? PAYMENT_STATUS.REFUNDED
                : PAYMENT_STATUS.PARTIALLY_REFUNDED,
            ...(refunded >= booking.total ? { status: BOOKING_STATUS.CANCELLED } : {}),
          },
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    // Return 500 so Stripe retries rather than dropping the event.
    console.error('[webhook] handler failed', event.type, error);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function confirmBooking(session: Stripe.Checkout.Session) {
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { stripeSessionId: session.id },
        ...(session.metadata?.bookingId ? [{ id: session.metadata.bookingId }] : []),
      ],
    },
  });

  if (!booking) {
    console.error('[webhook] no booking for session', session.id);
    return;
  }

  // Idempotency: Stripe retries, and we must not send two confirmation emails.
  if (booking.status === BOOKING_STATUS.CONFIRMED) return;

  const intentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const confirmed = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PAID,
      stripePaymentIntentId: intentId,
      stripeSessionId: session.id,
    },
  });

  // If the guest left a note at booking, seed the message thread with it so
  // the host has one place to answer from.
  if (confirmed.message) {
    await prisma.message
      .create({
        data: {
          thread: confirmed.guestEmail,
          author: 'GUEST',
          name: confirmed.guestName,
          email: confirmed.guestEmail,
          phone: confirmed.guestPhone,
          subject: `Booking ${confirmed.reference}`,
          body: confirmed.message,
          bookingId: confirmed.id,
        },
      })
      .catch(() => {});
  }

  const payload = {
    reference: confirmed.reference,
    guestName: confirmed.guestName,
    guestEmail: confirmed.guestEmail,
    checkIn: toISODate(confirmed.checkIn),
    checkOut: toISODate(confirmed.checkOut),
    guests: confirmed.guests,
    nights: confirmed.nights,
    total: confirmed.total,
    locale: confirmed.locale,
  };

  // Email failures are logged, never thrown — the money is already taken.
  await Promise.allSettled([sendBookingConfirmation(payload), sendHostBookingAlert(payload)]);
}
