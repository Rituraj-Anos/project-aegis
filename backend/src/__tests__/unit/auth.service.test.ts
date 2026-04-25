import { UserModel } from '../../modules/users/user.model';
import { register, login, refresh, logout } from '../../modules/auth/auth.service';
import { ConflictError, UnauthorizedError } from '../../utils/appError';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

describe('AuthService', () => {
  const validInput = { email: 'test@example.com', password: 'Password1!', name: 'Test User' };

  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      const result = await register(validInput);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(validInput.email);
      expect(result.user.role).toBe('user');
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('throws ConflictError when email already exists', async () => {
      await register(validInput);
      await expect(register(validInput)).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => { await register(validInput); });

    it('returns tokens on valid credentials', async () => {
      const result = await login({ email: validInput.email, password: validInput.password });
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(validInput.email);
    });

    it('throws UnauthorizedError for wrong password', async () => {
      await expect(login({ email: validInput.email, password: 'WrongPass1!' }))
        .rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError for non-existent email', async () => {
      await expect(login({ email: 'nobody@test.com', password: 'Password1!' }))
        .rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when account is locked', async () => {
      await UserModel.findOneAndUpdate(
        { email: validInput.email },
        { failedLoginAttempts: 5, lockedUntil: new Date(Date.now() + 60_000) },
      );
      await expect(login({ email: validInput.email, password: validInput.password }))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refresh', () => {
    it('rotates refresh token and returns new token pair', async () => {
      const reg = await register(validInput);
      const newTokens = await refresh(reg.refreshToken);
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.refreshToken).not.toBe(reg.refreshToken);
    });

    it('detects token reuse and wipes all sessions', async () => {
      const reg = await register(validInput);
      const oldRefresh = reg.refreshToken;
      // Use it once (valid)
      await refresh(oldRefresh);
      // Use it again (reuse) — should wipe all sessions
      await expect(refresh(oldRefresh)).rejects.toThrow(UnauthorizedError);
      // Verify all tokens wiped
      const user = await UserModel.findOne({ email: validInput.email });
      expect(user!.refreshTokens).toHaveLength(0);
    });
  });

  describe('logout', () => {
    it('removes the matching refresh token hash', async () => {
      const reg = await register(validInput);
      const user = await UserModel.findOne({ email: validInput.email });
      expect(user!.refreshTokens.length).toBeGreaterThan(0);
      await logout(user!._id.toString(), reg.refreshToken);
      const updated = await UserModel.findOne({ email: validInput.email });
      expect(updated!.refreshTokens).toHaveLength(0);
    });

    it('does not throw if user not found', async () => {
      await expect(logout('000000000000000000000000', 'fake-token')).resolves.not.toThrow();
    });
  });
});
