/**
 * GET /api/leads/[id] — fetch a single lead (for client detail view).
 * PATCH /api/leads/[id] — update lead contact info (first_name, last_name, email_address, phone, address, etc.).
 * Owners may also PATCH assigned_broker_id.
 * Requires Clerk auth. RLS: only assigned broker/lender can read/update; owners use service role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, supabaseAdmin } from '@/lib/supabase';
import { getAgentSlugByEmail } from '@/data/agents';
import { isOwnerRole } from '@/lib/roles';
import { LEADS_SELECT } from '@/lib/leads-fields';

export const dynamic = 'force-dynamic';

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
    .select(LEADS_SELECT)
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

const PATCH_BODY_KEYS = ['first_name', 'last_name', 'email_address', 'phone', 'address', 'city', 'state', 'zip', 'notes'] as const;

/** Allowed for owners only. */
const PATCH_OWNER_KEYS = ['assigned_broker_id'] as const;

function sanitizePatchBody(body: unknown): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  if (body == null || typeof body !== 'object') return out;
  const b = body as Record<string, unknown>;

  const maxLen: Record<string, number> = {
    email_address: 254,
    phone: 50,
    address: 500,
    city: 120,
    state: 60,
    zip: 20,
    first_name: 120,
    last_name: 120,
    assigned_broker_id: 500,
    notes: 20000,
  };

  for (const key of PATCH_BODY_KEYS) {
    const v = b[key];
    if (v === undefined) continue;
    if (v === null || v === '') {
      out[key] = null;
    } else if (typeof v === 'string') {
      const trimmed = v.trim();
      const max = maxLen[key] ?? 500;
      out[key] = trimmed.length > max ? trimmed.slice(0, max) : trimmed;
    }
  }
  return out;
}

function sanitizeOwnerPatchBody(body: unknown): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  if (body == null || typeof body !== 'object') return out;
  const b = body as Record<string, unknown>;
  for (const key of PATCH_OWNER_KEYS) {
    const v = b[key];
    if (v === undefined) continue;
    if (v === null || v === '') {
      out[key] = null;
    } else if (typeof v === 'string') {
      const trimmed = v.trim();
      out[key] = trimmed.length > 500 ? trimmed.slice(0, 500) : trimmed;
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
  const admin = supabaseAdmin();
  const { data: userRow } = await admin.from('users').select('role').eq('clerk_id', userId).maybeSingle();
  let isOwner = isOwnerRole(userRow?.role ?? null);
  if (!isOwner) {
    const clerkUser = await currentUser();
    const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
    isOwner = isOwnerRole(roleFromClerk);
  }
  if (isOwner) {
    const ownerUpdates = sanitizeOwnerPatchBody(body);
    Object.assign(updates, ownerUpdates);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = await createClerkSupabaseClient();
  let existing: { id: string } | null = null;
  let leadRow: { id: string; first_name?: string | null; last_name?: string | null; email_address?: string | null; phone?: string | null } | null = null;

  const { data: existingData } = await supabase
    .from('leads')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  existing = existingData;

  if (!existing && isOwner) {
    const { data: adminExisting } = await admin.from('leads').select('id').eq('id', id).maybeSingle();
    existing = adminExisting;
  }

  if (!existing && !isOwner) {
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
    const { data: rescueRow } = await admin
      .from('leads')
      .select('id, assigned_broker_id')
      .eq('id', id)
      .maybeSingle();
    const assignedTrimmed = rescueRow?.assigned_broker_id?.trim();
    if (rescueRow && assignedTrimmed && (uniqWithCase.has(assignedTrimmed) || uniqWithCase.has(assignedTrimmed.toLowerCase()))) {
      const valueToStore = slug && slug.trim() ? slug.trim() : userId;
      await admin.from('leads').update({ assigned_broker_id: valueToStore }).eq('id', id);
      const { data: retryExisting } = await supabase.from('leads').select('id').eq('id', id).maybeSingle();
      existing = retryExisting;
    }
  }

  if (!existing && !isOwner) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Owners use admin so they can update any lead (including assigned_broker_id)
  const client = isOwner ? admin : supabase;
  const { data, error } = await client
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select('id, first_name, last_name, email_address, phone, address, city, state, zip, assigned_broker_id, notes')
    .single();

  if (error) {
    console.error('PATCH /api/leads/[id]:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }

  leadRow = data;

  revalidatePath('/agents/dashboard/leads');
  revalidatePath(`/agents/dashboard/leads/${id}`);
  if (isOwner) {
    revalidatePath('/owners/dashboard/leads');
    revalidatePath(`/owners/dashboard/leads/${id}`);
  }
  return NextResponse.json(data);
}
