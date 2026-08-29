import Photo from './Photo';
import Reveal from './Reveal';
import Parallax from './Parallax';
import { image } from '@/lib/images';
import type { Dictionary } from '@/lib/i18n';

/**
 * "One day in Lovere" — a timeline as an editorial spread.
 * A hairline runs down the left with the hours marked on it; the photographs
 * appear at three points in the day so the section reads as a rhythm rather
 * than a list.
 */

// 22:00 deliberately has no inline photograph — the night frame closes the
// whole section full-bleed instead, which is where it earns its keep.
const WITH_IMAGE: Record<number, string> = {
  1: 'day-morning',
  4: 'day-aperitivo',
};

export default function OneDaySection({ locale, d }: { locale: string; d: Dictionary }) {
  return (
    <section className="bg-ivory py-section" id="one-day">
      <div className="shell">
        <div className="max-w-3xl">
          <Reveal as="p" className="eyebrow">
            {d.day.eyebrow}
          </Reveal>
          <Reveal as="h2" delay={80} className="mt-5 text-display-md font-light">
            {d.day.title}
          </Reveal>
          <Reveal as="p" delay={150} className="lede mt-7">
            {d.day.lede}
          </Reveal>
        </div>

        <ol className="mt-20 border-l border-stone">
          {d.day.items.map((item, i) => {
            const imageId = WITH_IMAGE[i];
            return (
              <li key={item.time} className="relative pl-8 sm:pl-14">
                <Reveal className="pb-12 sm:pb-16">
                  <span
                    aria-hidden
                    className="absolute left-0 top-[0.6rem] block h-px w-5 bg-sand sm:w-9"
                  />
                  <div className="grid gap-6 lg:grid-cols-12 lg:gap-12">
                    <div className="lg:col-span-3">
                      <time className="font-display text-[1.9rem] font-light leading-none text-olive-deep">
                        {item.time}
                      </time>
                    </div>

                    <div className="lg:col-span-5">
                      <h3 className="font-display text-[1.6rem] font-light leading-tight text-charcoal">
                        {item.title}
                      </h3>
                      <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink/80">
                        {item.body}
                      </p>
                    </div>

                    {imageId && (
                      <div className="lg:col-span-4">
                        <div className="frame frame-hover">
                          <Photo
                            img={image(imageId)}
                            locale={locale}
                            ratio="5 / 4"
                            sizes="(max-width: 1024px) 100vw, 30vw"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The day closes on the town from above, lit. Full width, no crop. */}
      <figure className="mt-8 lg:mt-16">
        <Reveal>
          <Parallax speed={0.13} className="relative h-[66svh] min-h-[380px] w-full">
            <Photo
              img={image('day-night')}
              locale={locale}
              fill
              sizes="100vw"
              quality={86}
              className="h-full w-full"
            />
          </Parallax>
        </Reveal>
        <figcaption className="shell mt-6">
          <Reveal as="p" className="max-w-md font-display text-[1.3rem] font-light italic leading-snug text-ink/85">
            {d.day.closing}
          </Reveal>
        </figcaption>
      </figure>
    </section>
  );
}
