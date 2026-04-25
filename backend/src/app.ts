import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import passport from 'passport';

import { env }                  from './config/env.js';
import { initPassport }         from './config/passport.js';
import { errorHandler }         from './middleware/errorHandler.js';
import { NotFoundError }        from './utils/appError.js';

// ── Phase 5 middleware ─────────────────────────────────────
import { requestId }             from './middleware/requestId.js';
import { helmetConfig, noSniff } from './middleware/securityHeaders.js';
import { corsOptions }           from './middleware/corsConfig.js';
import { compressionMiddleware } from './middleware/compression.js';
import { globalLimiter, authLimiter, coachLimiter, reportLimiter } from './middleware/rateLimiter.js';
import { sanitizeMiddleware }    from './middleware/sanitize.js';
import { requestTimeout }        from './middleware/timeout.js';
import { bruteForceGuard }       from './middleware/bruteForce.js';

// ── Route imports ──────────────────────────────────────────
import healthRoutes              from './modules/health/health.routes.js';
import { authRouter }            from './modules/auth/auth.routes.js';
import { accountRouter }         from './modules/accounts/account.routes.js';
import { transactionRouter }     from './modules/transactions/transaction.routes.js';
import { budgetRouter }          from './modules/budgets/budget.routes.js';
import { coachRouter }           from './modules/coach/coach.routes.js';
import { analyticsRouter }       from './modules/analytics/analytics.routes.js';
import { reportRouter }          from './modules/reports/report.routes.js';
import { adminRouter }           from './modules/admin/admin.routes.js';
import { notificationRouter }    from './modules/notifications/notification.routes.js';
import { attachmentRouter }      from './modules/attachments/attachment.routes.js';
import { userRouter }            from './modules/users/user.routes.js';

// ── Sentry (must be before Express app) ───────────────────
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      if (event.request?.data) {
        try {
          const data =
            typeof event.request.data === 'string'
              ? JSON.parse(event.request.data)
              : event.request.data;
          if (data?.password)     data.password     = '[REDACTED]';
          if (data?.token)        data.token        = '[REDACTED]';
          if (data?.refreshToken) data.refreshToken = '[REDACTED]';
          event.request.data = JSON.stringify(data);
        } catch { /* Not JSON */ }
      }
      return event;
    },
  });
}

const app = express();

// ── 1. Request ID ─────────────────────────────────────────
app.use(requestId);

// ── 2. Security headers ───────────────────────────────────
app.use(helmet(helmetConfig));
app.use(noSniff);

// ── 3. CORS ───────────────────────────────────────────────
app.use(cors(corsOptions));

// ── 4. Compression ────────────────────────────────────────
app.use(compressionMiddleware);

// ── 5. Global rate limiter (Redis-backed) ─────────────────
app.use(globalLimiter);

// ── 6. Cookie parser (before body parsers) ────────────────
app.use(cookieParser());

// ── 7. Body parsers ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── 8. Request timeout ────────────────────────────────────
app.use(requestTimeout(30_000));

// ── 9. Sanitization (mongo injection + HPP + XSS) ─────────
app.use(...sanitizeMiddleware);

// ── 10. Morgan request logger ─────────────────────────────
app.use(morgan(':method :url :status :response-time ms - id::req[x-request-id]', {
  skip: () => env.NODE_ENV === 'test',
}));

// ── 11. Passport (stateless) ──────────────────────────────
initPassport();
app.use(passport.initialize());

// ── 12. Health routes (no auth/rate-limit overhead) ───────
app.use(healthRoutes);

// ── 13. Auth routes (strict limiter + brute force guard) ──
app.use('/api/v1/auth', authLimiter, bruteForceGuard, authRouter);

// ── 14. API routes ────────────────────────────────────────
app.use('/api/v1/accounts',     accountRouter);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/budgets',      budgetRouter);
app.use('/api/v1/coach',        coachLimiter, coachRouter);
app.use('/api/v1/analytics',    analyticsRouter);
app.use('/api/v1/reports',      reportLimiter, reportRouter);
app.use('/api/v1/admin',        adminRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/attachments',   attachmentRouter);
app.use('/api/v1/users',         userRouter);

// ── 15. Static uploads (local dev only) ──────────────────
if (env.STORAGE_PROVIDER === 'local') {
  app.use('/uploads', express.static(env.LOCAL_UPLOAD_DIR));
}

// ── 15. 404 catch-all ─────────────────────────────────────
app.use((_req, _res, next) => {
  next(new NotFoundError('Route not found'));
});

// ── 16. Sentry error handler ──────────────────────────────
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// ── 17. Central error handler — MUST be last ──────────────
app.use(errorHandler);

export default app;
