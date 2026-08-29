import { NextResponse } from 'next/server';
import { quoteStay } from '@/lib/availability';
import { isValidISODate } from '@/lib/dates';

export const dynamic = 'force-dynamic';

/**
 * Price a proposed stay. Display only — the amount charged is recalculated at
 * checkout, so a manipulated response here buys nothing.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'RANGE' }, { status: 400 });
  }

  const { checkIn, checkOut, guests } = (body ?? {}) as Record<string, unknown>;

  if (!isValidISODate(checkIn) || !isValidISODate(checkOut)) {
    return NextResponse.json({ error: 'RANGE' }, { status: 400 });
  }

  const guestCount = Number(guests);
  if (!Number.isInteger(guestCount)) {
    return NextResponse.json({ error: 'GUESTS' }, { status: 400 });
  }

  try {
    const result = await quoteStay(checkIn, checkOut, guestCount);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ quote: result.quote });
  } catch (error) {
    console.error('[quote]', error);
    return NextResponse.json({ error: 'SERVER' }, { status: 500 });
  }
}
