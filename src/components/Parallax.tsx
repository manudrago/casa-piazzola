'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** 0 = pinned to the page, 1 = moves a full viewport. Keep it small. */
  speed?: number;
  className?: string;
};

/**
 * A restrained parallax: the child is scaled a little taller than its frame
 * and drifts within it as the frame crosses the viewport. Driven by rAF off a
 * passive scroll listener, skipped entirely when the element is off-screen or
 * the visitor has asked for reduced motion.
 */
export default function Parallax({ children, speed = 0.14, className = '' }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frameEl = frame.current;
    const innerEl = inner.current;
    if (!frameEl || !innerEl) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let onScreen = false;
    let ticking = false;

    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) update();
      },
      { rootMargin: '20% 0px' },
    );
    io.observe(frameEl);

    function update() {
      ticking = false;
      if (!onScreen || !frameEl || !innerEl) return;
      const rect = frameEl.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 when the frame is just below the fold, +1 when it is just above.
      const progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2);
      const shift = progress * speed * rect.height;
      innerEl.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [speed]);

  // The inner element is oversized by twice the drift so no edge is ever exposed.
  const overscan = `${(1 + speed * 2) * 100}%`;

  // No `relative` here on purpose: some callers need the frame itself to be
  // absolutely positioned (a full-bleed background behind content). They pass
  // their own positioning; `overflow-hidden` is the only thing this component
  // insists on.
  return (
    <div ref={frame} className={`overflow-hidden ${className}`}>
      <div
        ref={inner}
        className="absolute left-0 will-change-transform"
        style={{ height: overscan, width: '100%', top: `-${speed * 100}%` }}
      >
        {children}
      </div>
    </div>
  );
}
