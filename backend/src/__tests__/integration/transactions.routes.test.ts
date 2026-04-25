import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';
import { createAuthenticatedUser } from '../helpers/auth';
import { createTestAccount, createTestTransaction } from '../factories';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

describe('Transaction Routes', () => {
  let headers: { Authorization: string };
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser();
    headers = auth.headers;
    userId = auth.user._id.toString();
    const acct = await createTestAccount(userId, { name: 'Main', balance: 50000 });
    accountId = acct._id.toString();
  });

  describe('POST /api/v1/transactions', () => {
    it('201 — income increases balance', async () => {
      const res = await request(app).post('/api/v1/transactions').set(headers)
        .send({ accountId, type: 'income', amount: 10000, currency: 'USD', category: 'Salary', date: new Date().toISOString() });
      expect(res.status).toBe(201);
      const acct = await request(app).get(`/api/v1/accounts/${accountId}`).set(headers);
      expect(acct.body.data.balance).toBe(60000);
    });

    it('201 — expense decreases balance', async () => {
      await request(app).post('/api/v1/transactions').set(headers)
        .send({ accountId, type: 'expense', amount: 10000, currency: 'USD', category: 'Food', date: new Date().toISOString() });
      const acct = await request(app).get(`/api/v1/accounts/${accountId}`).set(headers);
      expect(acct.body.data.balance).toBe(40000);
    });

    it('201 — transfer adjusts both accounts', async () => {
      const dest = await createTestAccount(userId, { name: 'Savings', balance: 0 });
      await request(app).post('/api/v1/transactions').set(headers).send({
        accountId, type: 'transfer', amount: 20000, currency: 'USD', category: 'Transfer',
        date: new Date().toISOString(), transferToAccountId: dest._id.toString(),
      });
      const srcRes = await request(app).get(`/api/v1/accounts/${accountId}`).set(headers);
      const dstRes = await request(app).get(`/api/v1/accounts/${dest._id}`).set(headers);
      expect(srcRes.body.data.balance).toBe(30000);
      expect(dstRes.body.data.balance).toBe(20000);
    });
  });

  describe('GET /api/v1/transactions', () => {
    it('200 — returns paginated transactions', async () => {
      for (let i = 0; i < 25; i++) {
        await createTestTransaction(userId, accountId, { type: 'expense', category: 'Food', amount: 100 });
      }
      const res = await request(app).get('/api/v1/transactions?page=1&limit=20').set(headers);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(20);
      expect(res.body.pagination.total).toBe(25);
    });

    it('200 — filters by type', async () => {
      await createTestTransaction(userId, accountId, { type: 'income', category: 'Salary', amount: 1000 });
      await createTestTransaction(userId, accountId, { type: 'expense', category: 'Food', amount: 500 });
      const res = await request(app).get('/api/v1/transactions?type=income').set(headers);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('DELETE /api/v1/transactions/:txId', () => {
    it('200 — soft deletes and reverses balance', async () => {
      const create = await request(app).post('/api/v1/transactions').set(headers)
        .send({ accountId, type: 'expense', amount: 10000, currency: 'USD', category: 'Food', date: new Date().toISOString() });
      const txId = create.body.data._id;
      await request(app).delete(`/api/v1/transactions/${txId}`).set(headers);
      const acct = await request(app).get(`/api/v1/accounts/${accountId}`).set(headers);
      expect(acct.body.data.balance).toBe(50000);
    });
  });
});
