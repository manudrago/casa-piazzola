import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SETTING } from '@/lib/availability';

export const dynamic = 'force-dynamic';

const MAX_CLEANING_CENTS = 100_000; // €1,000 — a typo guard

/**
 * Update host settings. Body: { cleaningFee } in cents; 0 is allowed (no fee).
 * Applies to quotes from now on; bookings already made keep what they paid.
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

  const { cleaningFee } = body;
  if (
    typeof cleaningFee !== 'number' ||
    !Number.isInteger(cleaningFee) ||
    cleaningFee < 0 ||
    cleaningFee > MAX_CLEANING_CENTS
  ) {
    return NextResponse.json({ error: 'bad amount' }, { status: 400 });
  }

  await prisma.setting.upsert({
    where: { key: SETTING.CLEANING_FEE },
    update: { value: cleaningFee },
    create: { key: SETTING.CLEANING_FEE, value: cleaningFee },
  });

  return NextResponse.json({ ok: true });
}
