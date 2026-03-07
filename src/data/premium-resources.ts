/**
 * Premium resources registry. Used by the premium hub for teaser and full list.
 * Add new premium guides here; href should match the route under /premium.
 */

export type PremiumResource = {
  slug: string;
  title: string;
  excerpt: string;
  href: string;
};

export const PREMIUM_RESOURCES: PremiumResource[] = [
  {
    slug: 'portland-condo-guide',
    title: '2026 Portland Condo Guide',
    excerpt:
      'Data-rich overview of condominium buildings across Portland. Compare median prices, HOA levels, rent caps, amenities, and more.',
    href: '/premium/portland-condo-guide',
  },
];
