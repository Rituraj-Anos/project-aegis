import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/appError.js';

/**
 * Role guard middleware factory.
 * Verifies the authenticated user has one of the required roles.
 * Must be placed AFTER requireAuth in the middleware chain.
 *
 * Usage:
 *   router.delete('/users/:id', requireAuth, roleGuard('admin'), controller)
 */
export function roleGuard(...allowedRoles: Array<'user' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}
