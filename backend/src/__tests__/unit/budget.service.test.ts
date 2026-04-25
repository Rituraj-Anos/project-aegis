import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';
import { createTestUser, createTestAccount, createTestTransaction } from '../factories';
import * as budgetService from '../../modules/budgets/budget.service';
import { ConflictError } from '../../utils/appError';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

describe('BudgetService', () => {
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user._id.toString();
    const account = await createTestAccount(userId, { name: 'Main', balance: 100000 });
    accountId = account._id.toString();
  });

  describe('createBudget', () => {
    it('creates budget when no conflict exists', async () => {
      const budget = await budgetService.createBudget(userId, {
        name: 'Food Budget', category: 'Food', period: 'monthly', amount: 50000,
        currency: 'USD', startDate: new Date(),
      });
      expect(budget.name).toBe('Food Budget');
      expect(budget.category).toBe('Food');
    });

    it('throws ConflictError for duplicate active category+period', async () => {
      const input = { name: 'Food', category: 'Food', period: 'monthly' as const, amount: 50000, currency: 'USD', startDate: new Date() };
      await budgetService.createBudget(userId, input);
      await expect(budgetService.createBudget(userId, { ...input, name: 'Food2' }))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('getBudgets', () => {
    it('computes currentSpend and percentUsed correctly', async () => {
      await budgetService.createBudget(userId, {
        name: 'Food Budget', category: 'Food', period: 'monthly', amount: 10000,
        currency: 'USD', startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      });
      // Create expense in current month
      await createTestTransaction(userId, accountId, { type: 'expense', category: 'Food', amount: 7500, date: new Date() });

      const budgets = await budgetService.getBudgets(userId);
      expect(budgets).toHaveLength(1);
      expect(budgets[0]!.currentSpend).toBe(7500);
      expect(budgets[0]!.percentUsed).toBe(75);
      expect(budgets[0]!.remaining).toBe(2500);
    });

    it('caps percentUsed at 100 when over budget', async () => {
      await budgetService.createBudget(userId, {
        name: 'Tight Budget', category: 'Food', period: 'monthly', amount: 10000,
        currency: 'USD', startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      });
      await createTestTransaction(userId, accountId, { type: 'expense', category: 'Food', amount: 15000, date: new Date() });

      const budgets = await budgetService.getBudgets(userId);
      expect(budgets[0]!.percentUsed).toBe(100);
    });

    it('returns percentUsed=0 when no spending', async () => {
      await budgetService.createBudget(userId, {
        name: 'Empty Budget', category: 'Shopping', period: 'monthly', amount: 20000,
        currency: 'USD', startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      });
      const budgets = await budgetService.getBudgets(userId);
      expect(budgets[0]!.currentSpend).toBe(0);
      expect(budgets[0]!.percentUsed).toBe(0);
    });
  });

  describe('deleteBudget', () => {
    it('soft-deletes budget', async () => {
      const budget = await budgetService.createBudget(userId, {
        name: 'Delete Me', category: 'Transport', period: 'monthly', amount: 5000,
        currency: 'USD', startDate: new Date(),
      });
      await budgetService.deleteBudget(budget._id.toString(), userId);
      const all = await budgetService.getBudgets(userId);
      expect(all.find((b) => b._id?.toString() === budget._id.toString())).toBeUndefined();
    });
  });
});
