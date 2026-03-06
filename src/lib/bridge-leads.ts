import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Links leads to a user by setting leads.clerk_id where email matches and clerk_id is null.
 * Call after creating/upserting a user so existing leads (e.g. from import) are claimed.
 * Tries leads.email_address first (CRM schema), then leads.email.
 */
export async function bridgeLeadsByEmail(
  admin: SupabaseClient,
  clerkId: string,
  email: string | null
): Promise<void> {
  if (!email || !email.trim()) return;
  const normalizedEmail = email.trim().toLowerCase();

  for (const column of ['email_address', 'email'] as const) {
    try {
      const { error } = await admin
        .from('leads')
        .update({ clerk_id: clerkId })
        .eq(column, normalizedEmail)
        .is('clerk_id', null);

      if (error) {
        if (column === 'email_address') continue;
        console.warn('bridgeLeads: lead bridge skipped', { clerkId, column, message: error.message });
        return;
      }
      return;
    } catch (err) {
      if (column === 'email_address') continue;
      console.warn('bridgeLeads: lead bridge threw', { clerkId, err });
    }
  }
}
