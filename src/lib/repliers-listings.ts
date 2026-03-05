/**
 * Repliers.io IDX feed sync for RMLS compliance (12-hour refresh).
 * Fetches active listings via POST /listings and upserts into Supabase.
 * Do not expose seller_contact or showing_instructions to public.
 */

import type { RepliersConfig } from './repliers';
import type { SupabaseClient } from '@supabase/supabase-js';

const REPLIERS_BASE = 'https://api.repliers.io';
const REPLIERS_CDN = 'https://cdn.repliers.io';
const RESULTS_PER_PAGE = 100;

/** Repliers listing search response (listings array item). */
export interface RepliersListing {
  mlsNumber: string;
  status?: string;
  listPrice?: string | number | null;
  listDate?: string | null;
  lastStatus?: string | null;
  address?: {
    streetNumber?: string | null;
    streetName?: string | null;
    streetSuffix?: string | null;
    unitNumber?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  } | null;
  office?: { brokerageName?: string | null } | null;
  details?: {
    numBedrooms?: number | string | null;
    numBathrooms?: number | string | null;
    sqft?: string | number | null;
  } | null;
  images?: string[] | null;
  timestamps?: {
    expiryDate?: string | null;
    listingUpdated?: string | null;
  } | null;
  agents?: Array<{ name?: string | null; [key: string]: unknown }> | null;
}

/** Repliers POST /listings response. */
interface RepliersListingsResponse {
  listings?: RepliersListing[];
  page?: number;
  numPages?: number;
  pageSize?: number;
  count?: number;
}

/** Map Repliers status + lastStatus to our status. */
function toOurStatus(repliers: RepliersListing): 'Active' | 'Pending' | 'Expired' | 'Withdrawn' | 'Canceled' | 'Sold' {
  const s = (repliers.status ?? '').toUpperCase();
  const last = (repliers.lastStatus ?? '').toLowerCase();
  if (s === 'U') {
    if (last === 'sld') return 'Sold';
    if (last === 'exp') return 'Expired';
    if (last === 'ter' || last === 'dft') return 'Withdrawn';
    if (last === 'pc' || last === 'lc') return 'Canceled';
    return 'Expired';
  }
  if (last === 'new' || last === 'sus' || last === 'ext') return 'Active';
  if (last === 'sce' || last === 'lce' || last === 'pc') return 'Pending';
  return 'Active';
}

/** Build full address line from Repliers address object. */
function formatAddress(addr: RepliersListing['address']): string {
  if (!addr) return '';
  const parts = [
    addr.streetNumber,
    [addr.streetName, addr.streetSuffix].filter(Boolean).join(' '),
    addr.unitNumber ? `#${addr.unitNumber}` : null,
  ].filter(Boolean);
  return parts.join(' ').trim();
}

/** First image URL from Repliers (CDN base + path). */
function firstImageUrl(images: string[] | null | undefined): string | null {
  const first = images?.[0];
  if (!first || typeof first !== 'string') return null;
  if (first.startsWith('http')) return first;
  const path = first.startsWith('/') ? first.slice(1) : first;
  return `${REPLIERS_CDN}/${path}`;
}

