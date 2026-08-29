import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n';
import { creditedImages, altFor } from '@/lib/images';
import { property } from '@/lib/property';

export const metadata: Metadata = {
  title: 'Photo credits',
  robots: { index: false, follow: true },
};

/**
 * Attribution page.
 *
 * The destination photography is used under Creative Commons licences, most of
 * which require credit by name and a link to the licence. This page is how that
 * obligation is met — it is not optional decoration, and the footer links to it
 * from every page.
 */
export default async function CreditsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const d = getDictionary(locale);
  const credited = creditedImages();

  return (
    <div className="pb-section" style={{ paddingTop: 'calc(var(--header-h) + 5rem)' }}>
      <div className="shell max-w-4xl">
        <p className="eyebrow">{d.footer.creditsLink}</p>
        <h1 className="mt-5 text-display-md font-light">{d.gallery.photoCredit}</h1>
        <p className="lede mt-7 max-w-prose">{d.footer.credits}</p>

        <section className="mt-16">
          <h2 className="eyebrow">{d.gallery.filterApartment}</h2>
          <p className="mt-5 max-w-prose text-[0.95rem] leading-relaxed text-ink/85">
            Photographs of the apartment are reproduced from the property listing.
          </p>
          <a
            href={property.source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="link-rule mt-3 inline-block text-[0.9rem] text-muted"
          >
            {property.source.label}
          </a>
        </section>

        <section className="mt-16">
          <h2 className="eyebrow">
            {d.gallery.filterLovere} · {d.gallery.filterLake}
          </h2>
          <ul className="mt-7">
            {credited.map((img) => (
              <li
                key={img.id}
                className="grid gap-2 border-t border-stone py-5 sm:grid-cols-12 sm:gap-6"
              >
                <span className="text-[0.95rem] leading-relaxed text-charcoal sm:col-span-7">
                  {altFor(img, locale)}
                </span>
                <span className="text-[0.88rem] text-muted sm:col-span-3">
                  {img.credit!.author}
                </span>
                <span className="sm:col-span-2 sm:text-right">
                  <a
                    href={img.credit!.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-rule text-[0.8rem] text-muted"
                  >
                    {img.credit!.license}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
