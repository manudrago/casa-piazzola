'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import { altFor, type SiteImage } from '@/lib/images';
import type { Dictionary } from '@/lib/i18n';

type Ctx = { open: (id: string) => void; close: () => void };

const LightboxContext = createContext<Ctx>({ open: () => {}, close: () => {} });

export function useLightbox() {
  return useContext(LightboxContext);
}

/**
 * One lightbox for the whole page. Any photograph can open it by id, and it
 * navigates across the full set it was given — so a click in the room sequence
 * and a click in the gallery behave identically.
 *
 * Keyboard: ← → to move, Esc to close, focus trapped while open.
 * Touch: horizontal swipe.
 */
export default function LightboxProvider({
  images,
  locale,
  d,
  children,
}: {
  images: SiteImage[];
  locale: string;
  d: Dictionary;
  children: ReactNode;
}) {
  const usable = useMemo(() => images.filter((i) => i.src), [images]);
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const open = useCallback(
    (id: string) => {
      const i = usable.findIndex((img) => img.id === id);
      if (i >= 0) {
        restoreFocus.current = document.activeElement as HTMLElement;
        setIndex(i);
      }
    },
    [usable],
  );

  const close = useCallback(() => {
    setIndex(null);
    restoreFocus.current?.focus?.();
  }, []);

  const step = useCallback(
    (delta: number) => {
      setIndex((cur) => (cur === null ? cur : (cur + delta + usable.length) % usable.length));
    },
    [usable.length],
  );

  useEffect(() => {
    if (index === null) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab') {
        // Simple trap: keep focus inside the dialog.
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, close, step]);

  const ctx = useMemo(() => ({ open, close }), [open, close]);
  const current = index === null ? null : usable[index];

  return (
    <LightboxContext.Provider value={ctx}>
      {children}

      {current && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={d.gallery.open}
          className="fixed inset-0 z-[80] flex flex-col bg-charcoal/97 backdrop-blur-sm animate-veil-up"
          onTouchStart={(e) => {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            const s = touchStart.current;
            if (!s) return;
            const dx = e.changedTouches[0].clientX - s.x;
            const dy = e.changedTouches[0].clientY - s.y;
            if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
            touchStart.current = null;
          }}
        >
          <div className="flex items-center justify-between px-6 py-5 sm:px-10">
            <span className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-ivory/60">
              {index! + 1} {d.gallery.counter} {usable.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label={d.gallery.closeLightbox}
              className="group flex h-11 w-11 items-center justify-center text-ivory/70 transition-colors hover:text-ivory"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={d.gallery.previous}
              className="absolute left-2 z-10 hidden h-14 w-14 items-center justify-center text-ivory/60 transition-colors hover:text-ivory sm:flex"
            >
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                <path d="M16 3L6 13l10 10" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            </button>

            <figure className="relative flex h-full max-h-full w-full max-w-6xl items-center justify-center">
              <Image
                key={current.id}
                src={current.src!}
                alt={altFor(current, locale)}
                width={current.width}
                height={current.height}
                sizes="100vw"
                quality={86}
                className="max-h-[76vh] w-auto object-contain animate-veil-up"
                priority
              />
            </figure>

            <button
              type="button"
              onClick={() => step(1)}
              aria-label={d.gallery.next}
              className="absolute right-2 z-10 hidden h-14 w-14 items-center justify-center text-ivory/60 transition-colors hover:text-ivory sm:flex"
            >
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                <path d="M10 3l10 10-10 10" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            </button>
          </div>

          <div className="px-6 pb-8 pt-5 sm:px-10">
            <p className="mx-auto max-w-3xl text-center text-[0.9rem] leading-relaxed text-ivory/80">
              {altFor(current, locale)}
            </p>
            {current.credit && (
              <p className="mx-auto mt-2 max-w-3xl text-center text-[0.68rem] text-ivory/45">
                {d.gallery.photoCredit}: {current.credit.author} ·{' '}
                <a
                  href={current.credit.licenseUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline underline-offset-2 hover:text-ivory/70"
                >
                  {current.credit.license}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </LightboxContext.Provider>
  );
}
