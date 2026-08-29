'use client';

import Photo from './Photo';
import Reveal from './Reveal';
import { image } from '@/lib/images';
import { useLightbox } from './LightboxProvider';
import type { Dictionary } from '@/lib/i18n';

/**
 * "Further afield" — the excursions the lake is a base for.
 *
 * Given a different rhythm from Discover Lovere on purpose: a sticky title on
 * the left and an indexed run of entries on the right, each with its own
 * photograph and two facts a guest actually plans around — how far, and when
 * it is worth going. Discover alternates left/right blocks; if this section
 * did the same the two would blur into one another on the same page.
 */
export default function BeyondLovere({ locale, d }: { locale: string; d: Dictionary }) {
  const { open } = useLightbox();

  return (
    <section className="bg-ivory py-section" id="beyond">
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <Reveal as="p" className="eyebrow">
              {d.beyond.eyebrow}
            </Reveal>
            <Reveal as="h2" delay={80} className="mt-5 text-display-md font-light">
              {d.beyond.title}
            </Reveal>
            <Reveal as="p" delay={150} className="lede mt-7">
              {d.beyond.lede}
            </Reveal>
            <Reveal as="p" delay={210} className="mt-8 max-w-sm text-[0.8rem] leading-relaxed text-muted">
              {d.beyond.note}
            </Reveal>
          </div>
        </div>

        <ol className="lg:col-span-7 lg:col-start-6">
          {d.beyond.items.map((item, i) => {
            const img = image(`beyond-${item.key}`);

            return (
              <li key={item.key}>
                <Reveal className="border-t border-stone py-12 first:pt-0 lg:py-16">
                  {/* An entry with no photograph yet reads as a text block, not
                      as an empty grey frame. Better a quiet gap than a hole. */}
                  {img.src && (
                    <button
                      type="button"
                      onClick={() => open(img.id)}
                      className="frame frame-hover block w-full cursor-zoom-in"
                      aria-label={item.title}
                    >
                      <Photo
                        img={img}
                        locale={locale}
                        ratio="16 / 10"
                        sizes="(max-width: 1024px) 100vw, 55vw"
                      />
                    </button>
                  )}

                  <div
                    className={`flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6 ${
                      img.src ? 'mt-8' : ''
                    }`}
                  >
                    <span className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="font-display text-display-sm font-light leading-[1.1]">
                        {item.title}
                      </h3>
                      <p className="mt-2 font-sans text-[0.68rem] uppercase tracking-[0.2em] text-olive-deep">
                        {item.place}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 max-w-2xl text-[0.98rem] leading-[1.8] text-ink/85">
                    {item.body}
                  </p>

                  <dl className="mt-7 flex flex-wrap gap-x-12 gap-y-4">
                    <div>
                      <dt className="font-sans text-[0.58rem] uppercase tracking-[0.2em] text-muted">
                        {d.beyond.distanceLabel}
                      </dt>
                      <dd className="mt-1 font-display text-[1.15rem] text-charcoal">
                        {item.distance}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-sans text-[0.58rem] uppercase tracking-[0.2em] text-muted">
                        {d.beyond.seasonLabel}
                      </dt>
                      <dd className="mt-1 font-display text-[1.15rem] text-charcoal">
                        {item.season}
                      </dd>
                    </div>
                  </dl>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
