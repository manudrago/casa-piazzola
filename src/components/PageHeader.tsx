import Photo from './Photo';
import Reveal from './Reveal';
import Parallax from './Parallax';
import { image } from '@/lib/images';

/**
 * The opening frame of an interior page: a wide photographic band with the
 * title sitting on ivory beneath it, overlapping slightly. Shorter than the
 * homepage hero so the content starts sooner.
 */
export default function PageHeader({
  locale,
  eyebrow,
  title,
  lede,
  imageId,
}: {
  locale: string;
  eyebrow: string;
  title: string;
  lede?: string;
  imageId: string;
}) {
  return (
    <header>
      <Parallax speed={0.12} className="relative h-[52svh] min-h-[340px] w-full">
        <Photo
          img={image(imageId)}
          locale={locale}
          fill
          priority
          quality={86}
          sizes="100vw"
          className="h-full w-full"
        />
      </Parallax>

      <div className="shell relative -mt-16 lg:-mt-20">
        <div className="max-w-3xl bg-ivory pr-6 pt-9 lg:pr-14 lg:pt-12">
          <Reveal as="p" className="eyebrow">
            {eyebrow}
          </Reveal>
          <Reveal as="h1" delay={80} className="mt-5 text-display-md font-light">
            {title}
          </Reveal>
          {lede && (
            <Reveal as="p" delay={150} className="lede mt-7 max-w-prose">
              {lede}
            </Reveal>
          )}
        </div>
      </div>
    </header>
  );
}
