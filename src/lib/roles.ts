/**
 * Role logic: all users are clients unless explicitly marked as broker, owner, or lender.
 * Broker access (agent dashboard) is granted when role is 'agent', 'broker', or 'owner'.
 * Owner = expanded broker with full access to all leads (god-mode CRM).
 * Lender access is granted when role is 'lender'.
 */

const BROKER_ROLES = ['agent', 'broker', 'owner'] as const;
const LENDER_ROLE = 'lender' as const;

export function isBrokerRole(role: string | null | undefined): boolean {
  if (role == null || role === '') return false;
  return BROKER_ROLES.includes(role.toLowerCase() as (typeof BROKER_ROLES)[number]);
}

export function isOwnerRole(role: string | null | undefined): boolean {
  if (role == null || role === '') return false;
  return role.toLowerCase() === 'owner';
}

export function isLenderRole(role: string | null | undefined): boolean {
  if (role == null || role === '') return false;
  return role.toLowerCase() === LENDER_ROLE;
}
