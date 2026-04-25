import mongoose, { Types } from 'mongoose';
import { TransactionModel, ITransaction } from './transaction.model.js';
import { AccountModel } from '../accounts/account.model.js';
import { adjustBalance } from '../accounts/account.service.js';
import { BadRequestError, NotFoundError } from '../../utils/appError.js';
import type { CreateTransactionInput, UpdateTransactionInput, ListTransactionsQuery } from './transaction.schema.js';

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<ITransaction> {
  // Verify account ownership
  const account = await AccountModel.findOne({
    _id: new Types.ObjectId(input.accountId),
    userId: new Types.ObjectId(userId),
    isDeleted: false,
  });
  if (!account) throw new NotFoundError('Account not found');

  // Verify transfer destination
  if (input.type === 'transfer' && input.transferToAccountId) {
    const dest = await AccountModel.findOne({
      _id: new Types.ObjectId(input.transferToAccountId),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });
    if (!dest) throw new NotFoundError('Destination account not found');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const [tx] = await TransactionModel.create(
      [{ ...input, userId: new Types.ObjectId(userId), accountId: new Types.ObjectId(input.accountId) }],
      { session },
    );

    const { amount: txAmount, type, transferFee = 0, transferToAccountId } = input;

    if (type === 'income') {
      await adjustBalance(input.accountId, txAmount, session);
    } else if (type === 'expense') {
      await adjustBalance(input.accountId, -txAmount, session);
    } else if (type === 'transfer' && transferToAccountId) {
      await adjustBalance(input.accountId, -(txAmount + transferFee), session);
      await adjustBalance(transferToAccountId, txAmount, session);
    }

    await session.commitTransaction();
    return tx!;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function listTransactions(
  userId: string,
  query: ListTransactionsQuery,
): Promise<{ data: ITransaction[]; total: number; page: number; totalPages: number }> {
  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    isDeleted: false,
  };

  if (query.accountId)  filter['accountId'] = new Types.ObjectId(query.accountId);
  if (query.type)       filter['type'] = query.type;
  if (query.category)   filter['category'] = { $regex: new RegExp(query.category, 'i') };
  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) dateFilter['$gte'] = query.startDate;
    if (query.endDate)   dateFilter['$lte'] = query.endDate;
    filter['date'] = dateFilter;
  }
  if (query.tags) {
    const tagList = query.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length) filter['tags'] = { $in: tagList };
  }

  const sortField = query.sortBy ?? 'date';
  const sortDir   = query.sortOrder === 'asc' ? 1 : -1;
  const skip      = (query.page - 1) * query.limit;

  const [total, data] = await Promise.all([
    TransactionModel.countDocuments(filter),
    TransactionModel.find(filter)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(query.limit)
      .lean(),
  ]);

  return {
    data: data as ITransaction[],
    total,
    page: query.page,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getTransactionById(txId: string, userId: string): Promise<ITransaction> {
  const tx = await TransactionModel.findOne({ _id: new Types.ObjectId(txId), isDeleted: false });
  if (!tx) throw new NotFoundError('Transaction not found');
  if (tx.userId.toString() !== userId) throw new NotFoundError('Transaction not found');
  return tx;
}

const UPDATABLE_FIELDS = ['category','subcategory','description','date','tags','notes','attachments','isRecurring'] as const;

export async function updateTransaction(
  txId: string,
  userId: string,
  input: UpdateTransactionInput,
): Promise<ITransaction> {
  if ('amount' in input || 'accountId' in input) {
    throw new BadRequestError('To change amount or account, delete and recreate the transaction');
  }

  const tx = await getTransactionById(txId, userId);

  for (const field of UPDATABLE_FIELDS) {
    if (field in input && input[field] !== undefined) {
      (tx as any)[field] = (input as any)[field];
    }
  }

  return tx.save();
}

export async function deleteTransaction(txId: string, userId: string): Promise<void> {
  const tx = await getTransactionById(txId, userId);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    tx.isDeleted = true;
    tx.deletedAt = new Date();
    await tx.save({ session });

    const { amount, type, transferFee = 0 } = tx;
    const accountId = tx.accountId.toString();
    const destId    = tx.transferToAccountId?.toString();

    if (type === 'income') {
      await adjustBalance(accountId, -amount, session);
    } else if (type === 'expense') {
      await adjustBalance(accountId, amount, session);
    } else if (type === 'transfer' && destId) {
      await adjustBalance(accountId, amount + transferFee, session);
      await adjustBalance(destId, -amount, session);
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
