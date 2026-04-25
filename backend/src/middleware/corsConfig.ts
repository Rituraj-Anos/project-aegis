import type { CorsOptions } from 'cors';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400,
};
