import { Router } from 'express';
import passport from 'passport';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { googleOAuthEnabled } from '../../config/passport.js';
import { env } from '../../config/env.js';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  googleCallbackController,
} from './auth.controller.js';

export const authRouter = Router();

// ── Email / Password ─────────────────────────────────────
authRouter.post('/register', validate({ body: registerSchema }), registerController);
authRouter.post('/login', validate({ body: loginSchema }), loginController);
authRouter.post('/refresh', refreshController);
authRouter.post('/logout', requireAuth, logoutController);

// ── Google OAuth ─────────────────────────────────────────
authRouter.get('/google', (req, res, next) => {
  if (!googleOAuthEnabled) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Google OAuth not configured' },
    });
    return;
  }
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
  })(req, res, next);
});

authRouter.get('/google/callback', (req, res, next) => {
  if (!googleOAuthEnabled) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Google OAuth not configured' },
    });
    return;
  }
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed`,
  })(req, res, () => {
    googleCallbackController(req, res).catch(next);
  });
});
