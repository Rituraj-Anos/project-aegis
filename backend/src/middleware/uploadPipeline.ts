import type { RequestHandler } from 'express';
import type { Multer } from 'multer';
import { storageProvider } from '../config/storage.js';
import { processReceiptImage, generateThumbnail } from '../utils/imageProcessor.js';
import { generateStorageKey, getThumbnailKey } from '../utils/storageKey.js';
import { handleMulterError } from './upload.js';
import type { FileCategory } from '../utils/storageKey.js';

export interface UploadedFileResult {
  key: string;
  url: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  originalName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      uploadedFiles?: UploadedFileResult[];
    }
  }
}

export function createUploadPipeline(params: {
  multerInstance: Multer;
  fieldName: string;
  category: FileCategory;
  processImages?: boolean;
  generateThumbs?: boolean;
}): RequestHandler[] {
  return [
    params.multerInstance.array(params.fieldName, 5) as RequestHandler,
    handleMulterError as unknown as RequestHandler,
    async (req, _res, next) => {
      try {
        const files = req.files as Express.Multer.File[] | undefined;
        if (!files || files.length === 0) { next(); return; }

        const results: UploadedFileResult[] = [];

        for (const file of files) {
          let buffer = file.buffer;
          let mimeType = file.mimetype;

          if (params.processImages && mimeType.startsWith('image/')) {
            const processed = await processReceiptImage(buffer);
            buffer = processed.buffer;
            mimeType = processed.mimeType;
          }

          const key = generateStorageKey({
            userId:       req.user!._id.toString(),
            category:     params.category,
            originalName: file.originalname,
          });

          const uploaded = await storageProvider.upload({ key, buffer, mimeType, size: buffer.length });

          const result: UploadedFileResult = {
            key:          uploaded.key,
            url:          uploaded.url,
            mimeType,
            size:         buffer.length,
            originalName: file.originalname,
          };

          if (params.generateThumbs && mimeType.startsWith('image/')) {
            const thumbBuffer = await generateThumbnail(buffer);
            const thumbKey = getThumbnailKey(key);
            const thumbUploaded = await storageProvider.upload({
              key: thumbKey, buffer: thumbBuffer,
              mimeType: 'image/jpeg', size: thumbBuffer.length,
            });
            result.thumbnailKey = thumbUploaded.key;
            result.thumbnailUrl = thumbUploaded.url;
          }

          results.push(result);
        }

        req.uploadedFiles = results;
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
}
