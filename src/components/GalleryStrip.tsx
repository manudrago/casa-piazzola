'use client';

import Link from 'next/link';
import Photo from './Photo';
import Reveal from './Reveal';
import { useLightbox } from './LightboxProvider';
import type { SiteImage } from '@/lib/images';
import { href, type Dictionary } from '@/lib/i18n';

/**
 * The homepage's gallery teaser: a horizontally scrollable strip, swipeable on
 * touch, that mixes apartment and destination frames. It ends with a card that
 * leads to the full gallery, so the strip has a natural stopping point.
 */
export default function GalleryStrip({
  images,
  locale,
  d,
}: {
  images: SiteImage[];
  locale: string;
  d: Dictionary;
}) {
  const { open } = useLightbox();

  return (
    <section className="bg-ivory py-section" id="gallery">
      <div className="shell">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Reveal as="p" className="eyebrow">
              {d.gallery.eyebrow}
            </Reveal>
            <Reveal as="h2" delay={80} className="mt-5 text-display-md font-light">
              {d.gallery.title}
            </Reveal>
          </div>
          <Reveal delay={140}>
            <Link href={href(locale, 'gallery')} className="btn-ghost whitespace-nowrap">
              {d.gallery.filterAll}
            </Link>
          </Reveal>
        </div>
      </div>

      <div className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:gap-6 sm:px-8 lg:px-12">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => open(img.id)}
            className="frame frame-hover w-[78vw] shrink-0 snap-start cursor-zoom-in sm:w-[46vw] lg:w-[30vw]"
            aria-label={d.gallery.open}
          >
            <Photo
              img={img}
              locale={locale}
              ratio={i % 3 === 1 ? '3 / 4' : '4 / 3'}
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 30vw"
            />
          </button>
        ))}

        <Link
          href={href(locale, 'gallery')}
          className="flex w-[60vw] shrink-0 snap-start items-center justify-center border border-stone
                     bg-paper text-center transition-colors duration-500 hover:bg-stone/40 sm:w-[32vw] lg:w-[20vw]"
        >
          <span className="px-8 font-display text-[1.5rem] font-light leading-tight text-charcoal">
            {d.gallery.lede}
          </span>
        </Link>
      </div>
    </section>
  );
}
