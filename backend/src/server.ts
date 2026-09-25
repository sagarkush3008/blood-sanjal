import app from './app';
import { connectDB } from './config/db.config';
import { logger } from './config/logger.config';
import { env } from './config/env.config';
import mongoose from 'mongoose';
import { redisConnection } from './core/jobs/redis.client';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed.');
          await redisConnection.quit();
          logger.info('Redis connection closed.');
        } catch (err) {
          logger.error('Error during teardown:', err);
        }
        process.exit(0);
      });

      // Force close if it takes too long
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to boot server', error);
    process.exit(1);
  }
};

startServer();
