import { createHash } from 'node:crypto';

export function hashQuery(query: Record<string, unknown>): string {
  const sorted = Object.keys(query).sort().reduce<Record<string, unknown>>((acc, k) => {
    acc[k] = query[k];
    return acc;
  }, {});
  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 16);
}
