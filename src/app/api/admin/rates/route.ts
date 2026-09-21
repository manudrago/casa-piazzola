import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addDays, isValidISODate, toUTCDate } from '@/lib/dates';

export const dynamic = 'force-dynamic';

/** Highest nightly price the dashboard will accept: a typo guard, not a policy. */
const MAX_NIGHTLY_CENTS = 1_000_000; // €10,000

/**
 * Set or clear the nightly price for a range of dates, both ends inclusive —
 * the host thinks "from the 1st to the 31st", not in check-out-exclusive terms.
 *
 * Body: { from, to, amount }  → every night in the range costs `amount` cents
 *       { from, to, clear: true } → the range goes back to the seasonal price
 *
 * Existing bookings are never repriced: a booking stores the amounts it was
 * quoted, so changing a price only affects stays booked afterwards.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  const { from, to, amount, clear } = body;
  if (!isValidISODate(from) || !isValidISODate(to)) {
    return NextResponse.json({ error: 'bad dates' }, { status: 400 });
  }
  const start = toUTCDate(from);
  const end = toUTCDate(to);
  if (end < start) return NextResponse.json({ error: 'bad range' }, { status: 400 });

  const dates: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    dates.push(d);
    if (dates.length > 400) return NextResponse.json({ error: 'range too long' }, { status: 400 });
  }

  if (clear === true) {
    const { count } = await prisma.rateOverride.deleteMany({ where: { date: { in: dates } } });
    return NextResponse.json({ ok: true, cleared: count });
  }

  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0 || amount > MAX_NIGHTLY_CENTS) {
    return NextResponse.json({ error: 'bad amount' }, { status: 400 });
  }

  await prisma.$transaction(
    dates.map((date) =>
      prisma.rateOverride.upsert({
        where: { date },
        update: { amount },
        create: { date, amount },
      }),
    ),
  );

  return NextResponse.json({ ok: true, set: dates.length });
}
