/**
 * Links leads to a user by setting leads.clerk_id where email matches and clerk_id is null.
 * Call after creating/upserting a user so existing leads (e.g. from import) are claimed.
 * public.leads no longer has clerk_id; this is a no-op for leads and only exists for API compatibility.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export async function bridgeLeadsByEmail(
  _admin: SupabaseClient,
  _clerkId: string,
  _email: string | null
): Promise<void> {
  // leads table was simplified and no longer has clerk_id; nothing to bridge
}
