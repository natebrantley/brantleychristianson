/**
 * Centralized Repliers API request/response types.
 * Use in all Repliers call sites; validate critical fields at runtime after res.json().
 */

/** Address object from Repliers listing */
export interface RepliersAddress {
  streetNumber?: string | null;
  streetName?: string | null;
  streetSuffix?: string | null;
  unitNumber?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Single listing in POST /listings response */
export interface RepliersListingItem {
  mlsNumber: string;
  status?: string;
  listPrice?: string | number | null;
  listDate?: string | null;
  lastStatus?: string | null;
  address?: RepliersAddress | null;
  office?: { brokerageName?: string | null } | null;
  details?: {
    numBedrooms?: number | string | null;
    numBathrooms?: number | string | null;
    sqft?: string | number | null;
    [key: string]: unknown;
  } | null;
  images?: string[] | null;
  timestamps?: {
    expiryDate?: string | null;
    listingUpdated?: string | null;
    [key: string]: unknown;
  } | null;
  agents?: Array<{ name?: string | null; [key: string]: unknown }> | null;
  score?: number;
  [key: string]: unknown;
}

/** POST /listings response */
export interface RepliersListingsResponse {
  listings?: RepliersListingItem[];
  page?: number;
  numPages?: number;
  pageSize?: number;
  count?: number;
  aggregates?: {
    map?: {
      clusters?: RepliersMapCluster[];
    };
    [key: string]: unknown;
  };
  statistics?: Record<string, unknown>;
}

export interface RepliersMapCluster {
  count: number;
  location?: { latitude: number; longitude: number };
  bounds?: Record<string, unknown>;
  map?: unknown;
  listing?: RepliersListingItem;
  listings?: RepliersListingItem[];
  statistics?: Record<string, unknown>;
}

/** GET single listing (expanded) response */
export interface RepliersSingleListingResponse {
  listing?: RepliersListingItem;
  comparables?: RepliersListingItem[];
  history?: unknown[];
  [key: string]: unknown;
}

/** NLP POST response: structured query + nlpId for session */
export interface RepliersNlpResponse {
  request?: Record<string, unknown>;
  nlpId?: string;
  [key: string]: unknown;
}

/** Webhook payload (structure per Repliers docs; validate event type and payload) */
export interface RepliersWebhookPayload {
  event?: string;
  eventId?: string;
  data?: unknown;
  [key: string]: unknown;
}

/** Ensure listings array is present and is array; default to empty. */
export function normalizeListingsResponse(
  data: unknown
): { listings: RepliersListingItem[]; page?: number; numPages?: number; count?: number } {
  if (data == null || typeof data !== 'object') {
    return { listings: [] };
  }
  const d = data as Record<string, unknown>;
  const listings = Array.isArray(d.listings) ? d.listings : [];
  return {
    listings: listings as RepliersListingItem[],
    page: typeof d.page === 'number' ? d.page : undefined,
    numPages: typeof d.numPages === 'number' ? d.numPages : undefined,
    count: typeof d.count === 'number' ? d.count : undefined,
  };
}

/** Ensure single listing response has listing object. */
export function normalizeSingleListingResponse(
  data: unknown
): { listing: RepliersListingItem | null; comparables?: RepliersListingItem[] } {
  if (data == null || typeof data !== 'object') {
    return { listing: null };
  }
  const d = data as Record<string, unknown>;
  const listing =
    d.listing != null && typeof d.listing === 'object' && 'mlsNumber' in d.listing
      ? (d.listing as RepliersListingItem)
      : null;
  const comparables = Array.isArray(d.comparables) ? (d.comparables as RepliersListingItem[]) : undefined;
  return { listing, comparables };
}
