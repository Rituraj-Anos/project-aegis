import { Types, ClientSession } from 'mongoose';
import { AccountModel, IAccount } from './account.model.js';
import { ConflictError, NotFoundError } from '../../utils/appError.js';
import { withCache, cacheDel, cacheKeys } from '../../utils/cache.js';
import type { CreateAccountInput, UpdateAccountInput } from './account.schema.js';

export async function createAccount(userId: string, input: CreateAccountInput): Promise<IAccount> {
  const duplicate = await AccountModel.findOne({
    userId: new Types.ObjectId(userId),
    name: { $regex: new RegExp(`^${input.name}$`, 'i') },
    isDeleted: false,
  });
  if (duplicate) throw new ConflictError('Account name already exists');

  const account = await AccountModel.create({ ...input, userId: new Types.ObjectId(userId) });
  await cacheDel(cacheKeys.accounts(userId));
  return account;
}

export async function getAccounts(userId: string, includeArchived = false): Promise<IAccount[]> {
  return withCache(cacheKeys.accounts(userId), 300, async () => {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    };
    if (!includeArchived) filter['isArchived'] = false;
    return AccountModel.find(filter).sort({ createdAt: 1 });
  });
}

export async function getAccountById(accountId: string, userId: string): Promise<IAccount> {
  const account = await AccountModel.findOne({ _id: new Types.ObjectId(accountId), isDeleted: false });
  if (!account) throw new NotFoundError('Account not found');

  if (account.userId.toString() !== userId) throw new NotFoundError('Account not found');

  return account;
}

export async function updateAccount(
  accountId: string,
  userId: string,
  input: UpdateAccountInput,
): Promise<IAccount> {
  const account = await getAccountById(accountId, userId);

  if (input.name && input.name !== account.name) {
    const duplicate = await AccountModel.findOne({
      userId: new Types.ObjectId(userId),
      name: { $regex: new RegExp(`^${input.name}$`, 'i') },
      isDeleted: false,
      _id: { $ne: account._id },
    });
    if (duplicate) throw new ConflictError('Account name already exists');
  }

  Object.assign(account, input);
  const saved = await account.save();
  await cacheDel(cacheKeys.accounts(userId));
  return saved;
}

export async function deleteAccount(accountId: string, userId: string): Promise<void> {
  const account = await getAccountById(accountId, userId);
  account.isDeleted = true;
  account.deletedAt = new Date();
  await account.save();
  await cacheDel(cacheKeys.accounts(userId));
}

export async function adjustBalance(
  accountId: string,
  amount: number,
  session?: ClientSession,
): Promise<void> {
  const result = await AccountModel.findOneAndUpdate(
    { _id: new Types.ObjectId(accountId), isDeleted: false },
    { $inc: { balance: amount } },
    { session },
  );
  if (!result) throw new NotFoundError('Account not found');
}
