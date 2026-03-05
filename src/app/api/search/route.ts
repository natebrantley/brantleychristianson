/**
 * Search listings via Repliers API with validation, fallback to Supabase, and RMLS stripping.
 * GET /api/search?pageNum=1&resultsPerPage=20&minPrice=... etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSearchParamsFromUrl, parseSearchParams } from '@/lib/validate-search-params';
import { repliersSearchListings } from '@/lib/repliers-client';
import { supabaseAdmin } from '@/lib/supabase';
import { apiErrorResponse, API_ERROR_CODES } from '@/lib/api-errors';
import { RMLS_PUBLIC_STATUSES } from '@/lib/listings-rmls';
import { getClientIp, isRateLimited } from '@/lib/rateLimit';
import type { RepliersListingItem } from '@/lib/repliers-types';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_KEY_PREFIX = 'search:';

/** Strip restricted fields and filter to public statuses for response. */
function toPublicItem(item: RepliersListingItem): Record<string, unknown> {
  const status = (item.status ?? '').toString().toUpperCase();
  const last = ((item as Record<string, unknown>).lastStatus as string) ?? '';
  const allowed =
    status === 'A' ||
    (status === 'U' && ['new', 'sus', 'ext', 'sce', 'lce', 'pc'].includes(last.toLowerCase()));
  const row = item as Record<string, unknown>;
  const { seller_contact, showing_instructions, ...rest } = row;
  void seller_contact;
  void showing_instructions;
  if (!allowed) return { ...rest, status: 'Expired' };
  return rest;
}

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const start = Date.now();

  const clientIp = getClientIp(request);
  if (isRateLimited(`${RATE_LIMIT_KEY_PREFIX}${clientIp}`)) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.TOO_MANY_REQUESTS);
    return NextResponse.json(body, { status });
  }

  const raw = getSearchParamsFromUrl(request.nextUrl.searchParams);
  const parsed = parseSearchParams(raw as Record<string, unknown>);
  if (!parsed.success) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  const params = parsed.data;
  const searchParams: Record<string, string | number | boolean | string[]> = {
    pageNum: params.pageNum,
    resultsPerPage: params.resultsPerPage,
    status: params.status ?? 'A',
  };
  if (params.minPrice != null) searchParams.minPrice = params.minPrice;
  if (params.maxPrice != null) searchParams.maxPrice = params.maxPrice;
  if (params.minBedrooms != null) searchParams.minBedrooms = params.minBedrooms;
  if (params.maxBedrooms != null) searchParams.maxBedrooms = params.maxBedrooms;
  if (params.minBaths != null) searchParams.minBaths = params.minBaths;
  if (params.maxBaths != null) searchParams.maxBaths = params.maxBaths;
  if (params.minSqft != null) searchParams.minSqft = params.minSqft;
  if (params.maxSqft != null) searchParams.maxSqft = params.maxSqft;
  if (params.city?.length) searchParams.city = params.city;
  if (params.search) searchParams.search = params.search;
  if (params.sort) searchParams.sort = params.sort;
  if (params.cluster === true) {
    searchParams.cluster = true;
    searchParams.listings = params.listings ?? true;
    if (params.clusterPrecision != null) searchParams.clusterPrecision = params.clusterPrecision;
    if (params.clusterFields) searchParams.clusterFields = params.clusterFields;
    if (params.clusterLimit != null) searchParams.clusterLimit = params.clusterLimit;
    if (params.clusterListingsThreshold != null)
      searchParams.clusterListingsThreshold = params.clusterListingsThreshold;
  }

  let supabase: ReturnType<typeof supabaseAdmin> | undefined;
  try {
    supabase = supabaseAdmin();
  } catch {
    supabase = undefined;
  }

  const result = await repliersSearchListings({
    searchParams,
    correlationId,
    supabaseFallback: supabase,
  });

  const durationMs = Date.now() - start;

  if ('error' in result) {
    const { body, status } = apiErrorResponse(result.error);
    console.log('search: error', { correlationId, route: '/api/search', statusCode: status, durationMs });
    return NextResponse.json(body, { status });
  }

  let listings: Record<string, unknown>[];
  let count: number;
  if (result.source === 'repliers') {
    listings = result.listings
      .filter((item) => {
        const s = (item.status ?? '').toString().toUpperCase();
        const last = ((item as Record<string, unknown>).lastStatus as string) ?? '';
        if (s === 'A') return true;
        if (s === 'U')
          return ['new', 'sus', 'ext', 'sce', 'lce', 'pc'].includes(last.toLowerCase());
        return false;
      })
      .map(toPublicItem);
    count = result.count ?? listings.length;
  } else {
    listings = result.listings;
    count = result.count;
  }

  const response: {
    listings: Record<string, unknown>[];
    count: number;
    page?: number;
    numPages?: number;
    source?: 'cache';
    aggregates?: unknown;
  } = {
    listings,
    count,
    ...(result.source === 'repliers' && {
      page: result.page,
      numPages: result.numPages,
      ...(result.aggregates && { aggregates: result.aggregates }),
    }),
    ...(result.source === 'cache' && { source: 'cache' as const }),
  };

  console.log('search: success', {
    correlationId,
    route: '/api/search',
    statusCode: 200,
    durationMs,
    source: result.source,
    count: listings.length,
  });

  return NextResponse.json(response);
}
