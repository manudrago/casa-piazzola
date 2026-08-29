import { NextResponse } from 'next/server';
import { passwordMatches, createSession, adminConfigured } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Brute-force brake: a handful of attempts per IP per window. */
const attempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'too many attempts' }, { status: 429 });
  }
  recent.push(now);
  attempts.set(ip, recent);

  let password = '';
  try {
    password = String(((await request.json()) as { password?: unknown }).password ?? '');
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  if (!passwordMatches(password)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  attempts.delete(ip);
  await createSession();
  return NextResponse.json({ ok: true });
}
