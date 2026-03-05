/**
 * Role logic: all users are clients unless explicitly marked as broker or lender.
 * Broker access is granted only when role is 'agent' or 'broker'.
 * Lender access is granted when role is 'lender'.
 */

const BROKER_ROLES = ['agent', 'broker'] as const;
const LENDER_ROLE = 'lender' as const;

export function isBrokerRole(role: string | null | undefined): boolean {
  if (role == null || role === '') return false;
  return BROKER_ROLES.includes(role.toLowerCase() as (typeof BROKER_ROLES)[number]);
}

export function isLenderRole(role: string | null | undefined): boolean {
  if (role == null || role === '') return false;
  return role.toLowerCase() === LENDER_ROLE;
}
