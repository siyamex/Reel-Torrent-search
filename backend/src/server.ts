import { createApp } from './app';
import { env } from './config/env';
import { initCache } from './cache';
import { initUserStore } from './store';
import { createSessionMiddleware } from './config/session';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  await initCache();
  await initUserStore();
  const sessionMiddleware = await createSessionMiddleware();

  const app = createApp(sessionMiddleware);

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
