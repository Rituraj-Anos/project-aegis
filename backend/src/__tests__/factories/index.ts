import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { UserModel } from '../../modules/users/user.model';
import { AccountModel } from '../../modules/accounts/account.model';
import { TransactionModel } from '../../modules/transactions/transaction.model';
import { BudgetModel } from '../../modules/budgets/budget.model';
import type { IUser } from '../../modules/users/user.model';
import type { IAccount } from '../../modules/accounts/account.model';
import type { ITransaction } from '../../modules/transactions/transaction.model';
import type { IBudget } from '../../modules/budgets/budget.model';

export function userFactory(overrides: Partial<IUser> = {}): Record<string, unknown> {
  return {
    email:               faker.internet.email().toLowerCase(),
    name:                faker.person.fullName(),
    passwordHash:        '$2b$12$LJ3m4ys3GZxkF0N1URd0QOqKMQOaGnMnGTMBMzLDOnj/lXNHqMIVu', // "Password1"
    role:                'user',
    coachState:          0,
    failedLoginAttempts: 0,
    refreshTokens:       [],
    isDeleted:           false,
    ...overrides,
  };
}

export function accountFactory(userId: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId:     new mongoose.Types.ObjectId(userId),
    name:       faker.finance.accountName(),
    type:       faker.helpers.arrayElement(['checking', 'savings', 'credit_card', 'cash']),
    currency:   'USD',
    balance:    faker.number.int({ min: 0, max: 1_000_000 }),
    isArchived: false,
    isDeleted:  false,
    ...overrides,
  };
}

export function transactionFactory(userId: string, accountId: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId:      new mongoose.Types.ObjectId(userId),
    accountId:   new mongoose.Types.ObjectId(accountId),
    type:        faker.helpers.arrayElement(['income', 'expense']),
    amount:      faker.number.int({ min: 100, max: 100_000 }),
    currency:    'USD',
    category:    faker.helpers.arrayElement(['Food', 'Transport', 'Shopping', 'Salary']),
    date:        faker.date.recent({ days: 30 }),
    description: faker.finance.transactionDescription(),
    tags:        [],
    isRecurring: false,
    isDeleted:   false,
    ...overrides,
  };
}

export function budgetFactory(userId: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId:    new mongoose.Types.ObjectId(userId),
    name:      faker.word.words(2) + ' Budget',
    category:  faker.helpers.arrayElement(['Food', 'Transport', 'Shopping']),
    period:    'monthly',
    amount:    faker.number.int({ min: 10_000, max: 500_000 }),
    currency:  'USD',
    startDate: new Date(),
    isActive:  true,
    isDeleted: false,
    ...overrides,
  };
}

// ── DB-saving helpers ────────────────────────────────────

export async function createTestUser(overrides: Partial<IUser> = {}): Promise<IUser> {
  return UserModel.create(userFactory(overrides));
}

export async function createTestAccount(userId: string, overrides: Record<string, unknown> = {}): Promise<IAccount> {
  return AccountModel.create(accountFactory(userId, overrides));
}

export async function createTestTransaction(userId: string, accountId: string, overrides: Record<string, unknown> = {}): Promise<ITransaction> {
  return TransactionModel.create(transactionFactory(userId, accountId, overrides));
}

export async function createTestBudget(userId: string, overrides: Record<string, unknown> = {}): Promise<IBudget> {
  return BudgetModel.create(budgetFactory(userId, overrides));
}
