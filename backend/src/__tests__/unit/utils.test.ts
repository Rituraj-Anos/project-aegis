import { generateStorageKey, getThumbnailKey } from '../../utils/storageKey';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

// ── storageKey utils ─────────────────────────────────────

describe('storageKey utils', () => {
  describe('generateStorageKey', () => {
    it('produces correct path format', () => {
      const key = generateStorageKey({ userId: 'abc123', category: 'receipts', originalName: 'photo.jpg' });
      expect(key).toMatch(/^receipts\/abc123\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+\.jpg$/);
    });

    it('sanitizes dangerous characters in original filename', () => {
      const key = generateStorageKey({ userId: 'u1', category: 'receipts', originalName: '../../etc/passwd.jpg' });
      expect(key).not.toContain('..');
      expect(key).toMatch(/\.jpg$/);
    });

    it('falls back to .bin when no extension found', () => {
      const key = generateStorageKey({ userId: 'u1', category: 'documents', originalName: 'noext' });
      expect(key).toMatch(/\.bin$/);
    });

    it('uses explicit extension param over filename', () => {
      const key = generateStorageKey({ userId: 'u1', category: 'receipts', originalName: 'file.png', extension: '.webp' });
      expect(key).toMatch(/\.webp$/);
    });
  });

  describe('getThumbnailKey', () => {
    it('replaces category prefix with thumbnails', () => {
      const thumb = getThumbnailKey('receipts/user1/2024-03-15/abc.jpg');
      expect(thumb).toBe('thumbnails/user1/2024-03-15/abc.jpg');
    });
  });
});

// ── JWT utils ────────────────────────────────────────────

describe('jwt utils', () => {
  const payload = { _id: 'user123', role: 'user' as const, email: 'test@test.com' };

  it('signAccessToken returns a valid JWT string', () => {
    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifyAccessToken returns correct payload', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded._id).toBe(payload._id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('verifyAccessToken throws on tampered token', () => {
    const token = signAccessToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('refresh token has different secret from access token', () => {
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: 'user123', tokenId: 'tid1' });
    expect(accessToken).not.toBe(refreshToken);
    // Verify cross-verification fails
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });

  it('signRefreshToken + verifyRefreshToken roundtrip works', () => {
    const rPayload = { userId: 'u1', tokenId: 'tok1' };
    const token = signRefreshToken(rPayload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.tokenId).toBe('tok1');
  });
});
