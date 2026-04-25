import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';
import { createTestUser, createTestAccount } from '../factories';
import * as accountService from '../../modules/accounts/account.service';
import { ConflictError, NotFoundError } from '../../utils/appError';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

describe('AccountService', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user._id.toString();
  });

  describe('createAccount', () => {
    it('creates account when name is unique for user', async () => {
      const account = await accountService.createAccount(userId, {
        name: 'Checking', type: 'checking', balance: 50000, currency: 'USD',
      });
      expect(account.name).toBe('Checking');
      expect(account.userId.toString()).toBe(userId);
    });

    it('throws ConflictError when account name already exists', async () => {
      await accountService.createAccount(userId, { name: 'Dup', type: 'checking', balance: 0, currency: 'USD' });
      await expect(
        accountService.createAccount(userId, { name: 'Dup', type: 'savings', balance: 0, currency: 'USD' }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getAccounts', () => {
    it('returns only non-deleted, non-archived accounts by default', async () => {
      await createTestAccount(userId, { name: 'A1', isArchived: false });
      await createTestAccount(userId, { name: 'A2', isArchived: true });
      await createTestAccount(userId, { name: 'A3', isDeleted: true });
      const accounts = await accountService.getAccounts(userId);
      expect(accounts).toHaveLength(1);
      expect(accounts[0]!.name).toBe('A1');
    });

    it('includes archived accounts when includeArchived=true', async () => {
      await createTestAccount(userId, { name: 'A1' });
      await createTestAccount(userId, { name: 'A2', isArchived: true });
      const accounts = await accountService.getAccounts(userId, true);
      expect(accounts).toHaveLength(2);
    });
  });

  describe('getAccountById', () => {
    it('returns account when user is owner', async () => {
      const created = await createTestAccount(userId, { name: 'Mine' });
      const found = await accountService.getAccountById(created._id.toString(), userId);
      expect(found.name).toBe('Mine');
    });

    it('throws NotFoundError for non-existent account', async () => {
      await expect(accountService.getAccountById('000000000000000000000000', userId))
        .rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError for wrong owner', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const account = await createTestAccount(userId, { name: 'Private' });
      await expect(accountService.getAccountById(account._id.toString(), otherUser._id.toString()))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('adjustBalance', () => {
    it('increments balance with positive amount', async () => {
      const account = await createTestAccount(userId, { name: 'Adj', balance: 10000 });
      await accountService.adjustBalance(account._id.toString(), 5000);
      const updated = await accountService.getAccountById(account._id.toString(), userId);
      expect(updated.balance).toBe(15000);
    });

    it('decrements balance with negative amount', async () => {
      const account = await createTestAccount(userId, { name: 'Adj2', balance: 10000 });
      await accountService.adjustBalance(account._id.toString(), -3000);
      const updated = await accountService.getAccountById(account._id.toString(), userId);
      expect(updated.balance).toBe(7000);
    });
  });
});
