import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

export const attachmentQuerySchema = z.object({
  transactionId: objectId.optional(),
  category:      z.enum(['receipt', 'document', 'other']).optional(),
  page:          z.coerce.number().int().positive().default(1),
  limit:         z.coerce.number().int().min(1).max(50).default(20),
});

export const linkAttachmentSchema = z.object({
  transactionId: objectId,
  attachmentId:  objectId,
});

export type AttachmentQuery       = z.infer<typeof attachmentQuerySchema>;
export type LinkAttachmentInput   = z.infer<typeof linkAttachmentSchema>;
