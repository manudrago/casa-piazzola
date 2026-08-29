import { getDictionary } from '@/lib/i18n';
import { allImages, bySection, image, present } from '@/lib/images';
import Hero from '@/components/Hero';
import StaySection from '@/components/StaySection';
import RoomSequence from '@/components/RoomSequence';
import DestinationSection from '@/components/DestinationSection';
import DiscoverLovere from '@/components/DiscoverLovere';
import ExperienceSection from '@/components/ExperienceSection';
import OneDaySection from '@/components/OneDaySection';
import GalleryStrip from '@/components/GalleryStrip';
import LocationMap from '@/components/LocationMap';
import BookingInvite from '@/components/BookingInvite';
import LightboxProvider from '@/components/LightboxProvider';
import MobileBookingBar from '@/components/MobileBookingBar';

/**
 * The homepage tells the whole story in one scroll:
 *   arrive → the apartment → the rooms → fall for Lovere → imagine the days
 *   → see it all → know where it is → book.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const d = getDictionary(locale);

  // Alternates apartment and destination frames — the strip is the argument
  // that the two belong to each other.
  const strip = present([
    ...bySection('living').slice(0, 1),
    image('discover-old-town'),
    ...bySection('sleep').slice(0, 1),
    image('lovere-hero'),
    ...bySection('kitchen').slice(0, 1),
    image('discover-lake'),
    ...bySection('details').slice(0, 1),
    image('exp-sunset'),
    image('day-night'),
  ]).slice(0, 9);

  return (
    <LightboxProvider images={allImages} locale={locale} d={d}>
      <Hero locale={locale} d={d} imageId="hero" />
      <StaySection locale={locale} d={d} />
      <RoomSequence locale={locale} d={d} />
      <DestinationSection locale={locale} d={d} />
      <DiscoverLovere locale={locale} d={d} />
      <ExperienceSection locale={locale} d={d} />
      <OneDaySection locale={locale} d={d} />
      <GalleryStrip images={strip} locale={locale} d={d} />
      <LocationMap d={d} />
      <BookingInvite locale={locale} d={d} />
      <MobileBookingBar locale={locale} d={d} />
    </LightboxProvider>
  );
}
