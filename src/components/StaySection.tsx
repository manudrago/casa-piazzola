import Link from 'next/link';
import Photo from './Photo';
import Reveal from './Reveal';
import Parallax from './Parallax';
import { image } from '@/lib/images';
import { href, type Dictionary } from '@/lib/i18n';
import { property } from '@/lib/property';

/**
 * "Stay in the heart of Lovere" — the editorial introduction to the apartment.
 * A tall photograph carries the left half; the right is type, facts and a
 * single call to action. Every fact shown here is traceable to the listing.
 */
export default function StaySection({ locale, d }: { locale: string; d: Dictionary }) {
  const c = property.confirmed;
  const h = property.hostConfigurable;

  const facts = [
    { label: d.facts.guests, value: String(h.maxGuests) },
    { label: d.facts.bedroom, value: String(c.bedrooms) },
    { label: d.facts.bathroom, value: String(c.bathrooms) },
    { label: d.facts.size, value: `${c.interiorSizeSqm} m²` },
    { label: d.facts.floor, value: d.facts.floorValue },
    { label: d.facts.location, value: d.facts.locationValue },
  ];

  return (
    <section className="bg-ivory py-section" id="stay">
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-6">
          <Parallax speed={0.1} className="relative h-[62vh] min-h-[420px] lg:h-[86vh]">
            <Photo
              img={image('stay-hero')}
              locale={locale}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full"
            />
          </Parallax>
        </Reveal>

        <div className="flex flex-col justify-center lg:col-span-5 lg:col-start-8">
          <Reveal as="p" className="eyebrow">
            {d.stay.eyebrow}
          </Reveal>

          <Reveal as="h2" delay={80} className="mt-5 text-display-md font-light">
            {d.stay.title}
          </Reveal>

          <div className="mt-8 space-y-5 text-[1.02rem] leading-[1.75] text-ink/90">
            {d.stay.body.map((paragraph, i) => (
              <Reveal as="p" key={i} delay={140 + i * 70}>
                {paragraph}
              </Reveal>
            ))}
          </div>

          <Reveal delay={280} className="mt-12">
            <h3 className="eyebrow">{d.stay.factsTitle}</h3>
            <dl className="mt-6 grid grid-cols-2 gap-x-8 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="border-t border-stone py-4">
                  <dt className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-muted">
                    {f.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-[1.3rem] leading-tight text-charcoal">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={340} className="mt-10">
            <h3 className="eyebrow">{d.stay.amenitiesTitle}</h3>
            <ul className="mt-5 space-y-2.5">
              {d.stay.amenities.map((a) => (
                <li key={a} className="flex items-start gap-3 text-[0.95rem] text-ink/85">
                  <span aria-hidden className="mt-[0.62rem] block h-px w-4 shrink-0 bg-olive" />
                  {a}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={400} className="mt-11">
            <Link href={href(locale, 'book')} className="btn-ghost">
              {d.stay.cta}
            </Link>
            <p className="mt-6 max-w-sm text-[0.75rem] leading-relaxed text-muted">
              {d.stay.sourceNote}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
