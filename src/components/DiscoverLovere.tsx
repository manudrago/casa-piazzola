import Photo from './Photo';
import Reveal from './Reveal';
import { image } from '@/lib/images';
import type { Dictionary } from '@/lib/i18n';

/**
 * Five editorial blocks, alternating sides. Full-width photography, no cards,
 * no shadows — the picture does the work and the type sits beside it.
 */

const BLOCKS = [
  { key: 'oldTown', imageId: 'discover-old-town' },
  { key: 'lake', imageId: 'discover-lake' },
  { key: 'art', imageId: 'discover-art' },
  { key: 'food', imageId: 'discover-food' },
  { key: 'outdoors', imageId: 'discover-outdoors' },
] as const;

export default function DiscoverLovere({ locale, d }: { locale: string; d: Dictionary }) {
  return (
    <section className="bg-ivory py-section" id="discover">
      <div className="shell">
        <Reveal as="p" className="eyebrow">
          {d.discover.eyebrow}
        </Reveal>
        <Reveal as="h2" delay={80} className="mt-5 max-w-2xl text-display-md font-light">
          {d.discover.title}
        </Reveal>
      </div>

      <div className="mt-20 space-y-24 lg:space-y-32">
        {BLOCKS.map(({ key, imageId }, i) => {
          const block = d.discover[key];
          const flip = i % 2 === 1;

          return (
            <article key={key} className="shell">
              <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
                <Reveal
                  className={`lg:col-span-7 ${flip ? 'lg:order-2 lg:col-start-6' : 'lg:col-start-1'}`}
                >
                  <div className="frame frame-hover">
                    <Photo
                      img={image(imageId)}
                      locale={locale}
                      ratio="3 / 2"
                      sizes="(max-width: 1024px) 100vw, 58vw"
                    />
                  </div>
                </Reveal>

                <div
                  className={`lg:col-span-4 ${flip ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-9'}`}
                >
                  <Reveal delay={90}>
                    <span className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 font-display text-display-sm font-light">{block.title}</h3>
                    <p className="mt-6 text-[0.98rem] leading-[1.8] text-ink/85">{block.body}</p>
                    <p className="mt-7 flex items-center gap-3 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-olive-deep">
                      <span aria-hidden className="block h-px w-7 bg-olive" />
                      {block.tag}
                    </p>
                  </Reveal>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
