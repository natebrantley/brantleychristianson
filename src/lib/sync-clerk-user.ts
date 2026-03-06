/**
 * Server-side sync of Clerk user to Supabase.
 * Use when a signed-in user has no row in public.users (e.g. webhook missed or ran before sign-in).
 * Keeps role logic and preserve-column behavior in sync with the Clerk webhook.
 */

import type { User } from '@clerk/nextjs/server';
import { bridgeLeadsByEmail } from '@/lib/bridge-leads';
import { supabaseAdmin } from '@/lib/supabase';
import type { TablesInsert } from '@/types/database';
import { deriveUserSlug } from '@/lib/user-slug';

const AGENT_EMAIL_DOMAIN = 'brantleychristianson.com';

const USERS_PRESERVE_COLUMNS = ['assigned_broker_id', 'assigned_lender_id', 'repliers_client_id', 'marketing_opt_in'] as const;

export type UsersRow = {
  clerk_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: 'agent' | 'broker' | 'lender' | 'user';
};

function getPrimaryEmail(user: User): string | null {
  const list = user.emailAddresses ?? [];
  const first = list[0];
  const email = first?.emailAddress;
  return typeof email === 'string' && email.trim().length > 0 ? email.trim().toLowerCase() : null;
}

function getRoleFromMetadata(user: User): 'agent' | 'broker' | 'lender' | null | undefined {
  const meta = user.publicMetadata;
  if (meta == null || typeof meta !== 'object' || !('role' in meta)) return undefined;
  const r = (meta as { role?: unknown }).role;
  if (typeof r !== 'string') return undefined;
  const lower = r.trim().toLowerCase();
  if (lower === 'agent' || lower === 'broker' || lower === 'lender') return lower;
  return null;
}

function buildUsersRowFromClerkUser(user: User): UsersRow {
  const clerkId = user.id.trim();
  const email = getPrimaryEmail(user);
  const firstName =
    typeof user.firstName === 'string' && user.firstName.trim().length > 0 ? user.firstName.trim() : null;
  const lastName =
    typeof user.lastName === 'string' && user.lastName.trim().length > 0 ? user.lastName.trim() : null;
  const roleFromMeta = getRoleFromMetadata(user);
  const isAgentDomain =
    typeof email === 'string' && email.trim().toLowerCase().endsWith('@' + AGENT_EMAIL_DOMAIN);
  const role: UsersRow['role'] =
    roleFromMeta === 'agent' || roleFromMeta === 'broker' || roleFromMeta === 'lender'
      ? roleFromMeta
      : isAgentDomain
        ? 'agent'
        : 'user';

  return {
    clerk_id: clerkId,
    email,
    first_name: firstName,
    last_name: lastName,
    role,
  };
}

/**
 * Ensures the given Clerk user exists in public.users with correct profile and role.
 * Preserves assigned_broker_id, repliers_client_id, marketing_opt_in if a row already exists.
 * Call this when the user is signed in but Supabase has no row (e.g. first sign-in after webhook was down).
 *
 * @returns The UsersRow we wrote (or that already existed) for role routing; null on failure.
 */
export async function ensureUserInSupabase(clerkUser: User): Promise<UsersRow | null> {
  try {
    const admin = supabaseAdmin();
    const row = buildUsersRowFromClerkUser(clerkUser);

    const isAgentOrLender = row.role === 'agent' || row.role === 'broker' || row.role === 'lender';
    let upsertPayload: Record<string, unknown> = {
      clerk_id: row.clerk_id,
      email: row.email ?? '',
      first_name: row.first_name,
      last_name: row.last_name,
      role: row.role,
      slug: isAgentOrLender ? deriveUserSlug(row.first_name, row.last_name) : null,
      assigned_broker_id: null,
      assigned_lender_id: null,
      marketing_opt_in: null,
      repliers_client_id: null,
      updated_at: null,
    };

    const { data: existing } = await admin
      .from('users')
      .select(USERS_PRESERVE_COLUMNS.join(','))
      .eq('clerk_id', row.clerk_id)
      .maybeSingle();

    if (existing && typeof existing === 'object') {
      for (const key of USERS_PRESERVE_COLUMNS) {
        if (key in existing && (existing as Record<string, unknown>)[key] !== undefined) {
          upsertPayload[key] = (existing as Record<string, unknown>)[key];
        }
      }
    }

    const { error } = await admin.from('users').upsert(upsertPayload as TablesInsert<'users'>, { onConflict: 'clerk_id' });

    if (error) {
      console.error('sync-clerk-user: Supabase upsert failed', {
        clerkId: row.clerk_id,
        message: error.message,
        code: error.code,
      });
      return null;
    }

    // Claim matching leads (same as webhook): link public.leads by email when clerk_id is null
    if (row.email) {
      await bridgeLeadsByEmail(admin, row.clerk_id, row.email);
    }

    return row;
  } catch (err) {
    console.error('sync-clerk-user: unexpected error', { err });
    return null;
  }
}
