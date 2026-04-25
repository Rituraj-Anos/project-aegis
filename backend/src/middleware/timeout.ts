import type { RequestHandler } from 'express';
import { logger } from '../utils/logger.js';

export function requestTimeout(ms = 30_000): RequestHandler {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Request timeout', { path: req.path, method: req.method, id: req.id });
        res.status(503).json({
          success: false,
          error: { message: 'Request timed out', code: 'TIMEOUT' },
        });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
}
