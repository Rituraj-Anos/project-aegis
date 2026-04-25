import Tesseract from 'tesseract.js';
import fs from 'node:fs';
import path from 'node:path';
import { AttachmentModel } from './attachment.model.js';
import { storageProvider } from '../../config/storage.js';
import { NotFoundError, ForbiddenError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';
import { Types } from 'mongoose';

export interface OcrResult {
  rawText:    string;
  confidence: number;
  parsedData: {
    amount?:    number;
    date?:      string;
    merchant?:  string;
    lineItems:  string[];
  };
}

const DATE_PATTERNS = [
  /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/,   // MM/DD/YYYY or DD/MM/YYYY
  /\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/,      // YYYY-MM-DD
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{4}\b/i,
];


function parseReceiptText(rawText: string): OcrResult['parsedData'] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const merchant = lines[0] ?? undefined;

  // Parse date
  let date: string | undefined;
  for (const line of lines) {
    for (const re of DATE_PATTERNS) {
      if (re.test(line)) { date = new Date(line.match(re)![0]).toISOString(); break; }
    }
    if (date) break;
  }

  // Parse amount — find the largest dollar value (likely total)
  const amounts: number[] = [];
  const text = rawText.replace(/,/g, '');
  let m: RegExpExecArray | null;
  const amtRe = /\$?(\d+\.\d{2})/g;
  while ((m = amtRe.exec(text)) !== null) {
    amounts.push(parseFloat(m[1]!));
  }
  const maxAmount = amounts.length ? Math.max(...amounts) : undefined;
  const amount = maxAmount !== undefined ? Math.round(maxAmount * 100) : undefined;

  return { amount, date, merchant, lineItems: lines };
}

export async function extractReceiptText(imageBuffer: Buffer): Promise<OcrResult> {
  const start = Date.now();
  const result = await Tesseract.recognize(imageBuffer, 'eng', { logger: () => {} });
  const duration = Date.now() - start;

  const rawText    = result.data.text;
  const confidence = result.data.confidence;
  const parsedData = parseReceiptText(rawText);

  logger.info('OCR complete', { duration, confidence });

  return { rawText, confidence, parsedData };
}

export async function processReceiptOcr(attachmentId: string, userId: string): Promise<OcrResult> {
  const attachment = await AttachmentModel.findOne({ _id: new Types.ObjectId(attachmentId), isDeleted: false });
  if (!attachment) throw new NotFoundError('Attachment not found');
  if (attachment.userId.toString() !== userId) throw new ForbiddenError('Not your attachment');

  // Download image buffer
  let buffer: Buffer;
  if (env.STORAGE_PROVIDER === 'local') {
    buffer = fs.readFileSync(path.join(env.LOCAL_UPLOAD_DIR, attachment.key));
  } else {
    const signedUrl = await storageProvider.getSignedUrl(attachment.key, 300);
    const resp = await fetch(signedUrl);
    buffer = Buffer.from(await resp.arrayBuffer());
  }

  const ocrResult = await extractReceiptText(buffer);

  attachment.ocrData = {
    rawText:     ocrResult.rawText,
    confidence:  ocrResult.confidence,
    parsedData:  ocrResult.parsedData,
    processedAt: new Date(),
  };
  await attachment.save();

  return ocrResult;
}
