import { assetPaths } from '@/config/theme';

const M = assetPaths.markets;

export interface City {
  name: string;
  slug: string;
  tagline?: string;
  imageSrc: string;
  imageAlt: string;
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
  description: 'Portland metro, the Willamette Valley, the coast, Central and Eastern Oregon.',
  imageSrc: `${M}/pdx.jpeg`,
  imageAlt: 'Portland, Oregon',
  href: '/markets/oregon',
  counties: [
    {
      name: 'Baker County',
      slug: 'baker',
      description: 'Northeast Oregon ranchland, mountains, and historic small towns along I-84.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Baker County landscape',
      cities: [
        { name: 'Baker City', slug: 'baker-city', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Baker City' },
        { name: 'Greenhorn', slug: 'greenhorn', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Greenhorn' },
        { name: 'Haines', slug: 'haines', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Haines' },
        { name: 'Halfway', slug: 'halfway', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Halfway' },
        { name: 'Huntington', slug: 'huntington', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Huntington' },
        { name: 'Richland', slug: 'richland', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Richland' },
        { name: 'Sumpter', slug: 'sumpter', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Sumpter' },
      ],
    },
    {
      name: 'Benton County',
      slug: 'benton',
      description: 'Home to Corvallis and Oregon State University—college-town energy and valley farmland.',
      imageSrc: `${M}/Tualatin.jpg`,
      imageAlt: 'Benton County landscape',
      cities: [
        { name: 'Adair Village', slug: 'adair-village', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Adair Village' },
        { name: 'Corvallis', slug: 'corvallis', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Corvallis' },
        { name: 'Monroe', slug: 'monroe', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Monroe' },
        { name: 'Philomath', slug: 'philomath', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Philomath' },
      ],
    },
    {
      name: 'Multnomah County',
      slug: 'multnomah',
      description: 'Portland and inner metro. Downtown, Pearl, Eastside, and surrounding neighborhoods.',
      imageSrc: `${M}/pdx.jpeg`,
      imageAlt: 'Portland skyline',
      cities: [
        { name: 'Portland', slug: 'portland', tagline: 'City of Roses & urban neighborhoods', imageSrc: `${M}/pdx.jpeg`, imageAlt: 'Portland skyline' },
        { name: 'Gresham', slug: 'gresham', tagline: 'East county hub', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Gresham and east Multnomah County' },
        { name: 'Troutdale', slug: 'troutdale', tagline: 'Gateway to the Gorge', imageSrc: `${M}/pdx_skyline.jpeg`, imageAlt: 'Troutdale and Columbia River Gorge' },
        { name: 'Fairview', slug: 'fairview', tagline: 'Columbia River community', imageSrc: `${M}/pdx_skyline.jpeg`, imageAlt: 'Fairview area' },
        { name: 'Wood Village', slug: 'wood-village', tagline: 'Small-city living', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Wood Village area' },
        { name: 'Maywood Park', slug: 'maywood-park', tagline: 'Portland enclave', imageSrc: `${M}/pdx.jpeg`, imageAlt: 'Maywood Park and Portland' },
      ],
    },
    {
      name: 'Washington County',
      slug: 'washington',
      description: 'West metro: Beaverton, Hillsboro, Tigard, Tualatin, and the tech corridor.',
      imageSrc: `${M}/Tualatin.jpg`,
      imageAlt: 'Washington County',
      cities: [
        { name: 'Beaverton', slug: 'beaverton', tagline: 'Tech corridor & family neighborhoods', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Beaverton area' },
        { name: 'Hillsboro', slug: 'hillsboro', tagline: 'Silicon Forest & historic downtown', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Hillsboro and Washington County' },
        { name: 'Tigard', slug: 'tigard', tagline: 'Central west metro', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Tigard area' },
        { name: 'Tualatin', slug: 'tualatin', tagline: 'Riverside community', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Tualatin' },
        { name: 'Sherwood', slug: 'sherwood', tagline: 'Wine country edge', imageSrc: `${M}/Tualatin_2.jpg`, imageAlt: 'Sherwood area' },
        { name: 'Wilsonville', slug: 'wilsonville', tagline: 'I-5 corridor hub', imageSrc: `${M}/Tualatin_2.jpg`, imageAlt: 'Wilsonville area' },
        { name: 'Forest Grove', slug: 'forest-grove', tagline: 'University town', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Forest Grove area' },
        { name: 'Cornelius', slug: 'cornelius', tagline: 'Tualatin Valley', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Cornelius area' },
        { name: 'North Plains', slug: 'north-plains', tagline: 'Agricultural heritage', imageSrc: `${M}/Tualatin_2.jpg`, imageAlt: 'North Plains area' },
        { name: 'Banks', slug: 'banks', tagline: 'Highway 26 gateway', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Banks area' },
        { name: 'King City', slug: 'king-city', tagline: 'Active adult community', imageSrc: `${M}/Tualatin_2.jpg`, imageAlt: 'King City area' },
        { name: 'Durham', slug: 'durham', tagline: 'Small-town character', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Durham area' },
      ],
    },
    {
      name: 'Clackamas County',
      slug: 'clackamas',
      description: 'South and east metro: Oregon City, Lake Oswego, West Linn, Happy Valley, and Mt. Hood gateway.',
      imageSrc: `${M}/pdx_skyline.jpeg`,
      imageAlt: 'Clackamas County and Portland',
      cities: [
        { name: 'Lake Oswego', slug: 'lake-oswego', tagline: 'Lakefront living', imageSrc: `${M}/pdx_skyline.jpeg`, imageAlt: 'Lake Oswego area' },
        { name: 'West Linn', slug: 'west-linn', tagline: 'Family-focused community', imageSrc: `${M}/pdx_skyline.jpeg`, imageAlt: 'West Linn area' },
        { name: 'Oregon City', slug: 'oregon-city', tagline: 'End of the Oregon Trail', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Oregon City' },
        { name: 'Happy Valley', slug: 'happy-valley', tagline: 'Growing east county', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Happy Valley area' },
        { name: 'Milwaukie', slug: 'milwaukie', tagline: 'North Clackamas hub', imageSrc: `${M}/pdx_skyline.jpeg`, imageAlt: 'Milwaukie area' },
        { name: 'Gladstone', slug: 'gladstone', tagline: 'Riverside & parks', imageSrc: `${M}/pdx_skyline.jpeg`, imageAlt: 'Gladstone area' },
        { name: 'Sandy', slug: 'sandy', tagline: 'Gateway to Mt. Hood', imageSrc: `${M}/AdobeStock_103952323.jpeg`, imageAlt: 'Sandy and Mt. Hood gateway' },
        { name: 'Estacada', slug: 'estacada', tagline: 'Clackamas River corridor', imageSrc: `${M}/toutle.jpg`, imageAlt: 'Estacada area' },
        { name: 'Canby', slug: 'canby', tagline: 'Agricultural heritage', imageSrc: `${M}/pdx_skyline.jpeg`, imageAlt: 'Canby area' },
        { name: 'Molalla', slug: 'molalla', tagline: 'Rural character', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Molalla area' },
        { name: 'Damascus', slug: 'damascus', tagline: 'Former city, now Portland', imageSrc: `${M}/pdx.jpeg`, imageAlt: 'Damascus area' },
        { name: 'Boring', slug: 'boring', tagline: 'Mt. Hood gateway', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Boring area' },
      ],
    },
    {
      name: 'Clatsop County',
      slug: 'clatsop',
      description: 'Northern Oregon coast: Astoria, Seaside, and beach towns along the Pacific.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Clatsop County coastline',
      cities: [
        { name: 'Astoria', slug: 'astoria', tagline: 'Historic port at the Columbia mouth', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Astoria' },
        { name: 'Cannon Beach', slug: 'cannon-beach', tagline: 'Haystack Rock and iconic beaches', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Cannon Beach' },
        { name: 'Gearhart', slug: 'gearhart', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Gearhart' },
        { name: 'Seaside', slug: 'seaside', tagline: 'Classic coast resort with promenade and beaches', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Seaside' },
        { name: 'Warrenton', slug: 'warrenton', tagline: 'North coast peninsula; Fort Stevens and Columbia', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Warrenton' },
      ],
    },
    {
      name: 'Columbia County',
      slug: 'columbia',
      description: 'Columbia River towns north of Portland, with riverfront and rural acreage.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Columbia County',
      cities: [
        { name: 'Clatskanie', slug: 'clatskanie', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Clatskanie' },
        { name: 'Columbia City', slug: 'columbia-city', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Columbia City' },
        { name: 'Prescott', slug: 'prescott', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Prescott' },
        { name: 'Rainier', slug: 'rainier', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Rainier' },
        { name: 'St. Helens', slug: 'st-helens', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'St. Helens' },
        { name: 'Scappoose', slug: 'scappoose', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Scappoose' },
        { name: 'Vernonia', slug: 'vernonia', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Vernonia' },
      ],
    },
    {
      name: 'Coos County',
      slug: 'coos',
      description: 'Southern Oregon coast: Coos Bay, Bandon, and timber, port, and beach communities.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Coos County coastline',
      cities: [
        { name: 'Bandon', slug: 'bandon', tagline: 'Sea stacks, old town, cranberries', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Bandon' },
        { name: 'Coos Bay', slug: 'coos-bay', tagline: 'Largest city on the Oregon coast', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Coos Bay' },
        { name: 'Coquille', slug: 'coquille', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Coquille' },
        { name: 'Lakeside', slug: 'lakeside', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Lakeside' },
        { name: 'Myrtle Point', slug: 'myrtle-point', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Myrtle Point' },
        { name: 'North Bend', slug: 'north-bend', tagline: 'Coos Bay\'s neighbor; airport and dunes', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'North Bend' },
        { name: 'Powers', slug: 'powers', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Powers' },
      ],
    },
    {
      name: 'Crook County',
      slug: 'crook',
      description: 'Central Oregon high desert and Prineville, with access to recreation and rural property.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Crook County landscape',
      cities: [
        { name: 'Prineville', slug: 'prineville', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Prineville' },
      ],
    },
    {
      name: 'Curry County',
      slug: 'curry',
      description: 'Remote, scenic south coast: Brookings, Gold Beach, and Port Orford.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Curry County coastline',
      cities: [
        { name: 'Brookings', slug: 'brookings', tagline: 'Southern coast banana belt; harbor and redwoods', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Brookings' },
        { name: 'Gold Beach', slug: 'gold-beach', tagline: 'Rogue River mouth and jet boats', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Gold Beach' },
        { name: 'Port Orford', slug: 'port-orford', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Port Orford' },
      ],
    },
    {
      name: 'Deschutes County',
      slug: 'deschutes',
      description: 'Bend, Redmond, Sisters, and La Pine—Central Oregon lifestyle and recreation.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Deschutes County',
      cities: [
        { name: 'Bend', slug: 'bend', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Bend' },
        { name: 'La Pine', slug: 'la-pine', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'La Pine' },
        { name: 'Redmond', slug: 'redmond', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Redmond' },
        { name: 'Sisters', slug: 'sisters', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Sisters' },
      ],
    },
    {
      name: 'Douglas County',
      slug: 'douglas',
      description: 'Roseburg, the Umpqua Valley, and small towns along I-5 and the coast.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Douglas County',
      cities: [
        { name: 'Canyonville', slug: 'canyonville', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Canyonville' },
        { name: 'Drain', slug: 'drain', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Drain' },
        { name: 'Elkton', slug: 'elkton', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Elkton' },
        { name: 'Glendale', slug: 'glendale', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Glendale' },
        { name: 'Myrtle Creek', slug: 'myrtle-creek', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Myrtle Creek' },
        { name: 'Oakland', slug: 'oakland', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Oakland' },
        { name: 'Reedsport', slug: 'reedsport', tagline: 'Umpqua River and Oregon Dunes gateway', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Reedsport' },
        { name: 'Riddle', slug: 'riddle', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Riddle' },
        { name: 'Roseburg', slug: 'roseburg', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Roseburg' },
        { name: 'Sutherlin', slug: 'sutherlin', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Sutherlin' },
        { name: 'Winston', slug: 'winston', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Winston' },
        { name: 'Yoncalla', slug: 'yoncalla', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Yoncalla' },
      ],
    },
    {
      name: 'Gilliam County',
      slug: 'gilliam',
      description: 'Small Columbia Plateau communities with wide-open Eastern Oregon views.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Gilliam County',
      cities: [
        { name: 'Arlington', slug: 'arlington', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Arlington' },
        { name: 'Condon', slug: 'condon', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Condon' },
        { name: 'Lonerock', slug: 'lonerock', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Lonerock' },
      ],
    },
    {
      name: 'Grant County',
      slug: 'grant',
      description: 'Eastern Oregon ranchland, forest, and historic towns along the John Day River.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Grant County',
      cities: [
        { name: 'Canyon City', slug: 'canyon-city', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Canyon City' },
        { name: 'Dayville', slug: 'dayville', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Dayville' },
        { name: 'Granite', slug: 'granite', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Granite' },
        { name: 'John Day', slug: 'john-day', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'John Day' },
        { name: 'Long Creek', slug: 'long-creek', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Long Creek' },
        { name: 'Monument', slug: 'monument', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Monument' },
        { name: 'Mt. Vernon', slug: 'mt-vernon', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Mt. Vernon' },
        { name: 'Prairie City', slug: 'prairie-city', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Prairie City' },
        { name: 'Seneca', slug: 'seneca', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Seneca' },
      ],
    },
    {
      name: 'Harney County',
      slug: 'harney',
      description: 'Oregon’s high desert heart, centered on Burns and Hines.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Harney County',
      cities: [
        { name: 'Burns', slug: 'burns', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Burns' },
        { name: 'Hines', slug: 'hines', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Hines' },
      ],
    },
    {
      name: 'Hood River County',
      slug: 'hood-river',
      description: 'Columbia River Gorge towns with wind, wine, and mountain views.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Hood River County',
      cities: [
        { name: 'Cascade Locks', slug: 'cascade-locks', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Cascade Locks' },
        { name: 'Hood River', slug: 'hood-river', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Hood River' },
      ],
    },
    {
      name: 'Jackson County',
      slug: 'jackson',
      description: 'Southern Oregon: Ashland, Medford, Rogue River valley, and mountain communities.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Jackson County',
      cities: [
        { name: 'Ashland', slug: 'ashland', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Ashland' },
        { name: 'Butte Falls', slug: 'butte-falls', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Butte Falls' },
        { name: 'Central Point', slug: 'central-point', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Central Point' },
        { name: 'Eagle Point', slug: 'eagle-point', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Eagle Point' },
        { name: 'Gold Hill', slug: 'gold-hill', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Gold Hill' },
        { name: 'Jacksonville', slug: 'jacksonville', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Jacksonville' },
        { name: 'Medford', slug: 'medford', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Medford' },
        { name: 'Phoenix', slug: 'phoenix', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Phoenix' },
        { name: 'Rogue River', slug: 'rogue-river', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Rogue River' },
        { name: 'Shady Cove', slug: 'shady-cove', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Shady Cove' },
        { name: 'Talent', slug: 'talent', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Talent' },
      ],
    },
    {
      name: 'Jefferson County',
      slug: 'jefferson',
      description: 'Madras, Culver, and Metolius—Central Oregon farmland and desert views.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Jefferson County',
      cities: [
        { name: 'Culver', slug: 'culver', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Culver' },
        { name: 'Madras', slug: 'madras', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Madras' },
        { name: 'Metolius', slug: 'metolius', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Metolius' },
      ],
    },
    {
      name: 'Josephine County',
      slug: 'josephine',
      description: 'Grants Pass, Cave Junction, and Rogue Valley gateway to the Oregon Caves.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Josephine County',
      cities: [
        { name: 'Cave Junction', slug: 'cave-junction', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Cave Junction' },
        { name: 'Grants Pass', slug: 'grants-pass', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Grants Pass' },
      ],
    },
    {
      name: 'Klamath County',
      slug: 'klamath',
      description: 'Southern Oregon lakes, high desert, and Klamath Falls regional hub.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Klamath County',
      cities: [
        { name: 'Bonanza', slug: 'bonanza', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Bonanza' },
        { name: 'Chiloquin', slug: 'chiloquin', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Chiloquin' },
        { name: 'Klamath Falls', slug: 'klamath-falls', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Klamath Falls' },
        { name: 'Malin', slug: 'malin', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Malin' },
        { name: 'Merrill', slug: 'merrill', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Merrill' },
      ],
    },
    {
      name: 'Lake County',
      slug: 'lake',
      description: 'Wide-open high desert and lakes in south-central Oregon.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Lake County',
      cities: [
        { name: 'Lakeview', slug: 'lakeview', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Lakeview' },
        { name: 'Paisley', slug: 'paisley', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Paisley' },
      ],
    },
    {
      name: 'Lane County',
      slug: 'lane',
      description: 'Eugene, Springfield, coastal and mountain communities across west-central Oregon.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Lane County',
      cities: [
        { name: 'Coburg', slug: 'coburg', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Coburg' },
        { name: 'Cottage Grove', slug: 'cottage-grove', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Cottage Grove' },
        { name: 'Creswell', slug: 'creswell', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Creswell' },
        { name: 'Dunes City', slug: 'dunes-city', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Dunes City' },
        { name: 'Eugene', slug: 'eugene', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Eugene' },
        { name: 'Florence', slug: 'florence', tagline: 'Gateway to the Oregon Dunes and Siuslaw', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Florence' },
        { name: 'Junction City', slug: 'junction-city', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Junction City' },
        { name: 'Lowell', slug: 'lowell', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Lowell' },
        { name: 'Oakridge', slug: 'oakridge', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Oakridge' },
        { name: 'Springfield', slug: 'springfield', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Springfield' },
        { name: 'Veneta', slug: 'veneta', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Veneta' },
        { name: 'Westfir', slug: 'westfir', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Westfir' },
      ],
    },
    {
      name: 'Lincoln County',
      slug: 'lincoln',
      description: 'Central Oregon coast: Newport, Lincoln City, Depoe Bay, and beyond.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Lincoln County coastline',
      cities: [
        { name: 'Depoe Bay', slug: 'depoe-bay', tagline: 'World\'s smallest harbor; whale watching', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Depoe Bay' },
        { name: 'Lincoln City', slug: 'lincoln-city', tagline: 'Seven miles of beaches and family coast', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Lincoln City' },
        { name: 'Newport', slug: 'newport', tagline: 'Central coast hub; aquarium and waterfront', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Newport' },
        { name: 'Siletz', slug: 'siletz', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Siletz' },
        { name: 'Toledo', slug: 'toledo', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Toledo' },
        { name: 'Waldport', slug: 'waldport', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Waldport' },
        { name: 'Yachats', slug: 'yachats', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Yachats' },
      ],
    },
    {
      name: 'Linn County',
      slug: 'linn',
      description: 'Willamette Valley and foothill communities from Albany to Sweet Home.',
      imageSrc: `${M}/Tualatin.jpg`,
      imageAlt: 'Linn County',
      cities: [
        { name: 'Albany', slug: 'albany', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Albany' },
        { name: 'Brownsville', slug: 'brownsville', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Brownsville' },
        { name: 'Halsey', slug: 'halsey', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Halsey' },
        { name: 'Harrisburg', slug: 'harrisburg', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Harrisburg' },
        { name: 'Lebanon', slug: 'lebanon', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Lebanon' },
        { name: 'Lyons', slug: 'lyons', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Lyons' },
        { name: 'Millersburg', slug: 'millersburg', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Millersburg' },
        { name: 'Scio', slug: 'scio', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Scio' },
        { name: 'Sodaville', slug: 'sodaville', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Sodaville' },
        { name: 'Sweet Home', slug: 'sweet-home', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Sweet Home' },
        { name: 'Tangent', slug: 'tangent', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Tangent' },
        { name: 'Waterloo', slug: 'waterloo', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Waterloo' },
      ],
    },
    {
      name: 'Malheur County',
      slug: 'malheur',
      description: 'Eastern Oregon border communities including Ontario, Nyssa, and Vale.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Malheur County',
      cities: [
        { name: 'Adrian', slug: 'adrian', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Adrian' },
        { name: 'Jordan Valley', slug: 'jordan-valley', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Jordan Valley' },
        { name: 'Nyssa', slug: 'nyssa', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Nyssa' },
        { name: 'Ontario', slug: 'ontario', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Ontario' },
        { name: 'Vale', slug: 'vale', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Vale' },
      ],
    },
    {
      name: 'Marion County',
      slug: 'marion',
      description: 'Salem-Keizer, Mt. Angel, and small towns across the mid-Willamette Valley.',
      imageSrc: `${M}/Tualatin.jpg`,
      imageAlt: 'Marion County',
      cities: [
        { name: 'Aumsville', slug: 'aumsville', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Aumsville' },
        { name: 'Aurora', slug: 'aurora', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Aurora' },
        { name: 'Detroit', slug: 'detroit', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Detroit' },
        { name: 'Donald', slug: 'donald', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Donald' },
        { name: 'Gates', slug: 'gates', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Gates' },
        { name: 'Gervais', slug: 'gervais', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Gervais' },
        { name: 'Hubbard', slug: 'hubbard', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Hubbard' },
        { name: 'Idanha', slug: 'idanha', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Idanha' },
        { name: 'Jefferson', slug: 'jefferson', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Jefferson' },
        { name: 'Keizer', slug: 'keizer', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Keizer' },
        { name: 'Mill City', slug: 'mill-city', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Mill City' },
        { name: 'Mt. Angel', slug: 'mt-angel', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Mt. Angel' },
        { name: 'Salem', slug: 'salem', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Salem' },
        { name: 'Scotts Mills', slug: 'scotts-mills', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Scotts Mills' },
        { name: 'Silverton', slug: 'silverton', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Silverton' },
        { name: 'St. Paul', slug: 'st-paul', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'St. Paul' },
        { name: 'Stayton', slug: 'stayton', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Stayton' },
        { name: 'Sublimity', slug: 'sublimity', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Sublimity' },
        { name: 'Turner', slug: 'turner', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Turner' },
        { name: 'Woodburn', slug: 'woodburn', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Woodburn' },
      ],
    },
    {
      name: 'Morrow County',
      slug: 'morrow',
      description: 'Boardman, Heppner, and irrigated farmland along the Columbia Plateau.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Morrow County',
      cities: [
        { name: 'Boardman', slug: 'boardman', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Boardman' },
        { name: 'Heppner', slug: 'heppner', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Heppner' },
        { name: 'Ione', slug: 'ione', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Ione' },
        { name: 'Irrigon', slug: 'irrigon', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Irrigon' },
        { name: 'Lexington', slug: 'lexington', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Lexington' },
      ],
    },
    // Multnomah County already defined above
    {
      name: 'Polk County',
      slug: 'polk',
      description: 'Dallas, Independence, and Willamette Valley communities west of Salem.',
      imageSrc: `${M}/Tualatin.jpg`,
      imageAlt: 'Polk County',
      cities: [
        { name: 'Dallas', slug: 'dallas', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Dallas' },
        { name: 'Falls City', slug: 'falls-city', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Falls City' },
        { name: 'Independence', slug: 'independence', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Independence' },
        { name: 'Monmouth', slug: 'monmouth', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Monmouth' },
      ],
    },
    {
      name: 'Sherman County',
      slug: 'sherman',
      description: 'Small Columbia Plateau towns along the I-84 corridor.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Sherman County',
      cities: [
        { name: 'Grass Valley', slug: 'grass-valley', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Grass Valley' },
        { name: 'Moro', slug: 'moro', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Moro' },
        { name: 'Rufus', slug: 'rufus', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Rufus' },
        { name: 'Wasco', slug: 'wasco', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Wasco' },
      ],
    },
    {
      name: 'Tillamook County',
      slug: 'tillamook',
      description: 'North and central coast dairy and beach towns, from Tillamook to Manzanita.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Tillamook County coastline',
      cities: [
        { name: 'Bay City', slug: 'bay-city', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Bay City' },
        { name: 'Garibaldi', slug: 'garibaldi', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Garibaldi' },
        { name: 'Manzanita', slug: 'manzanita', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Manzanita' },
        { name: 'Nehalem', slug: 'nehalem', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Nehalem' },
        { name: 'Rockaway Beach', slug: 'rockaway-beach', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Rockaway Beach' },
        { name: 'Tillamook', slug: 'tillamook', tagline: 'Tillamook Creamery and Three Capes Route', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Tillamook' },
        { name: 'Wheeler', slug: 'wheeler', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Wheeler' },
      ],
    },
    {
      name: 'Umatilla County',
      slug: 'umatilla',
      description: 'Eastern Oregon Columbia River and plateau communities including Hermiston and Pendleton.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Umatilla County',
      cities: [
        { name: 'Adams', slug: 'adams', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Adams' },
        { name: 'Athena', slug: 'athena', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Athena' },
        { name: 'Echo', slug: 'echo', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Echo' },
        { name: 'Helix', slug: 'helix', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Helix' },
        { name: 'Hermiston', slug: 'hermiston', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Hermiston' },
        { name: 'Milton-Freewater', slug: 'milton-freewater', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Milton-Freewater' },
        { name: 'Pendleton', slug: 'pendleton', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Pendleton' },
        { name: 'Pilot Rock', slug: 'pilot-rock', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Pilot Rock' },
        { name: 'Stanfield', slug: 'stanfield', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Stanfield' },
        { name: 'Ukiah', slug: 'ukiah', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Ukiah' },
        { name: 'Umatilla', slug: 'umatilla', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Umatilla' },
        { name: 'Weston', slug: 'weston', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Weston' },
      ],
    },
    {
      name: 'Union County',
      slug: 'union',
      description: 'La Grande, Island City, and small Eastern Oregon valley communities.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Union County',
      cities: [
        { name: 'Cove', slug: 'cove', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Cove' },
        { name: 'Elgin', slug: 'elgin', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Elgin' },
        { name: 'Imbler', slug: 'imbler', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Imbler' },
        { name: 'Island City', slug: 'island-city', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Island City' },
        { name: 'La Grande', slug: 'la-grande', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'La Grande' },
        { name: 'North Powder', slug: 'north-powder', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'North Powder' },
        { name: 'Summerville', slug: 'summerville', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Summerville' },
        { name: 'Union', slug: 'union', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Union' },
      ],
    },
    {
      name: 'Wallowa County',
      slug: 'wallowa',
      description: 'Northeast Oregon mountains, including Enterprise, Joseph, and Wallowa Lake region.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Wallowa County',
      cities: [
        { name: 'Enterprise', slug: 'enterprise', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Enterprise' },
        { name: 'Joseph', slug: 'joseph', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Joseph' },
        { name: 'Lostine', slug: 'lostine', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Lostine' },
        { name: 'Wallowa', slug: 'wallowa', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Wallowa' },
      ],
    },
    {
      name: 'Wasco County',
      slug: 'wasco',
      description: 'The Dalles, Maupin, Mosier, and small Columbia Gorge and high-desert towns.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Wasco County',
      cities: [
        { name: 'Antelope', slug: 'antelope', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Antelope' },
        { name: 'Dufur', slug: 'dufur', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Dufur' },
        { name: 'Maupin', slug: 'maupin', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Maupin' },
        { name: 'Mosier', slug: 'mosier', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Mosier' },
        { name: 'Shaniko', slug: 'shaniko', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Shaniko' },
        { name: 'The Dalles', slug: 'the-dalles', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'The Dalles' },
      ],
    },
    // Washington County already defined above
    {
      name: 'Wheeler County',
      slug: 'wheeler',
      description: 'One of Oregon’s least populous counties, with rugged terrain and small towns.',
      imageSrc: `${M}/pdx_skyline_2.jpeg`,
      imageAlt: 'Wheeler County',
      cities: [
        { name: 'Fossil', slug: 'fossil', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Fossil' },
        { name: 'Mitchell', slug: 'mitchell', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Mitchell' },
        { name: 'Spray', slug: 'spray', imageSrc: `${M}/pdx_skyline_2.jpeg`, imageAlt: 'Spray' },
      ],
    },
    {
      name: 'Yamhill County',
      slug: 'yamhill',
      description: 'Willamette Valley wine country: Newberg, McMinnville, and surrounding towns.',
      imageSrc: `${M}/Tualatin.jpg`,
      imageAlt: 'Yamhill County',
      cities: [
        { name: 'Amity', slug: 'amity', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Amity' },
        { name: 'Carlton', slug: 'carlton', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Carlton' },
        { name: 'Dayton', slug: 'dayton', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Dayton' },
        { name: 'Dundee', slug: 'dundee', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Dundee' },
        { name: 'Lafayette', slug: 'lafayette', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Lafayette' },
        { name: 'McMinnville', slug: 'mcminnville', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'McMinnville' },
        { name: 'Newberg', slug: 'newberg', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Newberg' },
        { name: 'Sheridan', slug: 'sheridan', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Sheridan' },
        { name: 'Willamina', slug: 'willamina', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Willamina' },
        { name: 'Yamhill', slug: 'yamhill', imageSrc: `${M}/Tualatin.jpg`, imageAlt: 'Yamhill' },
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
        { name: 'Vancouver', slug: 'vancouver', tagline: 'Portland-Vancouver metro', imageSrc: `${M}/camas_river.webp`, imageAlt: 'Vancouver and Columbia River' },
        { name: 'Camas', slug: 'camas', tagline: 'Paper mill town turned gem', imageSrc: `${M}/camas_landing.jpg`, imageAlt: 'Camas' },
        { name: 'Battle Ground', slug: 'battle-ground', tagline: 'North Clark County', imageSrc: `${M}/battle_ground.jfif`, imageAlt: 'Battle Ground' },
        { name: 'Washougal', slug: 'washougal', tagline: 'Columbia River gateway', imageSrc: `${M}/wasougal.jpg`, imageAlt: 'Washougal' },
        { name: 'Ridgefield', slug: 'ridgefield', tagline: 'I-5 & wildlife refuge', imageSrc: `${M}/ridgefield_river.webp`, imageAlt: 'Ridgefield' },
        { name: 'La Center', slug: 'la-center', tagline: 'Card rooms & countryside', imageSrc: `${M}/lacenter1.jpg`, imageAlt: 'La Center' },
        { name: 'Yacolt', slug: 'yacolt', tagline: 'Foothills community', imageSrc: `${M}/ariel.jpg`, imageAlt: 'Yacolt area' },
        { name: 'Amboy', slug: 'amboy', tagline: 'Rural Clark County', imageSrc: `${M}/amboy.jpg`, imageAlt: 'Amboy' },
      ],
    },
    {
      name: 'Cowlitz County',
      slug: 'cowlitz',
      description: 'Longview, Kelso, Castle Rock, Kalama, and the Lower Columbia River corridor.',
      imageSrc: `${M}/kelso.jpg`,
      imageAlt: 'Cowlitz County',
      cities: [
        { name: 'Longview', slug: 'longview', tagline: 'Planned city on the Columbia', imageSrc: `${M}/Longview.jpg`, imageAlt: 'Longview' },
        { name: 'Kelso', slug: 'kelso', tagline: 'Cowlitz County seat', imageSrc: `${M}/kelso.jpg`, imageAlt: 'Kelso' },
        { name: 'Castle Rock', slug: 'castle-rock', tagline: 'I-5 & Mount St. Helens', imageSrc: `${M}/castle%20rock.jpg`, imageAlt: 'Castle Rock' },
        { name: 'Kalama', slug: 'kalama', tagline: 'Riverfront & antiques', imageSrc: `${M}/kalama.webp`, imageAlt: 'Kalama' },
        { name: 'Woodland', slug: 'woodland', tagline: 'Lewis River & I-5', imageSrc: `${M}/kelso.jpg`, imageAlt: 'Woodland area' },
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
