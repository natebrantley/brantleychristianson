/**
 * Get single listing by mlsNumber. Repliers with fallback to Supabase. RMLS stripping.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateMlsNumber } from '@/lib/validate-mls-number';
import { repliersGetSingleListing } from '@/lib/repliers-client';
import { supabaseAdmin } from '@/lib/supabase';
import { apiErrorResponse, API_ERROR_CODES } from '@/lib/api-errors';
import { RMLS_PUBLIC_STATUSES } from '@/lib/listings-rmls';

export const dynamic = 'force-dynamic';

function toPublicListing(row: Record<string, unknown>): Record<string, unknown> {
  const { seller_contact, showing_instructions, ...rest } = row;
  void seller_contact;
  void showing_instructions;
  return rest;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ mlsNumber: string }> }
) {
  const correlationId = crypto.randomUUID();
  const { mlsNumber: raw } = await context.params;

  const validation = validateMlsNumber(raw);
  if (!validation.valid) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  let supabase: ReturnType<typeof supabaseAdmin> | undefined;
  try {
    supabase = supabaseAdmin();
  } catch {
    supabase = undefined;
  }

  const result = await repliersGetSingleListing({
    mlsNumber: validation.mlsNumber,
    correlationId,
    supabaseFallback: supabase,
  });

  if ('error' in result) {
    const { body, status } = apiErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const listing = toPublicListing(
    result.listing as Record<string, unknown>
  );
  const response: { listing: Record<string, unknown>; source?: 'cache'; comparables?: unknown[] } = {
    listing,
    ...(result.source === 'cache' && { source: 'cache' }),
    ...('comparables' in result && result.comparables && { comparables: result.comparables }),
  };

  return NextResponse.json(response);
}
