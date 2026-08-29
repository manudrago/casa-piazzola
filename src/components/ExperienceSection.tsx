import Photo from './Photo';
import Reveal from './Reveal';
import { image } from '@/lib/images';
import type { Dictionary } from '@/lib/i18n';

/**
 * "Make yourself at home in Lovere" — nine suggestions, three of which carry a
 * photograph. Deliberately not a grid of nine identical cards: the picture
 * appears where it earns its place, and the rest is type.
 */

const WITH_IMAGE: Record<number, string> = {
  0: 'exp-morning',
  3: 'exp-sunset',
  7: 'exp-monteisola',
};

export default function ExperienceSection({ locale, d }: { locale: string; d: Dictionary }) {
  return (
    <section className="bg-paper py-section" id="experience">
      <div className="shell">
        <div className="max-w-3xl">
          <Reveal as="p" className="eyebrow">
            {d.experience.eyebrow}
          </Reveal>
          <Reveal as="h2" delay={80} className="mt-5 text-display-md font-light">
            {d.experience.title}
          </Reveal>
          <Reveal as="p" delay={150} className="lede mt-7">
            {d.experience.lede}
          </Reveal>
        </div>

        <div className="mt-16 grid gap-x-12 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {d.experience.items.map((item, i) => {
            const imageId = WITH_IMAGE[i];
            return (
              <Reveal key={item.title} delay={(i % 3) * 90} className="group">
                <div className="flex h-full flex-col border-t border-stone py-8">
                  <span className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {imageId && (
                    <div className="frame frame-hover mt-6">
                      <Photo
                        img={image(imageId)}
                        locale={locale}
                        ratio="4 / 3"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  <h3 className="mt-6 font-display text-[1.5rem] font-light leading-tight text-charcoal">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[0.93rem] leading-relaxed text-ink/80">{item.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
