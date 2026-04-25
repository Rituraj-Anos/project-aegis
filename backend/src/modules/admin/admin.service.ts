import { Types } from 'mongoose';
import { UserModel } from '../users/user.model.js';
import { AccountModel } from '../accounts/account.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { BadRequestError, NotFoundError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import { withCache, cacheKeys } from '../../utils/cache.js';
import type { ListUsersQuery, UpdateUserRoleInput } from './admin.schema.js';

// ── Types ────────────────────────────────────────────────

export interface SafeAdminUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  coachState: 0 | 1 | 2;
  isDeleted: boolean;
  createdAt: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  hasGoogle: boolean;
}

export interface AdminUserDetails extends SafeAdminUser {
  accountCount: number;
  transactionCount: number;
  totalNetWorth: number;
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  totalAccounts: number;
  totalTransactions: number;
  newUsersLast30Days: number;
}

// ── Service ──────────────────────────────────────────────

function toSafeAdmin(u: any): SafeAdminUser {
  return {
    id: u._id.toString(), email: u.email, name: u.name,
    role: u.role, coachState: u.coachState ?? 0,
    isDeleted: u.isDeleted ?? false, createdAt: u.createdAt,
    failedLoginAttempts: u.failedLoginAttempts ?? 0,
    lockedUntil: u.lockedUntil, hasGoogle: !!u.googleId,
  };
}

export async function listUsers(query: ListUsersQuery) {
  const filter: Record<string, unknown> = { isDeleted: query.isDeleted };
  if (query.role) filter['role'] = query.role;
  if (query.search) {
    filter['$or'] = [
      { email: { $regex: query.search, $options: 'i' } },
      { name:  { $regex: query.search, $options: 'i' } },
    ];
  }

  const sortDir = query.sortOrder === 'asc' ? 1 : -1;
  const skip = (query.page - 1) * query.limit;

  const [total, users] = await Promise.all([
    UserModel.countDocuments(filter),
    UserModel.find(filter)
      .select('-passwordHash -refreshTokens')
      .sort({ [query.sortBy]: sortDir })
      .skip(skip).limit(query.limit).lean(),
  ]);

  return {
    data: users.map(toSafeAdmin),
    total, page: query.page,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getUserDetails(targetUserId: string): Promise<AdminUserDetails> {
  const uid = new Types.ObjectId(targetUserId);

  const [user, accountCount, txCount, netWorthAgg] = await Promise.all([
    UserModel.findById(uid).select('-passwordHash -refreshTokens').lean(),
    AccountModel.countDocuments({ userId: uid, isDeleted: false }),
    TransactionModel.countDocuments({ userId: uid, isDeleted: false }),
    AccountModel.aggregate([
      { $match: { userId: uid, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),
  ]);

  if (!user) throw new NotFoundError('User not found');

  return {
    ...toSafeAdmin(user),
    accountCount, transactionCount: txCount,
    totalNetWorth: (netWorthAgg[0] as any)?.total ?? 0,
  };
}

export async function updateUserRole(targetUserId: string, input: UpdateUserRoleInput): Promise<void> {
  const user = await UserModel.findById(targetUserId);
  if (!user) throw new NotFoundError('User not found');
  user.role = input.role;
  await user.save();
  logger.info({ action: 'admin_role_change', targetUserId, newRole: input.role });
}

export async function softDeleteUser(targetUserId: string, requestingAdminId: string): Promise<void> {
  if (targetUserId === requestingAdminId) {
    throw new BadRequestError('Cannot delete your own account');
  }
  const user = await UserModel.findById(targetUserId);
  if (!user) throw new NotFoundError('User not found');
  user.isDeleted = true;
  user.deletedAt = new Date();
  await user.save();
  logger.warn({ action: 'admin_user_deleted', targetUserId, requestingAdminId });
}

export async function unlockUser(targetUserId: string): Promise<void> {
  const user = await UserModel.findById(targetUserId);
  if (!user) throw new NotFoundError('User not found');
  await user.resetFailedLogins();
}

export async function getPlatformStats(): Promise<PlatformStats> {
  return withCache(cacheKeys.platformStats(), 60, async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

    const [totalUsers, activeUsers, adminCount, totalAccounts, totalTransactions, newUsersLast30Days] =
      await Promise.all([
        UserModel.countDocuments(),
        UserModel.countDocuments({ isDeleted: false }),
        UserModel.countDocuments({ role: 'admin', isDeleted: false }),
        AccountModel.countDocuments({ isDeleted: false }),
        TransactionModel.countDocuments({ isDeleted: false }),
        UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, isDeleted: false }),
      ]);

    return { totalUsers, activeUsers, adminCount, totalAccounts, totalTransactions, newUsersLast30Days };
  });
}
