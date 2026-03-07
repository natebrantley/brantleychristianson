/**
 * Build the list of assigned_broker_id values that mean "this user" for owner/agent "My leads".
 * Matches clerk_id, users.slug, derived slug (first_last), agents.json slug by email, and full name variants.
 */

import { deriveUserSlug } from '@/lib/user-slug';
import { getAgentSlugByEmail } from '@/data/agents';

type UserLike = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  slug?: string | null;
};

type ClerkUserLike = {
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: Array<{ emailAddress?: string }>;
};

export function buildMyLeadsBrokerIds(
  user: UserLike | null,
  clerkUserId: string,
  clerkUser: ClerkUserLike | null
): string[] {
  const ids: string[] = [clerkUserId];
  if (user?.slug) ids.push(user.slug);
  const derived = deriveUserSlug(
    user?.first_name ?? clerkUser?.firstName,
    user?.last_name ?? clerkUser?.lastName
  );
  if (derived) ids.push(derived);
  const email = user?.email ?? clerkUser?.emailAddresses?.[0]?.emailAddress;
  const agentSlug = getAgentSlugByEmail(email ?? undefined);
  if (agentSlug) ids.push(agentSlug);
  const first = (user?.first_name ?? clerkUser?.firstName ?? '').toString().trim();
  const last = (user?.last_name ?? clerkUser?.lastName ?? '').toString().trim();
  if (first || last) {
    ids.push([first, last].filter(Boolean).join(' '));
    if (first && last) ids.push([last, first].join(' '));
  }
  const uniq = [...new Set(ids)];
  const withCase = [...uniq, ...uniq.map((s) => s.toLowerCase())];
  return [...new Set(withCase)];
}
