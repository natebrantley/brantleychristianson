/**
 * Market statistics from Repliers (aggregates + statistics).
 * GET /api/market/stats?city=Portland or similar. Short-lived cache recommended at call site.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isRateLimited } from '@/lib/rateLimit';
import { apiErrorResponse, API_ERROR_CODES } from '@/lib/api-errors';

const REPLIERS_BASE = 'https://api.repliers.io';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (isRateLimited(`market-stats:${clientIp}`)) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.TOO_MANY_REQUESTS);
    return NextResponse.json(body, { status });
  }

  const apiKey = process.env.REPLIERS_API_KEY?.trim();
  if (!apiKey) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.REPLIERS_UNAVAILABLE);
    return NextResponse.json(body, { status });
  }

  const city = request.nextUrl.searchParams.get('city')?.trim().slice(0, 100);
  const url = new URL(`${REPLIERS_BASE}/listings`);
  url.searchParams.set('status', 'A');
  url.searchParams.set('listings', 'false');
  url.searchParams.set('statistics', 'avg-listPrice,med-listPrice,count');
  if (city) url.searchParams.set('city', city);

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'REPLIERS-API-KEY': apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const { body: errBody, status } = apiErrorResponse(API_ERROR_CODES.REPLIERS_UNAVAILABLE);
      return NextResponse.json(errBody, { status });
    }

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json({ statistics: data.statistics ?? {}, city: city ?? null });
  } catch {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.REPLIERS_UNAVAILABLE);
    return NextResponse.json(body, { status });
  }
}
