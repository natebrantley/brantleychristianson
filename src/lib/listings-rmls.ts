/**
 * RMLS compliance: listing status and restricted fields.
 * - Only Active (and optionally Pending) listings may be shown on public IDX.
 * - Expired/Withdrawn/Canceled/Sold must not be displayed to the public without login.
 * - seller_contact and showing_instructions must NEVER be sent to the front for public pages.
 */

export const RMLS_PUBLIC_STATUSES = ['Active', 'Pending'] as const;
export type RMLSPublicStatus = (typeof RMLS_PUBLIC_STATUSES)[number];

/** Statuses that must not be shown on public IDX (only behind VOW login if permitted). */
export const RMLS_RESTRICTED_STATUSES = ['Expired', 'Withdrawn', 'Canceled', 'Sold'] as const;

export interface ListingRow {
  id: string;
  mls_listing_id: string;
  status: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  listing_firm_name: string;
  listing_agent_name?: string | null;
  image_url?: string | null;
  expiration_date?: string | null;
  seller_contact?: string | null;
  showing_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Safe shape for public IDX: no seller contact, no showing instructions, only displayable statuses. */
export interface ListingPublic {
  id: string;
  mls_listing_id: string;
  status: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  listing_firm_name: string;
  listing_agent_name?: string | null;
  image_url?: string | null;
  expiration_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Strip restricted fields and ensure only public statuses when for unauthenticated display. */
export function toPublicListing(row: ListingRow, forPublicIdX: boolean): ListingPublic | null {
  if (forPublicIdX && !RMLS_PUBLIC_STATUSES.includes(row.status as RMLSPublicStatus)) {
    return null;
  }
  const { seller_contact: _sc, showing_instructions: _si, ...rest } = row;
  return rest as ListingPublic;
}

/** Filter listing rows to only those displayable on public IDX. */
export function filterPublicListings<T extends { status: string }>(rows: T[]): T[] {
  return rows.filter((r) => RMLS_PUBLIC_STATUSES.includes(r.status as RMLSPublicStatus));
}
