import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Admin access is a single shared password — this is a one-apartment site with
 * one host, and a full user system would be ceremony without benefit.
 *
 * The password itself is never stored in a cookie. On sign-in we set a
 * signed, HTTP-only session cookie; every admin request verifies the
 * signature. Rotate ADMIN_SESSION_SECRET to invalidate every session at once.
 */

const COOKIE = 'cp_admin';
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'ADMIN_SESSION_SECRET must be set to a random string of at least 16 characters.',
    );
  }
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function makeToken(): string {
  const payload = `${Date.now() + MAX_AGE * 1000}.${randomBytes(8).toString('hex')}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const given = token.slice(idx + 1);
  const expected = sign(payload);
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expiry = Number(payload.split('.')[0]);
  return Number.isFinite(expiry) && expiry > Date.now();
}

/** Constant-time password check. */
export function passwordMatches(given: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(given.padEnd(64).slice(0, 64));
  const b = Buffer.from(expected.padEnd(64).slice(0, 64));
  return timingSafeEqual(a, b) && given.length === expected.length;
}

export async function createSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const jar = await cookies();
    return verifyToken(jar.get(COOKIE)?.value);
  } catch {
    return false;
  }
}

/** Guard for admin API routes. Returns null when the caller is allowed. */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAuthenticated()) return null;
  return Response.json({ error: 'Unauthorised' }, { status: 401 });
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}
