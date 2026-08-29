import type { Metadata } from 'next';
import { getDictionary, href, locales } from '@/lib/i18n';
import { allImages } from '@/lib/images';
import { property } from '@/lib/property';
import PageHeader from '@/components/PageHeader';
import StaySection from '@/components/StaySection';
import RoomSequence from '@/components/RoomSequence';
import BookingInvite from '@/components/BookingInvite';
import LightboxProvider from '@/components/LightboxProvider';
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
    title: d.seo.apartmentTitle,
    description: d.seo.apartmentDescription,
    alternates: {
      canonical: href(locale, 'apartment'),
      languages: Object.fromEntries(locales.map((l) => [l, href(l, 'apartment')])),
    },
  };
}

export default async function ApartmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const d = getDictionary(locale);
  const c = property.confirmed;
  const h = property.hostConfigurable;

  /** The full technical record — everything the listing states, and nothing else. */
  const specs = [
    { label: d.facts.size, value: `${c.interiorSizeSqm} m²` },
    { label: d.stay.factsTitle, value: c.layout },
    { label: d.facts.guests, value: String(h.maxGuests) },
    { label: d.facts.floor, value: d.facts.floorValue },
    { label: d.facts.heating, value: d.facts.heatingValue },
    { label: d.facts.built, value: d.facts.builtValue },
    { label: d.facts.energy, value: `${c.energyClass} · ${c.energyValue} kWh/m²·y` },
    { label: d.facts.location, value: d.facts.locationValue },
  ];

  return (
    <LightboxProvider images={allImages} locale={locale} d={d}>
      <PageHeader
        locale={locale}
        eyebrow={d.stay.eyebrow}
        title={d.stay.title}
        lede={d.hero.sub}
        imageId="stay-hero"
      />

      <StaySection locale={locale} d={d} />
      <RoomSequence locale={locale} d={d} />

      <section className="bg-ivory py-section">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal as="h2" className="text-display-sm font-light">
              {d.stay.factsTitle}
            </Reveal>
            <Reveal as="p" delay={90} className="mt-6 max-w-sm text-[0.85rem] leading-relaxed text-muted">
              {d.stay.sourceNote}
            </Reveal>
            <Reveal delay={140} className="mt-6">
              <a
                href={property.source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="link-rule text-[0.8rem] text-muted"
              >
                {property.source.label}
              </a>
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:col-span-7 lg:col-start-6">
            <dl>
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="grid grid-cols-1 gap-1 border-t border-stone py-5 sm:grid-cols-12 sm:gap-6"
                >
                  <dt className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-muted sm:col-span-4">
                    {s.label}
                  </dt>
                  <dd className="text-[1rem] leading-relaxed text-charcoal sm:col-span-8">
                    {s.value}
                  </dd>
                </div>
              ))}
              <div className="grid grid-cols-1 gap-1 border-y border-stone py-5 sm:grid-cols-12 sm:gap-6">
                <dt className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-muted sm:col-span-4">
                  {d.stay.walkTitle}
                </dt>
                <dd className="text-[1rem] leading-relaxed text-charcoal sm:col-span-8">
                  {c.walkable.join(' · ')}
                </dd>
              </div>
            </dl>

            <p className="mt-8 max-w-xl text-[0.88rem] leading-relaxed text-ink/75">
              {h.accessNote}
            </p>
          </Reveal>
        </div>
      </section>

      <BookingInvite locale={locale} d={d} />
      <MobileBookingBar locale={locale} d={d} />
    </LightboxProvider>
  );
}
