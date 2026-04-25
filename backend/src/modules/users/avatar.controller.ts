import type { Request, Response } from 'express';
import { UserModel } from './user.model.js';
import { storageProvider } from '../../config/storage.js';
import { NotFoundError, BadRequestError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import type { UpdateMeInput } from './user.schema.js';

export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
    throw new BadRequestError('No file uploaded');
  }
  const file = req.uploadedFiles[0]!;
  const user = await UserModel.findById(req.user!._id);
  if (!user) throw new NotFoundError('User not found');

  // Delete old avatar from storage if it exists
  if (user.avatarKey) {
    try { await storageProvider.delete(user.avatarKey); } catch (err) {
      logger.error('Failed to delete old avatar', { err, key: user.avatarKey });
    }
  }

  user.avatarUrl = file.url;
  user.avatarKey = file.key;
  await user.save();

  res.json({ success: true, data: { avatarUrl: file.url } });
}

export async function deleteAvatar(req: Request, res: Response): Promise<void> {
  const user = await UserModel.findById(req.user!._id);
  if (!user) throw new NotFoundError('User not found');

  if (user.avatarKey) {
    try { await storageProvider.delete(user.avatarKey); } catch (err) {
      logger.error('Failed to delete avatar from storage', { err });
    }
  }

  user.avatarUrl = undefined;
  user.avatarKey = undefined;
  await user.save();

  res.json({ success: true, data: { message: 'Avatar removed' } });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await UserModel.findById(req.user!._id)
    .select('-passwordHash -refreshTokens -failedLoginAttempts');
  if (!user) throw new NotFoundError('User not found');
  res.json({ success: true, data: user });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateMeInput;
  const user = await UserModel.findById(req.user!._id);
  if (!user) throw new NotFoundError('User not found');

  if (input.name !== undefined)       user.name       = input.name;
  if (input.coachState !== undefined) user.coachState = input.coachState;
  await user.save();

  const safe = await UserModel.findById(user._id).select('-passwordHash -refreshTokens -failedLoginAttempts');
  res.json({ success: true, data: safe });
}
