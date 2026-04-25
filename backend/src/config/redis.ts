import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { err }));
redis.on('close', () => logger.warn('Redis connection closed'));

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    logger.info('Redis ready');
  } catch (err) {
    logger.error('Redis connection failed', { err });
    throw err;
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

export default redis;
