/**
 * Shared constants and helpers for webhook routes.
 * Use for body size limits and consistent security behavior.
 */

/** Max webhook request body size (512 KB). Reject larger payloads to reduce DoS risk. */
export const MAX_WEBHOOK_BODY_BYTES = 512 * 1024;

/**
 * Returns true if request body is within limit (by Content-Length header).
 * Call before reading body; if false, respond with 413.
 */
export function isBodySizeAllowed(request: Request): boolean {
  const cl = request.headers.get('content-length');
  if (cl == null) return true; // unknown; let handler read (platform may limit)
  const n = parseInt(cl, 10);
  if (Number.isNaN(n) || n < 0) return true;
  return n <= MAX_WEBHOOK_BODY_BYTES;
}

/** Constant-time string compare to prevent timing attacks on secrets. */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}
