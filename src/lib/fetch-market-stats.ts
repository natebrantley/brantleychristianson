/**
 * Server-side fetch for market stats. Use in RSC to avoid client round-trip.
 * Maps API response to MarketStatsData. Returns null on failure or missing data.
 */

import { SITE_URL } from '@/config/site';
import type { MarketStatsData } from '@/components/markets/MarketStats';

const REVALIDATE_SECONDS = 300;

export async function getMarketStatsForCity(cityName: string): Promise<MarketStatsData | null> {
  const base =
    process.env.NODE_ENV === 'production'
      ? SITE_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
  const url = `${base}/api/market/stats?city=${encodeURIComponent(cityName)}`;
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    const data = (await res.json()) as { statistics?: Record<string, unknown>; city?: string | null };
    const stats = data.statistics;
    if (!stats || typeof stats !== 'object') return null;
    const med = stats['med-listPrice'];
    const avg = stats['avg-listPrice'];
    const count = stats['count'];
    const medianListPrice = typeof med === 'number' ? med : undefined;
    const averageListPrice = typeof avg === 'number' ? avg : undefined;
    const countNum = typeof count === 'number' ? count : undefined;
    if (medianListPrice == null && averageListPrice == null && countNum == null) return null;
    return {
      medianListPrice: medianListPrice ?? undefined,
      averageListPrice: averageListPrice ?? undefined,
      count: countNum ?? undefined,
    };
  } catch {
    return null;
  }
}
