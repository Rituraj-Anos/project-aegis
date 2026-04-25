import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// ── Interfaces ────────────────────────────────────────────

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface StorageProvider {
  upload(params: { key: string; buffer: Buffer; mimeType: string; size: number }): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  getPublicUrl(key: string): string;
}

// ── S3 Provider ───────────────────────────────────────────

class S3Provider implements StorageProvider {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.S3_REGION,
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
          : undefined,
      ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
    });
  }

  async upload({ key, buffer, mimeType, size }: { key: string; buffer: Buffer; mimeType: string; size: number }): Promise<UploadResult> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: env.S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentLength: size,
        ServerSideEncryption: 'AES256',
      },
    });
    await upload.done();
    return { key, url: this.getPublicUrl(key), size, mimeType };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET!, Key: key }));
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    return s3GetSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: env.S3_BUCKET!, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  getPublicUrl(key: string): string {
    const base = env.S3_PUBLIC_URL ?? `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`;
    return `${base}/${key}`;
  }
}

// ── Local Provider ────────────────────────────────────────

class LocalProvider implements StorageProvider {
  async upload({ key, buffer, mimeType, size }: { key: string; buffer: Buffer; mimeType: string; size: number }): Promise<UploadResult> {
    const fullPath = path.join(env.LOCAL_UPLOAD_DIR, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    logger.info('Local file written', { key, size });
    return { key, url: this.getPublicUrl(key), size, mimeType };
  }

  async delete(key: string): Promise<void> {
    try {
      fs.unlinkSync(path.join(env.LOCAL_UPLOAD_DIR, key));
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async getSignedUrl(key: string, _expiresInSeconds: number): Promise<string> {
    return this.getPublicUrl(key);
  }

  getPublicUrl(key: string): string {
    return `${env.LOCAL_UPLOAD_URL}/${key}`;
  }
}

// ── Factory + singleton ───────────────────────────────────

export function createStorageProvider(): StorageProvider {
  switch (env.STORAGE_PROVIDER) {
    case 's3':    return new S3Provider();
    case 'local': return new LocalProvider();
    default:      throw new Error(`Unsupported storage provider: ${env.STORAGE_PROVIDER}`);
  }
}

export const storageProvider: StorageProvider = createStorageProvider();
