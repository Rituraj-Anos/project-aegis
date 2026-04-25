import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';
import { createTestUser, createTestAccount, createTestTransaction } from '../factories';
import * as txService from '../../modules/transactions/transaction.service';
import * as accountService from '../../modules/accounts/account.service';
import { NotFoundError, BadRequestError } from '../../utils/appError';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

const txDefaults = { tags: [] as string[], isRecurring: false, transferFee: 0 };

describe('TransactionService', () => {
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user._id.toString();
    const account = await createTestAccount(userId, { name: 'Main', balance: 50000 });
    accountId = account._id.toString();
  });

  describe('createTransaction', () => {
    it('creates income and credits account balance', async () => {
      const tx = await txService.createTransaction(userId, {
        accountId, type: 'income', amount: 10000, currency: 'USD', category: 'Salary', date: new Date(), ...txDefaults,
      });
      expect(tx.type).toBe('income');
      const acc = await accountService.getAccountById(accountId, userId);
      expect(acc.balance).toBe(60000);
    });

    it('creates expense and debits account balance', async () => {
      await txService.createTransaction(userId, {
        accountId, type: 'expense', amount: 10000, currency: 'USD', category: 'Food', date: new Date(), ...txDefaults,
      });
      const acc = await accountService.getAccountById(accountId, userId);
      expect(acc.balance).toBe(40000);
    });

    it('creates transfer and adjusts both accounts', async () => {
      const dest = await createTestAccount(userId, { name: 'Savings', balance: 0 });
      await txService.createTransaction(userId, {
        accountId, type: 'transfer', amount: 20000, currency: 'USD', category: 'Transfer',
        date: new Date(), transferToAccountId: dest._id.toString(), ...txDefaults, transferFee: 100,
      });
      const src = await accountService.getAccountById(accountId, userId);
      const dst = await accountService.getAccountById(dest._id.toString(), userId);
      expect(src.balance).toBe(29900);
      expect(dst.balance).toBe(20000);
    });

    it('throws NotFoundError for non-owned accountId', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const otherAcct = await createTestAccount(otherUser._id.toString(), { name: 'Other' });
      await expect(txService.createTransaction(userId, {
        accountId: otherAcct._id.toString(), type: 'income', amount: 100,
        currency: 'USD', category: 'Salary', date: new Date(), ...txDefaults,
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('listTransactions', () => {
    it('paginates results correctly', async () => {
      for (let i = 0; i < 25; i++) {
        await createTestTransaction(userId, accountId, { type: 'expense', category: 'Food', amount: 100 });
      }
      const result = await txService.listTransactions(userId, { page: 1, limit: 20, sortBy: 'date', sortOrder: 'desc' });
      expect(result.data).toHaveLength(20);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(2);
    });

    it('filters by type', async () => {
      await createTestTransaction(userId, accountId, { type: 'income', category: 'Salary', amount: 1000 });
      await createTestTransaction(userId, accountId, { type: 'expense', category: 'Food', amount: 500 });
      const result = await txService.listTransactions(userId, { page: 1, limit: 20, type: 'income', sortBy: 'date', sortOrder: 'desc' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.type).toBe('income');
    });
  });

  describe('deleteTransaction', () => {
    it('soft-deletes and reverses expense balance', async () => {
      const tx = await txService.createTransaction(userId, {
        accountId, type: 'expense', amount: 10000, currency: 'USD', category: 'Food', date: new Date(), ...txDefaults,
      });
      await txService.deleteTransaction(tx._id.toString(), userId);
      const acc = await accountService.getAccountById(accountId, userId);
      expect(acc.balance).toBe(50000);
    });

    it('soft-deletes and reverses income balance', async () => {
      const tx = await txService.createTransaction(userId, {
        accountId, type: 'income', amount: 5000, currency: 'USD', category: 'Salary', date: new Date(), ...txDefaults,
      });
      await txService.deleteTransaction(tx._id.toString(), userId);
      const acc = await accountService.getAccountById(accountId, userId);
      expect(acc.balance).toBe(50000);
    });
  });

  describe('updateTransaction', () => {
    it('updates category and description', async () => {
      const tx = await txService.createTransaction(userId, {
        accountId, type: 'expense', amount: 500, currency: 'USD', category: 'Food', date: new Date(), ...txDefaults,
      });
      const updated = await txService.updateTransaction(tx._id.toString(), userId, { category: 'Transport', description: 'Bus fare' });
      expect(updated.category).toBe('Transport');
      expect(updated.description).toBe('Bus fare');
    });

    it('rejects amount change', async () => {
      const tx = await txService.createTransaction(userId, {
        accountId, type: 'expense', amount: 500, currency: 'USD', category: 'Food', date: new Date(), ...txDefaults,
      });
      await expect(txService.updateTransaction(tx._id.toString(), userId, { amount: 999 } as any))
        .rejects.toThrow(BadRequestError);
    });
  });
});
