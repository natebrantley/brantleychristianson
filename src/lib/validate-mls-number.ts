/**
 * Validate mlsNumber format for API routes. Return 400 for invalid format.
 */

const MLS_NUMBER_MAX_LENGTH = 32;
const MLS_NUMBER_PATTERN = /^[A-Za-z0-9._-]+$/;

export function isValidMlsNumber(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MLS_NUMBER_MAX_LENGTH) return false;
  return MLS_NUMBER_PATTERN.test(trimmed);
}

export function validateMlsNumber(
  value: unknown
): { valid: true; mlsNumber: string } | { valid: false; error: string } {
  if (!isValidMlsNumber(value)) {
    return {
      valid: false,
      error: 'Invalid listing ID format.',
    };
  }
  return { valid: true, mlsNumber: value.trim() };
}
