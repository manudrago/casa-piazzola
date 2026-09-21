import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normaliseCode } from '@/lib/availability';
import { isValidISODate, toUTCDate } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const MAX_FIXED_CENTS = 1_000_000; // €10,000 — a typo guard

function optionalInt(v: unknown, min: number, max: number): number | null | 'bad' {
  if (v === null || v === undefined || v === '') return null;
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : 'bad';
}

function optionalDate(v: unknown): Date | null | 'bad' {
  if (v === null || v === undefined || v === '') return null;
  return isValidISODate(v) ? toUTCDate(v) : 'bad';
}

/**
 * Manage discount codes.
 *   { action: 'create', code, type: 'PERCENT'|'FIXED', value, validFrom?, validTo?, minNights?, maxUses? }
 *     value is a whole percentage (1–100) or cents.
 *   { action: 'toggle', id }   switch on/off
 *   { action: 'delete', id }   bookings that used it keep their stored price
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

  if (body.action === 'toggle' || body.action === 'delete') {
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'bad id' }, { status: 400 });
    const row = await prisma.coupon.findUnique({ where: { id: body.id } });
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (body.action === 'delete') await prisma.coupon.delete({ where: { id: row.id } });
    else await prisma.coupon.update({ where: { id: row.id }, data: { active: !row.active } });
    return NextResponse.json({ ok: true });
  }

  if (body.action !== 'create') return NextResponse.json({ error: 'bad action' }, { status: 400 });

  const code = normaliseCode(body.code);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return NextResponse.json({ error: 'bad code' }, { status: 400 });

  const type = body.type === 'FIXED' ? 'FIXED' : body.type === 'PERCENT' ? 'PERCENT' : null;
  if (!type) return NextResponse.json({ error: 'bad type' }, { status: 400 });

  const value = body.value;
  const maxValue = type === 'PERCENT' ? 100 : MAX_FIXED_CENTS;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > maxValue) {
    return NextResponse.json({ error: 'bad value' }, { status: 400 });
  }

  const validFrom = optionalDate(body.validFrom);
  const validTo = optionalDate(body.validTo);
  const minNights = optionalInt(body.minNights, 1, 365);
  const maxUses = optionalInt(body.maxUses, 1, 100_000);
  if ([validFrom, validTo, minNights, maxUses].includes('bad')) {
    return NextResponse.json({ error: 'bad field' }, { status: 400 });
  }
  if (validFrom instanceof Date && validTo instanceof Date && validTo < validFrom) {
    return NextResponse.json({ error: 'bad range' }, { status: 400 });
  }

  if (await prisma.coupon.findUnique({ where: { code } })) {
    return NextResponse.json({ error: 'CODE_TAKEN' }, { status: 409 });
  }

  await prisma.coupon.create({
    data: {
      code,
      type,
      value,
      validFrom: validFrom as Date | null,
      validTo: validTo as Date | null,
      minNights: minNights as number | null,
      maxUses: maxUses as number | null,
    },
  });
  return NextResponse.json({ ok: true, code });
}
