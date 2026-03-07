import type { SupabaseClient } from '@supabase/supabase-js';
import { getAgentBySlug } from '@/data/agents';

/**
 * Fetches broker/agent display names from public.users for the given Clerk user IDs.
 * Used to show "Assigned to: [name]" on leads where assigned_broker_id is a Clerk ID.
 * Returns a Map of clerk_id -> "First Last" (or email if no name).
 */
export async function getBrokerDisplayNamesByClerkId(
  supabase: SupabaseClient,
  clerkIds: string[]
): Promise<Map<string, string>> {
  return getBrokerDisplayNamesByIdOrSlug(supabase, clerkIds);
}

/**
 * Fetches broker/agent display names for the given IDs, which may be clerk_id or slug (first_last).
 * Returns a Map of id -> "First Last" so assigned_broker_id (clerk_id or slug) resolves to a name.
 */
export async function getBrokerDisplayNamesByIdOrSlug(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const [byClerk, bySlug] = await Promise.all([
    supabase.from('users').select('clerk_id, slug, first_name, last_name, email').in('clerk_id', unique),
    supabase.from('users').select('clerk_id, slug, first_name, last_name, email').in('slug', unique),
  ]);

  const map = new Map<string, string>();
  for (const res of [byClerk, bySlug]) {
    if (res.error) continue;
    for (const row of res.data ?? []) {
      const first = (row.first_name as string | null) ?? '';
      const last = (row.last_name as string | null) ?? '';
      const name = [first, last].filter(Boolean).join(' ').trim() || (row.email as string) || '—';
      if (row.clerk_id) map.set(row.clerk_id as string, name);
      if (row.slug && row.slug !== row.clerk_id) map.set(row.slug as string, name);
    }
  }
  return map;
}

/**
 * Resolves a lead's assigned broker for display: prefer name from users (by clerk_id or slug),
 * else name from agents.json by slug (legacy), else fallback text.
 */
export function resolveLeadAssignedAgentName(
  assignedBrokerId: string | null | undefined,
  agentTextFallback: string | null | undefined,
  brokerNameByClerkId: Map<string, string>
): string {
  if (assignedBrokerId && brokerNameByClerkId.has(assignedBrokerId)) {
    return brokerNameByClerkId.get(assignedBrokerId)!;
  }
  if (assignedBrokerId) {
    const bySlug = getAgentBySlug(assignedBrokerId);
    if (bySlug?.name) return bySlug.name;
  }
  if (agentTextFallback && agentTextFallback.trim()) return agentTextFallback.trim();
  return 'Unassigned';
}
