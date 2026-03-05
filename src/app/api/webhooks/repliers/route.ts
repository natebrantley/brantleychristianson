/**
 * Repliers webhook: listing change events. Verify secret; idempotent upsert by mls_listing_id.
 * Set REPLIERS_WEBHOOK_SECRET in env; Repliers may send X-Hook-Secret or similar for verification.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { RepliersListingItem } from '@/lib/repliers-types';
import { normalizeListingsResponse } from '@/lib/repliers-types';
import { isBodySizeAllowed, MAX_WEBHOOK_BODY_BYTES, secureCompare } from '@/lib/webhook-utils';

export const dynamic = 'force-dynamic';

const SOURCE = 'repliers';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.REPLIERS_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get('x-repliers-signature') ?? request.headers.get('x-hook-secret') ?? request.headers.get('authorization');
  if (!header) return false;
  const provided = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
  return secureCompare(provided, secret);
}

/** Map Repliers listing to our listings row (no restricted fields). */
function toRow(item: RepliersListingItem): Record<string, unknown> {
  const addr = item.address;
  const priceRaw = item.listPrice;
  const price = typeof priceRaw === 'number' ? priceRaw : typeof priceRaw === 'string' ? parseFloat(priceRaw) : null;
  const details = item.details as Record<string, unknown> | undefined;
  const beds = details?.numBedrooms;
  const baths = details?.numBathrooms;
  const sqft = details?.sqft;
  const agentName = (item.agents as Array<{ name?: string | null }> | undefined)?.[0]?.name;
  const addressStr = addr
    ? [addr.streetNumber, addr.streetName, addr.streetSuffix, addr.unitNumber ? `#${addr.unitNumber}` : null]
        .filter(Boolean)
        .join(' ')
    : null;
  const office = item.office as Record<string, unknown> | undefined;
  const brokerageName = office?.brokerageName ?? 'Unknown';
  const images = item.images;
  const firstImage = Array.isArray(images) ? images[0] : null;
  const imageUrl =
    typeof firstImage === 'string'
      ? firstImage.startsWith('http')
        ? firstImage
        : `https://cdn.repliers.io/${firstImage.replace(/^\//, '')}`
      : null;
  const timestamps = item.timestamps as { expiryDate?: string } | undefined;
  const expiryDate = timestamps?.expiryDate
    ? new Date(timestamps.expiryDate).toISOString().split('T')[0]
    : null;

  const status = (item.status ?? 'A').toString().toUpperCase();
  const last = ((item as Record<string, unknown>).lastStatus as string) ?? '';
  let ourStatus = 'Active';
  if (status === 'U') {
    if (last.toLowerCase() === 'sld') ourStatus = 'Sold';
    else if (last.toLowerCase() === 'exp') ourStatus = 'Expired';
    else if (['ter', 'dft'].includes(last.toLowerCase())) ourStatus = 'Withdrawn';
    else if (['pc', 'lc'].includes(last.toLowerCase())) ourStatus = 'Canceled';
    else ourStatus = 'Expired';
  } else if (['sce', 'lce', 'pc'].includes(last.toLowerCase())) {
    ourStatus = 'Pending';
  }

  return {
    mls_listing_id: item.mlsNumber,
    status: ourStatus,
    address: addressStr,
    city: addr?.city ?? null,
    state: addr?.state ?? null,
    zip: addr?.zip ?? null,
    price: Number.isFinite(price) ? price : null,
    beds: beds != null && Number.isFinite(Number(beds)) ? Number(beds) : null,
    baths: baths != null && Number.isFinite(Number(baths)) ? Number(baths) : null,
    sqft: sqft != null && Number.isFinite(Number(sqft)) ? Number(sqft) : null,
    listing_firm_name: String(brokerageName).trim() || 'Unknown',
    listing_agent_name: typeof agentName === 'string' ? agentName.trim() : null,
    image_url: imageUrl,
    expiration_date: expiryDate,
    updated_at: new Date().toISOString(),
    seller_contact: null,
    showing_instructions: null,
  };
}

/** GET /api/webhooks/repliers — health check (env configured). Does not reveal secret. */
export async function GET() {
  const secret = process.env.REPLIERS_WEBHOOK_SECRET?.trim();
  const body = secret
    ? { status: 'ok', webhook: 'repliers', env: 'configured' }
    : { status: 'error', message: 'Missing REPLIERS_WEBHOOK_SECRET' };
  return NextResponse.json(body, { status: secret ? 200 : 503 });
}

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();

  if (!isAuthorized(request)) {
    console.log('repliers webhook: unauthorized', { correlationId });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isBodySizeAllowed(request)) {
    return NextResponse.json(
      { error: `Request body exceeds ${MAX_WEBHOOK_BODY_BYTES} bytes` },
      { status: 413 }
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  let payload: { eventId?: string; event?: string; listing?: RepliersListingItem; listings?: RepliersListingItem[] };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = payload.eventId ?? payload.event ?? correlationId;
  const admin = supabaseAdmin();

  const { data: existing } = await admin
    .from('webhook_events')
    .select('id')
    .eq('source', SOURCE)
    .eq('event_id', eventId)
    .single();

  if (existing) {
    return new NextResponse(null, { status: 200 });
  }

  await admin.from('webhook_events').insert({ source: SOURCE, event_id: eventId });

  const listings: RepliersListingItem[] = payload.listing
    ? [payload.listing]
    : Array.isArray(payload.listings)
      ? payload.listings
      : [];
  if (listings.length === 0) {
    const normalized = normalizeListingsResponse(payload);
    if (normalized.listings.length > 0) {
      listings.push(...normalized.listings);
    }
  }

  for (const item of listings) {
    if (!item.mlsNumber) continue;
    const row = toRow(item);
    await admin
      .from('listings')
      .upsert(row, { onConflict: 'mls_listing_id', ignoreDuplicates: false });
  }

  console.log('repliers webhook: processed', { correlationId, eventId, listingCount: listings.length });
  return new NextResponse(null, { status: 200 });
}
