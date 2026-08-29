import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { PAYMENT_STATUS, BOOKING_STATUS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * Refund through Stripe.
 *
 * The database is NOT updated here — Stripe's `charge.refunded` webhook is the
 * single source of truth for money, and it will arrive in a moment. Writing the
 * state twice is how ledgers drift.
 *
 * `amount` in cents refunds partially; omit it to refund whatever is left.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id, amount } = (await request.json().catch(() => ({}))) as {
    id?: string;
    amount?: number;
  };
  if (!id) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (booking.paymentStatus !== PAYMENT_STATUS.PAID) {
    return NextResponse.json({ error: 'not refundable' }, { status: 409 });
  }
  if (!booking.stripePaymentIntentId) {
    return NextResponse.json({ error: 'no payment intent' }, { status: 409 });
  }

  const outstanding = booking.total - booking.refundedAmount;
  const value = Number.isInteger(amount) && amount! > 0 ? Math.min(amount!, outstanding) : outstanding;
  if (value <= 0) return NextResponse.json({ error: 'nothing to refund' }, { status: 409 });

  try {
    await getStripe().refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: value,
      metadata: { reference: booking.reference },
    });
  } catch (error) {
    console.error('[admin/refund]', error);
    return NextResponse.json({ error: 'stripe refused the refund' }, { status: 502 });
  }

  // A full refund also frees the dates; the webhook confirms the money side.
  if (value >= outstanding) {
    await prisma.booking.update({
      where: { id },
      data: { status: BOOKING_STATUS.CANCELLED },
    });
  }

  return NextResponse.json({ ok: true, refunded: value });
}
