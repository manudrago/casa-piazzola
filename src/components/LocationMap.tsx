'use client';

import { useState } from 'react';
import Reveal from './Reveal';
import { property } from '@/lib/property';
import type { Dictionary } from '@/lib/i18n';

/**
 * A drawn map rather than an embedded one.
 *
 * A Google Maps iframe would dominate the page, drag in third-party cookies and
 * break the palette. This is a schematic: the lake, the shoreline, the old town
 * rising behind it, and labelled points. It is deliberately diagrammatic — it
 * shows how close things are to each other, not exact metres — and the real
 * address goes to the guest with their confirmation.
 */

type Pin = {
  id: keyof Dictionary['location']['pins'];
  x: number;
  y: number;
  kind: 'home' | 'place' | 'service';
};

const PINS: Pin[] = [
  { id: 'apartment', x: 46, y: 40, kind: 'home' },
  { id: 'oldTown', x: 39, y: 33, kind: 'place' },
  { id: 'tower', x: 51, y: 30, kind: 'place' },
  { id: 'basilica', x: 31, y: 44, kind: 'place' },
  { id: 'museum', x: 66, y: 47, kind: 'place' },
  { id: 'waterfront', x: 55, y: 60, kind: 'place' },
  { id: 'harbour', x: 71, y: 63, kind: 'place' },
  { id: 'restaurants', x: 44, y: 51, kind: 'service' },
  { id: 'cafes', x: 52, y: 45, kind: 'service' },
  { id: 'supermarket', x: 27, y: 57, kind: 'service' },
  { id: 'parking', x: 63, y: 70, kind: 'service' },
  { id: 'lake', x: 82, y: 82, kind: 'place' },
];