/** Parse expiry date to YYYY-MM-DD for expiration_date column. */
function expiryDate(repliers: RepliersListing): string | null {
  const raw = repliers.timestamps?.expiryDate;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/** Map one Repliers listing to our listings row (no restricted fields). */
function toListingsRow(repliers: RepliersListing): {
  mls_listing_id: string;
  status: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  listing_firm_name: string;
  listing_agent_name: string | null;
  image_url: string | null;
  expiration_date: string | null;
  updated_at: string;
} {
  const addr = repliers.address;
  const priceRaw = repliers.listPrice;
  const price = typeof priceRaw === 'number' ? priceRaw : typeof priceRaw === 'string' ? parseFloat(priceRaw) : null;
  const beds = typeof repliers.details?.numBedrooms === 'number' ? repliers.details.numBedrooms : null;
  const bathsRaw = repliers.details?.numBathrooms;
  const baths = typeof bathsRaw === 'number' ? bathsRaw : typeof bathsRaw === 'string' ? parseFloat(bathsRaw) : null;
  const sqftRaw = repliers.details?.sqft;
  const sqft = typeof sqftRaw === 'number' ? sqftRaw : typeof sqftRaw === 'string' ? parseInt(sqftRaw, 10) : null;
  const agentName = repliers.agents?.[0]?.name ?? null;

  return {
    mls_listing_id: repliers.mlsNumber,
    status: toOurStatus(repliers),
    address: formatAddress(addr) || null,
    city: addr?.city ?? null,
    state: addr?.state ?? null,
    zip: addr?.zip ?? null,
    price: Number.isFinite(price) ? price : null,
    beds: beds != null && Number.isFinite(beds) ? beds : null,
    baths: baths != null && Number.isFinite(baths) ? baths : null,
    sqft: sqft != null && Number.isFinite(sqft) ? sqft : null,
    listing_firm_name: repliers.office?.brokerageName?.trim() || 'Unknown',
    listing_agent_name: typeof agentName === 'string' ? agentName.trim() || null : null,
    image_url: firstImageUrl(repliers.images),
    expiration_date: expiryDate(repliers),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch one page of active listings from Repliers (status=A).
 */
export async function fetchRepliersListingsPage(
  config: RepliersConfig,
  pageNum: number,
  resultsPerPage: number = RESULTS_PER_PAGE
): Promise<RepliersListingsResponse> {
  const url = new URL(`${REPLIERS_BASE}/listings`);
  url.searchParams.set('status', 'A');
  url.searchParams.set('pageNum', String(pageNum));
  url.searchParams.set('resultsPerPage', String(resultsPerPage));

  const res = await config.fetch(url.toString(), { method: 'POST', body: JSON.stringify({}) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Repliers listings ${res.status}: ${text}`);
  }
  return (await res.json()) as RepliersListingsResponse;
}

/**
 * Fetch all active listings from Repliers (paginated).
 */
export async function fetchAllRepliersActiveListings(
  config: RepliersConfig
): Promise<RepliersListing[]> {
  const all: RepliersListing[] = [];
  let pageNum = 1;
  let numPages = 1;

  do {
    const data = await fetchRepliersListingsPage(config, pageNum);
    const list = data.listings ?? [];
    all.push(...list);
    numPages = data.numPages ?? 1;
    const count = data.count ?? 0;
    pageNum += 1;
    if (list.length === 0 || pageNum > numPages) break;
  } while (true);

  return all;
}

/**
 * Sync Repliers IDX feed into Supabase listings table.
 * Upserts all active listings; marks listings no longer in the feed as Expired.
 */
export async function syncRepliersListingsToSupabase(
  config: RepliersConfig,
  supabase: SupabaseClient
): Promise<{ upserted: number; expired: number }> {
  const list = await fetchAllRepliersActiveListings(config);
  const rows = list.map(toListingsRow);
  const mlsIds = new Set(rows.map((r) => r.mls_listing_id));

  let upserted = 0;
  for (const row of rows) {
    const { error } = await supabase.from('listings').upsert(
      {
        ...row,
        seller_contact: null,
        showing_instructions: null,
      },
      { onConflict: 'mls_listing_id', ignoreDuplicates: false }
    );
    if (error) throw new Error(`listings upsert ${row.mls_listing_id}: ${error.message}`);
    upserted += 1;
  }

  // Mark as Expired any listing still Active/Pending that was not in this feed
  const { data: existing } = await supabase
    .from('listings')
    .select('mls_listing_id')
    .in('status', ['Active', 'Pending']);

  const toExpire = (existing ?? []).filter((r) => !mlsIds.has(r.mls_listing_id));
  let expired = 0;
  for (const { mls_listing_id } of toExpire) {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'Expired', updated_at: new Date().toISOString() })
      .eq('mls_listing_id', mls_listing_id);
    if (!error) expired += 1;
  }

  return { upserted, expired };
}
