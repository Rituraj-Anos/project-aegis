import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { startAlertJobs } from './modules/notifications/alert.job.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initializeSockets } from './sockets/index.js';

async function bootstrap(): Promise<void> {
  // 1. Connect to database
  await connectDB();

  // 2. Connect to Redis
  await connectRedis();

  // 2. Create HTTP server (needed for Socket.io in Phase 5)
  const server = http.createServer(app);

  // 3. Socket.io setup will be added in Phase 5
  initializeSockets(server);

  // 4. Cron jobs
  startAlertJobs();

  // 5. Start listening
  server.listen(env.PORT, () => {
    logger.info(`🛡️  Aegis API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // ── Graceful shutdown ──────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
      logger.info('Server closed');
      process.exit(0);
    });

    // Force exit after 10s if graceful shutdown stalls
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', { error: (err as Error).message || err, stack: (err as Error).stack });
  process.exit(1);
});
