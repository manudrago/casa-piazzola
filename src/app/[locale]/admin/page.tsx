import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated, adminConfigured } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDictionary } from '@/lib/i18n';
import { BOOKING_STATUS } from '@/lib/constants';
import { todayUTC, toISODate, addDays } from '@/lib/dates';
import AdminSignIn from '@/components/admin/AdminSignIn';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Host dashboard',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const d = getDictionary(locale);

  if (!adminConfigured()) {
    return (
      <div className="shell py-40">
        <h1 className="text-display-sm font-light">Admin is not configured</h1>
        <p className="mt-5 max-w-prose text-[0.98rem] leading-relaxed text-ink/85">
          Set <code className="bg-stone/60 px-1.5 py-0.5">ADMIN_PASSWORD</code> and{' '}
          <code className="bg-stone/60 px-1.5 py-0.5">ADMIN_SESSION_SECRET</code> in your
          environment, then reload. See the README.
        </p>
      </div>
    );
  }

  if (!(await isAuthenticated())) {
    return <AdminSignIn d={d} />;
  }

  const today = todayUTC();
  const horizon = addDays(today, 400);

  const [bookings, blocked, messages] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { checkIn: 'asc' },
      where: { OR: [{ status: BOOKING_STATUS.CONFIRMED }, { status: BOOKING_STATUS.CANCELLED }] },
      take: 300,
    }),
    prisma.blockedDate.findMany({
      where: { date: { gte: addDays(today, -30), lt: horizon } },
      orderBy: { date: 'asc' },
    }),
    prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 300 }),
  ]);

  return (
    <AdminDashboard
      d={d}
      locale={locale}
      bookings={bookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        checkIn: toISODate(b.checkIn),
        checkOut: toISODate(b.checkOut),
        nights: b.nights,
        guests: b.guests,
        guestName: b.guestName,
        guestEmail: b.guestEmail,
        guestPhone: b.guestPhone,
        country: b.country,
        message: b.message,
        total: b.total,
        refundedAmount: b.refundedAmount,
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt.toISOString(),
      }))}
      blocked={blocked.map((b) => ({ date: toISODate(b.date), reason: b.reason }))}
      messages={messages.map((m) => ({
        id: m.id,
        thread: m.thread,
        author: m.author,
        name: m.name,
        email: m.email,
        phone: m.phone,
        subject: m.subject,
        body: m.body,
        readAt: m.readAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
