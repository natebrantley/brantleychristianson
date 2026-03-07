/**
 * Build assigned_broker_id values that mean "this user" for owner/agent "My leads".
 * Matches clerk_id, users.slug, underscore + hyphen slugs, agents.json slug, full name.
 */

import { deriveUserSlug, deriveUserSlugHyphen } from '@/lib/user-slug';
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
  const first = user?.first_name ?? clerkUser?.firstName;
  const last = user?.last_name ?? clerkUser?.lastName;
  const derived = deriveUserSlug(first, last);
  if (derived) ids.push(derived);
  const derivedHyphen = deriveUserSlugHyphen(first, last);
  if (derivedHyphen) ids.push(derivedHyphen);
  const email = user?.email ?? clerkUser?.emailAddresses?.[0]?.emailAddress;
  const agentSlug = getAgentSlugByEmail(email ?? undefined);
  if (agentSlug) ids.push(agentSlug);
  const firstStr = (first ?? '').toString().trim();
  const lastStr = (last ?? '').toString().trim();
  if (firstStr || lastStr) {
    ids.push([firstStr, lastStr].filter(Boolean).join(' '));
    if (firstStr && lastStr) ids.push([lastStr, firstStr].join(' '));
  }
  const uniq = [...new Set(ids)];
  const withCase = [...uniq, ...uniq.map((s) => s.toLowerCase())];
  return [...new Set(withCase)];
}
