import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';
import { createAuthenticatedUser } from '../helpers/auth';
import { createTestAccount, createTestTransaction } from '../factories';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

// Analytics schema caps range at 366 days — use tight 90-day window
const START = '2024-01-01';
const END   = '2024-03-31';

describe('Analytics Routes', () => {
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

  describe('GET /api/v1/analytics/cash-flow', () => {
    it('200 — returns periods with income/expenses/net', async () => {
      await createTestTransaction(userId, accountId, {
        type: 'income', category: 'Salary', amount: 50000,
        date: new Date('2024-02-15'),
      });
      await createTestTransaction(userId, accountId, {
        type: 'expense', category: 'Food', amount: 20000,
        date: new Date('2024-02-20'),
      });
      const res = await request(app)
        .get(`/api/v1/analytics/cash-flow?startDate=${START}&endDate=${END}&groupBy=month`)
        .set(headers);
      expect(res.status).toBe(200);
      expect(res.body.data.totals.income).toBe(50000);
      expect(res.body.data.totals.expenses).toBe(20000);
      expect(res.body.data.totals.net).toBe(30000);
    });

    it('401 — unauthenticated', async () => {
      const res = await request(app).get(`/api/v1/analytics/cash-flow?startDate=${START}&endDate=${END}`);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/analytics/category-breakdown', () => {
    it('200 — returns expense categories with percentages', async () => {
      await createTestTransaction(userId, accountId, {
        type: 'expense', category: 'Food', amount: 6000,
        date: new Date('2024-02-10'),
      });
      await createTestTransaction(userId, accountId, {
        type: 'expense', category: 'Transport', amount: 4000,
        date: new Date('2024-02-11'),
      });
      const res = await request(app)
        .get(`/api/v1/analytics/category-breakdown?startDate=${START}&endDate=${END}`)
        .set(headers);
      expect(res.status).toBe(200);
      expect(res.body.data.expenses).toHaveLength(2);
      const food = res.body.data.expenses.find((e: any) => e.category === 'Food');
      expect(food.percentage).toBe(60);
    });

    it('200 — returns empty when no transactions', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/category-breakdown?startDate=${START}&endDate=${END}`)
        .set(headers);
      expect(res.status).toBe(200);
      expect(res.body.data.expenses).toHaveLength(0);
    });
  });
});
