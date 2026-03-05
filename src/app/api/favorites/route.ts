/**
 * Favorites: GET list, POST add, DELETE remove. Requires auth; uses Supabase RLS.
 * Optional: sync to Repliers Add/Get favorites when repliers_client_id present.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase';
import { apiErrorResponse, API_ERROR_CODES } from '@/lib/api-errors';
import { validateMlsNumber } from '@/lib/validate-mls-number';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const postBodySchema = z.object({
  mls_listing_id: z.string().trim().min(1).max(32),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.UNAUTHORIZED);
    return NextResponse.json(body, { status });
  }

  try {
    const supabase = await createClerkSupabaseClient();
    const { data, error } = await supabase
      .from('favorites')
      .select('mls_listing_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      const { body, status } = apiErrorResponse(API_ERROR_CODES.INTERNAL);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json({ favorites: data ?? [] });
  } catch {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INTERNAL);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.UNAUTHORIZED);
    return NextResponse.json(body, { status });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  const validation = validateMlsNumber(parsed.data.mls_listing_id);
  if (!validation.valid) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  try {
    const supabase = await createClerkSupabaseClient();
    const { error } = await supabase.from('favorites').insert({
      clerk_id: userId,
      mls_listing_id: validation.mlsNumber,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, message: 'Already in favorites' });
      }
      const { body, status } = apiErrorResponse(API_ERROR_CODES.INTERNAL);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json({ ok: true });
  } catch {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INTERNAL);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.UNAUTHORIZED);
    return NextResponse.json(body, { status });
  }

  const mlsNumber = request.nextUrl.searchParams.get('mls_listing_id');
  const validation = validateMlsNumber(mlsNumber);
  if (!validation.valid) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  try {
    const supabase = await createClerkSupabaseClient();
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('clerk_id', userId)
      .eq('mls_listing_id', validation.mlsNumber);

    if (error) {
      const { body, status } = apiErrorResponse(API_ERROR_CODES.INTERNAL);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json({ ok: true });
  } catch {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INTERNAL);
    return NextResponse.json(body, { status });
  }
}
