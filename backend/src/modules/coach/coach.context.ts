import { Types } from 'mongoose';
import { AccountModel } from '../accounts/account.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { UserModel } from '../users/user.model.js';
import { getBudgets, BudgetWithSpend } from '../budgets/budget.service.js';

export interface CoachContext {
  accounts:    { name: string; type: string; balance: number; currency: string }[];
  recentTx:    { date: Date; type: string; amount: number; category: string; description?: string }[];
  budgets:     BudgetWithSpend[];
  netWorth:    number;
  monthSpend:  number;
  monthIncome: number;
  coachState:  0 | 1 | 2;
}

export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const uid = new Types.ObjectId(userId);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [accounts, recentTx, budgets, monthAgg, user] = await Promise.all([
    AccountModel.find({ userId: uid, isDeleted: false, isArchived: false }).lean(),
    TransactionModel.find({ userId: uid, isDeleted: false })
      .sort({ date: -1 }).limit(30).lean(),
    getBudgets(userId),
    TransactionModel.aggregate([
      { $match: { userId: uid, isDeleted: false, type: { $in: ['expense','income'] }, date: { $gte: startOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    UserModel.findById(uid).select('coachState').lean(),
  ]);

  const monthSpend  = monthAgg.find((r: any) => r._id === 'expense')?.total ?? 0;
  const monthIncome = monthAgg.find((r: any) => r._id === 'income')?.total ?? 0;
  const netWorth    = (accounts as any[]).reduce((sum, a) => sum + a.balance, 0);

  return {
    accounts:    (accounts as any[]).map(({ name, type, balance, currency }) => ({ name, type, balance, currency })),
    recentTx:    (recentTx as any[]).map(({ date, type, amount, category, description }) => ({ date, type, amount, category, description })),
    budgets,
    netWorth,
    monthSpend,
    monthIncome,
    coachState:  (user as any)?.coachState ?? 0,
  };
}
