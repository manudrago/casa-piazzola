import { NextResponse } from 'next/server';
import { calendar } from '@/lib/availability';

export const dynamic = 'force-dynamic';

/** Public availability feed. Read-only, no personal data, safe to cache briefly. */
export async function GET() {
  try {
    const data = await calendar();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('[availability]', error);
    return NextResponse.json({ error: 'UNAVAILABLE' }, { status: 500 });
  }
}
