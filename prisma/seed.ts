import { PrismaClient } from '@prisma/client';

/**
 * Development seed.
 *
 * Puts a couple of blocked ranges and one confirmed booking into the calendar
 * so the availability UI has something to show and the "unavailable" states can
 * actually be seen. Safe to run repeatedly; safe to skip entirely in production.
 */

const prisma = new PrismaClient();

function day(offset: number): Date {
  const now = new Date();
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(base + offset * 86_400_000);
}

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
    console.log('Refusing to seed in production. Set ALLOW_SEED=1 to override.');
    return;
  }

  // A week the host is keeping for themselves, three weeks out.
  for (let i = 21; i < 27; i++) {
    const date = day(i);
    await prisma.blockedDate.upsert({
      where: { date },
      update: {},
      create: { date, reason: 'Owner stay' },
    });
  }

  // A long weekend already taken on another channel.
  for (let i = 45; i < 48; i++) {
    const date = day(i);
    await prisma.blockedDate.upsert({
      where: { date },
      update: {},
      create: { date, reason: 'Booked on Airbnb' },
    });
  }

  // One confirmed direct booking, so the admin dashboard is not empty.
  const reference = 'LOV-SEED01';
  const existing = await prisma.booking.findUnique({ where: { reference } });
  if (!existing) {
    const checkIn = day(10);
    const checkOut = day(14);
    await prisma.booking.create({
      data: {
        reference,
        checkIn,
        checkOut,
        nights: 4,
        guests: 2,
        guestName: 'Chiara Bonomi',
        guestEmail: 'chiara.example@example.com',
        guestPhone: '+39 000 000 0000',
        country: 'Italy',
        message: 'Arriviamo verso le 18. Grazie!',
        nightlyBreakdown: JSON.stringify([]),
        accommodation: 46000,
        cleaningFee: 4500,
        touristTax: 1200,
        total: 51700,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        locale: 'it',
      },
    });

    await prisma.message.create({
      data: {
        thread: 'chiara.example@example.com',
        author: 'GUEST',
        name: 'Chiara Bonomi',
        email: 'chiara.example@example.com',
        subject: 'Arrivo e parcheggio',
        body: 'Buongiorno, arriviamo in auto — dove conviene parcheggiare vicino all’appartamento?',
      },
    });
  }

  console.log('Seeded: blocked ranges, one confirmed booking, one message.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
