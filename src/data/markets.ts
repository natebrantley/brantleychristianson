import { assetPaths } from '@/config/theme';

const M = assetPaths.markets;

export interface City {
  name: string;
  slug: string;
  tagline?: string;
}

export interface County {
  name: string;
  slug: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  cities: City[];
}

export interface StateMarket {
  name: string;
  slug: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
  counties: County[];
}

/** Oregon: Multnomah, Washington, Clackamas counties */
export const oregonMarket: StateMarket = {
  name: 'Oregon',
  slug: 'oregon',
  description: 'Portland metro, the coast & Mt. Hood',
  imageSrc: `${M}/pdx.jpeg`,
  imageAlt: 'Portland, Oregon',
  href: '/markets/oregon',
  counties: [
    {
      name: 'Multnomah County',
      slug: 'multnomah',
      description: 'Portland and inner metro. Downtown, Pearl, Eastside, and surrounding neighborhoods.',
      imageSrc: `${M}/pdx.jpeg`,
      imageAlt: 'Portland skyline',
      cities: [
        { name: 'Portland', slug: 'portland', tagline: 'City of Roses & urban neighborhoods' },
        { name: 'Gresham', slug: 'gresham', tagline: 'East county hub' },
        { name: 'Troutdale', slug: 'troutdale', tagline: 'Gateway to the Gorge' },
        { name: 'Fairview', slug: 'fairview', tagline: 'Columbia River community' },
        { name: 'Wood Village', slug: 'wood-village', tagline: 'Small-city living' },
        { name: 'Maywood Park', slug: 'maywood-park', tagline: 'Portland enclave' },
      ],
    },
    {
      name: 'Washington County',
      slug: 'washington',
      description: 'West metro: Beaverton, Hillsboro, Tigard, Tualatin, and the tech corridor.',
      imageSrc: `${M}/Tualatin.jpg`,
      imageAlt: 'Washington County',
      cities: [
        { name: 'Beaverton', slug: 'beaverton', tagline: 'Tech corridor & family neighborhoods' },
        { name: 'Hillsboro', slug: 'hillsboro', tagline: 'Silicon Forest & historic downtown' },
        { name: 'Tigard', slug: 'tigard', tagline: 'Central west metro' },
        { name: 'Tualatin', slug: 'tualatin', tagline: 'Riverside community' },
        { name: 'Sherwood', slug: 'sherwood', tagline: 'Wine country edge' },
        { name: 'Wilsonville', slug: 'wilsonville', tagline: 'I-5 corridor hub' },
        { name: 'Forest Grove', slug: 'forest-grove', tagline: 'University town' },
        { name: 'Cornelius', slug: 'cornelius', tagline: 'Tualatin Valley' },
        { name: 'North Plains', slug: 'north-plains', tagline: 'Agricultural heritage' },
        { name: 'Banks', slug: 'banks', tagline: 'Highway 26 gateway' },
        { name: 'King City', slug: 'king-city', tagline: 'Active adult community' },
        { name: 'Durham', slug: 'durham', tagline: 'Small-town character' },
      ],
    },
    {
      name: 'Clackamas County',
      slug: 'clackamas',
      description: 'South and east metro: Oregon City, Lake Oswego, West Linn, Happy Valley, and Mt. Hood gateway.',
      imageSrc: `${M}/pdx_skyline.jpeg`,
      imageAlt: 'Clackamas County and Portland',
      cities: [
        { name: 'Lake Oswego', slug: 'lake-oswego', tagline: 'Lakefront living' },
        { name: 'West Linn', slug: 'west-linn', tagline: 'Family-focused community' },
        { name: 'Oregon City', slug: 'oregon-city', tagline: 'End of the Oregon Trail' },
        { name: 'Happy Valley', slug: 'happy-valley', tagline: 'Growing east county' },
        { name: 'Milwaukie', slug: 'milwaukie', tagline: 'North Clackamas hub' },
        { name: 'Gladstone', slug: 'gladstone', tagline: 'Riverside & parks' },
        { name: 'Sandy', slug: 'sandy', tagline: 'Gateway to Mt. Hood' },
        { name: 'Estacada', slug: 'estacada', tagline: 'Clackamas River corridor' },
        { name: 'Canby', slug: 'canby', tagline: 'Agricultural heritage' },
        { name: 'Molalla', slug: 'molalla', tagline: 'Rural character' },
        { name: 'Damascus', slug: 'damascus', tagline: 'Former city, now Portland' },
        { name: 'Boring', slug: 'boring', tagline: 'Mt. Hood gateway' },
      ],
    },
  ],
};

