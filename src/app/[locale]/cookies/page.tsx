import type { Metadata } from 'next';
import { getDictionary, isLocale, defaultLocale } from '@/lib/i18n';
import { cookiePolicy } from '@/lib/legal';
import LegalPage from '@/components/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).legal.cookiesTitle };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const d = getDictionary(locale);
  return (
    <LegalPage
      title={d.legal.cookiesTitle}
      sections={cookiePolicy(isLocale(locale) ? locale : defaultLocale)}
      d={d}
    />
  );
}
