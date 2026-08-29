import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addDays, isValidISODate, toUTCDate } from '@/lib/dates';

export const dynamic = 'force-dynamic';

/**
 * Block or release a range of dates.
 *
 * Blocking is inclusive of both ends — the host thinks "I am away from the 4th
 * to the 9th", not in check-out-exclusive terms. Existing confirmed bookings
 * are never overwritten; the request simply skips those nights and reports how
 * many it could not take.
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

  const { from, to, reason, unblock } = body;
  if (!isValidISODate(from) || !isValidISODate(to)) {
    return NextResponse.json({ error: 'bad dates' }, { status: 400 });
  }

  const start = toUTCDate(from);
  const end = toUTCDate(to);
  if (end < start) return NextResponse.json({ error: 'bad range' }, { status: 400 });

  const dates: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    dates.push(d);
    if (dates.length > 400) break;
  }

  if (unblock === true) {
    await prisma.blockedDate.deleteMany({ where: { date: { in: dates } } });
    return NextResponse.json({ ok: true, released: dates.length });
  }

  const label = typeof reason === 'string' ? reason.trim().slice(0, 200) || null : null;

  let blockedCount = 0;
  for (const date of dates) {
    try {
      await prisma.blockedDate.upsert({
        where: { date },
        update: { reason: label },
        create: { date, reason: label },
      });
      blockedCount++;
    } catch (error) {
      console.error('[admin/block]', error);
    }
  }

  return NextResponse.json({ ok: true, blocked: blockedCount });
}
