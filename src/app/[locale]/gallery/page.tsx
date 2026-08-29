import type { Metadata } from 'next';
import { getDictionary, href, locales } from '@/lib/i18n';
import { allImages, present } from '@/lib/images';
import GalleryGrid from '@/components/GalleryGrid';
import LightboxProvider from '@/components/LightboxProvider';
import BookingInvite from '@/components/BookingInvite';
import MobileBookingBar from '@/components/MobileBookingBar';
import Reveal from '@/components/Reveal';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const d = getDictionary(locale);
  return {
    title: d.seo.galleryTitle,
    description: d.seo.galleryDescription,
    alternates: {
      canonical: href(locale, 'gallery'),
      languages: Object.fromEntries(locales.map((l) => [l, href(l, 'gallery')])),
    },
  };
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const d = getDictionary(locale);

  /**
   * The order matters: apartment and destination frames are interleaved rather
   * than grouped, so scrolling the page makes the argument the headline states.
   */
  const ordered = present(allImages).sort((a, b) => {
    const rank = (c: string) => (c === 'apartment' ? 0 : c === 'lovere' ? 1 : 2);
    return rank(a.category) - rank(b.category) || a.id.localeCompare(b.id);
  });

  const interleaved: typeof ordered = [];
  const apartment = ordered.filter((i) => i.category === 'apartment');
  const rest = ordered.filter((i) => i.category !== 'apartment');
  const max = Math.max(apartment.length, rest.length);
  for (let i = 0; i < max; i++) {
    if (apartment[i]) interleaved.push(apartment[i]);
    if (rest[i]) interleaved.push(rest[i]);
    if (rest[i + max]) interleaved.push(rest[i + max]);
  }
  for (const img of rest) if (!interleaved.includes(img)) interleaved.push(img);

  return (
    <LightboxProvider images={allImages} locale={locale} d={d}>
      <div className="pb-section" style={{ paddingTop: 'calc(var(--header-h) + 5rem)' }}>
        <div className="shell mb-14 max-w-3xl">
          <Reveal as="p" className="eyebrow">
            {d.gallery.eyebrow}
          </Reveal>
          <Reveal as="h1" delay={80} className="mt-5 text-display-md font-light">
            {d.gallery.title}
          </Reveal>
          <Reveal as="p" delay={150} className="lede mt-7">
            {d.gallery.lede}
          </Reveal>
        </div>

        <GalleryGrid images={interleaved} locale={locale} d={d} />
      </div>

      <BookingInvite locale={locale} d={d} />
      <MobileBookingBar locale={locale} d={d} />
    </LightboxProvider>
  );
}
