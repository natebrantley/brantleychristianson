/**
 * Zod schema and allowlist for search API query params.
 * Build Repliers request from validated values only; reject unknown keys.
 */

import { z } from 'zod';

const MAX_PAGE_SIZE = 100;
const MAX_PAGE_NUM = 1000;
const MAX_STRING_LENGTH = 200;

/** Allowed sort values for Repliers (map to their param format) */
export const SEARCH_SORT_OPTIONS = [
  'listPrice-asc',
  'listPrice-desc',
  'listDate-desc',
  'listDate-asc',
  'sqft-desc',
  'sqft-asc',
] as const;

export const searchSortSchema = z.enum(SEARCH_SORT_OPTIONS);

/** Schema for search query params (from URL searchParams or parsed body) */
export const searchParamsSchema = z.object({
  pageNum: z.coerce.number().int().min(1).max(MAX_PAGE_NUM).default(1),
  resultsPerPage: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
  minPrice: z.coerce.number().int().min(0).max(2 ** 31 - 1).optional(),
  maxPrice: z.coerce.number().int().min(0).max(2 ** 31 - 1).optional(),
  minBedrooms: z.coerce.number().int().min(0).max(50).optional(),
  maxBedrooms: z.coerce.number().int().min(0).max(50).optional(),
  minBaths: z.coerce.number().min(0).max(50).optional(),
  maxBaths: z.coerce.number().min(0).max(50).optional(),
  minSqft: z.coerce.number().int().min(0).optional(),
  maxSqft: z.coerce.number().int().min(0).optional(),
  city: z
    .union([z.string().trim().max(MAX_STRING_LENGTH), z.array(z.string().trim().max(MAX_STRING_LENGTH))])
    .optional()
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : undefined)),
  status: z.enum(['A', 'U', 'P']).optional(),
  sort: searchSortSchema.optional(),
  search: z.string().trim().max(500).optional(),
  cluster: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  clusterPrecision: z.coerce.number().int().min(0).max(29).optional(),
  clusterFields: z.string().trim().max(200).optional(),
  clusterLimit: z.coerce.number().int().min(1).max(200).optional(),
  clusterListingsThreshold: z.coerce.number().int().min(1).max(100).optional(),
  listings: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (v === false || v === 'false' ? false : true)),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

/** Allowlist of query param names we accept from the client */
const ALLOWED_SEARCH_PARAM_NAMES = new Set([
  'pageNum',
  'resultsPerPage',
  'minPrice',
  'maxPrice',
  'minBedrooms',
  'maxBedrooms',
  'minBaths',
  'maxBaths',
  'minSqft',
  'maxSqft',
  'city',
  'status',
  'sort',
  'search',
  'cluster',
  'clusterPrecision',
  'clusterFields',
  'clusterLimit',
  'clusterListingsThreshold',
  'listings',
  'area',
  'areaOrCity',
  'zip',
  'propertyType',
  'lat',
  'long',
  'radius',
]);

/** Build a record of search params from URLSearchParams, only including allowed keys. */
export function getSearchParamsFromUrl(searchParams: URLSearchParams): Record<string, string | string[] | number | boolean> {
  const out: Record<string, string | string[] | number | boolean> = {};
  for (const [key, value] of searchParams) {
    if (!ALLOWED_SEARCH_PARAM_NAMES.has(key)) continue;
    const existing = out[key];
    if (existing === undefined) {
      out[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      out[key] = [existing as string, value];
    }
  }
  return out;
}

/** Parse and validate search params; returns { success: true, data } or { success: false, error }. */
export function parseSearchParams(
  raw: Record<string, unknown>
): { success: true; data: SearchParams } | { success: false; error: string } {
  const result = searchParamsSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const first = result.error.flatten().fieldErrors;
  const msg = Object.entries(first)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
    .join('; ');
  return { success: false, error: msg || 'Invalid search parameters' };
}
