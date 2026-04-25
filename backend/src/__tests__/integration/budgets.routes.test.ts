import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';
import { createAuthenticatedUser } from '../helpers/auth';
import { createTestAccount, createTestTransaction } from '../factories';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

describe('Budget Routes', () => {
  let headers: { Authorization: string };
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser();
    headers = auth.headers;
    userId = auth.user._id.toString();
    const acct = await createTestAccount(userId, { name: 'Main', balance: 100000 });
    accountId = acct._id.toString();
  });

  describe('POST /api/v1/budgets', () => {
    it('201 — creates budget', async () => {
      const res = await request(app).post('/api/v1/budgets').set(headers).send({
        name: 'Food Budget', category: 'Food', period: 'monthly', amount: 50000, currency: 'USD', startDate: new Date().toISOString(),
      });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Food Budget');
    });

    it('409 — duplicate active budget', async () => {
      const input = { name: 'Food', category: 'Food', period: 'monthly', amount: 50000, currency: 'USD', startDate: new Date().toISOString() };
      await request(app).post('/api/v1/budgets').set(headers).send(input);
      const res = await request(app).post('/api/v1/budgets').set(headers).send({ ...input, name: 'Food2' });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/budgets', () => {
    it('200 — returns budgets with currentSpend calculated', async () => {
      await request(app).post('/api/v1/budgets').set(headers).send({
        name: 'Food Budget', category: 'Food', period: 'monthly', amount: 50000, currency: 'USD',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      });
      await createTestTransaction(userId, accountId, { type: 'expense', category: 'Food', amount: 12000, date: new Date() });
      const res = await request(app).get('/api/v1/budgets').set(headers);
      expect(res.status).toBe(200);
      expect(res.body.data[0].currentSpend).toBe(12000);
      expect(res.body.data[0].percentUsed).toBe(24);
    });
  });

  describe('DELETE /api/v1/budgets/:budgetId', () => {
    it('200 — soft deletes', async () => {
      const create = await request(app).post('/api/v1/budgets').set(headers).send({
        name: 'Del', category: 'Transport', period: 'monthly', amount: 5000, currency: 'USD', startDate: new Date().toISOString(),
      });
      const res = await request(app).delete(`/api/v1/budgets/${create.body.data._id}`).set(headers);
      expect(res.status).toBe(200);
    });
  });
});
