import type { Metadata } from 'next';
import { getDictionary, isLocale, defaultLocale } from '@/lib/i18n';
import { terms } from '@/lib/legal';
import LegalPage from '@/components/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).legal.termsTitle };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const d = getDictionary(locale);
  return (
    <LegalPage
      title={d.legal.termsTitle}
      sections={terms(isLocale(locale) ? locale : defaultLocale)}
      d={d}
    />
  );
}
