import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendGuestMessageReceipt, sendHostMessageAlert } from '@/lib/email';
import { isLocale, defaultLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

/**
 * Guest → host messages.
 *
 * Threads are keyed by lowercased email so a guest who writes before booking
 * and again during their stay stays in one conversation. If they quote a
 * booking reference the message is attached to that booking too.
 */

/** Crude in-memory rate limit. Adequate for one apartment; swap for Upstash at scale. */
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 500) recent.clear();
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  // Honeypot: accept and discard, so the bot believes it succeeded.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? '').trim().slice(0, 120);
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
  const phone = body.phone ? String(body.phone).trim().slice(0, 60) : null;
  const subject = body.subject ? String(body.subject).trim().slice(0, 160) : null;
  const text = String(body.body ?? '').trim().slice(0, 4000);
  const reference = body.reference ? String(body.reference).trim().toUpperCase().slice(0, 20) : null;
  const locale = isLocale(body.locale) ? body.locale : defaultLocale;

  if (name.length < 2 || text.length < 5) {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'EMAIL' }, { status: 400 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'RATE_LIMIT' }, { status: 429 });
  }

  const booking = reference
    ? await prisma.booking.findUnique({ where: { reference }, select: { id: true } })
    : null;

  try {
    await prisma.message.create({
      data: {
        thread: email,
        author: 'GUEST',
        name,
        email,
        phone,
        subject,
        body: text,
        bookingId: booking?.id ?? null,
      },
    });
  } catch (error) {
    console.error('[messages] write failed', error);
    return NextResponse.json({ error: 'SERVER' }, { status: 500 });
  }

  const payload = { name, email, phone, subject, body: text, reference, locale };
  // Notifications are best-effort — the message is already safely stored.
  await Promise.allSettled([sendHostMessageAlert(payload), sendGuestMessageReceipt(payload)]);

  return NextResponse.json({ ok: true });
}
