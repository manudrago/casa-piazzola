import Link from 'next/link';
import { getDictionary, href, defaultLocale } from '@/lib/i18n';

/**
 * A 404 inside the locale segment cannot read params, so it speaks the default
 * language. It stays photographic in spirit — quiet type on ivory — rather than
 * shouting an error code at someone who mistyped a URL.
 */
export default function NotFound() {
  const d = getDictionary(defaultLocale);

  return (
    <div className="shell flex min-h-[72svh] flex-col justify-center py-32">
      <p className="eyebrow">404</p>
      <h1 className="mt-6 max-w-[16ch] text-display-lg font-light">{d.common.notFoundTitle}</h1>
      <p className="mt-7 max-w-prose text-[1.02rem] leading-relaxed text-ink/85">
        {d.common.notFoundBody}
      </p>
      <div className="mt-11 flex flex-wrap gap-4">
        <Link href={href(defaultLocale)} className="btn-solid">
          {d.common.goHome}
        </Link>
        <Link href={href(defaultLocale, 'book')} className="btn-ghost">
          {d.hero.primary}
        </Link>
      </div>
    </div>
  );
}
