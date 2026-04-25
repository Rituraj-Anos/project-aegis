/* eslint-disable @typescript-eslint/no-namespace */

/**
 * Augment the Express Request interface with our application-specific
 * user type. This is populated by:
 *   - requireAuth middleware (JWT path): { _id, email, role } as strings
 *   - Passport (OAuth path): same shape, cast in the OAuth controller
 *
 * We override Express.User here to prevent Passport's empty interface
 * from conflicting with our shape.
 */
declare global {
  namespace Express {
    /** Passport uses Express.User — align it with our JWT payload */
    interface User {
      _id: string | import('mongoose').Types.ObjectId;
      email: string;
      role: 'user' | 'admin';
    }

    interface Request {
      /** Populated by requireAuth (JWT) or Passport (OAuth) */
      user?: {
        _id: string;
        email: string;
        role: 'user' | 'admin';
      };
    }
  }
}

export {};
