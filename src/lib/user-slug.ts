/**
 * Canonical broker/agent slug: firstname_lastname, lowercase (e.g. nate_brantley).
 * Used for users.slug, agents.json slug, URLs (/agents/[slug]), and leads.assigned_broker_id.
 */
export function deriveUserSlug(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string | null {
  const first = typeof firstName === 'string' ? firstName.trim() : '';
  const last = typeof lastName === 'string' ? lastName.trim() : '';
  const combined = [first, last].filter(Boolean).join('_');
  if (!combined) return null;
  return combined.toLowerCase().replace(/\s+/g, '_');
}
