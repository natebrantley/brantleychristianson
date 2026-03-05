/**
 * PATCH /api/me/agent — set the current user's assigned broker (by slug).
 * Client-only: requires Clerk auth. Used from brokers page "Choose as my agent".
 * Updates public.users.assigned_broker_id (stores broker slug); Clerk webhook preserves this on user.updated.
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
  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ assigned_broker_id: slug })
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
      role: 'user',
      assigned_broker_id: slug,
    });
    if (insertError) {
      console.error('PATCH /api/me/agent insert:', insertError);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
  }

  revalidatePath('/clients/dashboard');
  return NextResponse.json({ ok: true, slug });
}
