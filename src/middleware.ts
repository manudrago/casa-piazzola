import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';

const PUBLIC_FILE = /\.(?:png|jpe?g|webp|avif|svg|ico|txt|xml|webmanifest|woff2?)$/i;

/**
 * URL shape:
 *   /en/...  /it/...   → content, one prefix per language (clean hreflang)
 *   /admin            → rewritten to the default locale, so the host has a
 *                       short URL to bookmark
 *   /                 → redirected to the visitor's best language
 *
 * Language is chosen from an explicit cookie first (the switcher sets it),
 * then Accept-Language, then English.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = preferredLocale(request);

  // Short admin URL, kept out of the language structure.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.rewrite(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

function preferredLocale(request: NextRequest): string {
  const cookie = request.cookies.get('cp_locale')?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) return cookie;

  const header = request.headers.get('accept-language') ?? '';
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if ((locales as readonly string[]).includes(tag)) return tag;
  }
  return defaultLocale;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
