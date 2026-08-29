import type { MetadataRoute } from 'next';
import { locales, href } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';

/**
 * Every public page in every language, with hreflang alternates so Google
 * serves the Italian version to Italian searchers and the English one to
 * everyone else. Private pages (admin, confirmations) are deliberately absent
 * and carry noindex of their own.
 */
const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: 'apartment', priority: 0.9, changeFrequency: 'monthly' },
  { path: 'lovere', priority: 0.9, changeFrequency: 'monthly' },
  { path: 'experience', priority: 0.7, changeFrequency: 'monthly' },
  { path: 'gallery', priority: 0.7, changeFrequency: 'monthly' },
  { path: 'location', priority: 0.7, changeFrequency: 'yearly' },
  { path: 'book', priority: 0.9, changeFrequency: 'daily' },
  { path: 'contact', priority: 0.5, changeFrequency: 'yearly' },
  { path: 'privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: 'cookies', priority: 0.2, changeFrequency: 'yearly' },
  { path: 'terms', priority: 0.2, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PAGES.flatMap((page) =>
    locales.map((locale) => ({
      url: `${SITE_URL}${href(locale, page.path)}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}${href(l, page.path)}`]),
        ),
      },
    })),
  );
}
