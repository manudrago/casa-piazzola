import type { Metadata } from 'next';
import { getDictionary, href, locales } from '@/lib/i18n';
import { calendar } from '@/lib/availability';
import { property } from '@/lib/property';
import BookingWidget from '@/components/BookingWidget';
import Reveal from '@/components/Reveal';
import Photo from '@/components/Photo';
import { image } from '@/lib/images';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const d = getDictionary(locale);
  return {
    title: d.seo.bookTitle,
    description: d.seo.bookDescription,
    alternates: {
      canonical: href(locale, 'book'),
      languages: Object.fromEntries(locales.map((l) => [l, href(l, 'book')])),
    },
  };
}

export default async function BookPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const d = getDictionary(locale);

  // Rendered on the server so the calendar is correct on first paint — no
  // empty grid, no layout shift, and it works before hydration.
  const data = await calendar();
  const h = property.hostConfigurable;

  return (
    <div className="pb-section" style={{ paddingTop: 'calc(var(--header-h) + 4rem)' }}>
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal as="p" className="eyebrow">
              {d.booking.eyebrow}
            </Reveal>
            <Reveal as="h1" delay={80} className="mt-5 text-display-md font-light">
              {d.booking.title}
            </Reveal>
            <Reveal as="p" delay={150} className="lede mt-6 max-w-prose">
              {d.booking.lede}
            </Reveal>
          </div>

          <Reveal delay={120} className="hidden lg:col-span-4 lg:col-start-9 lg:block">
            <div className="frame">
              <Photo img={image('stay-hero')} locale={locale} ratio="4 / 3" sizes="33vw" />
            </div>
          </Reveal>
        </div>

        <div className="mt-16">
          <BookingWidget locale={locale} d={d} initial={data} />
        </div>

        <div className="mt-20 grid gap-10 border-t border-stone pt-12 sm:grid-cols-3">
          <div>
            <h2 className="eyebrow">{d.confirmation.arrivalTitle}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/85">
              {d.booking.checkIn} {h.checkInFrom} · {d.booking.checkOut} {h.checkOutBy}
            </p>
          </div>
          <div>
            <h2 className="eyebrow">{d.facts.floor}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/85">{h.accessNote}</p>
          </div>
          <div>
            <h2 className="eyebrow">{d.contact.title}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/85">
              {d.contact.responseNote}
            </p>
            <a href={href(locale, 'contact')} className="link-rule mt-3 inline-block text-[0.95rem]">
              {d.confirmation.contactHost}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
