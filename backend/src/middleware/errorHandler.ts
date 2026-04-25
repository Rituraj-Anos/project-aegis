import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Central error handler — MUST be the last middleware in the stack.
 * Normalises all errors into the standard response shape.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Known operational error ────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields && { fields: err.fields }),
      },
    });
    return;
  }

  // ── Mongoose validation error ──────────────────────────
  if (err.name === 'ValidationError' && 'errors' in err) {
    const mongoErr = err as any;
    const fields: Record<string, string> = {};
    for (const key of Object.keys(mongoErr.errors)) {
      fields[key] = mongoErr.errors[key].message;
    }
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields },
    });
    return;
  }

  // ── Mongoose cast error (bad ObjectId, etc.) ───────────
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Invalid resource identifier' },
    });
    return;
  }

  // ── Mongoose duplicate key ─────────────────────────────
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Resource already exists' },
    });
    return;
  }

  // ── JWT errors ─────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_INVALID', message: 'Invalid token' },
    });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
    });
    return;
  }

  // ── Unknown / unexpected error ─────────────────────────
  logger.error('Unhandled error', {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
  });
}
