/**
 * Derive users.slug from first_name + last_name for RLS and lead assignment.
 * Format: first_last lowercased, spaces to underscores (e.g. nate_brantley).
 * Used so leads.assigned_broker_id / assigned_lender_id can match by slug in RLS.
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
