import type { Metadata } from 'next';
import { getDictionary, href, locales } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import LocationMap from '@/components/LocationMap';
import BookingInvite from '@/components/BookingInvite';
import MobileBookingBar from '@/components/MobileBookingBar';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const d = getDictionary(locale);
  return {
    title: d.seo.locationTitle,
    description: d.seo.locationDescription,
    alternates: {
      canonical: href(locale, 'location'),
      languages: Object.fromEntries(locales.map((l) => [l, href(l, 'location')])),
    },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const d = getDictionary(locale);

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={d.location.eyebrow}
        title={d.location.title}
        lede={d.location.body}
        imageId="discover-lake"
      />
      <LocationMap d={d} />
      <BookingInvite locale={locale} d={d} />
      <MobileBookingBar locale={locale} d={d} />
    </>
  );
}
