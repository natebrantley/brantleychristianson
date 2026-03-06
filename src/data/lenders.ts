import type { Lender } from './types';
import lendersJson from './lenders.json';

export const lenders: Lender[] = lendersJson as Lender[];

export function getLenderBySlug(slug: string): Lender | undefined {
  return lenders.find((l) => l.slug === slug);
}

/** Resolve full lender by email (for display when we only have clerk_id → users.email). */
export function getLenderByEmail(email: string | null | undefined): Lender | undefined {
  if (!email || !email.trim()) return undefined;
  const normalized = email.trim().toLowerCase();
  return lenders.find((l) => l.email?.toLowerCase() === normalized);
}
