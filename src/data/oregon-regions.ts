import { assetPaths } from '@/config/theme';
import { oregonMarket } from '@/data/markets';
import type { County } from '@/data/markets';

const M = assetPaths.markets;

export interface OregonRegion {
  name: string;
  slug: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  /** County slugs in this region (match counties in oregonMarket) */
  countySlugs: string[];
}

export const oregonRegions: OregonRegion[] = [
  {
    name: 'Portland Metro',
    slug: 'portland-metro',
    description: 'Multnomah, Washington, and Clackamas counties. Portland, Beaverton, Lake Oswego, Gresham, and the urban core.',
    imageSrc: `${M}/pdx.jpeg`,
    imageAlt: 'Portland skyline and metro area',
    countySlugs: ['multnomah', 'washington', 'clackamas'],
  },
  {
    name: 'Willamette Valley',
    slug: 'willamette-valley',
    description: 'Salem, Eugene, Corvallis, and the valley floor. Benton, Lane, Linn, Marion, Polk, and Yamhill counties.',
    imageSrc: `${M}/Tualatin.jpg`,
    imageAlt: 'Willamette Valley',
    countySlugs: ['benton', 'lane', 'linn', 'marion', 'polk', 'yamhill'],
  },
  {
    name: 'Oregon Coast',
    slug: 'oregon-coast',
    description: 'From Astoria to Brookings. Clatsop, Columbia, Lincoln, Tillamook, Coos, and Curry counties.',
    imageSrc: `${M}/pdx_skyline_2.jpeg`,
    imageAlt: 'Oregon coast',
    countySlugs: ['clatsop', 'columbia', 'lincoln', 'tillamook', 'coos', 'curry'],
  },
  {
    name: 'Central Oregon',
    slug: 'central-oregon',
    description: 'Bend, Redmond, Sisters, Prineville, and Madras. Deschutes, Crook, and Jefferson counties.',
    imageSrc: `${M}/pdx_skyline_2.jpeg`,
    imageAlt: 'Central Oregon',
    countySlugs: ['deschutes', 'crook', 'jefferson'],
  },
  {
    name: 'Southern Oregon',
    slug: 'southern-oregon',
    description: 'Medford, Ashland, Grants Pass, and Roseburg. Jackson, Josephine, and Douglas counties.',
    imageSrc: `${M}/pdx_skyline_2.jpeg`,
    imageAlt: 'Southern Oregon',
    countySlugs: ['jackson', 'josephine', 'douglas'],
  },
  {
    name: 'Eastern Oregon',
    slug: 'eastern-oregon',
    description: 'The Dalles, Pendleton, La Grande, Baker City, and the high desert. Hood River, Wasco, Umatilla, Union, Baker, and more.',
    imageSrc: `${M}/pdx_skyline_2.jpeg`,
    imageAlt: 'Eastern Oregon',
    countySlugs: [
      'hood-river',
      'wasco',
      'sherman',
      'umatilla',
      'morrow',
      'gilliam',
      'union',
      'wallowa',
      'baker',
      'grant',
      'harney',
      'malheur',
      'wheeler',
      'klamath',
      'lake',
    ],
  },
];

/** Get region by slug */
export function getRegionBySlug(slug: string): OregonRegion | undefined {
  return oregonRegions.find((r) => r.slug === slug.toLowerCase());
}

/** Get counties in a region (order preserved from region’s countySlugs) */
export function getCountiesForRegion(regionSlug: string): County[] {
  const region = getRegionBySlug(regionSlug);
  if (!region) return [];
  const bySlug = new Map(oregonMarket.counties.map((c) => [c.slug, c]));
  return region.countySlugs
    .map((slug) => bySlug.get(slug))
    .filter((c): c is County => c != null);
}

/** All region slugs for generateStaticParams */
export function getAllOregonRegionSlugs(): string[] {
  return oregonRegions.map((r) => r.slug);
}
