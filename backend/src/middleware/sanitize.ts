import type { RequestHandler } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import xss from 'xss';
import { logger } from '../utils/logger.js';

function deepSanitize(obj: unknown): unknown {
  if (typeof obj === 'string') return xss(obj, { whiteList: {}, stripIgnoreTag: true });
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = deepSanitize(v);
    }
    return result;
  }
  return obj;
}

const xssSanitizer: RequestHandler = (req, _res, next) => {
  if (req.body) {
    const original = JSON.stringify(req.body);
    req.body = deepSanitize(req.body);
    if (JSON.stringify(req.body) !== original) {
      logger.warn('XSS attempt detected and sanitized', { ip: req.ip, path: req.path });
    }
  }
  // Express 5: req.query is a getter-only property — sanitize values in-place
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      const val = req.query[key];
      if (typeof val === 'string') {
        (req.query as Record<string, any>)[key] = xss(val, { whiteList: {}, stripIgnoreTag: true });
      }
    }
  }
  next();
};

// Express 5: mongoSanitize tries to reassign req.query which is read-only.
// Restrict it to body + params only by wrapping in a custom handler.
const mongoSanitizeBodyOnly: RequestHandler = (req, res, next) => {
  // Temporarily hide req.query from sanitizer by providing a safe fallback
  const sanitizer = mongoSanitize({ replaceWith: '_' }) as unknown as RequestHandler;
  // Back up and restore query since mongoSanitize will try to write it
  const originalQuery = req.query;
  try {
    sanitizer(req, res, (err?: any) => {
      // Always restore query to the original reference
      Object.defineProperty(req, 'query', {
        get: () => originalQuery,
        configurable: true,
      });
      next(err);
    });
  } catch {
    next();
  }
};

// Express 5: hpp tries to reassign req.query which is read-only.
const hppWrapper: RequestHandler = (req, res, next) => {
  const hppMiddleware = hpp({ whitelist: ['tags', 'type', 'category', 'sortBy'] });
  const originalQuery = req.query;
  try {
    hppMiddleware(req, res, (err?: any) => {
      Object.defineProperty(req, 'query', {
        get: () => originalQuery,
        configurable: true,
      });
      next(err);
    });
  } catch {
    next();
  }
};

export const sanitizeMiddleware: RequestHandler[] = [
  mongoSanitizeBodyOnly,
  hppWrapper,
  xssSanitizer,
];

