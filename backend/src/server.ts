import app from './app';
import { connectDB } from './config/db.config';
import { logger } from './config/logger.config';
import { env } from './config/env.config';
import mongoose from 'mongoose';
import { redisConnection } from './core/jobs/redis.client';
import { startCronJobs } from './services/cron.service';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Start automated daily eligibility cron jobs
    startCronJobs();

    // Helper cron: automatically revert INACTIVE donors to ACTIVE if their scheduled inactivity period has expired.
    const availabilityCron = setInterval(async () => {
      try {
        const { DonorService } = await import('./modules/donors/donor.service');
        const count = await DonorService.processAutoExpirations();
        if (count > 0) {
          logger.info(`Cron: Restored ${count} donors to ACTIVE status.`);
        }
      } catch (err) {
        logger.error('Error in availability cron helper', err);
      }
    }, 60 * 1000 * 5); // Run every 5 minutes


    // Graceful Shutdown
    const shutdown = async () => {
      clearInterval(availabilityCron);
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
