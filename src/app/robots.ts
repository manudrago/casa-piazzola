import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Nothing behind these is useful to a crawler, and confirmations
        // contain a guest's name.
        disallow: ['/api/', '/admin', '/en/admin', '/it/admin', '/en/booking/', '/it/booking/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
