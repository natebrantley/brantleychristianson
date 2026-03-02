import type { PortlandCondoEntry } from './portland-condo-guide-types';

import guideData from './portland-condo-guide.json';

/** 2026 Portland Condo Guide – loaded from portland-condo-guide.json. Image paths use /media/img/condos/. */
export const portlandCondoGuide: PortlandCondoEntry[] = guideData as PortlandCondoEntry[];

/** Unique neighborhoods for filter dropdown */
export const portlandCondoNeighborhoods = Array.from(
  new Set(portlandCondoGuide.map((c) => c.neighborhood))
).sort();

/** Get a single condo by URL slug (id). */
export function getCondoBySlug(slug: string): PortlandCondoEntry | undefined {
  return portlandCondoGuide.find((c) => c.id === slug);
}

/** Get all condo slugs for static generation. */
export function getCondoSlugs(): string[] {
  return portlandCondoGuide.map((c) => c.id);
}

/** Get other condos in the same neighborhood, excluding the given id. */
export function getCondosInNeighborhood(
  categoryId: string,
  excludeId: string
): PortlandCondoEntry[] {
  return portlandCondoGuide.filter(
    (c) => c.categoryId === categoryId && c.id !== excludeId
  );
}
