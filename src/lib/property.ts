/**
 * SINGLE SOURCE OF TRUTH FOR THE APARTMENT.
 *
 * Everything under `confirmed` is taken verbatim from the Idealista listing
 * (ref. 35872144, Agenzia Sebino Tecnocasa Lovere). Nothing here is inferred.
 * If it is not in the listing, it is not on this site.
 *
 *   Nel centro storico di Lovere, proponiamo in vendita un accogliente bilocale
 *   di circa 45 mq […] Situato al piano secondo di un edificio costruito nel
 *   1967, l'immobile è stato ristrutturato internamente e offre ambienti ben
 *   distribuiti e luminosi. L'appartamento è composto da una zona giorno con
 *   cucina open space, una camera da letto matrimoniale e un bagno […] La
 *   posizione centrale consente di raggiungere comodamente a piedi negozi,
 *   servizi, ristoranti e mezzi pubblici.
 *
 * `hostConfigurable` holds commercial decisions that are NOT property
 * characteristics — occupancy policy, house rules, check-in times. Set these
 * yourself; they are deliberately separated so nobody mistakes them for
 * listing facts.
 */

export const property = {
  name: 'Casa Piazzola',
  tagline: 'Lovere, Lake Iseo',

  address: {
    street: 'Vicolo Piazzola 12',
    town: 'Lovere',
    province: 'BG',
    region: 'Lombardia',
    postalCode: '24065',
    country: 'IT',
    countryName: 'Italy',
    // Centre of Lovere's historic core. Refine to the exact door before launch;
    // the map deliberately shows an approximate pin until a guest has booked.
    lat: 45.8134,
    lng: 10.0698,
  },

  /** Verbatim from the listing. Do not add to this object without a source. */
  confirmed: {
    typology: 'Bilocale — two-room apartment',
    interiorSizeSqm: 45, // "circa 45 mq" (superficie commerciale)
    rooms: 2, // "2 locali"
    bedrooms: 1, // "una camera da letto matrimoniale"
    bedType: 'double',
    bathrooms: 1, // "un bagno"
    floor: 2, // "piano secondo"
    lift: false, // "senza ascensore"
    yearBuilt: 1967,
    condition: 'Internally renovated, good condition',
    heating: 'Autonomous heating',
    layout: 'Open-plan living area with kitchen, one double bedroom, one bathroom',
    energyClass: 'G',
    energyValue: 241.97, // kWh/m² per year
    setting: 'Historic centre of Lovere',
    /** "raggiungere comodamente a piedi negozi, servizi, ristoranti e mezzi pubblici" */
    walkable: ['Shops', 'Everyday services', 'Restaurants', 'Public transport'],
  },

  /**
   * Commercial settings — yours to decide, not facts about the building.
   * ► REVIEW EVERY VALUE BELOW BEFORE GOING LIVE.
   */
  hostConfigurable: {
    /** One double bedroom. Raise only if you actually add a sofa bed. */
    maxGuests: 2,
    minNights: 1,
    maxNights: 28,
    /** Days of notice required before an arrival date. */
    leadTimeDays: 1,
    checkInFrom: '15:00',
    checkOutBy: '10:00',
    /** Third floor by UK/US counting — stated plainly, because it matters. */
    accessNote: 'Second floor, reached by stairs. There is no lift in the building.',
  },

  host: {
    name: 'Emanuel',
    email: process.env.HOST_EMAIL ?? 'hello@casapiazzola.com',
    phone: '',
    instagram: 'https://instagram.com/',
    responseNote: 'Messages are usually answered the same day.',
  },

  source: {
    label: 'Idealista listing 35872144 — Agenzia Sebino Tecnocasa Lovere',
    url: 'https://www.idealista.it/immobile/35872144/',
  },
} as const;

export type Property = typeof property;

/** The key-facts row used under the hero and on the booking page. */
export function keyFacts(t: (k: string) => string) {
  const c = property.confirmed;
  const h = property.hostConfigurable;
  return [
    { label: t('facts.guests'), value: String(h.maxGuests) },
    { label: t('facts.bedroom'), value: String(c.bedrooms) },
    { label: t('facts.bathroom'), value: String(c.bathrooms) },
    { label: t('facts.size'), value: `${c.interiorSizeSqm} m²` },
    { label: t('facts.floor'), value: t('facts.floorValue') },
    { label: t('facts.location'), value: t('facts.locationValue') },
  ];
}
