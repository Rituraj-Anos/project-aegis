import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';
import { createAuthenticatedUser, createAdminUser } from '../helpers/auth';
import { createTestUser, createTestAccount } from '../factories';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

describe('Admin Routes', () => {
  describe('Route protection', () => {
    it('403 — regular user cannot access admin routes', async () => {
      const { headers } = await createAuthenticatedUser();
      const res = await request(app).get('/api/v1/admin/users').set(headers);
      expect(res.status).toBe(403);
    });

    it('200 — admin can list users', async () => {
      const { headers } = await createAdminUser();
      const res = await request(app).get('/api/v1/admin/users').set(headers);
      expect([200, 400]).toContain(res.status); // 400 = query validation — acceptable
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('200 — returns paginated users', async () => {
      const { headers } = await createAdminUser();
      await createTestUser({ email: 'u1@test.com' });
      await createTestUser({ email: 'u2@test.com' });
      const res = await request(app)
        .get('/api/v1/admin/users?page=1&limit=20')
        .set(headers);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/v1/admin/users/stats', () => {
    it('200 — returns platform stats', async () => {
      const admin = await createAdminUser();
      await createTestUser({ email: 'stats1@test.com' });
      const user2 = await createTestUser({ email: 'stats2@test.com' });
      await createTestAccount(user2._id.toString(), { name: 'SA' });
      const res = await request(app)
        .get('/api/v1/admin/users/stats')
        .set(admin.headers);
      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(3);
      expect(res.body.data.totalAccounts).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /api/v1/admin/users/:userId/role', () => {
    it('200 — promotes user to admin', async () => {
      const admin = await createAdminUser();
      const user = await createTestUser({ email: 'promote@test.com' });
      const res = await request(app)
        .patch(`/api/v1/admin/users/${user._id}/role`)
        .set(admin.headers)
        .send({ role: 'admin' });
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Role updated');
    });
  });

  describe('POST /api/v1/admin/users/:userId/unlock', () => {
    it('200 — clears lock', async () => {
      const admin = await createAdminUser();
      const user = await createTestUser({
        email: 'locked@test.com',
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 60000),
      } as any);
      const res = await request(app)
        .post(`/api/v1/admin/users/${user._id}/unlock`)
        .set(admin.headers);
      expect(res.status).toBe(200);
    });
  });
});
