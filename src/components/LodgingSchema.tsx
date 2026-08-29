import { property } from '@/lib/property';
import { SITE_URL } from '@/lib/constants';
import { fromNightly } from '@/lib/pricing';
import { image, ogImageId, byCategory } from '@/lib/images';
import { getDictionary, href } from '@/lib/i18n';

/**
 * Structured data for the accommodation.
 *
 * Only properties we can actually support are emitted — amenityFeature lists
 * exactly what the listing confirms, and nothing more. An invented amenity in
 * schema.org is the same lie as an invented amenity in prose, and Google
 * penalises it harder.
 */
export default function LodgingSchema({ locale }: { locale: string }) {
  const d = getDictionary(locale);
  const c = property.confirmed;
  const h = property.hostConfigurable;
  const og = image(ogImageId);

  const photos = byCategory('apartment')
    .filter((i) => i.src)
    .slice(0, 8)
    .map((i) => `${SITE_URL}${i.src}`);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Apartment',
        '@id': `${SITE_URL}${href(locale)}#apartment`,
        name: property.name,
        description: d.seo.apartmentDescription,
        numberOfRooms: c.rooms,
        numberOfBedrooms: c.bedrooms,
        numberOfBathroomsTotal: c.bathrooms,
        occupancy: { '@type': 'QuantitativeValue', maxValue: h.maxGuests, unitText: 'guests' },
        floorSize: { '@type': 'QuantitativeValue', value: c.interiorSizeSqm, unitCode: 'MTK' },
        floorLevel: String(c.floor),
        yearBuilt: c.yearBuilt,
        amenityFeature: [
          { '@type': 'LocationFeatureSpecification', name: 'Open-plan kitchen', value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Autonomous heating', value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Lift', value: c.lift },
        ],
        address: {
          '@type': 'PostalAddress',
          streetAddress: property.address.street,
          addressLocality: property.address.town,
          addressRegion: property.address.province,
          postalCode: property.address.postalCode,
          addressCountry: property.address.country,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: property.address.lat,
          longitude: property.address.lng,
        },
        ...(photos.length ? { photo: photos } : {}),
      },
      {
        '@type': 'LodgingBusiness',
        '@id': `${SITE_URL}${href(locale)}#business`,
        name: property.name,
        url: `${SITE_URL}${href(locale)}`,
        description: d.seo.homeDescription,
        ...(og.src ? { image: `${SITE_URL}${og.src}` } : {}),
        email: property.host.email,
        priceRange: '€€',
        petsAllowed: false,
        numberOfRooms: c.rooms,
        checkinTime: h.checkInFrom,
        checkoutTime: h.checkOutBy,
        address: {
          '@type': 'PostalAddress',
          addressLocality: property.address.town,
          addressRegion: property.address.province,
          postalCode: property.address.postalCode,
          addressCountry: property.address.country,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: property.address.lat,
          longitude: property.address.lng,
        },
        containedInPlace: {
          '@type': 'Place',
          name: 'Lake Iseo',
          address: { '@type': 'PostalAddress', addressRegion: 'Lombardia', addressCountry: 'IT' },
        },
        makesOffer: {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: (fromNightly() / 100).toFixed(0),
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            priceCurrency: 'EUR',
            price: (fromNightly() / 100).toFixed(0),
            unitCode: 'DAY',
          },
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}${href(locale, 'book')}`,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: property.name,
        inLanguage: d.meta.htmlLang,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Structured data is generated from our own constants, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
