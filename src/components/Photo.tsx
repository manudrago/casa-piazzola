import Image from 'next/image';
import { altFor, type SiteImage } from '@/lib/images';

type Props = {
  img: SiteImage;
  locale: string;
  /** Passed straight to next/image. Get this right — it drives the srcset. */
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Aspect ratio as a CSS value, e.g. '3 / 4'. Omit to use the file's own. */
  ratio?: string;
  /** Fill the parent instead of laying out intrinsically. */
  fill?: boolean;
  quality?: number;
};

/**
 * Every photograph on the site goes through here, so that:
 *  - a missing file degrades to a designed placeholder rather than a gap,
 *  - blur-up placeholders are consistent,
 *  - alt text is always locale-correct and never invented at the call site.
 */
export default function Photo({
  img,
  locale,
  sizes = '100vw',
  priority = false,
  className = '',
  ratio,
  fill = false,
  quality = 82,
}: Props) {
  const alt = altFor(img, locale);

  if (!img.src) {
    return (
      <div
        className={`relative flex items-center justify-center bg-stone/70 ${className}`}
        style={ratio ? { aspectRatio: ratio } : { aspectRatio: '3 / 2' }}
        role="img"
        aria-label={alt || 'Photograph to follow'}
      >
        <PlaceholderMark />
      </div>
    );
  }

  const common = {
    src: img.src,
    alt,
    quality,
    sizes,
    priority,
    ...(img.blurDataURL ? { placeholder: 'blur' as const, blurDataURL: img.blurDataURL } : {}),
    style: img.focus
      ? { objectPosition: `${img.focus.x}% ${img.focus.y}%` }
      : undefined,
  };

  if (fill) {
    return (
      <Image {...common} fill className={`object-cover ${className}`} />
    );
  }

  return (
    <div className={`relative ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      {ratio ? (
        <Image {...common} fill className="object-cover" />
      ) : (
        <Image {...common} width={img.width} height={img.height} className="h-auto w-full" />
      )}
    </div>
  );
}

/** A quiet mark for slots waiting on photography — never a broken image icon. */
function PlaceholderMark() {
  return (
    <span className="flex flex-col items-center gap-3 text-muted/70">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <rect x="0.5" y="4.5" width="33" height="25" stroke="currentColor" strokeWidth="1" />
        <circle cx="11" cy="13" r="2.5" stroke="currentColor" strokeWidth="1" />
        <path d="M1 24l9-8 7 6 5-4 11 9" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
    </span>
  );
}
