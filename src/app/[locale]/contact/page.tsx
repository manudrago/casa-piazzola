import type { Metadata } from 'next';
import { getDictionary, href, locales } from '@/lib/i18n';
import { property } from '@/lib/property';
import { image } from '@/lib/images';
import ContactForm from '@/components/ContactForm';
import Photo from '@/components/Photo';
import Reveal from '@/components/Reveal';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const d = getDictionary(locale);
  return {
    title: d.seo.contactTitle,
    description: d.seo.contactDescription,
    alternates: {
      canonical: href(locale, 'contact'),
      languages: Object.fromEntries(locales.map((l) => [l, href(l, 'contact')])),
    },
  };
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  const { ref } = await searchParams;
  const d = getDictionary(locale);

  return (
    <div className="pb-section" style={{ paddingTop: 'calc(var(--header-h) + 5rem)' }}>
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Reveal as="p" className="eyebrow">
            {d.contact.eyebrow}
          </Reveal>
          <Reveal as="h1" delay={80} className="mt-5 text-display-md font-light">
            {d.contact.title}
          </Reveal>
          <Reveal as="p" delay={150} className="lede mt-7 max-w-prose">
            {d.contact.lede}
          </Reveal>

          <Reveal delay={220} className="mt-12">
            <ContactForm
              d={d}
              locale={locale}
              defaultReference={ref ?? ''}
              defaultSubject={ref ? 'arrival' : 'general'}
            />
          </Reveal>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Reveal delay={140}>
            <div className="frame">
              <Photo
                img={image('discover-old-town')}
                locale={locale}
                ratio="4 / 5"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </Reveal>

          <Reveal delay={200} className="mt-10 border-t border-stone pt-8">
            <h2 className="eyebrow">{d.footer.contact}</h2>
            <ul className="mt-5 space-y-2.5 text-[0.98rem]">
              <li>
                <a href={`mailto:${property.host.email}`} className="link-rule break-all">
                  {property.host.email}
                </a>
              </li>
              <li>
                <a
                  href={property.host.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-rule"
                >
                  {d.footer.instagram}
                </a>
              </li>
            </ul>

            <address className="mt-7 not-italic text-[0.95rem] leading-relaxed text-muted">
              {property.address.street}
              <br />
              {property.address.postalCode} {property.address.town} ({property.address.province})
              <br />
              {property.address.countryName}
            </address>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
