import type { Request, Response, NextFunction } from 'express';
import redis from '../config/redis.js';

export async function bruteForceGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const email = (req.body as any)?.email?.toLowerCase();
  if (!email) { next(); return; }

  const key = `bf:${email}`;
  const attempts = await redis.get(key);

  if (attempts && parseInt(attempts, 10) >= 10) {
    res.status(429).json({
      success: false,
      error: { message: 'Account temporarily locked due to too many failed attempts.', code: 'BRUTE_FORCE_LOCKED' },
    });
    return;
  }
  next();
}

export async function recordFailedLogin(email: string): Promise<void> {
  const key = `bf:${email.toLowerCase()}`;
  await redis.multi().incr(key).expire(key, 30 * 60).exec();
}

export async function clearFailedLogins(email: string): Promise<void> {
  await redis.del(`bf:${email.toLowerCase()}`);
}
