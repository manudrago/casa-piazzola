import type { Metadata } from 'next';
import { getDictionary, href, locales } from '@/lib/i18n';
import { allImages } from '@/lib/images';
import PageHeader from '@/components/PageHeader';
import ExperienceSection from '@/components/ExperienceSection';
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
    title: d.experience.title,
    description: d.experience.lede,
    alternates: {
      canonical: href(locale, 'experience'),
      languages: Object.fromEntries(locales.map((l) => [l, href(l, 'experience')])),
    },
  };
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const d = getDictionary(locale);

  return (
    <LightboxProvider images={allImages} locale={locale} d={d}>
      <PageHeader
        locale={locale}
        eyebrow={d.experience.eyebrow}
        title={d.experience.title}
        lede={d.experience.lede}
        imageId="exp-morning"
      />
      <ExperienceSection locale={locale} d={d} />
      <BeyondLovere locale={locale} d={d} />
      <OneDaySection locale={locale} d={d} />
      <BookingInvite locale={locale} d={d} />
      <MobileBookingBar locale={locale} d={d} />
    </LightboxProvider>
  );
}
