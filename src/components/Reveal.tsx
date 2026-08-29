'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Milliseconds of stagger — used to cascade a row of items. */
  delay?: number;
  as?: ElementType;
  className?: string;
  /** How far into the viewport before it fires. */
  threshold?: number;
};

/**
 * One IntersectionObserver per element, disconnected the moment it fires.
 * Cheaper than a scroll listener, and it degrades to "always visible" when
 * the API is missing or motion is reduced (handled in CSS).
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
  threshold = 0.14,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
