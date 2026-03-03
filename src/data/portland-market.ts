/**
 * Portland market data – verified as of March 2026.
 * Used for hero stat cards, financing breakdown, and neighborhood spotlight.
 */

export const PORTLAND_MARKET_VERIFIED = 'March 2026';

export const portlandMarketStats = {
  medianSoldPrice: 480_000,
  medianPricePerSqFt: 302,
  avgDaysToPending: 30,
  saleToListRatio: 100,
  trend: 'Hot' as const,
} as const;

export const portlandFinancing = [
  { label: 'Conventional', pct: 61 },
  { label: 'All-Cash', pct: 24, highlight: true },
  { label: 'FHA', pct: 9 },
  { label: 'Other', pct: 6 },
] as const;

export const portlandTrendingNeighborhoods = [
  { name: 'St. Johns', zip: '97203' },
  { name: 'SE Portland', zip: '97206' },
  { name: 'SW Portland', zip: '97219' },
  { name: 'Gresham', zip: '97080' },
] as const;