export default function LocationMap({ d }: { d: Dictionary }) {
  const [active, setActive] = useState<string | null>('apartment');
  const a = property.address;
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=16/${a.lat}/${a.lng}`;

  return (
    <section className="bg-paper py-section" id="location">
      <div className="shell">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal as="p" className="eyebrow">
              {d.location.eyebrow}
            </Reveal>
            <Reveal as="h2" delay={80} className="mt-5 text-display-md font-light">
              {d.location.title}
            </Reveal>
            <Reveal as="p" delay={140} className="mt-7 max-w-md text-[1rem] leading-[1.8] text-ink/85">
              {d.location.body}
            </Reveal>

            <Reveal delay={200} className="mt-10">
              <h3 className="eyebrow">{d.location.addressLabel}</h3>
              <address className="mt-4 not-italic text-[1.05rem] leading-relaxed text-charcoal">
                {a.street}
                <br />
                {a.postalCode} {a.town} ({a.province})
                <br />
                {a.countryName}
              </address>
              <p className="mt-4 max-w-sm text-[0.78rem] leading-relaxed text-muted">
                {d.location.addressNote}
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost mt-7"
              >
                {d.location.openInMaps}
              </a>
            </Reveal>

            <Reveal delay={260} className="mt-12">
              <h3 className="eyebrow">{d.location.gettingHere}</h3>
              <dl className="mt-5 space-y-4">
                {d.location.gettingHereItems.map((g) => (
                  <div key={g.label} className="border-t border-stone pt-3">
                    <dt className="text-[0.95rem] text-charcoal">{g.label}</dt>
                    <dd className="mt-0.5 text-[0.83rem] text-muted">{g.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:col-span-8">
            <figure className="border border-stone bg-ivory p-4 sm:p-7">
              <svg
                viewBox="0 0 100 92"
                className="h-auto w-full"
                role="img"
                aria-label={`${d.location.title} — ${a.town}`}
              >
                <defs>
                  <pattern id="hatch" width="3" height="3" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="3" stroke="#D3C8B6" strokeWidth="0.5" />
                  </pattern>
                  <linearGradient id="water" x1="0" y1="0" x2="0.6" y2="1">
                    <stop offset="0%" stopColor="#DCE6EA" />
                    <stop offset="100%" stopColor="#C3D5DC" />
                  </linearGradient>
                </defs>

                {/* Lake — the town sits on its north-western shore. */}
                <path
                  d="M100 92 L100 40 C86 44 74 52 64 62 C55 71 46 80 38 92 Z"
                  fill="url(#water)"
                />
                <path
                  d="M100 40 C86 44 74 52 64 62 C55 71 46 80 38 92"
                  fill="none"
                  stroke="#7595A3"
                  strokeWidth="0.4"
                />

                {/* Mountains behind the town */}
                <path
                  d="M0 0 L100 0 L100 14 C88 10 78 18 66 14 C54 10 44 20 30 15 C18 11 8 18 0 14 Z"
                  fill="url(#hatch)"
                />

                {/* The old town block, rising from the shore */}
                <path
                  d="M14 22 C30 18 52 20 70 28 C62 40 50 52 40 62 C30 56 20 44 14 22 Z"
                  fill="#EFEAE0"
                  stroke="#E4DDD1"
                  strokeWidth="0.4"
                />

                {/* Streets — schematic, showing that everything runs down to the water */}
                <g stroke="#DBD2C3" strokeWidth="0.45" fill="none">
                  <path d="M20 26 C32 34 42 46 48 62" />
                  <path d="M34 22 C42 32 50 44 56 58" />
                  <path d="M48 23 C54 33 60 42 66 54" />
                  <path d="M18 34 C32 32 50 34 66 40" />
                  <path d="M24 46 C36 44 52 46 64 51" />
                </g>

                {/* Lungolago — the two-kilometre promenade */}
                <path
                  d="M96 42 C84 46 72 54 62 64 C54 72 46 81 40 90"
                  fill="none"
                  stroke="#B9AC96"
                  strokeWidth="0.9"
                  strokeDasharray="1.6 1.4"
                />

                {PINS.map((pin) => {
                  const on = active === pin.id;
                  return (
                    <g
                      key={pin.id}
                      transform={`translate(${pin.x} ${pin.y})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setActive(pin.id)}
                      onFocus={() => setActive(pin.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={d.location.pins[pin.id]}
                    >
                      {pin.kind === 'home' ? (
                        <>
                          <circle r={on ? 3.4 : 3} fill="#585F4E" />
                          <circle r={on ? 6 : 5} fill="none" stroke="#7B8470" strokeWidth="0.4" opacity={0.8} />
                        </>
                      ) : (
                        <circle
                          r={on ? 2 : 1.4}
                          fill={pin.kind === 'place' ? '#41606D' : '#B9AC96'}
                          className="transition-all duration-300"
                        />
                      )}
                      <text
                        x={pin.x > 62 ? -3.5 : 3.5}
                        y="1.2"
                        textAnchor={pin.x > 62 ? 'end' : 'start'}
                        fontSize="2.5"
                        fill={on ? '#1E1C19' : '#6E675C'}
                        className="font-sans transition-colors duration-300"
                        style={{ letterSpacing: '0.04em' }}
                      >
                        {d.location.pins[pin.id]}
                      </text>
                    </g>
                  );
                })}

                <text x="88" y="88" fontSize="2.6" fill="#41606D" textAnchor="end" fontStyle="italic">
                  {d.location.pins.lake}
                </text>
              </svg>

              <figcaption className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-stone pt-4 text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                <span className="flex items-center gap-2">
                  <span className="block h-2 w-2 rounded-full bg-olive-deep" />
                  {d.location.pins.apartment}
                </span>
                <span className="flex items-center gap-2">
                  <span className="block h-1.5 w-1.5 rounded-full bg-lake-deep" />
                  {d.location.legend}
                </span>
                <span className="flex items-center gap-2">
                  <span className="block h-px w-5 bg-sand" />
                  {d.location.pins.waterfront}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
