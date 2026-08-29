import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getDictionary, href, fill } from '@/lib/i18n';
import { formatLongDate } from '@/lib/dates';
import { formatMoney } from '@/lib/pricing';
import { BOOKING_STATUS } from '@/lib/constants';
import { property } from '@/lib/property';
import Photo from '@/components/Photo';
import Reveal from '@/components/Reveal';
import Parallax from '@/components/Parallax';
import { image } from '@/lib/images';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The confirmation page. Reached by redirect from Stripe and by the link in
 * the confirmation email, so it must stand on its own weeks later.
 *
 * The booking reference is the only credential. It is 6 characters from a
 * 31-character alphabet — fine for a page showing a name and dates, and the
 * page is noindex. Anything more sensitive would need a signed link.
 */
export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; reference: string }>;
}) {
  const { locale, reference } = await params;
  const d = getDictionary(locale);
  const h = property.hostConfigurable;

  const booking = await prisma.booking.findUnique({
    where: { reference: reference.toUpperCase() },
  });

  if (!booking) {
    return (
      <Shell locale={locale} title={d.confirmation.notFound} imageId="lovere-hero">
        <p className="mt-6 max-w-prose text-[1rem] leading-relaxed text-ink/85">
          {d.confirmation.notFoundBody}
        </p>
        <Link href={href(locale, 'contact')} className="btn-ghost mt-9">
          {d.confirmation.contactHost}
        </Link>
      </Shell>
    );
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    return (
      <Shell locale={locale} title={d.confirmation.pending} imageId="lovere-hero">
        <p className="mt-6 max-w-prose text-[1rem] leading-relaxed text-ink/85">
          {d.confirmation.pendingBody}
        </p>
        <Link href={href(locale, 'book')} className="btn-solid mt-9">
          {d.hero.primary}
        </Link>
      </Shell>
    );
  }

  const rows = [
    { label: d.confirmation.reference, value: booking.reference },
    { label: d.confirmation.guest, value: booking.guestName },
    {
      label: d.confirmation.checkIn,
      value: `${formatLongDate(booking.checkIn, locale)} · ${h.checkInFrom}`,
    },
    {
      label: d.confirmation.checkOut,
      value: `${formatLongDate(booking.checkOut, locale)} · ${h.checkOutBy}`,
    },
    { label: d.confirmation.guests, value: String(booking.guests) },
    { label: d.confirmation.nights, value: String(booking.nights) },
    { label: d.confirmation.totalPaid, value: formatMoney(booking.total, locale) },
  ];

  return (
    <>
      <section className="relative isolate flex min-h-[72svh] items-end overflow-hidden text-ivory">
        <Parallax speed={0.14} className="absolute inset-0 -z-10 h-full w-full">
          <Photo
            img={image('lovere-hero')}
            locale={locale}
            fill
            priority
            sizes="100vw"
            className="h-full w-full"
          />
        </Parallax>
        <div className="veil absolute inset-0 -z-10" />

        <div className="shell pb-16 pt-40 lg:pb-20">
          <p className="eyebrow animate-veil-up text-ivory/75">{d.booking.stepConfirmed}</p>
          <h1
            className="mt-6 max-w-[14ch] animate-veil-up text-display-lg font-light text-ivory text-shadow-soft"
            style={{ animationDelay: '200ms' }}
          >
            {d.confirmation.title}
          </h1>
          <p
            className="mt-7 max-w-md animate-veil-up text-[1.02rem] leading-relaxed text-ivory/85"
            style={{ animationDelay: '380ms' }}
          >
            {d.confirmation.lede}
          </p>
        </div>
      </section>

      <section className="bg-ivory py-section">
        <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <h2 className="eyebrow">{d.booking.summaryTitle}</h2>
            <dl className="mt-7">
              {rows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-baseline justify-between gap-6 border-b border-stone py-4"
                >
                  <dt className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-muted">
                    {r.label}
                  </dt>
                  <dd className="text-right font-display text-[1.25rem] text-charcoal">
                    {r.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal>
              <h2 className="eyebrow">{d.confirmation.address}</h2>
              <p className="mt-5 text-[1rem] leading-[1.8] text-ink/90">
                {d.confirmation.addressBody}
              </p>
            </Reveal>

            <Reveal delay={100} className="mt-12">
              <h2 className="eyebrow">{d.confirmation.arrivalTitle}</h2>
              <p className="mt-5 text-[1rem] leading-[1.8] text-ink/90">
                {fill(d.confirmation.arrivalBody, { in: h.checkInFrom, out: h.checkOutBy })}
              </p>
            </Reveal>

            <Reveal delay={160} className="mt-12">
              <h2 className="eyebrow">{d.confirmation.beforeTitle}</h2>
              <ul className="mt-5 space-y-3">
                {d.confirmation.beforeItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.95rem] text-ink/85">
                    <span aria-hidden className="mt-[0.62rem] block h-px w-4 shrink-0 bg-olive" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={220} className="mt-12 border-t border-stone pt-8">
              <p className="text-[0.95rem] text-ink/85">{d.confirmation.questions}</p>
              <div className="mt-5 flex flex-wrap gap-4">
                <Link href={href(locale, `contact?ref=${booking.reference}`)} className="btn-ghost">
                  {d.confirmation.contactHost}
                </Link>
                <Link href={href(locale, 'lovere')} className="btn-ghost">
                  {d.nav.lovere}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

function Shell({
  locale,
  title,
  imageId,
  children,
}: {
  locale: string;
  title: string;
  imageId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-section" style={{ paddingTop: 'calc(var(--header-h) + 5rem)' }}>
      <div className="shell grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h1 className="text-display-md font-light">{title}</h1>
          {children}
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <div className="frame">
            <Photo img={image(imageId)} locale={locale} ratio="4 / 3" sizes="(max-width:1024px) 100vw, 40vw" />
          </div>
        </div>
      </div>
    </div>
  );
}
