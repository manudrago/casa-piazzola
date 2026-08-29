'use client';

import { useMemo, useState } from 'react';
import Photo from './Photo';
import Reveal from './Reveal';
import { useLightbox } from './LightboxProvider';
import type { SiteImage } from '@/lib/images';
import type { Dictionary } from '@/lib/i18n';

/**
 * The full gallery. Apartment and destination photography deliberately sit in
 * the same stream — the point of the page is that the two are one offer.
 *
 * The grid is a mosaic rather than a uniform tile: every fourth image runs
 * wide, every seventh runs tall, so the rhythm never settles into a catalogue.
 */

type Filter = 'all' | 'apartment' | 'lovere' | 'lake';

export default function GalleryGrid({
  images,
  locale,
  d,
}: {
  images: SiteImage[];
  locale: string;
  d: Dictionary;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const { open } = useLightbox();

  const shown = useMemo(
    () => (filter === 'all' ? images : images.filter((i) => i.category === filter)),
    [images, filter],
  );

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: d.gallery.filterAll },
    { key: 'apartment', label: d.gallery.filterApartment },
    { key: 'lovere', label: d.gallery.filterLovere },
    { key: 'lake', label: d.gallery.filterLake },
  ];

  return (
    <>
      <div className="shell">
        <div
          role="tablist"
          aria-label={d.gallery.eyebrow}
          className="no-scrollbar -mx-6 flex gap-8 overflow-x-auto px-6 sm:mx-0 sm:px-0"
        >
          {filters.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 border-b pb-3 font-sans text-[0.7rem] uppercase tracking-[0.2em] transition-colors duration-400 ${
                filter === f.key
                  ? 'border-charcoal text-charcoal'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="shell mt-16 text-[0.95rem] text-muted">{d.gallery.empty}</p>
      ) : (
        <div className="shell mt-12">
          <div className="grid auto-rows-[minmax(0,auto)] grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-6">
            {shown.map((img, i) => {
              const wide = i % 7 === 0;
              const tall = i % 7 === 3;
              const span = wide
                ? 'col-span-2 lg:col-span-4'
                : tall
                  ? 'col-span-2 lg:col-span-2'
                  : 'col-span-1 lg:col-span-2';
              const ratio = wide ? '16 / 9' : tall ? '3 / 4' : '1 / 1';

              return (
                <Reveal key={img.id} delay={(i % 3) * 80} className={span}>
                  <button
                    type="button"
                    onClick={() => open(img.id)}
                    className="frame frame-hover group block w-full cursor-zoom-in"
                    aria-label={d.gallery.open}
                  >
                    <Photo
                      img={img}
                      locale={locale}
                      ratio={ratio}
                      sizes={
                        wide
                          ? '(max-width: 1024px) 100vw, 66vw'
                          : '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw'
                      }
                    />
                    <span className="veil-soft opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
