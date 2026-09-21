import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SETTING } from '@/lib/availability';

export const dynamic = 'force-dynamic';

/**
 * Replace the long-stay discount tiers.
 * Body: { tiers: [{ minNights, percent }, …] } — an empty list means no
 * long-stay discount at all. Saving also switches the site from the code
 * defaults in pricing.ts to these tiers, permanently.
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

  if (!Array.isArray(body.tiers) || body.tiers.length > 20) {
    return NextResponse.json({ error: 'bad tiers' }, { status: 400 });
  }

  const tiers = new Map<number, number>();
  for (const t of body.tiers as unknown[]) {
    const { minNights, percent } = (t ?? {}) as Record<string, unknown>;
    if (
      typeof minNights !== 'number' || !Number.isInteger(minNights) || minNights < 2 || minNights > 365 ||
      typeof percent !== 'number' || !Number.isInteger(percent) || percent < 1 || percent > 90
    ) {
      return NextResponse.json({ error: 'bad tier' }, { status: 400 });
    }
    tiers.set(minNights, percent); // a repeated night count keeps the last value
  }

  await prisma.$transaction([
    prisma.longStayDiscount.deleteMany({}),
    ...[...tiers].map(([minNights, percent]) =>
      prisma.longStayDiscount.create({ data: { minNights, percent } }),
    ),
    prisma.setting.upsert({
      where: { key: SETTING.LONG_STAY_SAVED },
      update: { value: 1 },
      create: { key: SETTING.LONG_STAY_SAVED, value: 1 },
    }),
  ]);

  return NextResponse.json({ ok: true, tiers: tiers.size });
}
