import { assetPaths } from '@/config/theme';

const BASE = assetPaths.condos;

export interface Condo {
  name: string;
  slug: string;
  imageSrc: string;
  href: string;
}

export const condos: Condo[] = [
  { name: 'Eliot Tower', slug: 'eliot-tower', imageSrc: `${BASE}/eliot-tower.jpg`, href: '/markets/eliot-tower' },
  { name: 'Elizabeth', slug: 'elizabeth', imageSrc: `${BASE}/elizabeth.jpg`, href: '/markets/elizabeth' },
  { name: 'Harrison', slug: 'harrison', imageSrc: `${BASE}/harrison.jpg`, href: '/markets/harrison' },
  { name: 'Lexis', slug: 'lexis', imageSrc: `${BASE}/lexis.jpg`, href: '/markets/lexis' },
  { name: 'Marshall Wells', slug: 'marshall-wells', imageSrc: `${BASE}/marshall-wells.jpg`, href: '/markets/marshall-wells' },
  { name: 'Ritz', slug: 'ritz', imageSrc: `${BASE}/ritz.jpg`, href: '/markets/ritz' },
];
