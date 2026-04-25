import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ timestamp: ts, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} ${level}: ${message}${metaStr}`;
  }),
);

const prodFormat = combine(timestamp(), json());

/**
 * Structured logger.
 * - Dev:  colorized, human-readable
 * - Prod: JSON for log aggregators
 *
 * NEVER log passwords, tokens, API keys, or raw PII.
 */
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'aegis-api' },
  transports: [new winston.transports.Console()],
});
