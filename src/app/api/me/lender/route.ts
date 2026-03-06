/**
 * PATCH /api/me/lender — set the current user's assigned lender (by slug).
 * Client-only: requires Clerk auth. Used from lenders page "Choose as my lender".
 * Stores Clerk user ID (users.clerk_id) when the lender has signed in; otherwise stores slug for migration to fix later.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getLenderBySlug } from '@/data/lenders';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to assign a lender.' }, { status: 401 });
  }

  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const slug = typeof body?.slug === 'string' ? body.slug.trim() : null;
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const lender = getLenderBySlug(slug);
  if (!lender) {
    return NextResponse.json({ error: 'Unknown lender slug' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  // Resolve lender's Clerk ID from users so we store clerk_id (aligned with leads.assigned_lender_id)
  const { data: lenderUser } = await supabase
    .from('users')
    .select('clerk_id')
    .eq('email', lender.email)
    .eq('role', 'lender')
    .maybeSingle();
  const valueToStore = (lenderUser?.clerk_id as string) ?? slug;

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ assigned_lender_id: valueToStore })
    .eq('clerk_id', userId)
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('PATCH /api/me/lender:', updateError);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  if (!updated) {
    const { error: insertError } = await supabase.from('users').insert({
      clerk_id: userId,
      email: '',
      first_name: null,
      last_name: null,
      role: 'user',
      assigned_broker_id: null,
      assigned_lender_id: valueToStore,
      marketing_opt_in: null,
      repliers_client_id: null,
      updated_at: null,
    });
    if (insertError) {
      console.error('PATCH /api/me/lender insert:', insertError);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
  }

  revalidatePath('/clients/dashboard');
  revalidatePath('/dashboard');
  return NextResponse.json({ ok: true, slug });
}
