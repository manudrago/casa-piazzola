import Link from 'next/link';
import Photo from './Photo';
import Reveal from './Reveal';
import Parallax from './Parallax';
import { image } from '@/lib/images';
import { href, type Dictionary } from '@/lib/i18n';
import { formatMoney, fromNightly } from '@/lib/pricing';

/**
 * The closing frame: one photograph, one sentence, one button.
 * Everything the page has been arguing for, asked plainly.
 */
export default function BookingInvite({ locale, d }: { locale: string; d: Dictionary }) {
  return (
    <section className="relative isolate flex min-h-[76svh] items-end overflow-hidden text-ivory">
      <Parallax speed={0.18} className="absolute inset-0 -z-10 h-full w-full">
        <Photo
          img={image('closing')}
          locale={locale}
          fill
          sizes="100vw"
          quality={86}
          className="h-full w-full"
        />
      </Parallax>
      <div className="veil absolute inset-0 -z-10" />

      <div className="shell pb-20 pt-40 lg:pb-28">
        <Reveal as="p" className="eyebrow text-ivory/70">
          {d.hero.place}
        </Reveal>

        <Reveal as="h2" delay={90} className="mt-6 max-w-[16ch] text-display-lg font-light text-ivory">
          {d.hero.statement}
        </Reveal>

        <Reveal delay={200} className="mt-11 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <Link href={href(locale, 'book')} className="btn-solid-invert">
            {d.hero.primary}
          </Link>

          <p className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-ivory/80 text-shadow-soft">
            {d.booking.from}{' '}
            <span className="font-display text-[1.4rem] normal-case tracking-normal text-ivory">
              {formatMoney(fromNightly(), locale)}
            </span>{' '}
            {d.booking.perNight}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
