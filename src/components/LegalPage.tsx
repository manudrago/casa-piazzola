import Reveal from './Reveal';
import type { LegalSection } from '@/lib/legal';
import type { Dictionary } from '@/lib/i18n';

export default function LegalPage({
  title,
  sections,
  d,
}: {
  title: string;
  sections: LegalSection[];
  d: Dictionary;
}) {
  return (
    <div className="pb-section" style={{ paddingTop: 'calc(var(--header-h) + 5rem)' }}>
      <div className="shell max-w-3xl">
        <p className="eyebrow">{d.footer.apartment}</p>
        <h1 className="mt-5 text-display-md font-light">{title}</h1>

        <p className="mt-8 border-l-2 border-olive/50 pl-5 text-[0.85rem] leading-relaxed text-muted">
          {d.legal.draftNotice}
        </p>

        <div className="mt-14 space-y-12">
          {sections.map((section, i) => (
            <Reveal key={section.heading} delay={i * 50} as="section">
              <h2 className="font-display text-[1.6rem] font-light text-charcoal">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-3.5">
                {section.body.map((p, j) => (
                  <p key={j} className="text-[0.98rem] leading-[1.8] text-ink/85">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
