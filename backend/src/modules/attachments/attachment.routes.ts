import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';
import { receiptUpload } from '../../middleware/upload.js';
import { createUploadPipeline } from '../../middleware/uploadPipeline.js';
import { attachmentQuerySchema, linkAttachmentSchema } from './attachment.schema.js';
import {
  uploadAttachments, listAttachments, getSignedUrl,
  linkToTransaction, deleteAttachment, getStats, processOcr,
} from './attachment.controller.js';

export const attachmentRouter = Router();
attachmentRouter.use(requireAuth);

attachmentRouter.post(
  '/upload',
  uploadLimiter,
  ...createUploadPipeline({ multerInstance: receiptUpload, fieldName: 'files', category: 'receipts', processImages: true, generateThumbs: true }),
  uploadAttachments,
);

attachmentRouter.get('/',                              validate({ query: attachmentQuerySchema }), listAttachments);
attachmentRouter.get('/stats',                         getStats);
attachmentRouter.get('/:attachmentId/signed-url',      getSignedUrl);
attachmentRouter.post('/link',                         validate({ body: linkAttachmentSchema }), linkToTransaction);
attachmentRouter.delete('/:attachmentId',              deleteAttachment);
attachmentRouter.post('/:attachmentId/ocr',            processOcr);
