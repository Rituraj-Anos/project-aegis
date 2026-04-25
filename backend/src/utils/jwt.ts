import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// ── Access token payload (user identity) ─────────────────
export interface AccessTokenPayload {
  _id: string;
  email: string;
  role: 'user' | 'admin';
}

// ── Refresh token payload (rotation tracking) ────────────
export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

const ACCESS_OPTIONS: jwt.SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  issuer: 'aegis-api',
  audience: 'aegis-client',
};

const REFRESH_OPTIONS: jwt.SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  issuer: 'aegis-api',
  audience: 'aegis-client',
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, ACCESS_OPTIONS);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, REFRESH_OPTIONS);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'aegis-api',
    audience: 'aegis-client',
  }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'aegis-api',
    audience: 'aegis-client',
  }) as RefreshTokenPayload;
}
