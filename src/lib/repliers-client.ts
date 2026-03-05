/**
 * Repliers API client with timeout, retry, and optional fallback to Supabase.
 * Use for listing search and single-listing requests; never expose API key to client.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeListingsResponse,
  normalizeSingleListingResponse,
  type RepliersListingItem,
  type RepliersListingsResponse,
  type RepliersSingleListingResponse,
} from './repliers-types';
import { API_ERROR_CODES, type ApiErrorCode } from './api-errors';
import { RMLS_PUBLIC_STATUSES } from './listings-rmls';

const REPLIERS_BASE = 'https://api.repliers.io';
const REPLIERS_CDN = 'https://cdn.repliers.io';
const DEFAULT_TIMEOUT_MS = 18000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAYS_MS = [1000, 2000];

function getApiKey(): string | null {
  const key = process.env.REPLIERS_API_KEY?.trim();
  return key || null;
}

function getTimeoutMs(): number {
  const v = process.env.REPLIERS_TIMEOUT_MS;
  if (v == null || v === '') return DEFAULT_TIMEOUT_MS;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 60000) : DEFAULT_TIMEOUT_MS;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  apiKey: string
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'REPLIERS-API-KEY': apiKey,
        ...(init.headers as Record<string, string>),
      },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  isRetryable: (err: unknown) => boolean
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= RETRY_ATTEMPTS; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < RETRY_ATTEMPTS && isRetryable(err)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[i]));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

function isRetryableRepliersError(res: Response): boolean {
  return res.status >= 500 || res.status === 429;
}

/**
 * Search listings via Repliers POST /listings.
 * On timeout or 5xx after retries, optionally fall back to Supabase cache.
 */
export async function repliersSearchListings(options: {
  searchParams: Record<string, string | number | boolean | string[] | undefined>;
  body?: Record<string, unknown>;
  correlationId?: string;
  supabaseFallback?: SupabaseClient;
}): Promise<
  | { source: 'repliers'; listings: RepliersListingItem[]; page?: number; numPages?: number; count?: number; aggregates?: RepliersListingsResponse['aggregates'] }
  | { source: 'cache'; listings: Record<string, unknown>[]; count: number }
  | { error: ApiErrorCode }
> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (options.supabaseFallback) {
      return fallbackSearchFromSupabase(options.supabaseFallback, options.searchParams);
    }
    return { error: API_ERROR_CODES.REPLIERS_UNAVAILABLE };
  }

  const timeoutMs = getTimeoutMs();
  const url = new URL(`${REPLIERS_BASE}/listings`);
  Object.entries(options.searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, String(v)));
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  const body = options.body ?? {};

  try {
    const res = await withRetry(
      async () => {
        const r = await fetchWithTimeout(
          url.toString(),
          { method: 'POST', body: JSON.stringify(body) },
          timeoutMs,
          apiKey
        );
        if (r.status >= 500 || r.status === 429) {
          const e = new Error(`Repliers ${r.status}`) as Error & { response?: Response };
          e.response = r;
          throw e;
        }
        return r;
      },
      (err) => {
        if (err instanceof Error && err.name === 'AbortError') return true;
        if (err instanceof Error && (err as Error & { response?: Response }).response)
          return isRetryableRepliersError((err as Error & { response: Response }).response);
        return false;
      }
    );

    if (res.status === 429) {
      return { error: API_ERROR_CODES.REPLIERS_RATE_LIMIT };
    }

    if (!res.ok) {
      if (options.supabaseFallback && res.status >= 500) {
        return fallbackSearchFromSupabase(options.supabaseFallback, options.searchParams);
      }
      return { error: API_ERROR_CODES.REPLIERS_UNAVAILABLE };
    }

    const data = (await res.json().catch(() => ({}))) as unknown;
    const normalized = normalizeListingsResponse(data);
    const d = data as Record<string, unknown>;
    return {
      source: 'repliers',
      listings: normalized.listings,
      page: normalized.page,
      numPages: normalized.numPages,
      count: normalized.count,
      aggregates: d.aggregates as RepliersListingsResponse['aggregates'],
    };
  } catch (err) {
    if (options.supabaseFallback) {
      return fallbackSearchFromSupabase(options.supabaseFallback, options.searchParams);
    }
    return { error: API_ERROR_CODES.REPLIERS_UNAVAILABLE };
  }
}

