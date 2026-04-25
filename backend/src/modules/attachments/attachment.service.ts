import { Types } from 'mongoose';
import { AttachmentModel, IAttachment } from './attachment.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { storageProvider } from '../../config/storage.js';
import { NotFoundError, ForbiddenError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import type { UploadedFileResult } from '../../middleware/uploadPipeline.js';
import type { AttachmentQuery } from './attachment.schema.js';

// ── Types ────────────────────────────────────────────────

export interface AttachmentStats {
  totalFiles: number;
  totalSize:  number;
  byCategory: Record<string, number>;
}

// ── Service ──────────────────────────────────────────────

export async function createAttachments(
  userId: string,
  files: UploadedFileResult[],
  transactionId?: string,
): Promise<IAttachment[]> {
  const docs = files.map((f) => ({
    userId:        new Types.ObjectId(userId),
    transactionId: transactionId ? new Types.ObjectId(transactionId) : undefined,
    key:           f.key,
    url:           f.url,
    thumbnailKey:  f.thumbnailKey,
    thumbnailUrl:  f.thumbnailUrl,
    originalName:  f.originalName,
    mimeType:      f.mimeType,
    size:          f.size,
    category:      'receipt' as const,
  }));
  return AttachmentModel.insertMany(docs);
}

export async function listAttachments(userId: string, query: AttachmentQuery) {
  const filter: Record<string, unknown> = {
    userId:    new Types.ObjectId(userId),
    isDeleted: false,
  };
  if (query.transactionId) filter['transactionId'] = new Types.ObjectId(query.transactionId);
  if (query.category)      filter['category']      = query.category;

  const skip  = (query.page - 1) * query.limit;
  const total = await AttachmentModel.countDocuments(filter);
  const data  = await AttachmentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit);

  return { data, total, page: query.page, totalPages: Math.ceil(total / query.limit) };
}

export async function getAttachmentById(attachmentId: string, userId: string): Promise<IAttachment> {
  const attachment = await AttachmentModel.findOne({ _id: new Types.ObjectId(attachmentId), isDeleted: false });
  if (!attachment) throw new NotFoundError('Attachment not found');
  if (attachment.userId.toString() !== userId) throw new ForbiddenError('Not your attachment');
  return attachment;
}

export async function linkToTransaction(attachmentId: string, transactionId: string, userId: string): Promise<IAttachment> {
  const attachment = await getAttachmentById(attachmentId, userId);

  const tx = await TransactionModel.findOne({ _id: new Types.ObjectId(transactionId), userId: new Types.ObjectId(userId), isDeleted: false });
  if (!tx) throw new NotFoundError('Transaction not found');

  attachment.transactionId = new Types.ObjectId(transactionId);
  return attachment.save();
}

export async function deleteAttachment(attachmentId: string, userId: string): Promise<void> {
  const attachment = await getAttachmentById(attachmentId, userId);

  // Best-effort storage deletion
  try {
    await storageProvider.delete(attachment.key);
    logger.info('Storage file deleted', { key: attachment.key });
  } catch (err) {
    logger.error('Failed to delete storage file (proceeding with soft delete)', { err, key: attachment.key });
  }

  if (attachment.thumbnailKey) {
    try {
      await storageProvider.delete(attachment.thumbnailKey);
    } catch { /* swallow */ }
  }

  attachment.isDeleted = true;
  attachment.deletedAt = new Date();
  await attachment.save();
}

export async function getSignedUrl(attachmentId: string, userId: string): Promise<string> {
  const attachment = await getAttachmentById(attachmentId, userId);
  try {
    return await storageProvider.getSignedUrl(attachment.key, 3600);
  } catch {
    return attachment.url;
  }
}

export async function getAttachmentStats(userId: string): Promise<AttachmentStats> {
  const uid = new Types.ObjectId(userId);

  const [summary, categoryAgg] = await Promise.all([
    AttachmentModel.aggregate([
      { $match: { userId: uid, isDeleted: false } },
      { $group: { _id: null, totalFiles: { $sum: 1 }, totalSize: { $sum: '$size' } } },
    ]),
    AttachmentModel.aggregate([
      { $match: { userId: uid, isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  const byCategory: Record<string, number> = {};
  for (const item of categoryAgg) byCategory[item._id as string] = item.count as number;

  return {
    totalFiles: (summary[0] as any)?.totalFiles ?? 0,
    totalSize:  (summary[0] as any)?.totalSize  ?? 0,
    byCategory,
  };
}
