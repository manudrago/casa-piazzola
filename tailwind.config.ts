import type { Config } from 'tailwindcss';

/**
 * Palette — refined Lombardy / Sebino.
 * Warm ivory ground, stone and beige structure, deep charcoal ink,
 * muted olive as the single "living" accent, lake-blue used sparingly.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FBF9F5',
        paper: '#F4F0E8',
        stone: '#E4DDD1',
        beige: '#D3C8B6',
        sand: '#B9AC96',
        charcoal: '#1E1C19',
        ink: '#3A3630',
        muted: '#6E675C',
        olive: '#7B8470',
        'olive-deep': '#585F4E',
        lake: '#7595A3',
        'lake-deep': '#41606D',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Editorial display scale — headings are objects, not labels.
        'display-sm': ['clamp(2rem, 5vw, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
        'display-md': ['clamp(2.6rem, 7vw, 4.75rem)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(3.2rem, 10vw, 7.5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-xl': ['clamp(3.8rem, 13vw, 11rem)', { lineHeight: '0.9', letterSpacing: '-0.035em' }],
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.22em' }],
      },
      maxWidth: {
        prose: '38rem',
        editorial: '82rem',
      },
      spacing: {
        section: 'clamp(5rem, 12vw, 11rem)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        veil: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'veil-up': {
          from: { opacity: '0', transform: 'translate3d(0, 28px, 0)' },
          to: { opacity: '1', transform: 'none' },
        },
        'slow-zoom': {
          from: { transform: 'scale(1.08)' },
          to: { transform: 'scale(1)' },
        },
        'line-grow': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: {
        'veil-up': 'veil-up 1s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slow-zoom': 'slow-zoom 9s cubic-bezier(0.22, 0.61, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
