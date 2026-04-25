import { Types } from 'mongoose';
import { TransactionModel } from '../transactions/transaction.model.js';
import { AccountModel } from '../accounts/account.model.js';
import { withCache, cacheKeys } from '../../utils/cache.js';
import { hashQuery } from '../../utils/queryHash.js';
import type { AnalyticsQuery } from './analytics.schema.js';

// ── Result types ─────────────────────────────────────────

export interface CashFlowPeriod { label: string; income: number; expenses: number; net: number }
export interface CashFlowResult {
  periods: CashFlowPeriod[];
  totals: { income: number; expenses: number; net: number };
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
}

export interface CategoryItem { category: string; amount: number; percentage: number; count: number }
export interface CategoryBreakdownResult { expenses: CategoryItem[]; income: CategoryItem[] }

export interface NetWorthPoint { date: string; netWorth: number }

export interface SavingsRatePeriod { label: string; income: number; expenses: number; savingsRate: number }
export interface SavingsRateResult { periods: SavingsRatePeriod[]; overall: number }

// ── Helpers ──────────────────────────────────────────────

function buildBaseMatch(userId: string, query: AnalyticsQuery) {
  const match: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    isDeleted: false,
    type: { $in: ['income', 'expense'] },
    date: { $gte: query.startDate, $lte: query.endDate },
  };
  if (query.accountId) match['accountId'] = new Types.ObjectId(query.accountId);
  return match;
}

function getGroupId(groupBy: string) {
  switch (groupBy) {
    case 'day':
      return { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } };
    case 'week':
      return { year: { $isoWeekYear: '$date' }, week: { $isoWeek: '$date' } };
    default: // month
      return { year: { $year: '$date' }, month: { $month: '$date' } };
  }
}

function formatLabel(groupBy: string, bucket: any): string {
  const y = bucket._id.year;
  if (groupBy === 'day') {
    const m = String(bucket._id.month).padStart(2, '0');
    const d = String(bucket._id.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (groupBy === 'week') {
    return `${y}-W${String(bucket._id.week).padStart(2, '0')}`;
  }
  return `${y}-${String(bucket._id.month).padStart(2, '0')}`;
}

// ── Service functions ────────────────────────────────────

export async function getCashFlow(userId: string, query: AnalyticsQuery): Promise<CashFlowResult> {
  return withCache(cacheKeys.analytics(userId, hashQuery({ fn: 'cf', ...query })), 300, async () => {
    const match = buildBaseMatch(userId, query);
    const groupId = getGroupId(query.groupBy);

    const buckets = await TransactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupId,
          income:   { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } },
    ]);

    const periods: CashFlowPeriod[] = buckets.map((b) => ({
      label: formatLabel(query.groupBy, b),
      income: b.income,
      expenses: b.expenses,
      net: b.income - b.expenses,
    }));

    const totals = periods.reduce(
      (acc, p) => ({ income: acc.income + p.income, expenses: acc.expenses + p.expenses, net: acc.net + p.net }),
      { income: 0, expenses: 0, net: 0 },
    );

    const count = periods.length || 1;
    return {
      periods,
      totals,
      avgMonthlyIncome:   Math.round(totals.income / count),
      avgMonthlyExpenses: Math.round(totals.expenses / count),
    };
  });
}

export async function getCategoryBreakdown(userId: string, query: AnalyticsQuery): Promise<CategoryBreakdownResult> {
  return withCache(cacheKeys.analytics(userId, hashQuery({ fn: 'cb', ...query })), 300, async () => {
    const match = buildBaseMatch(userId, query);

    const raw = await TransactionModel.aggregate([
      { $match: match },
      { $group: { _id: { type: '$type', category: '$category' }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]);

    const expenseItems = raw.filter((r) => r._id.type === 'expense');
    const incomeItems  = raw.filter((r) => r._id.type === 'income');

    const expTotal = expenseItems.reduce((s, r) => s + r.amount, 0) || 1;
    const incTotal = incomeItems.reduce((s, r) => s + r.amount, 0) || 1;

    return {
      expenses: expenseItems.map((r) => ({
        category: r._id.category, amount: r.amount,
        percentage: Math.round((r.amount / expTotal) * 10000) / 100, count: r.count,
      })),
      income: incomeItems.map((r) => ({
        category: r._id.category, amount: r.amount,
        percentage: Math.round((r.amount / incTotal) * 10000) / 100, count: r.count,
      })),
    };
  });
}

export async function getNetWorthHistory(userId: string, query: AnalyticsQuery): Promise<NetWorthPoint[]> {
  const uid = new Types.ObjectId(userId);

  // Current net worth
  const accounts = await AccountModel.find({ userId: uid, isDeleted: false, isArchived: false }).lean();
  let currentNetWorth = (accounts as any[]).reduce((s, a) => s + a.balance, 0);

  // All transactions in range sorted descending (newest first for backward walk)
  const txs = await TransactionModel.find({
    userId: uid, isDeleted: false,
    date: { $gte: query.startDate, $lte: query.endDate },
  }).sort({ date: -1 }).lean();

  // Build period boundaries
  const periods: Date[] = [];
  const d = new Date(query.endDate);
  while (d >= query.startDate) {
    periods.push(new Date(d));
    if (query.groupBy === 'day') d.setDate(d.getDate() - 1);
    else if (query.groupBy === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
  }

  // Walk backwards
  let txIdx = 0;
  const points: NetWorthPoint[] = [];

  for (const periodEnd of periods) {
    // Subtract transactions that happened after this period
    while (txIdx < txs.length && new Date((txs[txIdx] as any).date) > periodEnd) {
      const tx = txs[txIdx] as any;
      if (tx.type === 'income') currentNetWorth -= tx.amount;
      else if (tx.type === 'expense') currentNetWorth += tx.amount;
      else if (tx.type === 'transfer') {
        // Transfers don't change net worth (internal)
      }
      txIdx++;
    }

    const label = query.groupBy === 'day'
      ? periodEnd.toISOString().slice(0, 10)
      : query.groupBy === 'week'
        ? `${periodEnd.getFullYear()}-W${String(Math.ceil(((periodEnd.getTime() - new Date(periodEnd.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)).padStart(2, '0')}`
        : `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, '0')}`;

    points.push({ date: label, netWorth: currentNetWorth });
  }

  return points.reverse();
}

export async function getSavingsRate(userId: string, query: AnalyticsQuery): Promise<SavingsRateResult> {
  const cashFlow = await getCashFlow(userId, query);

  const periods: SavingsRatePeriod[] = cashFlow.periods.map((p) => ({
    label: p.label,
    income: p.income,
    expenses: p.expenses,
    savingsRate: p.income === 0 ? 0 : Math.max(-100, Math.min(100, Math.round(((p.income - p.expenses) / p.income) * 100))),
  }));

  const overall = cashFlow.totals.income === 0
    ? 0
    : Math.max(-100, Math.min(100, Math.round(((cashFlow.totals.income - cashFlow.totals.expenses) / cashFlow.totals.income) * 100)));

  return { periods, overall };
}
