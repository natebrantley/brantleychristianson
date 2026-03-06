/**
 * PATCH /api/me/agent — set the current user's assigned broker (by slug).
 * Client-only: requires Clerk auth. Used from brokers page "Choose as my agent".
 * Stores Clerk user ID (users.clerk_id) when the agent has signed in; otherwise stores slug for migration to fix later.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getAgentBySlug } from '@/data/agents';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to assign an agent.' }, { status: 401 });
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

  const agent = getAgentBySlug(slug);
  if (!agent) {
    return NextResponse.json({ error: 'Unknown broker slug' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  // Resolve agent's Clerk ID from users so we store clerk_id (aligned with leads.assigned_broker_id)
  const { data: brokerUser } = await supabase
    .from('users')
    .select('clerk_id')
    .eq('email', agent.email)
    .in('role', ['agent', 'broker'])
    .maybeSingle();
  const valueToStore = (brokerUser?.clerk_id as string) ?? slug;

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ assigned_broker_id: valueToStore })
    .eq('clerk_id', userId)
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('PATCH /api/me/agent:', updateError);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  // If no row exists yet (e.g. webhook not run), insert so client can still assign
  if (!updated) {
    const { error: insertError } = await supabase.from('users').insert({
      clerk_id: userId,
      email: '',
      first_name: null,
      last_name: null,
      role: 'user',
      assigned_broker_id: valueToStore,
      assigned_lender_id: null,
      marketing_opt_in: null,
      repliers_client_id: null,
      updated_at: null,
    });
    if (insertError) {
      console.error('PATCH /api/me/agent insert:', insertError);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
  }

  revalidatePath('/clients/dashboard');
  revalidatePath('/dashboard');
  return NextResponse.json({ ok: true, slug });
}
