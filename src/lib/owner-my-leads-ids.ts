/**
 * Build assigned_broker_id values that mean "this user" for owner/agent "My leads".
 * Canonical broker slug is first_last (e.g. nate_brantley); we also match clerk_id,
 * users.slug, hyphen variant (nate-brantley), agents.json slug (legacy), and full-name variants.
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
  // Canonical broker slug: first_last (e.g. nate_brantley) from users.slug or derived from name
  if (user?.slug) ids.push(user.slug);
  const first = user?.first_name ?? clerkUser?.firstName;
  const last = user?.last_name ?? clerkUser?.lastName;
  const derived = deriveUserSlug(first, last); // first_last
  if (derived) ids.push(derived);
  const derivedHyphen = deriveUserSlugHyphen(first, last); // first-last
  if (derivedHyphen) ids.push(derivedHyphen);
  // Legacy: agents.json slug (e.g. nate, corey-allen) in case leads still use it
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
  // Title-case variants for slug-like IDs (e.g. "Nate" in DB when we have "nate")
  const titleCase = uniq
    .filter((s) => s && !s.includes(' ') && !s.startsWith('user_'))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
  return [...new Set([...withCase, ...titleCase])];
}
