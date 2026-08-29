'use client';

import Photo from './Photo';
import Reveal from './Reveal';
import { bySection, type SiteImage } from '@/lib/images';
import type { Dictionary } from '@/lib/i18n';
import { useLightbox } from './LightboxProvider';

/**
 * The photo-first tour of the apartment: Living, Sleep, Kitchen, The details,
 * Your stay. Each section takes a different shape — full-bleed, offset pair,
 * tall single — so that scrolling through them feels like turning pages of a
 * magazine rather than reading a grid of thumbnails.
 */

type SectionKey = 'living' | 'sleep' | 'kitchen' | 'details' | 'yourStay';

// Layouts are chosen to match how many photographs each room actually has.
// If you add a third interior shot to a room, promote it to `trio` here.
const SEQUENCE: { key: SectionKey; layout: 'full' | 'pair' | 'offset' | 'trio' }[] = [
  { key: 'living', layout: 'offset' },
  { key: 'sleep', layout: 'pair' },
  { key: 'kitchen', layout: 'full' },
  { key: 'details', layout: 'pair' },
  { key: 'yourStay', layout: 'full' },
];

export default function RoomSequence({ locale, d }: { locale: string; d: Dictionary }) {
  return (
    <section className="bg-paper py-section" id="rooms">
      <div className="shell">
        <Reveal as="p" className="eyebrow">
          {d.rooms.eyebrow}
        </Reveal>
        <Reveal as="h2" delay={80} className="mt-5 max-w-2xl text-display-md font-light">
          {d.rooms.title}
        </Reveal>
      </div>

      <div className="mt-20 space-y-28 lg:space-y-40">
        {SEQUENCE.map(({ key, layout }, i) => (
          <RoomBlock
            key={key}
            locale={locale}
            index={i}
            title={d.rooms[key].title}
            body={d.rooms[key].body}
            images={bySection(key)}
            layout={layout}
            flip={i % 2 === 1}
          />
        ))}
      </div>
    </section>
  );
}

function RoomBlock({
  locale,
  index,
  title,
  body,
  images,
  layout,
  flip,
}: {
  locale: string;
  index: number;
  title: string;
  body: string;
  images: SiteImage[];
  layout: 'full' | 'pair' | 'offset' | 'trio';
  flip: boolean;
}) {
  const { open } = useLightbox();
  const num = String(index + 1).padStart(2, '0');

  const Caption = (
    <div className={`shell ${layout === 'full' ? 'mt-8' : ''}`}>
      <Reveal className="flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-baseline sm:gap-10">
        <span className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-muted">
          {num}
        </span>
        <h3 className="font-display text-display-sm font-light">{title}</h3>
        <p className="max-w-sm text-[0.95rem] leading-relaxed text-ink/80 sm:ml-auto">{body}</p>
      </Reveal>
    </div>
  );

  if (layout === 'full') {
    return (
      <article>
        <Reveal>
          <button
            type="button"
            onClick={() => images[0]?.src && open(images[0].id)}
            className="frame frame-hover block w-full cursor-zoom-in"
            aria-label={title}
          >
            <Photo
              img={images[0] ?? { ...FALLBACK, id: `${num}-a` }}
              locale={locale}
              ratio="16 / 9"
              sizes="100vw"
            />
          </button>
        </Reveal>
        {Caption}
      </article>
    );
  }

  if (layout === 'pair') {
    return (
      <article className="shell">
        {Caption}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-7">
          {[0, 1].map((n) => (
            <Reveal key={n} delay={n * 110}>
              <button
                type="button"
                onClick={() => images[n]?.src && open(images[n].id)}
                className="frame frame-hover block w-full cursor-zoom-in"
              >
                <Photo
                  img={images[n] ?? { ...FALLBACK, id: `${num}-${n}` }}
                  locale={locale}
                  ratio={n === 0 ? '4 / 5' : '4 / 5'}
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </button>
            </Reveal>
          ))}
        </div>
      </article>
    );
  }

  if (layout === 'offset') {
    // A wide plate carrying the room, with a narrow upright beside it, dropped
    // slightly so the two do not line up along the bottom.
    return (
      <article className="shell">
        <div className="grid items-end gap-8 lg:grid-cols-12 lg:gap-12">
          <Reveal className={flip ? 'lg:order-2 lg:col-span-7 lg:col-start-6' : 'lg:col-span-7'}>
            <button
              type="button"
              onClick={() => images[0]?.src && open(images[0].id)}
              className="frame frame-hover block w-full cursor-zoom-in"
            >
              <Photo
                img={images[0] ?? { ...FALLBACK, id: `${num}-a` }}
                locale={locale}
                ratio="3 / 2"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </button>
          </Reveal>
          <Reveal
            delay={120}
            className={flip ? 'lg:order-1 lg:col-span-4' : 'lg:col-span-4 lg:col-start-9'}
          >
            <button
              type="button"
              onClick={() => images[1]?.src && open(images[1].id)}
              className="frame frame-hover block w-full cursor-zoom-in"
            >
              <Photo
                img={images[1] ?? { ...FALLBACK, id: `${num}-b` }}
                locale={locale}
                ratio="3 / 4"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </button>
          </Reveal>
        </div>
        <div className="mt-10">{Caption}</div>
      </article>
    );
  }

  // trio — a wide plate over two narrow ones
  return (
    <article className="shell">
      {Caption}
      <div className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-7">
        {[0, 1, 2].map((n) => (
          <Reveal key={n} delay={n * 100}>
            <button
              type="button"
              onClick={() => images[n]?.src && open(images[n].id)}
              className="frame frame-hover block w-full cursor-zoom-in"
            >
              <Photo
                img={images[n] ?? { ...FALLBACK, id: `${num}-${n}` }}
                locale={locale}
                ratio="1 / 1"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </button>
          </Reveal>
        ))}
      </div>
    </article>
  );
}

const FALLBACK: SiteImage = {
  id: 'placeholder',
  src: null,
  width: 1600,
  height: 1067,
  blurDataURL: null,
  category: 'apartment',
  section: 'placeholder',
  alt: { en: '', it: '' },
  credit: null,
};
