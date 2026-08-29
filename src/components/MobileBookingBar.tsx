'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { href, type Dictionary } from '@/lib/i18n';
import { formatMoney, fromNightly } from '@/lib/pricing';

/**
 * Sticky booking bar for touch devices.
 *
 * It stays out of the way until the hero has been scrolled past, then rises
 * from the bottom. Deliberately slim and translucent so it never covers the
 * photography it is selling, and it is hidden entirely on the booking page
 * itself, where it would be pointing at the page you are already on.
 */
export default function MobileBookingBar({
  locale,
  d,
  hidden = false,
}: {
  locale: string;
  d: Dictionary;
  hidden?: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (hidden) return;
    function onScroll() {
      setShow(window.scrollY > window.innerHeight * 0.8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-stone bg-ivory/95 backdrop-blur-md
                  transition-transform duration-500 ease-veil lg:hidden ${
                    show ? 'translate-y-0' : 'translate-y-full'
                  }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-3.5">
        <div className="leading-tight">
          <p className="font-sans text-[0.55rem] uppercase tracking-[0.2em] text-muted">
            {d.booking.from}
          </p>
          <p className="font-display text-[1.3rem] text-charcoal">
            {formatMoney(fromNightly(), locale)}
            <span className="ml-1.5 font-sans text-[0.62rem] uppercase tracking-[0.14em] text-muted">
              {d.booking.perNight}
            </span>
          </p>
        </div>

        <Link href={href(locale, 'book')} className="btn-solid !px-7 !py-3.5 text-[0.72rem]">
          {d.hero.primary}
        </Link>
      </div>
    </div>
  );
}
