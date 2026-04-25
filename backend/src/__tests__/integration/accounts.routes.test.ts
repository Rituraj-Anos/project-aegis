import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';
import { createAuthenticatedUser } from '../helpers/auth';
import { createTestAccount } from '../factories';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

describe('Account Routes', () => {
  let headers: { Authorization: string };
  let userId: string;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser();
    headers = auth.headers;
    userId = auth.user._id.toString();
  });

  describe('POST /api/v1/accounts', () => {
    it('201 — creates account', async () => {
      const res = await request(app).post('/api/v1/accounts')
        .set(headers).send({ name: 'Checking', type: 'checking', balance: 100000, currency: 'USD' });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Checking');
    });

    it('409 — duplicate name', async () => {
      await request(app).post('/api/v1/accounts').set(headers).send({ name: 'Dup', type: 'checking', balance: 0, currency: 'USD' });
      const res = await request(app).post('/api/v1/accounts').set(headers).send({ name: 'Dup', type: 'savings', balance: 0, currency: 'USD' });
      expect(res.status).toBe(409);
    });

    it('401 — unauthenticated', async () => {
      const res = await request(app).post('/api/v1/accounts').send({ name: 'X', type: 'checking', balance: 0, currency: 'USD' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/accounts', () => {
    it('200 — returns non-archived accounts', async () => {
      await createTestAccount(userId, { name: 'A1', isArchived: false });
      await createTestAccount(userId, { name: 'A2', isArchived: true });
      const res = await request(app).get('/api/v1/accounts').set(headers);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('200 — user only sees own accounts', async () => {
      const other = await createAuthenticatedUser({ email: 'other@test.com' });
      await createTestAccount(userId, { name: 'Mine' });
      await createTestAccount(other.user._id.toString(), { name: 'Theirs' });
      const res = await request(app).get('/api/v1/accounts').set(headers);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Mine');
    });
  });

  describe('PATCH /api/v1/accounts/:accountId', () => {
    it('200 — updates account', async () => {
      const acct = await createTestAccount(userId, { name: 'Old' });
      const res = await request(app).patch(`/api/v1/accounts/${acct._id}`).set(headers).send({ name: 'New' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New');
    });

    it('404 — cannot update other user\'s account', async () => {
      const other = await createAuthenticatedUser({ email: 'other2@test.com' });
      const acct = await createTestAccount(other.user._id.toString(), { name: 'Nope' });
      const res = await request(app).patch(`/api/v1/accounts/${acct._id}`).set(headers).send({ name: 'Hijack' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/accounts/:accountId', () => {
    it('200 — soft deletes', async () => {
      const acct = await createTestAccount(userId, { name: 'Delete' });
      const res = await request(app).delete(`/api/v1/accounts/${acct._id}`).set(headers);
      expect(res.status).toBe(200);
      // No longer in list
      const list = await request(app).get('/api/v1/accounts').set(headers);
      expect(list.body.data).toHaveLength(0);
    });
  });
});
