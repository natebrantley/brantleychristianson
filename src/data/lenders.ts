import type { Lender } from './types';
import lendersJson from './lenders.json';

export const lenders: Lender[] = lendersJson as Lender[];

export function getLenderBySlug(slug: string): Lender | undefined {
  return lenders.find((l) => l.slug === slug);
}
