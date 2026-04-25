import sharp from 'sharp';
import { BadRequestError } from './appError.js';

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'heif']);
const MAX_INPUT_SIZE = 20 * 1024 * 1024; // 20MB

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  size: number;
}

export async function processReceiptImage(input: Buffer): Promise<ProcessedImage> {
  if (input.length > MAX_INPUT_SIZE) {
    throw new BadRequestError('Image exceeds 20MB limit');
  }

  const meta = await sharp(input).metadata();

  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new BadRequestError('Unsupported image format. Use JPEG, PNG, WebP, or HEIC.');
  }

  const buffer = await sharp(input)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true })
    .toBuffer();

  const finalMeta = await sharp(buffer).metadata();

  return {
    buffer,
    mimeType: 'image/jpeg',
    width:  finalMeta.width  ?? 0,
    height: finalMeta.height ?? 0,
    size:   buffer.length,
  };
}

export async function generateThumbnail(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize({ width: 300, height: 300, fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer();
}

export async function getImageDimensions(input: Buffer): Promise<{ width: number; height: number }> {
  const meta = await sharp(input).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}
