import redis from '../config/redis.js';
import { logger } from './logger.js';

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error('Cache get failed', { err, key });
    try { await redis.del(key); } catch { /* swallow */ }
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.error('Cache set failed', { err, key });
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    logger.error('Cache delete failed', { err, keys });
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  } catch (err) {
    logger.error('Cache pattern delete failed', { err, pattern });
  }
}

export async function withCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const result = await fetcher();
  await cacheSet(key, result, ttlSeconds);
  return result;
}

export const cacheKeys = {
  accounts:     (userId: string) => `accounts:${userId}`,
  budgets:      (userId: string) => `budgets:${userId}`,
  analytics:    (userId: string, hash: string) => `analytics:${userId}:${hash}`,
  coachInsight: (userId: string) => `coach:${userId}`,
  platformStats: () => 'admin:platform-stats',
};
