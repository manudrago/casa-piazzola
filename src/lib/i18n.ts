import en from './dictionaries/en';

export const locales = ['en', 'it'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/**
 * The English dictionary is the contract every other locale is checked against.
 *
 * `en` is declared `as const`, which makes each value a string *literal* type —
 * useful for autocomplete on the source, useless as a target for a translation
 * ("Italiano" is not assignable to "English"). This widens literals back to
 * their base types and drops readonly, so a translator gets exactly one
 * constraint: the same keys, with the same shape.
 */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Widen<U>[]
        : T extends object
          ? { -readonly [K in keyof T]: Widen<T[K]> }
          : T;

export type Dictionary = Widen<typeof en>;

/**
 * Dictionaries are imported eagerly. They are a few kilobytes of strings and
 * nearly every route needs one, so lazy-loading them buys nothing but
 * complexity and a loading flash.
 */
import it from './dictionaries/it';

const dictionaries: Record<Locale, Dictionary> = {
  en: en as unknown as Dictionary,
  it,
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function getDictionary(locale: string): Dictionary {
  return dictionaries[isLocale(locale) ? locale : defaultLocale];
}

/** Prefix a path with the active locale: href('it', '/gallery') → '/it/gallery' */
export function href(locale: string, path = ''): string {
  const l = isLocale(locale) ? locale : defaultLocale;
  const clean = path.replace(/^\/+/, '');
  return clean ? `/${l}/${clean}` : `/${l}`;
}

/** Replace {token} placeholders: fill('Minimum {n} nights', { n: 2 }) */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** The other locales, for the language switcher. */
export function alternateLocales(current: string): Locale[] {
  return locales.filter((l) => l !== current);
}
