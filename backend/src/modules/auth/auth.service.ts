import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '../users/user.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { ConflictError, UnauthorizedError } from '../../utils/appError.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';

// ── Public types ─────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  coachState: 0 | 1 | 2;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Helpers ──────────────────────────────────────────────

function toSafeUser(user: IUser): SafeUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    coachState: user.coachState,
  };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Parse duration strings like "7d", "24h", "15m" into milliseconds */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback 7 days

  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;

  switch (unit) {
    case 'd': return value * 86_400_000;
    case 'h': return value * 3_600_000;
    case 'm': return value * 60_000;
    case 's': return value * 1_000;
    default:  return 7 * 86_400_000;
  }
}

/**
 * Issue access + refresh tokens and persist the refresh hash.
 * Caps stored refresh tokens to 10 most recent.
 */
async function _issueTokens(user: IUser): Promise<TokenPair> {
  const tokenId = crypto.randomUUID();

  const accessToken = signAccessToken({
    _id: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  const refreshToken = signRefreshToken({
    userId: user._id.toString(),
    tokenId,
  });

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN));

  user.refreshTokens.push({ tokenHash, expiresAt });

  // Keep only the 10 most recent tokens
  if (user.refreshTokens.length > 10) {
    user.refreshTokens = user.refreshTokens.slice(-10);
  }

  await user.save();
  return { accessToken, refreshToken };
}

// ── Exported service functions ───────────────────────────

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new ConflictError('Email already in use');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await UserModel.create({
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name,
    role: 'user',
  });

  const tokens = await _issueTokens(user);

  return { ...tokens, user: toSafeUser(user) };
}

export async function login(input: LoginInput, _ip?: string): Promise<AuthResult> {
  const user = await UserModel.findOne({
    email: input.email.toLowerCase(),
    isDeleted: { $ne: true },
  }).select('+passwordHash');

  if (!user) {
    // Dummy hash to prevent timing attacks revealing whether email exists
    await bcrypt.hash('dummy_password_timing_safe', 12);
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.isLocked()) {
    throw new UnauthorizedError('Account temporarily locked. Try again later');
  }

  if (!user.passwordHash) {
    // OAuth-only account — no password set
    throw new UnauthorizedError('Invalid credentials');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);

  if (!valid) {
    await user.incrementFailedLogins();
    throw new UnauthorizedError('Invalid credentials');
  }

  await user.resetFailedLogins();
  const tokens = await _issueTokens(user);

  return { ...tokens, user: toSafeUser(user) };
}

export async function refresh(incomingRefreshToken: string): Promise<TokenPair> {
  // 1. Verify JWT signature + expiry
  const payload = verifyRefreshToken(incomingRefreshToken);

  // 2. Find user
  const user = await UserModel.findById(payload.userId);
  if (!user) {
    throw new UnauthorizedError('Invalid token', 'REFRESH_TOKEN_INVALID');
  }

  // 3. Hash incoming token and look for match
  const incomingHash = hashToken(incomingRefreshToken);
  const now = new Date();
  const matchIdx = user.refreshTokens.findIndex(
    (t) => t.tokenHash === incomingHash && t.expiresAt > now,
  );

  // 4. Reuse detection — if token not found, revoke ALL sessions
  if (matchIdx === -1) {
    logger.warn('Refresh token reuse detected', { userId: payload.userId });
    user.refreshTokens = [];
    await user.save();
    throw new UnauthorizedError(
      'Token reuse detected. All sessions invalidated',
      'REFRESH_TOKEN_INVALID',
    );
  }

  // 5. Remove used token (rotation)
  user.refreshTokens.splice(matchIdx, 1);

  // 6. Issue new pair
  const tokens = await _issueTokens(user);

  return tokens;
}

export async function logout(userId: string, incomingRefreshToken: string): Promise<void> {
  try {
    const user = await UserModel.findById(userId);
    if (!user) return; // fail silently

    const incomingHash = hashToken(incomingRefreshToken);
    user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== incomingHash);
    await user.save();
  } catch {
    // Logout should never throw
  }
}

/**
 * Public version of _issueTokens for OAuth controller use.
 */
export async function issueTokensForOAuth(user: IUser): Promise<TokenPair> {
  return _issueTokens(user);
}

export { toSafeUser };
