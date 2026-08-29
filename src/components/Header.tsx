'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { href, locales, type Dictionary } from '@/lib/i18n';

type Props = { locale: string; d: Dictionary };

/**
 * The header starts transparent over the hero photograph and settles into an
 * ivory bar once the hero is behind you. It hides on the way down and returns
 * on the way up, so the photography is never permanently obstructed.
 */
export default function Header({ locale, d }: Props) {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  // Pages without a full-bleed hero need the solid bar from the first pixel.
  const bare = !/^\/[a-z]{2}\/?$/.test(pathname ?? '') && !(pathname ?? '').endsWith('/lovere');

  useEffect(() => {
    let last = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      setSolid(y > 40);
      setHidden(y > 320 && y > last && !open);
      last = y;
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const links = [
    { label: d.nav.stay, path: 'apartment' },
    { label: d.nav.lovere, path: 'lovere' },
    { label: d.nav.experience, path: 'experience' },
    { label: d.nav.gallery, path: 'gallery' },
    { label: d.nav.location, path: 'location' },
  ];

  const onDark = !solid && !bare && !open;

  return (
    <>
      <header
        className={[
          'fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-700 ease-soft',
          hidden ? '-translate-y-full' : 'translate-y-0',
          solid || bare || open
            ? 'bg-ivory/95 backdrop-blur-sm border-b border-stone'
            : 'bg-transparent border-b border-transparent',
        ].join(' ')}
        style={{ height: 'var(--header-h)' }}
      >
        <div className="shell flex h-full items-center justify-between gap-8">
          <Link
            href={href(locale)}
            className={`font-display text-[1.35rem] leading-none tracking-[0.02em] transition-colors duration-500 ${
              onDark ? 'text-ivory' : 'text-charcoal'
            }`}
          >
            Casa Piazzola
            <span
              className={`mt-1 block font-sans text-[0.5rem] uppercase tracking-[0.32em] transition-colors duration-500 ${
                onDark ? 'text-ivory/70' : 'text-muted'
              }`}
            >
              Lovere · Lago d’Iseo
            </span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            {links.map((l) => (
              <Link
                key={l.path}
                href={href(locale, l.path)}
                className={`link-rule font-sans text-[0.7rem] uppercase tracking-[0.2em] transition-colors duration-500 ${
                  onDark ? 'text-ivory/90 hover:text-ivory' : 'text-ink hover:text-charcoal'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <LanguageSwitcher locale={locale} pathname={pathname ?? '/'} onDark={onDark} />

            <Link
              href={href(locale, 'book')}
              className={`hidden md:inline-flex ${onDark ? 'btn-solid-invert' : 'btn-solid'} !px-7 !py-3`}
            >
              {d.nav.book}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? d.nav.close : d.nav.menu}
              className={`relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-[6px] lg:hidden ${
                onDark ? 'text-ivory' : 'text-charcoal'
              }`}
            >
              <span
                className={`block h-px w-6 bg-current transition-transform duration-500 ease-veil ${
                  open ? 'translate-y-[3.5px] rotate-45' : ''
                }`}
              />
              <span
                className={`block h-px w-6 bg-current transition-transform duration-500 ease-veil ${
                  open ? '-translate-y-[3.5px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen menu — ivory, typographic, no photography competing with it. */}
      <div
        className={`fixed inset-0 z-40 bg-ivory transition-[opacity,visibility] duration-500 ease-soft lg:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div
          className="shell flex h-full flex-col justify-center gap-1 pb-16"
          style={{ paddingTop: 'var(--header-h)' }}
        >
          {links.map((l, i) => (
            <Link
              key={l.path}
              href={href(locale, l.path)}
              className="border-b border-stone py-5 font-display text-[2.1rem] leading-none text-charcoal transition-transform duration-500 ease-veil hover:translate-x-2"
              style={{
                transitionDelay: open ? `${80 + i * 45}ms` : '0ms',
                opacity: open ? 1 : 0,
                transform: open ? 'none' : 'translateY(14px)',
                transitionProperty: 'opacity, transform',
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link href={href(locale, 'book')} className="btn-solid mt-9 w-full">
            {d.hero.primary}
          </Link>
          <Link
            href={href(locale, 'contact')}
            className="mt-5 text-center font-sans text-[0.7rem] uppercase tracking-[0.2em] text-muted"
          >
            {d.nav.contact}
          </Link>
        </div>
      </div>
    </>
  );
}

function LanguageSwitcher({
  locale,
  pathname,
  onDark,
}: {
  locale: string;
  pathname: string;
  onDark: boolean;
}) {
  const rest = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');

  return (
    <div
      className={`flex items-center gap-2 font-sans text-[0.65rem] uppercase tracking-[0.18em] transition-colors duration-500 ${
        onDark ? 'text-ivory/70' : 'text-muted'
      }`}
    >
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="opacity-40">|</span>}
          <Link
            href={`/${l}${rest}`}
            onClick={() => {
              document.cookie = `cp_locale=${l};path=/;max-age=31536000;samesite=lax`;
            }}
            aria-current={l === locale ? 'true' : undefined}
            className={
              l === locale
                ? onDark
                  ? 'text-ivory'
                  : 'text-charcoal'
                : 'opacity-60 transition-opacity hover:opacity-100'
            }
          >
            {l.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
