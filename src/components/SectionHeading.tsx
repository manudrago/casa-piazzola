import Reveal from './Reveal';

type Props = {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: 'left' | 'center';
  size?: 'md' | 'lg';
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  size = 'md',
  className = '',
}: Props) {
  const centred = align === 'center';

  return (
    <div className={`${centred ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'} ${className}`}>
      {eyebrow && (
        <Reveal as="p" className="eyebrow">
          {eyebrow}
        </Reveal>
      )}
      <Reveal
        as="h2"
        delay={90}
        className={`mt-5 ${size === 'lg' ? 'text-display-lg' : 'text-display-md'} font-light`}
      >
        {title}
      </Reveal>
      {lede && (
        <Reveal as="p" delay={180} className={`lede mt-7 ${centred ? 'mx-auto' : ''} max-w-prose`}>
          {lede}
        </Reveal>
      )}
    </div>
  );
}
