import type { Request, Response, NextFunction } from 'express';
import redis from '../config/redis.js';

const localStore = new Map<string, number>();

export async function bruteForceGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const email = (req.body as any)?.email?.toLowerCase();
  if (!email) { next(); return; }

  const key = `bf:${email}`;
  const attempts = localStore.get(key) || 0;

  if (attempts >= 10) {
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
  const current = localStore.get(key) || 0;
  localStore.set(key, current + 1);
}

export async function clearFailedLogins(email: string): Promise<void> {
  localStore.delete(`bf:${email.toLowerCase()}`);
}
