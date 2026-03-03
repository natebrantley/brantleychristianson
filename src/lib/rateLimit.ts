/**
 * In-memory rate limiter for API routes.
 * Use for single-instance or best-effort limiting; for multi-instance deploy consider Redis/Upstash.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

const store = new Map<string, number[]>();

function prune(timestamps: number[]): number[] {
  const cutoff = Date.now() - WINDOW_MS;
  return timestamps.filter((t) => t > cutoff);
}

export function isRateLimited( key: string ): boolean {
  const now = Date.now();
  let timestamps = store.get(key) ?? [];
  timestamps = prune(timestamps);
  if (timestamps.length >= MAX_REQUESTS) return true;
  timestamps.push(now);
  store.set(key, timestamps);
  return false;
}

export function getClientIp( request: Request ): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
