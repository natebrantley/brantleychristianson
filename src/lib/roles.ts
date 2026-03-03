/**
 * Role logic: all users are clients unless explicitly marked as broker.
 * Broker access is granted only when role is 'agent' or 'broker'.
 */

const BROKER_ROLES = ['agent', 'broker'] as const;

export function isBrokerRole(role: string | null | undefined): boolean {
  if (role == null || role === '') return false;
  return BROKER_ROLES.includes(role.toLowerCase() as (typeof BROKER_ROLES)[number]);
}
