import crypto from 'node:crypto';

/**
 * Timing-safe string comparison.
 * Prevents timing attacks on token/hash comparisons.
 * Returns false if lengths differ (still constant-time for equal lengths).
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
}
