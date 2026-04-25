import { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { UnauthorizedError } from '../../utils/appError.js';
import { env } from '../../config/env.js';
import type { IUser } from '../users/user.model.js';

// ── Cookie options for refresh token ─────────────────────
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

// ── Register ─────────────────────────────────────────────
export async function registerController(req: Request, res: Response): Promise<void> {
  const { accessToken, refreshToken, user } = await authService.register(req.body);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    data: { accessToken, user },
  });
}

// ── Login ────────────────────────────────────────────────
export async function loginController(req: Request, res: Response): Promise<void> {
  const { accessToken, refreshToken, user } = await authService.login(req.body, req.ip);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({
    success: true,
    data: { accessToken, user },
  });
}

// ── Refresh ──────────────────────────────────────────────
export async function refreshController(req: Request, res: Response): Promise<void> {
  const incomingToken = req.cookies?.['refreshToken'];

  if (!incomingToken) {
    throw new UnauthorizedError('No refresh token', 'REFRESH_TOKEN_INVALID');
  }

  const { accessToken, refreshToken } = await authService.refresh(incomingToken);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({
    success: true,
    data: { accessToken },
  });
}

// ── Logout ───────────────────────────────────────────────
export async function logoutController(req: Request, res: Response): Promise<void> {
  const incomingToken = req.cookies?.['refreshToken'];

  if (incomingToken && req.user) {
    await authService.logout(req.user._id.toString(), incomingToken);
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth' });

  res.json({
    success: true,
    data: { message: 'Logged out' },
  });
}

// ── Google OAuth Callback ────────────────────────────────
export async function googleCallbackController(req: Request, res: Response): Promise<void> {
  const user = req.user as unknown as IUser;

  const { accessToken, refreshToken } = await authService.issueTokensForOAuth(user);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  // Redirect to frontend — it reads token from URL and immediately clears it
  res.redirect(`${env.CLIENT_URL}/auth/callback?token=${accessToken}`);
}
