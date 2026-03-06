/**
 * GET /api/leads/[id] — fetch a single lead (for client detail view).
 * PATCH /api/leads/[id] — update lead contact info (first_name, last_name, email, phone, notes).
 * Requires Clerk auth. RLS: only assigned broker/lender can read/update.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase';

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
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select('id, first_name, last_name, email, phone, notes, updated_at')
    .single();

  if (error) {
    console.error('PATCH /api/leads/[id]:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }

  revalidatePath('/agents/dashboard/leads');
  revalidatePath(`/agents/dashboard/leads/${id}`);
  return NextResponse.json(data);
}
