/**
 * Push public.leads from Supabase to MailerLite as subscribers.
 * Uses MailerLite batch API (up to 50 requests per batch) to stay under 120 req/min.
 * Uses MAILERLITE_API_TOKEN and optional MAILERLITE_GROUP_ID.
 * MailerLite POST /subscribers upserts by email (create or update).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getAgentBySlug } from '@/data/agents';
import { LEADS_SELECT_MAILERLITE } from '@/lib/leads-fields';

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';
const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES_MS = 3000; // Stay under 120 req/min (2 batches/min = 100 subscribers/min safe)

type LeadRow = {
  id?: string;
  email_address?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  address?: string | null;
  assigned_broker_id?: string | null;
  [key: string]: unknown;
};

function leadToSubscriberPayload(
  lead: LeadRow,
  groupId: string | undefined
): { email: string; fields: Record<string, string>; groups?: string[]; status?: string } {
  const email =
    (lead.email_address ?? '').toString().trim().toLowerCase();
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
  set('address', lead.address, 200);
  if (lead.assigned_broker_id) {
    const agentName = getAgentBySlug(lead.assigned_broker_id)?.name;
    if (agentName) set('agent', agentName, 200);
  }

  const payload: {
    email: string;
    fields: Record<string, string>;
    groups?: string[];
    status?: string;
  } = { email, fields };
  if (groupId) payload.groups = [groupId];
  return payload;
}

export type SyncLeadsToMailerLiteResult = {
  synced: number;
  skipped: number;
  errors: Array<{ email: string; message: string }>;
};

type BatchRequest = { method: string; path: string; body?: unknown };
type BatchResponseItem = { code: number; body?: { message?: string; errors?: unknown } };

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Call MailerLite batch API (up to 50 requests). On 429, retry after delay.
 */
async function sendBatch(
  apiToken: string,
  requests: BatchRequest[],
  retries = 2
): Promise<{ successful: number; failed: number; responses: BatchResponseItem[] }> {
  const res = await fetch(`${MAILERLITE_API_BASE}/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ requests }),
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('X-RateLimit-Retry-After')) || 60;
    if (retries > 0) {
      await sleep(retryAfter * 1000);
      return sendBatch(apiToken, requests, retries - 1);
    }
    throw new Error(`MailerLite rate limited; retry after ${retryAfter}s`);
  }

  const data = (await res.json().catch(() => ({}))) as {
    successful?: number;
    failed?: number;
    responses?: BatchResponseItem[];
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data?.message ?? `HTTP ${res.status}`);
  }

  return {
    successful: data.successful ?? 0,
    failed: data.failed ?? 0,
    responses: data.responses ?? [],
  };
}

/**
 * Fetch leads from Supabase and upsert to MailerLite in batches of 50.
 * Uses email or email_address as primary email; skips rows with no valid email.
 * Optionally only sync leads updated since a given interval (e.g. "2h", "24h", "7d").
 */
export async function syncLeadsToMailerLite(
  admin: SupabaseClient,
  apiToken: string,
  groupId: string | undefined,
  options: { limit?: number; since?: string } = {}
): Promise<SyncLeadsToMailerLiteResult> {
  const limit = Math.min(Math.max(options.limit ?? 500, 1), 2000);
  const result: SyncLeadsToMailerLiteResult = { synced: 0, skipped: 0, errors: [] };

  let query = admin
    .from('leads')
    .select(LEADS_SELECT_MAILERLITE)
    .is('marketing_opted_out_at', null)
    .limit(limit);

  const { data: rows, error } = await query;

  if (error) {
    result.errors.push({ email: '', message: `Supabase: ${String(error)}` });
    return result;
  }
  const list = (rows ?? []) as LeadRow[];
  if (!list.length) return result;

  const toSync: { lead: LeadRow; payload: ReturnType<typeof leadToSubscriberPayload> }[] = [];
  for (const lead of list) {
    const email =
      (lead.email_address ?? '').toString().trim().toLowerCase();
    if (!email || !email.includes('@')) {
      result.skipped++;
      continue;
    }
    toSync.push({ lead, payload: leadToSubscriberPayload(lead, groupId) });
  }

  for (let i = 0; i < toSync.length; i += BATCH_SIZE) {
    const chunk = toSync.slice(i, i + BATCH_SIZE);
    const batchRequests: BatchRequest[] = chunk.map(({ payload }) => ({
      method: 'POST',
      path: 'api/subscribers',
      body: payload,
    }));

    try {
      const batchResult = await sendBatch(apiToken, batchRequests);
      result.synced += batchResult.successful;

      batchResult.responses.forEach((item, idx) => {
        const entry = chunk[idx];
        if (!entry) return;
        const email = entry.payload.email;
        if (item.code >= 200 && item.code < 300) return;
        const msg = item.body?.message ?? (item.body?.errors ? JSON.stringify(item.body.errors) : `HTTP ${item.code}`);
        result.errors.push({ email, message: msg });
      });

      if (i + BATCH_SIZE < toSync.length) {
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    } catch (err) {
      for (const { payload } of chunk) {
        result.errors.push({
          email: payload.email,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return result;
}
