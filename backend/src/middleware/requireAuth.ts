import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/appError.js';

/**
 * Verify JWT from Authorization header and attach user to request.
 * Must come before any route that requires authentication.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed authorization header');
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      _id: payload._id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired', 'TOKEN_EXPIRED');
    }
    throw new UnauthorizedError('Invalid token', 'TOKEN_INVALID');
  }
}