/** Fallback: query Supabase listings (Active/Pending only) with basic filters. */
async function fallbackSearchFromSupabase(
  supabase: SupabaseClient,
  params: Record<string, string | number | boolean | string[] | undefined>
): Promise<{ source: 'cache'; listings: Record<string, unknown>[]; count: number }> {
  let query = supabase
    .from('listings')
    .select('id, mls_listing_id, status, address, city, state, zip, price, beds, baths, sqft, listing_firm_name, listing_agent_name, image_url, expiration_date, created_at, updated_at', { count: 'exact' })
    .in('status', [...RMLS_PUBLIC_STATUSES]);

  const minPrice = typeof params.minPrice === 'number' ? params.minPrice : undefined;
  const maxPrice = typeof params.maxPrice === 'number' ? params.maxPrice : undefined;
  if (minPrice != null) query = query.gte('price', minPrice);
  if (maxPrice != null) query = query.lte('price', maxPrice);

  const city = params.city;
  if (city !== undefined) {
    const cities = Array.isArray(city) ? city : [city];
    const arr = cities.map(String).filter(Boolean);
    if (arr.length > 0) query = query.in('city', arr);
  }

  const { data, error, count } = await query.limit(100).order('updated_at', { ascending: false });

  if (error) {
    return { source: 'cache', listings: [], count: 0 };
  }
  const rows = (data ?? []) as Record<string, unknown>[];
  return { source: 'cache', listings: rows, count: count ?? rows.length };
}

/**
 * Get single listing by mlsNumber via Repliers (or fallback to Supabase).
 */
export async function repliersGetSingleListing(options: {
  mlsNumber: string;
  correlationId?: string;
  supabaseFallback?: SupabaseClient;
}): Promise<
  | { source: 'repliers'; listing: RepliersListingItem; comparables?: RepliersListingItem[] }
  | { source: 'cache'; listing: Record<string, unknown> }
  | { error: ApiErrorCode }
> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (options.supabaseFallback) {
      return fallbackSingleFromSupabase(options.supabaseFallback, options.mlsNumber);
    }
    return { error: API_ERROR_CODES.REPLIERS_UNAVAILABLE };
  }

  const timeoutMs = getTimeoutMs();
  const url = `${REPLIERS_BASE}/listings?mlsNumber=${encodeURIComponent(options.mlsNumber)}`;

  try {
    const res = await withRetry(
      async () => {
        const r = await fetchWithTimeout(url, { method: 'GET' }, timeoutMs, apiKey);
        if (r.status >= 500 || r.status === 429) {
          const e = new Error(`Repliers ${r.status}`) as Error & { response?: Response };
          e.response = r;
          throw e;
        }
        return r;
      },
      (err) => {
        if (err instanceof Error && err.name === 'AbortError') return true;
        if (err instanceof Error && (err as Error & { response?: Response }).response)
          return isRetryableRepliersError((err as Error & { response: Response }).response);
        return false;
      }
    );

    if (res.status === 404) {
      if (options.supabaseFallback) {
        return fallbackSingleFromSupabase(options.supabaseFallback, options.mlsNumber);
      }
      return { error: API_ERROR_CODES.NOT_FOUND };
    }

    if (!res.ok) {
      if (options.supabaseFallback && res.status >= 500) {
        return fallbackSingleFromSupabase(options.supabaseFallback, options.mlsNumber);
      }
      return { error: API_ERROR_CODES.REPLIERS_UNAVAILABLE };
    }

    const data = (await res.json().catch(() => ({}))) as unknown;
    const { listing, comparables } = normalizeSingleListingResponse(data);
    if (!listing) {
      if (options.supabaseFallback) {
        return fallbackSingleFromSupabase(options.supabaseFallback, options.mlsNumber);
      }
      return { error: API_ERROR_CODES.NOT_FOUND };
    }
    return { source: 'repliers', listing, comparables };
  } catch {
    if (options.supabaseFallback) {
      return fallbackSingleFromSupabase(options.supabaseFallback, options.mlsNumber);
    }
    return { error: API_ERROR_CODES.REPLIERS_UNAVAILABLE };
  }
}

async function fallbackSingleFromSupabase(
  supabase: SupabaseClient,
  mlsNumber: string
): Promise<
  | { source: 'cache'; listing: Record<string, unknown> }
  | { error: ApiErrorCode }
> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, mls_listing_id, status, address, city, state, zip, price, beds, baths, sqft, listing_firm_name, listing_agent_name, image_url, expiration_date, created_at, updated_at')
    .eq('mls_listing_id', mlsNumber)
    .single();

  if (error || !data) {
    return { error: API_ERROR_CODES.NOT_FOUND };
  }
  const row = data as Record<string, unknown>;
  if (!RMLS_PUBLIC_STATUSES.includes((row.status as string) as 'Active' | 'Pending')) {
    return { source: 'cache', listing: row };
  }
  return { source: 'cache', listing: row };
}

export { REPLIERS_BASE, REPLIERS_CDN };
