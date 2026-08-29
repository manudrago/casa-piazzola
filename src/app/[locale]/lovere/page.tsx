import type { Metadata } from 'next';
import { getDictionary, href, locales } from '@/lib/i18n';
import { allImages } from '@/lib/images';
import DestinationSection from '@/components/DestinationSection';
import DiscoverLovere from '@/components/DiscoverLovere';
import BeyondLovere from '@/components/BeyondLovere';
import OneDaySection from '@/components/OneDaySection';
import BookingInvite from '@/components/BookingInvite';
import LightboxProvider from '@/components/LightboxProvider';
import MobileBookingBar from '@/components/MobileBookingBar';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const d = getDictionary(locale);
  return {
    title: d.seo.lovereTitle,
    description: d.seo.lovereDescription,
    alternates: {
      canonical: href(locale, 'lovere'),
      languages: Object.fromEntries(locales.map((l) => [l, href(l, 'lovere')])),
    },
  };
}

export default async function LoverePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const d = getDictionary(locale);

  return (
    <LightboxProvider images={allImages} locale={locale} d={d}>
      <DestinationSection locale={locale} d={d} />
      <DiscoverLovere locale={locale} d={d} />
      <BeyondLovere locale={locale} d={d} />
      <OneDaySection locale={locale} d={d} />
      <BookingInvite locale={locale} d={d} />
      <MobileBookingBar locale={locale} d={d} />
    </LightboxProvider>
  );
}
