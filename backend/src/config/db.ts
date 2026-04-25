import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

/**
 * Connect to MongoDB with exponential-ish backoff.
 * Retries up to MAX_RETRIES before crashing so the process
 * supervisor (PM2, Docker, etc.) can restart it.
 */
export async function connectDB(attempt = 1): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: undefined, // uses DB name from URI
    });
    logger.info('✅  MongoDB connected');
  } catch (err) {
    logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed`, { error: err });

    if (attempt >= MAX_RETRIES) {
      logger.error('❌  Could not connect to MongoDB after max retries — exiting');
      process.exit(1);
    }

    const delay = RETRY_DELAY_MS * attempt;
    logger.info(`Retrying in ${delay}ms…`);
    await new Promise((r) => setTimeout(r, delay));
    return connectDB(attempt + 1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
