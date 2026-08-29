import Link from 'next/link';
import Photo from './Photo';
import { image } from '@/lib/images';
import { href, type Dictionary } from '@/lib/i18n';

/**
 * Full-bleed opening frame. One photograph, three lines of type, two ways in.
 * The image is `priority` and the only LCP candidate on the page.
 */
export default function Hero({
  locale,
  d,
  imageId,
}: {
  locale: string;
  d: Dictionary;
  imageId: string;
}) {
  const img = image(imageId);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full animate-slow-zoom">
          <Photo
            img={img}
            locale={locale}
            fill
            priority
            quality={88}
            sizes="100vw"
            className="h-full w-full"
          />
        </div>
        <div className="veil" />
      </div>

      <div className="shell pb-16 pt-40 sm:pb-20 lg:pb-24">
        <p className="eyebrow animate-veil-up text-ivory/80" style={{ animationDelay: '120ms' }}>
          {d.hero.place}
        </p>

        <h1
          className="mt-6 max-w-[15ch] animate-veil-up font-display text-display-lg font-light text-ivory text-shadow-soft"
          style={{ animationDelay: '260ms' }}
        >
          {d.hero.statement}
        </h1>

        <p
          className="mt-7 max-w-md animate-veil-up text-[1.02rem] leading-relaxed text-ivory/90 text-shadow-soft"
          style={{ animationDelay: '440ms' }}
        >
          {d.hero.sub}
        </p>

        <div
          className="mt-11 flex animate-veil-up flex-col gap-3 sm:flex-row sm:items-center sm:gap-5"
          style={{ animationDelay: '600ms' }}
        >
          <Link href={href(locale, 'book')} className="btn-solid-invert">
            {d.hero.primary}
          </Link>
          <Link href={href(locale, 'apartment')} className="btn-ghost-invert">
            {d.hero.secondary}
          </Link>
        </div>
      </div>

      <ScrollCue label={d.hero.scroll} />
    </section>
  );
}

function ScrollCue({ label }: { label: string }) {
  return (
    <div
      className="pointer-events-none absolute bottom-8 right-6 hidden items-center gap-4 lg:flex"
      aria-hidden="true"
    >
      <span className="font-sans text-[0.6rem] uppercase tracking-[0.3em] text-ivory/60">
        {label}
      </span>
      <span className="relative block h-14 w-px overflow-hidden bg-ivory/25">
        <span className="absolute inset-x-0 top-0 h-5 animate-[scroll-cue_2.6s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-ivory/85" />
      </span>
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes scroll-cue{0%{transform:translateY(-100%)}55%,100%{transform:translateY(340%)}}`,
        }}
      />
    </div>
  );
}
