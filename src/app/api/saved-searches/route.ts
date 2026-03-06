/**
 * Saved searches: GET list, POST create. Requires auth; Supabase RLS.
 * Repliers create/update saved search optional (requires repliers_client_id); 406 when matches > 100.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase';
import { apiErrorResponse, API_ERROR_CODES } from '@/lib/api-errors';
import type { Json } from '@/types/database';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MAX_SAVED_SEARCHES = 20;

const postBodySchema = z.object({
  name: z.string().trim().max(100).optional(),
  criteria: z.record(z.string(), z.unknown()).default({}),
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
      .from('saved_searches')
      .select('id, name, criteria, repliers_saved_search_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      const { body, status } = apiErrorResponse(API_ERROR_CODES.INTERNAL);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json({ savedSearches: data ?? [] });
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

  try {
    const supabase = await createClerkSupabaseClient();
    const { count } = await supabase
      .from('saved_searches')
      .select('*', { count: 'exact', head: true })
      .eq('clerk_id', userId);

    if ((count ?? 0) >= MAX_SAVED_SEARCHES) {
      const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
      return NextResponse.json(
        { ...body, error: `Maximum ${MAX_SAVED_SEARCHES} saved searches allowed.` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        clerk_id: userId,
        name: parsed.data.name ?? null,
        criteria: parsed.data.criteria as Json,
      })
      .select('id, name, criteria, created_at')
      .single();

    if (error) {
      const { body, status } = apiErrorResponse(API_ERROR_CODES.INTERNAL);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json({ savedSearch: data });
  } catch {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INTERNAL);
    return NextResponse.json(body, { status });
  }
}
