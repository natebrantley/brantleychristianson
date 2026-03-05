/**
 * AI image search: POST to Repliers /listings with imageSearchItems in body.
 * Body: { imageSearchItems: Array<{ type: 'text'|'image', value?: string, url?: string, boost?: number }> }
 * Max 10 items; string lengths bounded.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp, isRateLimited } from '@/lib/rateLimit';
import { apiErrorResponse, API_ERROR_CODES } from '@/lib/api-errors';
import { repliersSearchListings } from '@/lib/repliers-client';
import { supabaseAdmin } from '@/lib/supabase';
import { RMLS_PUBLIC_STATUSES } from '@/lib/listings-rmls';

const MAX_ITEMS = 10;
const MAX_STRING = 200;
const imageSearchItemSchema = z.object({
  type: z.enum(['text', 'image']),
  value: z.string().trim().max(MAX_STRING).optional(),
  url: z.string().trim().url().max(500).optional(),
  boost: z.number().min(0).max(100).optional(),
});

const bodySchema = z.object({
  imageSearchItems: z
    .array(imageSearchItemSchema)
    .min(1)
    .max(MAX_ITEMS)
    .refine(
      (items) => items.every((i) => (i.type === 'text' && i.value) || (i.type === 'image' && i.url)),
      { message: 'Text items need value; image items need url' }
    ),
});

export const dynamic = 'force-dynamic';

function toPublicItem(item: Record<string, unknown>): Record<string, unknown> {
  const { seller_contact, showing_instructions, ...rest } = item;
  void seller_contact;
  void showing_instructions;
  return rest;
}

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const clientIp = getClientIp(request);
  if (isRateLimited(`image-search:${clientIp}`)) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.TOO_MANY_REQUESTS);
    return NextResponse.json(body, { status });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  let supabase: ReturnType<typeof supabaseAdmin> | undefined;
  try {
    supabase = supabaseAdmin();
  } catch {
    supabase = undefined;
  }

  const result = await repliersSearchListings({
    searchParams: { status: 'A', resultsPerPage: 50 },
    body: { imageSearchItems: parsed.data.imageSearchItems },
    correlationId,
    supabaseFallback: supabase,
  });

  if ('error' in result) {
    const { body, status } = apiErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const rawListings = result.source === 'repliers' ? result.listings : result.listings;
  const listings = (rawListings as Record<string, unknown>[])
    .filter((item) => {
      const s = (item.status ?? '').toString().toUpperCase();
      const last = (item.lastStatus as string) ?? '';
      if (s === 'A') return true;
      if (s === 'U') return ['new', 'sus', 'ext', 'sce', 'lce', 'pc'].includes(last.toLowerCase());
      return false;
    })
    .map(toPublicItem);

  return NextResponse.json({
    listings,
    count: listings.length,
    source: result.source === 'cache' ? 'cache' : undefined,
  });
}
