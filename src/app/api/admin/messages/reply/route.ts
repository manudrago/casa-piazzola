import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendHostReply } from '@/lib/email';

export const dynamic = 'force-dynamic';

/** Host → guest reply: emailed, and recorded in the thread. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { email, body } = (await request.json().catch(() => ({}))) as {
    email?: string;
    body?: string;
  };

  const to = String(email ?? '').trim().toLowerCase();
  const text = String(body ?? '').trim().slice(0, 4000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to) || text.length < 2) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  // Reply in the guest's own language when we know it from their booking.
  const booking = await prisma.booking.findFirst({
    where: { guestEmail: to },
    orderBy: { createdAt: 'desc' },
    select: { id: true, locale: true },
  });

  const sent = await sendHostReply(to, text, booking?.locale ?? 'en');

  await prisma.message.create({
    data: {
      thread: to,
      author: 'HOST',
      email: to,
      body: text,
      bookingId: booking?.id ?? null,
      readAt: new Date(),
    },
  });

  // Mark the guest's side of the thread as read — replying is reading.
  await prisma.message.updateMany({
    where: { thread: to, author: 'GUEST', readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true, emailed: sent });
}
