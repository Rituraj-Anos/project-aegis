import { signAccessToken } from '../../utils/jwt';
import { createTestUser } from '../factories';
import type { IUser } from '../../modules/users/user.model';

export async function getAuthToken(user: IUser): Promise<string> {
  return signAccessToken({
    _id:   user._id.toString(),
    role:  user.role,
    email: user.email,
  });
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function createAuthenticatedUser(overrides: Record<string, unknown> = {}): Promise<{
  user: IUser;
  token: string;
  headers: { Authorization: string };
}> {
  const user  = await createTestUser(overrides as any);
  const token = await getAuthToken(user);
  return { user, token, headers: authHeader(token) };
}

export async function createAdminUser(overrides: Record<string, unknown> = {}): Promise<{
  user: IUser;
  token: string;
  headers: { Authorization: string };
}> {
  return createAuthenticatedUser({ role: 'admin', ...overrides });
}
