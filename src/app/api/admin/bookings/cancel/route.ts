import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BOOKING_STATUS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * Cancel a booking. The dates are released immediately.
 *
 * Cancelling does NOT refund — money is a separate, deliberate decision, made
 * through the refund endpoint. A host who wants both does both, and the two
 * confirmations that requires are a feature.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await prisma.booking.update({
    where: { id },
    data: { status: BOOKING_STATUS.CANCELLED },
  });

  return NextResponse.json({ ok: true });
}
