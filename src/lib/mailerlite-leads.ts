/**
 * Push public.leads from Supabase to MailerLite as subscribers.
 * Uses MAILERLITE_API_TOKEN and optional MAILERLITE_GROUP_ID.
 * MailerLite POST /subscribers upserts by email (create or update).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

type LeadRow = {
  id?: string;
  email?: string | null;
  email_address?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  source?: string | null;
  address?: string | null;
  agent?: string | null;
  opted_in_email?: string | null;
  [key: string]: unknown;
};

function isOptedOut(optedInEmail: string | null | undefined): boolean {
  if (!optedInEmail || !optedInEmail.trim()) return false;
  const v = optedInEmail.trim().toLowerCase();
  return v === 'false' || v === 'no' || v === 'opted out' || v === 'unsubscribed';
}

function leadToSubscriberPayload(
  lead: LeadRow,
  groupId: string | undefined
): { email: string; fields: Record<string, string>; groups?: string[]; status?: string } {
  const email =
    (lead.email ?? lead.email_address ?? '').toString().trim().toLowerCase();
  const fields: Record<string, string> = {};
  const set = (key: string, val: string | null | undefined, max = 500) => {
    if (val != null && String(val).trim()) fields[key] = String(val).trim().slice(0, max);
  };
  set('name', lead.first_name);
  set('last_name', lead.last_name);
  set('first_name', lead.first_name);
  set('phone', lead.phone, 50);
  set('city', lead.city, 100);
  set('state', lead.state, 50);
  set('zip', lead.zip, 20);
  set('source', lead.source, 100);
  set('address', lead.address, 200);
  set('agent', lead.agent, 200);

  const payload: {
    email: string;
    fields: Record<string, string>;
    groups?: string[];
    status?: string;
  } = { email, fields };
  if (groupId) payload.groups = [groupId];
  if (isOptedOut(lead.opted_in_email)) payload.status = 'unsubscribed';
  return payload;
}

export type SyncLeadsToMailerLiteResult = {
  synced: number;
  skipped: number;
  errors: Array<{ email: string; message: string }>;
};

/**
 * Fetch leads from Supabase and upsert each to MailerLite.
 * Uses email or email_address as primary email; skips rows with no valid email.
 */
export async function syncLeadsToMailerLite(
  admin: SupabaseClient,
  apiToken: string,
  groupId: string | undefined,
  options: { limit?: number } = {}
): Promise<SyncLeadsToMailerLiteResult> {
  const limit = Math.min(Math.max(options.limit ?? 500, 1), 2000);
  const result: SyncLeadsToMailerLiteResult = { synced: 0, skipped: 0, errors: [] };

  const { data: rows, error } = await admin
    .from('leads')
    .select(
      'id, email, email_address, first_name, last_name, phone, city, state, zip, source, address, agent, opted_in_email'
    )
    .limit(limit);

  if (error) {
    result.errors.push({ email: '', message: `Supabase: ${String(error)}` });
    return result;
  }
  const list = (rows ?? []) as LeadRow[];
  if (!list.length) return result;

  for (const lead of list) {
    const email =
      (lead.email ?? lead.email_address ?? '').toString().trim().toLowerCase();
    if (!email || !email.includes('@')) {
      result.skipped++;
      continue;
    }

    const payload = leadToSubscriberPayload(lead, groupId);
    try {
      const res = await fetch(`${MAILERLITE_API_BASE}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => ({}))) as { message?: string; errors?: unknown };
      if (!res.ok) {
        result.errors.push({
          email,
          message: body?.message ?? `HTTP ${res.status}`,
        });
        continue;
      }
      result.synced++;
    } catch (err) {
      result.errors.push({
        email,
        message: err instanceof Error ? err.message : String(err),
      });
    }

    // Avoid rate limits: short delay between requests
    await new Promise((r) => setTimeout(r, 80));
  }

  return result;
}
