import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/appError.js';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZES } from '../utils/storageKey.js';

const storage = multer.memoryStorage();

function fileFilter(allowedMimes: string[]) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`Invalid file type. Allowed: ${allowedMimes.join(', ')}`));
    }
  };
}

export const receiptUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZES.image, files: 5 },
  fileFilter: fileFilter(ALLOWED_MIME_TYPES.all as unknown as string[]),
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZES.avatar, files: 1 },
  fileFilter: fileFilter(ALLOWED_MIME_TYPES.images as unknown as string[]),
});

export const documentUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZES.pdf, files: 3 },
  fileFilter: fileFilter(ALLOWED_MIME_TYPES.documents as unknown as string[]),
});

export function handleMulterError(err: unknown, _req: Request, _res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':       next(new BadRequestError('File too large')); return;
      case 'LIMIT_FILE_COUNT':      next(new BadRequestError('Too many files')); return;
      case 'LIMIT_UNEXPECTED_FILE': next(new BadRequestError('Unexpected field name')); return;
      default:                      next(new BadRequestError(err.message)); return;
    }
  }
  next(err);
}
