/**
 * Oregon Coast Guide – 15 largest and most popular coastal cities.
 * Links point to existing market city pages: /markets/oregon/{countySlug}/{slug}
 */

export interface OregonCoastCity {
  name: string;
  slug: string;
  countySlug: string;
  description: string;
}

export const oregonCoastGuideCities: OregonCoastCity[] = [
  {
    name: 'Coos Bay',
    slug: 'coos-bay',
    countySlug: 'coos',
    description: 'Largest city on the Oregon coast; port, timber heritage, and gateway to the south coast.',
  },
  {
    name: 'Newport',
    slug: 'newport',
    countySlug: 'lincoln',
    description: 'Central coast hub with Oregon Coast Aquarium, Yaquina Bay, and working waterfront.',
  },
  {
    name: 'Astoria',
    slug: 'astoria',
    countySlug: 'clatsop',
    description: 'Historic port at the Columbia mouth; Victorian homes and maritime culture.',
  },
  {
    name: 'Florence',
    slug: 'florence',
    countySlug: 'lane',
    description: 'Gateway to the Oregon Dunes and Siuslaw River; old town and beaches.',
  },
  {
    name: 'Brookings',
    slug: 'brookings',
    countySlug: 'curry',
    description: 'Southern Oregon\'s "banana belt"; mild climate, harbor, and redwoods nearby.',
  },
  {
    name: 'North Bend',
    slug: 'north-bend',
    countySlug: 'coos',
    description: 'Coos Bay\'s neighbor; airport, dunes, and Coos River access.',
  },
  {
    name: 'Lincoln City',
    slug: 'lincoln-city',
    countySlug: 'lincoln',
    description: 'Seven miles of beaches, outlets, and family-friendly coast vibes.',
  },
  {
    name: 'Seaside',
    slug: 'seaside',
    countySlug: 'clatsop',
    description: 'Classic Oregon coast resort town with promenade, aquarium, and broad beaches.',
  },
  {
    name: 'Reedsport',
    slug: 'reedsport',
    countySlug: 'douglas',
    description: 'Umpqua River and Oregon Dunes; gateway to Winchester Bay and the coast.',
  },
  {
    name: 'Bandon',
    slug: 'bandon',
    countySlug: 'coos',
    description: 'Dramatic sea stacks, old town, cranberries, and Coquille River.',
  },
  {
    name: 'Warrenton',
    slug: 'warrenton',
    countySlug: 'clatsop',
    description: 'North coast peninsula; Fort Stevens, Hammond, and Columbia River access.',
  },
  {
    name: 'Cannon Beach',
    slug: 'cannon-beach',
    countySlug: 'clatsop',
    description: 'Haystack Rock, galleries, and one of the coast\'s most iconic beaches.',
  },
  {
    name: 'Tillamook',
    slug: 'tillamook',
    countySlug: 'tillamook',
    description: 'Tillamook Creamery, dairy country, and Three Capes Scenic Route.',
  },
  {
    name: 'Depoe Bay',
    slug: 'depoe-bay',
    countySlug: 'lincoln',
    description: '"World\'s smallest harbor"; whale watching and dramatic rocky shore.',
  },
  {
    name: 'Gold Beach',
    slug: 'gold-beach',
    countySlug: 'curry',
    description: 'Rogue River mouth, jet boats, and Curry County\'s scenic south coast.',
  },
];
