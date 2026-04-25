import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { ValidationError } from '../utils/appError.js';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Zod validation middleware factory.
 * Validates request body, query, and/or params against provided schemas.
 * Returns 400 VALIDATION_ERROR with field-level details on failure.
 *
 * Usage:
 *   router.post('/foo', validate({ body: createFooSchema }), controller)
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const path = issue.path.join('.') || 'body';
          errors[path] = issue.message;
        }
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const path = issue.path.join('.') || 'query';
          errors[`query.${path}`] = issue.message;
        }
      } else {
        // Express 5: req.query is read-only (getter).
        // Store parsed data back by mutating existing object in-place.
        const parsed = result.data as Record<string, unknown>;
        const q = req.query as Record<string, unknown>;
        for (const key of Object.keys(q)) {
          if (!(key in parsed)) delete q[key];
        }
        for (const [key, val] of Object.entries(parsed)) {
          q[key] = val as any;
        }
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const path = issue.path.join('.') || 'params';
          errors[`params.${path}`] = issue.message;
        }
      } else {
        (req as any).params = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  };
}
