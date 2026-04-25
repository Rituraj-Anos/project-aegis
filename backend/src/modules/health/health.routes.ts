import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /health — Liveness probe.
 * Always returns 200. No DB check, no auth.
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  });
});

/**
 * GET /ready — Readiness probe.
 * Returns 200 only when MongoDB is connected (readyState === 1).
 */
router.get('/ready', (_req: Request, res: Response) => {
  const dbReady = mongoose.connection.readyState === 1;

  res.status(dbReady ? 200 : 503).json({
    success: dbReady,
    data: {
      status: dbReady ? 'ready' : 'not_ready',
      db: dbReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