/** Washington: Clark and Cowlitz counties */
export const washingtonMarket: StateMarket = {
  name: 'Washington',
  slug: 'washington',
  description: 'SW Washington, Vancouver & Clark County',
  imageSrc: `${M}/camas_river.webp`,
  imageAlt: 'Southwest Washington',
  href: '/markets/washington',
  counties: [
    {
      name: 'Clark County',
      slug: 'clark',
      description: 'Vancouver, Camas, Battle Ground, Washougal, and the rest of the Portland-Vancouver metro.',
      imageSrc: `${M}/camas_river.webp`,
      imageAlt: 'Clark County',
      cities: [
        { name: 'Vancouver', slug: 'vancouver', tagline: 'Portland-Vancouver metro' },
        { name: 'Camas', slug: 'camas', tagline: 'Paper mill town turned gem' },
        { name: 'Battle Ground', slug: 'battle-ground', tagline: 'North Clark County' },
        { name: 'Washougal', slug: 'washougal', tagline: 'Columbia River gateway' },
        { name: 'Ridgefield', slug: 'ridgefield', tagline: 'I-5 & wildlife refuge' },
        { name: 'La Center', slug: 'la-center', tagline: 'Card rooms & countryside' },
        { name: 'Yacolt', slug: 'yacolt', tagline: 'Foothills community' },
        { name: 'Amboy', slug: 'amboy', tagline: 'Rural Clark County' },
      ],
    },
    {
      name: 'Cowlitz County',
      slug: 'cowlitz',
      description: 'Longview, Kelso, Castle Rock, Kalama, and the Lower Columbia River corridor.',
      imageSrc: `${M}/kelso.jpg`,
      imageAlt: 'Cowlitz County',
      cities: [
        { name: 'Longview', slug: 'longview', tagline: 'Planned city on the Columbia' },
        { name: 'Kelso', slug: 'kelso', tagline: 'Cowlitz County seat' },
        { name: 'Castle Rock', slug: 'castle-rock', tagline: 'I-5 & Mount St. Helens' },
        { name: 'Kalama', slug: 'kalama', tagline: 'Riverfront & antiques' },
        { name: 'Woodland', slug: 'woodland', tagline: 'Lewis River & I-5' },
      ],
    },
  ],
};

export const allMarkets: StateMarket[] = [oregonMarket, washingtonMarket];

/** Get state by slug (oregon | washington) */
export function getStateBySlug(stateSlug: string): StateMarket | undefined {
  return allMarkets.find((s) => s.slug === stateSlug.toLowerCase());
}

/** Get county by state slug + county slug */
export function getCountyBySlug(stateSlug: string, countySlug: string): County | undefined {
  const state = getStateBySlug(stateSlug);
  return state?.counties.find((c) => c.slug === countySlug.toLowerCase());
}

/** Get city by state + county + city slug */
export function getCityBySlug(
  stateSlug: string,
  countySlug: string,
  citySlug: string
): { city: City; county: County; state: StateMarket } | undefined {
  const county = getCountyBySlug(stateSlug, countySlug);
  const state = getStateBySlug(stateSlug);
  if (!county || !state) return undefined;
  const city = county.cities.find((c) => c.slug === citySlug.toLowerCase());
  return city ? { city, county, state } : undefined;
}

/** All [state, county] pairs for generateStaticParams */
export function getAllCountyPaths(): { state: string; county: string }[] {
  return allMarkets.flatMap((s) =>
    s.counties.map((c) => ({ state: s.slug, county: c.slug }))
  );
}

/** All [state, county, city] triples for generateStaticParams */
export function getAllCityPaths(): { state: string; county: string; city: string }[] {
  return allMarkets.flatMap((s) =>
    s.counties.flatMap((c) =>
      c.cities.map((city) => ({ state: s.slug, county: c.slug, city: city.slug }))
    )
  );
}

/** Other cities in the same county (for "Explore more" on city pages). Excludes the given city. */
export function getOtherCitiesInCounty(
  stateSlug: string,
  countySlug: string,
  excludeCitySlug: string
): City[] {
  const county = getCountyBySlug(stateSlug, countySlug);
  if (!county) return [];
  return county.cities.filter((c) => c.slug !== excludeCitySlug.toLowerCase());
}
