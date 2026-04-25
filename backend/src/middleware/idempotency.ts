import type { Request, Response, NextFunction } from 'express';
import redis from '../config/redis.js';
import { logger } from '../utils/logger.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function idempotency(req: Request, res: Response, next: NextFunction): void {
  if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) { next(); return; }

  const key = req.headers['idempotency-key'] as string | undefined;
  if (!key) { next(); return; }

  if (!UUID_RE.test(key)) {
    res.status(400).json({ success: false, error: { message: 'Invalid Idempotency-Key format', code: 'BAD_IDEMPOTENCY_KEY' } });
    return;
  }

  const userId = (req as any).user?._id?.toString() ?? req.ip ?? 'anon';
  const redisKey = `idem:${userId}:${key}`;

  redis.get(redisKey)
    .then((cached) => {
      if (cached) {
        const { status, body } = JSON.parse(cached);
        res.setHeader('Idempotency-Key', key);
        res.status(status).json(body);
        return;
      }

      // Intercept res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        const toCache = { status: res.statusCode, body };
        redis.set(redisKey, JSON.stringify(toCache), 'EX', 86400)
          .catch((err) => logger.error(err, 'Idempotency cache write failed'));
        res.setHeader('Idempotency-Key', key);
        return originalJson(body);
      };
      next();
    })
    .catch((err) => {
      logger.error(err, 'Idempotency check failed');
      next(); // Proceed without idempotency on Redis failure
    });
}
