import { Types } from 'mongoose';
import { BudgetModel, IBudget } from './budget.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { ConflictError, NotFoundError } from '../../utils/appError.js';
import { withCache, cacheDel, cacheKeys } from '../../utils/cache.js';
import type { CreateBudgetInput, UpdateBudgetInput } from './budget.schema.js';

export interface BudgetWithSpend extends Omit<IBudget, keyof Document> {
  _id: Types.ObjectId;
  currentSpend: number;
  remaining: number;
  percentUsed: number;
}

function getCurrentPeriodStart(period: 'weekly' | 'monthly' | 'yearly'): Date {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getDay(); // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day); // Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  // yearly
  return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
}

async function getSpendForBudget(userId: string, budget: IBudget): Promise<number> {
  const periodStart = getCurrentPeriodStart(budget.period);
  const result = await TransactionModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        category: { $regex: new RegExp(`^${budget.category}$`, 'i') },
        type: 'expense',
        date: { $gte: periodStart },
        isDeleted: false,
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total ?? 0;
}

export async function createBudget(userId: string, input: CreateBudgetInput): Promise<IBudget> {
  const existing = await BudgetModel.findOne({
    userId: new Types.ObjectId(userId),
    category: { $regex: new RegExp(`^${input.category}$`, 'i') },
    period: input.period,
    isActive: true,
    isDeleted: false,
  });
  if (existing) throw new ConflictError('Active budget already exists for this category and period');

  const budget = await BudgetModel.create({ ...input, userId: new Types.ObjectId(userId) });
  await cacheDel(cacheKeys.budgets(userId));
  return budget;
}

export async function getBudgets(userId: string): Promise<BudgetWithSpend[]> {
  return withCache(cacheKeys.budgets(userId), 180, async () => {
    const budgets = await BudgetModel.find({
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    }).lean();

    const spends = await Promise.all(budgets.map((b) => getSpendForBudget(userId, b as unknown as IBudget)));

    return budgets.map((b, i) => {
      const currentSpend = spends[i] ?? 0;
      const remaining    = Math.max(0, (b as any).amount - currentSpend);
      const percentUsed  = Math.min(100, Math.round((currentSpend / (b as any).amount) * 100));
      return { ...(b as any), currentSpend, remaining, percentUsed };
    });
  });
}

export async function getBudgetById(budgetId: string, userId: string): Promise<IBudget> {
  const budget = await BudgetModel.findOne({ _id: new Types.ObjectId(budgetId), isDeleted: false });
  if (!budget) throw new NotFoundError('Budget not found');
  if (budget.userId.toString() !== userId) throw new NotFoundError('Budget not found');
  return budget;
}

export async function updateBudget(
  budgetId: string,
  userId: string,
  input: UpdateBudgetInput,
): Promise<IBudget> {
  const budget = await getBudgetById(budgetId, userId);

  const categoryChanged = input.category && input.category !== budget.category;
  const periodChanged   = input.period   && input.period   !== budget.period;

  if (categoryChanged || periodChanged) {
    const category = input.category ?? budget.category;
    const period   = input.period   ?? budget.period;
    const duplicate = await BudgetModel.findOne({
      userId: new Types.ObjectId(userId),
      category: { $regex: new RegExp(`^${category}$`, 'i') },
      period,
      isActive: true,
      isDeleted: false,
      _id: { $ne: budget._id },
    });
    if (duplicate) throw new ConflictError('Active budget already exists for this category and period');
  }

  Object.assign(budget, input);
  const saved = await budget.save();
  await cacheDel(cacheKeys.budgets(userId));
  return saved;
}

export async function deleteBudget(budgetId: string, userId: string): Promise<void> {
  const budget = await getBudgetById(budgetId, userId);
  budget.isDeleted = true;
  budget.deletedAt = new Date();
  await budget.save();
  await cacheDel(cacheKeys.budgets(userId));
}
