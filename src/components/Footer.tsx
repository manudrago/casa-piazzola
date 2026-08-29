import Link from 'next/link';
import { href, type Dictionary } from '@/lib/i18n';
import { property } from '@/lib/property';

export default function Footer({ locale, d }: { locale: string; d: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone bg-paper">
      <div className="shell py-20 lg:py-24">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="font-display text-[2rem] leading-none text-charcoal">
              {d.footer.apartment}
            </h2>
            <p className="mt-3 font-sans text-[0.7rem] uppercase tracking-[0.24em] text-muted">
              {d.footer.place}
            </p>
            <p className="mt-8 max-w-sm text-[0.95rem] leading-relaxed text-ink/80">
              {d.hero.sub}
            </p>
            <Link href={href(locale, 'book')} className="btn-ghost mt-9">
              {d.footer.book}
            </Link>
          </div>

          <nav className="md:col-span-3 md:col-start-7" aria-label="Footer">
            <h3 className="eyebrow">{d.nav.menu}</h3>
            <ul className="mt-6 space-y-3">
              {[
                { label: d.nav.stay, path: 'apartment' },
                { label: d.nav.lovere, path: 'lovere' },
                { label: d.nav.experience, path: 'experience' },
                { label: d.nav.gallery, path: 'gallery' },
                { label: d.nav.location, path: 'location' },
                { label: d.nav.book, path: 'book' },
              ].map((l) => (
                <li key={l.path}>
                  <Link href={href(locale, l.path)} className="link-rule text-[0.95rem] text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h3 className="eyebrow">{d.footer.contact}</h3>
            <ul className="mt-6 space-y-3">
              <li>
                <Link href={href(locale, 'contact')} className="link-rule text-[0.95rem] text-ink">
                  {d.contact.title}
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${property.host.email}`}
                  className="link-rule break-all text-[0.95rem] text-ink"
                >
                  {property.host.email}
                </a>
              </li>
              <li>
                <a
                  href={property.host.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-rule text-[0.95rem] text-ink"
                >
                  {d.footer.instagram}
                </a>
              </li>
            </ul>

            <address className="mt-8 not-italic text-[0.9rem] leading-relaxed text-muted">
              {property.address.street}
              <br />
              {property.address.postalCode} {property.address.town} ({property.address.province})
              <br />
              {property.address.countryName}
            </address>
          </div>
        </div>

        <div className="rule mt-16" />

        <div className="mt-8 flex flex-col gap-6 text-[0.78rem] text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {d.footer.apartment}. {d.footer.rights}
          </p>
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <li>
              <Link href={href(locale, 'privacy')} className="link-rule">
                {d.footer.privacy}
              </Link>
            </li>
            <li>
              <Link href={href(locale, 'cookies')} className="link-rule">
                {d.footer.cookies}
              </Link>
            </li>
            <li>
              <Link href={href(locale, 'terms')} className="link-rule">
                {d.footer.terms}
              </Link>
            </li>
            <li>
              <Link href={href(locale, 'credits')} className="link-rule">
                {d.footer.creditsLink}
              </Link>
            </li>
          </ul>
        </div>

        <p className="mt-6 max-w-2xl text-[0.72rem] leading-relaxed text-muted/80">
          {d.footer.credits}
        </p>
      </div>
    </footer>
  );
}
