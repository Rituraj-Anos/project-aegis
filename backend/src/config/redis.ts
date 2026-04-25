import { logger } from '../utils/logger.js';

const redis = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  incr: async () => 1,
  expire: async () => 1,
  multi: () => redis,
  exec: async () => [],
  quit: async () => 'OK',
  on: () => {},
  status: 'ready',
} as any;

export async function connectRedis(): Promise<void> {
  logger.info('Redis disabled/mocked');
}

export async function disconnectRedis(): Promise<void> {}

export default redis;
