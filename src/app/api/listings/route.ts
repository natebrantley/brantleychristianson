/**
 * Public IDX listings API. RMLS compliant:
 * - Returns only Active/Pending listings (no Expired/Withdrawn to public).
 * - Never exposes seller_contact or showing_instructions.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { filterPublicListings, toPublicListing, type ListingRow } from '@/lib/listings-rmls';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id, mls_listing_id, status, address, city, state, zip, price, beds, baths, sqft, listing_firm_name, listing_agent_name, image_url, expiration_date, created_at, updated_at')
      .in('status', ['Active', 'Pending']);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ listings: [], message: 'Listings table not yet created.' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as ListingRow[];
    const publicListings = filterPublicListings(rows)
      .map((r) => toPublicListing(r, true))
      .filter(Boolean);

    return NextResponse.json({ listings: publicListings });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
