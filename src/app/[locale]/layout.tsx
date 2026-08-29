import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import { notFound } from 'next/navigation';

import '@/styles/globals.css';
import { locales, isLocale, getDictionary, href } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';
import { property } from '@/lib/property';
import { image, ogImageId } from '@/lib/images';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LodgingSchema from '@/components/LodgingSchema';

/**
 * Cormorant Garamond does the shouting — it is a display face and is only ever
 * used large. Jost carries the interface and the body copy: geometric, Italian
 * in feeling, and legible at 15px in a way a display serif is not.
 */
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const d = getDictionary(locale);
  const og = image(ogImageId);

  // A purpose-cut 1200×630 card, with the full-size photograph as a fallback
  // if the pipeline has not produced one yet.
  const ogImage = { url: '/images/og/opengraph.jpg', width: 1200, height: 630, alt: og.alt.en };

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: d.seo.homeTitle,
      template: `%s · ${property.name}`,
    },
    description: d.seo.homeDescription,
    applicationName: property.name,
    authors: [{ name: property.name }],
    keywords:
      locale === 'it'
        ? [
            'appartamento vacanze Lovere',
            'casa vacanze Lago d’Iseo',
            'affitto breve Lovere',
            'dove dormire a Lovere',
            'alloggi Lovere',
            'appartamento Lago d’Iseo',
          ]
        : [
            'holiday apartment Lovere',
            'apartment for rent Lovere Lake Iseo',
            'holiday rental Lake Iseo',
            'where to stay in Lovere',
            'Lovere accommodation',
            'Lake Iseo apartment',
            'vacation rental Lovere Italy',
          ],
    alternates: {
      canonical: href(locale),
      languages: Object.fromEntries([
        ...locales.map((l) => [l, href(l)]),
        ['x-default', href('en')],
      ]),
    },
    openGraph: {
      type: 'website',
      siteName: property.name,
      locale: d.meta.ogLocale,
      url: href(locale),
      title: d.seo.homeTitle,
      description: d.seo.homeDescription,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: d.seo.homeTitle,
      description: d.seo.homeDescription,
      images: [ogImage.url],
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const d = getDictionary(locale);

  return (
    <html lang={d.meta.htmlLang} className={`${display.variable} ${sans.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[100]
                     focus:bg-charcoal focus:px-5 focus:py-3 focus:text-ivory focus:text-xs
                     focus:uppercase focus:tracking-[0.18em]"
        >
          {d.nav.skipToContent}
        </a>
        <Header locale={locale} d={d} />
        <main id="main">{children}</main>
        <Footer locale={locale} d={d} />
        <LodgingSchema locale={locale} />
      </body>
    </html>
  );
}
