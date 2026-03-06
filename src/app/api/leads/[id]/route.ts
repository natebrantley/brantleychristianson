/**
 * GET /api/leads/[id] — fetch a single lead (for client detail view).
 * PATCH /api/leads/[id] — update lead contact info (first_name, last_name, email, phone, notes).
 * Requires Clerk auth. RLS: only assigned broker/lender can read/update.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, supabaseAdmin } from '@/lib/supabase';
import { getAgentSlugByEmail } from '@/data/agents';

export const dynamic = 'force-dynamic';

const CONTACT_FIELDS = [
  'id',
  'first_name',
  'last_name',
  'email',
  'email_address',
  'phone',
  'notes',
  'source',
  'timeframe',
  'city',
  'state',
  'clerk_id',
  'created_at',
  'last_login',
  'property_views',
  'property_inquiries',
] as const;

type LeadIdParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: LeadIdParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing lead id' }, { status: 400 });
  }

  const supabase = await createClerkSupabaseClient();
  const { data, error } = await supabase
    .from('leads')
    .select(CONTACT_FIELDS.join(', '))
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('GET /api/leads/[id]:', error);
    return NextResponse.json({ error: 'Failed to load lead' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

const PATCH_BODY_KEYS = ['first_name', 'last_name', 'email', 'phone', 'notes'] as const;

function sanitizePatchBody(body: unknown): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  if (body == null || typeof body !== 'object') return out;
  const b = body as Record<string, unknown>;

  for (const key of PATCH_BODY_KEYS) {
    const v = b[key];
    if (v === undefined) continue;
    if (v === null || v === '') {
      out[key] = null;
    } else if (typeof v === 'string') {
      const trimmed = v.trim();
      if (key === 'email' && trimmed.length > 254) continue;
      if (key === 'phone' && trimmed.length > 50) {
        out[key] = trimmed.slice(0, 50);
      } else if (key === 'notes' && trimmed.length > 5000) {
        out[key] = trimmed.slice(0, 5000);
      } else {
        out[key] = trimmed;
      }
    }
  }
  return out;
}

export async function PATCH(request: NextRequest, { params }: LeadIdParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing lead id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates = sanitizePatchBody(body);
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = await createClerkSupabaseClient();
  let existing: { id: string } | null = null;
  let leadRow: { id: string; clerk_id?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null } | null = null;

  const { data: existingData } = await supabase
    .from('leads')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  existing = existingData;

  if (!existing) {
    // Rescue: lead may have assigned_broker_id = email/name/slug; backfill then retry
    const clerkUser = await currentUser();
    const fullName = clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() : '';
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? '';
    const slug = getAgentSlugByEmail(email);
    const possibleIds: string[] = [userId];
    if (email) possibleIds.push(String(email).trim());
    if (fullName) possibleIds.push(fullName);
    if (slug) possibleIds.push(slug);
    const uniq = [...new Set(possibleIds)];
    const uniqWithCase = new Set([...uniq, ...uniq.map((s) => s.toLowerCase())]);
    const admin = supabaseAdmin();
    const { data: rescueRow } = await admin
      .from('leads')
      .select('id, assigned_broker_id')
      .eq('id', id)
      .maybeSingle();
    const assignedTrimmed = rescueRow?.assigned_broker_id?.trim();
    if (rescueRow && assignedTrimmed && (uniqWithCase.has(assignedTrimmed) || uniqWithCase.has(assignedTrimmed.toLowerCase()))) {
      await admin.from('leads').update({ assigned_broker_id: userId }).eq('id', id);
      const { data: retryExisting } = await supabase.from('leads').select('id').eq('id', id).maybeSingle();
      existing = retryExisting;
    }
  }

  if (!existing) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select('id, first_name, last_name, email, phone, notes, updated_at, clerk_id')
    .single();

  if (error) {
    console.error('PATCH /api/leads/[id]:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }

  leadRow = data;

  // Sync contact fields to public.users when lead has clerk_id (signed-in client); users table has first_name, last_name, email (no phone)
  if (leadRow?.clerk_id && (updates.first_name !== undefined || updates.last_name !== undefined || updates.email !== undefined)) {
    const userUpdates: Record<string, string | null> = {};
    if (updates.first_name !== undefined) userUpdates.first_name = updates.first_name;
    if (updates.last_name !== undefined) userUpdates.last_name = updates.last_name;
    if (updates.email !== undefined) userUpdates.email = updates.email;
    if (Object.keys(userUpdates).length > 0) {
      const admin = supabaseAdmin();
      await admin.from('users').update(userUpdates).eq('clerk_id', leadRow.clerk_id);
    }
  }

  revalidatePath('/agents/dashboard/leads');
  revalidatePath(`/agents/dashboard/leads/${id}`);
  return NextResponse.json(data);
}
