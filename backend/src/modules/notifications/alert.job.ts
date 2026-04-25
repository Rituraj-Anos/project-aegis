import cron from 'node-cron';
import { Types } from 'mongoose';
import { UserModel } from '../users/user.model.js';
import { AccountModel } from '../accounts/account.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { getBudgets } from '../budgets/budget.service.js';
import { createNotification } from './notification.service.js';
import { NotificationModel } from './notification.model.js';
import { logger } from '../../utils/logger.js';

// ── Helpers ──────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3_600_000);
}

// ── JOB 1: Budget Alerts (every hour) ────────────────────

async function budgetAlertJob() {
  const start = Date.now();
  logger.info('⏱  Budget alert job started');

  const users = await UserModel.find({ isDeleted: false }).select('_id').lean();

  const results = await Promise.allSettled(
    (users as any[]).map(async (u) => {
      const userId = u._id.toString();
      const budgets = await getBudgets(userId);
      const today = startOfToday();

      for (const budget of budgets) {
        if (budget.percentUsed > 100) {
          const exists = await NotificationModel.findOne({
            userId: u._id, type: 'budget_exceeded',
            'data.budgetId': budget._id.toString(),
            createdAt: { $gte: today },
          });
          if (!exists) {
            await createNotification({
              userId, type: 'budget_exceeded',
              title: `Budget Exceeded: ${budget.name}`,
              body: `You've spent ${budget.percentUsed}% of your "${budget.category}" budget.`,
              data: { budgetId: budget._id.toString() },
            });
          }
        } else if (budget.percentUsed > 80) {
          const exists = await NotificationModel.findOne({
            userId: u._id, type: 'budget_warning',
            'data.budgetId': budget._id.toString(),
            createdAt: { $gte: today },
          });
          if (!exists) {
            await createNotification({
              userId, type: 'budget_warning',
              title: `Budget Warning: ${budget.name}`,
              body: `You've used ${budget.percentUsed}% of your "${budget.category}" budget.`,
              data: { budgetId: budget._id.toString() },
            });
          }
        }
      }
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed) logger.error(`Budget alert job: ${failed}/${users.length} users failed`);
  logger.info(`⏱  Budget alert job finished in ${Date.now() - start}ms`);
}

// ── JOB 2: Low Balance Alerts (every 6 hours) ───────────

async function lowBalanceJob() {
  const start = Date.now();
  logger.info('⏱  Low balance job started');

  const accounts = await AccountModel.find({ isDeleted: false }).lean() as any[];

  const results = await Promise.allSettled(
    accounts.map(async (acct) => {
      const user = await UserModel.findById(acct.userId).select('lowBalanceThreshold').lean() as any;
      const threshold = user?.lowBalanceThreshold ?? 10000;

      if (acct.balance < threshold) {
        const recent = await NotificationModel.findOne({
          userId: acct.userId, type: 'low_balance',
          'data.accountId': acct._id.toString(),
          createdAt: { $gte: hoursAgo(24) },
        });
        if (!recent) {
          await createNotification({
            userId: acct.userId.toString(), type: 'low_balance',
            title: `Low Balance: ${acct.name}`,
            body: `Your "${acct.name}" account balance is ${(acct.balance / 100).toFixed(2)} ${acct.currency}.`,
            data: { accountId: acct._id.toString() },
          });
        }
      }
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed) logger.error(`Low balance job: ${failed}/${accounts.length} accounts failed`);
  logger.info(`⏱  Low balance job finished in ${Date.now() - start}ms`);
}

// ── JOB 3: Weekly Summary (every Monday 8 AM) ───────────

async function weeklySummaryJob() {
  const start = Date.now();
  logger.info('⏱  Weekly summary job started');

  const users = await UserModel.find({ isDeleted: false }).select('_id').lean();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

  const results = await Promise.allSettled(
    (users as any[]).map(async (u) => {
      const uid = new Types.ObjectId(u._id);

      const agg = await TransactionModel.aggregate([
        { $match: { userId: uid, isDeleted: false, date: { $gte: sevenDaysAgo }, type: { $in: ['income', 'expense'] } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]);

      const topCategory = await TransactionModel.aggregate([
        { $match: { userId: uid, isDeleted: false, date: { $gte: sevenDaysAgo }, type: 'expense' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]);

      const income   = (agg.find((r: any) => r._id === 'income')?.total ?? 0) / 100;
      const expenses = (agg.find((r: any) => r._id === 'expense')?.total ?? 0) / 100;
      const topCat   = (topCategory[0] as any)?._id ?? 'N/A';

      await createNotification({
        userId: u._id.toString(), type: 'weekly_summary',
        title: 'Your Weekly Summary',
        body: `Income: $${income.toFixed(2)} | Expenses: $${expenses.toFixed(2)} | Top category: ${topCat}`,
      });
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed) logger.error(`Weekly summary job: ${failed}/${users.length} users failed`);
  logger.info(`⏱  Weekly summary job finished in ${Date.now() - start}ms`);
}

// ── Start all jobs ───────────────────────────────────────

export function startAlertJobs(): void {
  cron.schedule('0 * * * *',   () => { budgetAlertJob().catch((e) => logger.error('Budget alert job crash', e)); });
  cron.schedule('0 */6 * * *', () => { lowBalanceJob().catch((e) => logger.error('Low balance job crash', e)); });
  cron.schedule('0 8 * * 1',   () => { weeklySummaryJob().catch((e) => logger.error('Weekly summary job crash', e)); });

  logger.info('🕐  Alert cron jobs registered');
}
