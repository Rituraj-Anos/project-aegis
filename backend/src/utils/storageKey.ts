import { v4 as uuidv4 } from 'uuid';
import path from 'node:path';

export type FileCategory = 'receipts' | 'avatars' | 'documents' | 'thumbnails';

export function generateStorageKey(params: {
  userId: string;
  category: FileCategory;
  originalName: string;
  extension?: string;
}): string {
  const { userId, category, originalName } = params;

  // Sanitize: keep only alphanumeric, dot, dash
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const ext = (params.extension ?? path.extname(sanitized)).toLowerCase().replace(/^\./, '');
  const finalExt = ext || 'bin';
  const date = new Date().toISOString().slice(0, 10);

  return `${category}/${userId}/${date}/${uuidv4()}.${finalExt}`;
}

export function getThumbnailKey(originalKey: string): string {
  // Replace the first path segment (category) with 'thumbnails'
  const parts = originalKey.split('/');
  parts[0] = 'thumbnails';
  return parts.join('/');
}

export const ALLOWED_MIME_TYPES = {
  images:    ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as string[],
  documents: ['application/pdf'] as string[],
  all:       ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'] as string[],
} as const;

export const MAX_FILE_SIZES = {
  image:  10 * 1024 * 1024,  // 10MB
  pdf:    25 * 1024 * 1024,  // 25MB
  avatar:  5 * 1024 * 1024,  // 5MB
} as const;
