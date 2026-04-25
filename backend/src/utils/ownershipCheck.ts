import { Model, Types } from 'mongoose';
import { NotFoundError } from './appError.js';

/**
 * Verify that the requesting user owns the resource.
 * Returns 404 (not 403) on wrong user to prevent resource enumeration.
 * Admins bypass the ownership check.
 */
export async function assertOwnership<T>(
  model: Model<T>,
  resourceId: string,
  userId: string,
  userRole?: string,
): Promise<T & { _id: Types.ObjectId }> {
  const filter: Record<string, unknown> = {
    _id: new Types.ObjectId(resourceId),
    isDeleted: { $ne: true },
  };

  // Admins can access any resource
  if (userRole !== 'admin') {
    filter['userId'] = new Types.ObjectId(userId);
  }

  const doc = await model.findOne(filter);
  if (!doc) {
    throw new NotFoundError('Resource not found');
  }

  return doc as T & { _id: Types.ObjectId };
}
