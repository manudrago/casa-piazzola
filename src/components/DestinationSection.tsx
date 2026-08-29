import Photo from './Photo';
import Reveal from './Reveal';
import Parallax from './Parallax';
import { image } from '@/lib/images';
import type { Dictionary } from '@/lib/i18n';

/**
 * "Welcome to Lovere" — the pivot from apartment to place.
 *
 * A full-height parallax plate, then the town's own words. The Montagu line is
 * genuine: she wrote it of Lovere after arriving in 1747, and it is the reason
 * the town still calls itself the most romantic village in Italy.
 */
export default function DestinationSection({ locale, d }: { locale: string; d: Dictionary }) {
  return (
    <section className="bg-charcoal text-ivory" id="lovere">
      <Parallax speed={0.16} className="relative h-[86svh] min-h-[520px]">
        <Photo
          img={image('lovere-hero')}
          locale={locale}
          fill
          sizes="100vw"
          quality={86}
          className="h-full w-full"
        />
      </Parallax>

      <div className="shell relative -mt-24 pb-section lg:-mt-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal className="bg-charcoal pr-8 pt-10 lg:pr-16 lg:pt-14">
              <p className="eyebrow text-ivory/55">{d.destination.eyebrow}</p>
              <h2 className="mt-5 text-display-lg font-light text-ivory">
                {d.destination.title}
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:col-start-8 lg:pt-32">
            <Reveal delay={120}>
              <blockquote className="font-display text-[clamp(1.4rem,2.4vw,2rem)] font-light italic leading-[1.4] text-ivory/90">
                {d.destination.lede}
              </blockquote>
              <cite className="mt-5 block font-sans text-[0.68rem] not-italic uppercase tracking-[0.18em] text-ivory/45">
                {d.destination.ledeAttribution}
              </cite>
            </Reveal>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-6 lg:col-span-6 lg:col-start-1">
            {d.destination.body.map((p, i) => (
              <Reveal as="p" key={i} delay={i * 90} className="text-[1.02rem] leading-[1.8] text-ivory/75">
                {p}
              </Reveal>
            ))}
          </div>

          <Reveal delay={180} className="lg:col-span-5 lg:col-start-8 lg:self-end">
            <div className="border-t border-ivory/20 pt-7">
              <p className="font-display text-[clamp(1.25rem,2vw,1.6rem)] font-light leading-[1.45] text-ivory/85">
                {d.destination.quiet}
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Two plates that carry the eye out of the dark section and back to ivory. */}
      <div className="grid gap-px bg-ivory/10 sm:grid-cols-2">
        {['lovere-water', 'lovere-streets'].map((id, i) => (
          <Reveal key={id} delay={i * 120}>
            <div className="frame frame-hover">
              <Photo
                img={image(id)}
                locale={locale}
                ratio="4 / 3"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
