import type { Request, Response } from 'express';
import * as attachmentService from './attachment.service.js';
import * as ocrService from './ocr.service.js';
import { BadRequestError } from '../../utils/appError.js';
import type { AttachmentQuery, LinkAttachmentInput } from './attachment.schema.js';

export async function uploadAttachments(req: Request, res: Response): Promise<void> {
  if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
    throw new BadRequestError('No files uploaded');
  }
  const transactionId = (req.body as any)?.transactionId as string | undefined;
  const attachments = await attachmentService.createAttachments(
    req.user!._id.toString(), req.uploadedFiles, transactionId,
  );
  res.status(201).json({ success: true, data: attachments });
}

export async function listAttachments(req: Request, res: Response): Promise<void> {
  const result = await attachmentService.listAttachments(
    req.user!._id.toString(), req.query as unknown as AttachmentQuery,
  );
  res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, totalPages: result.totalPages } });
}

export async function getSignedUrl(req: Request, res: Response): Promise<void> {
  const url = await attachmentService.getSignedUrl(req.params['attachmentId'] as string, req.user!._id.toString());
  res.json({ success: true, data: { url, expiresIn: 3600 } });
}

export async function linkToTransaction(req: Request, res: Response): Promise<void> {
  const body = req.body as LinkAttachmentInput;
  const attachment = await attachmentService.linkToTransaction(body.attachmentId, body.transactionId, req.user!._id.toString());
  res.json({ success: true, data: attachment });
}

export async function deleteAttachment(req: Request, res: Response): Promise<void> {
  await attachmentService.deleteAttachment(req.params['attachmentId'] as string, req.user!._id.toString());
  res.json({ success: true, data: { message: 'Attachment deleted' } });
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const stats = await attachmentService.getAttachmentStats(req.user!._id.toString());
  res.json({ success: true, data: stats });
}

export async function processOcr(req: Request, res: Response): Promise<void> {
  const result = await ocrService.processReceiptOcr(req.params['attachmentId'] as string, req.user!._id.toString());
  res.json({ success: true, data: result });
}
