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
  const unique = [...new Set(clerkIds)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from('users')
    .select('clerk_id, first_name, last_name, email')
    .in('clerk_id', unique);

  if (error) return new Map();

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const clerkId = row.clerk_id as string;
    const first = (row.first_name as string | null) ?? '';
    const last = (row.last_name as string | null) ?? '';
    const name = [first, last].filter(Boolean).join(' ').trim();
    map.set(clerkId, name || (row.email as string) || '—');
  }
  return map;
}

/**
 * Resolves a lead's assigned broker for display: prefer name from users (by clerk_id),
 * else name from agents.json by slug (assigned_broker_id may be slug), else fallback text.
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
