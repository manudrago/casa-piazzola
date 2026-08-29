import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStripe, stripeConfigured } from '@/lib/stripe';
import { quoteStay, bookingReference } from '@/lib/availability';
import { isValidISODate, toUTCDate, formatLongDate } from '@/lib/dates';
import { BOOKING_STATUS, PAYMENT_STATUS, SITE_URL } from '@/lib/constants';
import { getDictionary, href, isLocale, defaultLocale } from '@/lib/i18n';
import { property } from '@/lib/property';

export const dynamic = 'force-dynamic';

/**
 * Create a booking and hand back a Stripe Checkout URL.
 *
 * Order matters here:
 *  1. re-price the stay server-side (the client's number is never trusted)
 *  2. write a PENDING booking, which holds the nights for 30 minutes
 *  3. create the Stripe session for the amount WE calculated
 *  4. attach the session id to the booking
 *
 * If step 3 or 4 fails the pending booking is deleted, so a Stripe outage can
 * never leave phantom nights blocked in the calendar.
 */
export async function POST(request: Request) {
  if (!stripeConfigured()) {
    console.error('[checkout] STRIPE_SECRET_KEY missing');
    return NextResponse.json({ error: 'SERVER' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'RANGE' }, { status: 400 });
  }

  const checkIn = body.checkIn;
  const checkOut = body.checkOut;
  const guests = Number(body.guests);
  const locale = isLocale(body.locale) ? body.locale : defaultLocale;

  const guestName = String(body.guestName ?? '').trim().slice(0, 120);
  const guestEmail = String(body.guestEmail ?? '').trim().toLowerCase().slice(0, 200);
  const guestPhone = body.guestPhone ? String(body.guestPhone).trim().slice(0, 60) : null;
  const country = body.country ? String(body.country).trim().slice(0, 80) : null;
  const message = body.message ? String(body.message).trim().slice(0, 2000) : null;

  if (!isValidISODate(checkIn) || !isValidISODate(checkOut)) {
    return NextResponse.json({ error: 'RANGE' }, { status: 400 });
  }
  if (guestName.length < 2) {
    return NextResponse.json({ error: 'NAME' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(guestEmail)) {
    return NextResponse.json({ error: 'EMAIL' }, { status: 400 });
  }

  const priced = await quoteStay(checkIn, checkOut, guests);
  if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: 409 });
  const quote = priced.quote;

  const d = getDictionary(locale);
  const reference = bookingReference();

  const booking = await prisma.booking.create({
    data: {
      reference,
      checkIn: toUTCDate(checkIn),
      checkOut: toUTCDate(checkOut),
      guests,
      nights: quote.nights,
      guestName,
      guestEmail,
      guestPhone,
      country,
      message,
      nightlyBreakdown: JSON.stringify(quote.nightly),
      accommodation: quote.accommodation,
      cleaningFee: quote.cleaningFee,
      touristTax: quote.touristTax,
      total: quote.total,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.UNPAID,
      locale,
    },
  });

  try {
    const stripe = getStripe();
    const stayLabel = `${formatLongDate(toUTCDate(checkIn), locale)} → ${formatLongDate(
      toUTCDate(checkOut),
      locale,
    )}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Stripe collects the card. We never see it, never store it.
      customer_email: guestEmail,
      client_reference_id: reference,
      locale: locale === 'it' ? 'it' : 'en',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: quote.currency,
            unit_amount: quote.accommodation,
            product_data: {
              name: `${property.name} — ${quote.nights} ${
                quote.nights === 1 ? d.booking.night : d.booking.nights
              }`,
              description: `${stayLabel} · ${guests} ${
                guests === 1 ? d.booking.guest : d.booking.guestsPlural
              }`,
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: quote.currency,
            unit_amount: quote.cleaningFee,
            product_data: { name: d.booking.cleaningFee },
          },
        },
        ...(quote.touristTax > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: quote.currency,
                  unit_amount: quote.touristTax,
                  product_data: {
                    name: d.booking.touristTax,
                    description: d.booking.touristTaxNote,
                  },
                },
              },
            ]
          : []),
      ],
      metadata: {
        reference,
        bookingId: booking.id,
        checkIn,
        checkOut,
        guests: String(guests),
        locale,
      },
      payment_intent_data: {
        description: `${property.name} · ${reference}`,
        metadata: { reference, bookingId: booking.id },
      },
      success_url: `${SITE_URL}${href(locale, `booking/${reference}`)}?paid=1`,
      cancel_url: `${SITE_URL}${href(locale, 'book')}?cancelled=1`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    if (!session.url) throw new Error('Stripe returned no checkout URL');

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url, reference });
  } catch (error) {
    console.error('[checkout] stripe failed, releasing held dates', error);
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
    return NextResponse.json({ error: 'SERVER' }, { status: 500 });
  }
}
