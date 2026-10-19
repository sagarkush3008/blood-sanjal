// ============================================================================
// 1. GLOBAL CRASH PREVENTERS (The Safety Net) - Must sit at the very top
// ============================================================================
process.on('uncaughtException', (error: Error) => {
  console.error('💥 [FATAL] Uncaught Exception detected:');
  console.error(error.stack || error.message || error);
  // Keep process alive or exit cleanly if critical
});

process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ [WARNING] Unhandled Promise Rejection detected:');
  console.error(reason?.stack || reason?.message || reason);
});

import app from './app';
import { connectDB } from './config/db.config';
import { logger } from './config/logger.config';
import { env } from './config/env.config';
import mongoose from 'mongoose';
import { redisConnection } from './core/jobs/redis.client';
import { startCronJobs } from './services/cron.service';
import http from 'http';

let server: http.Server | null = null;
let availabilityCron: NodeJS.Timeout | null = null;

const startServer = async () => {
  try {
    // 2. RESILIENT DATABASE CONNECTION (Auto-Retry)
    await connectDB(5, 3000);

    // 3. BULLETPROOF SERVER INITIALIZATION & PORT BINDING
    const PORT = Number(env.PORT) || 5000;
    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT} (0.0.0.0) in ${env.NODE_ENV} mode`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use by another process!`);
        logger.info(`💡 Tip: Run 'npx kill-port ${PORT}' or use 'npm run dev' to automatically free this port.`);
        process.exit(1);
      } else {
        logger.error('❌ Server startup error:', err);
        process.exit(1);
      }
    });

    // Start automated daily eligibility cron jobs
    startCronJobs();

    // Helper cron: automatically revert INACTIVE donors to ACTIVE if their scheduled inactivity period has expired
    availabilityCron = setInterval(async () => {
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

  } catch (error) {
    logger.error('💥 Failed to boot server after exhausting database retries:', error);
    process.exit(1);
  }
};

// ============================================================================
// 4. THE GRACEFUL SHUTDOWN (No More Zombie Processes)
// ============================================================================
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`\n🛑 [${signal}] Signal received. Starting graceful shutdown...`);

  if (availabilityCron) {
    clearInterval(availabilityCron);
    availabilityCron = null;
  }

  // Force shutdown safeguard if clean closure takes more than 5 seconds
  const forceKillTimer = setTimeout(() => {
    logger.error('⏰ Forceful shutdown timeout exceeded (5s). Killing process.');
    process.exit(1);
  }, 5000);
  forceKillTimer.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) return reject(err);
          logger.info('✅ HTTP server closed. No longer accepting new connections.');
          resolve();
        });
      });
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      logger.info('✅ Database connection closed cleanly.');
    }

    try {
      if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.quit();
        logger.info('✅ Redis connection closed.');
      }
    } catch (e) {
      // Redis optional cleanup
    }

    logger.info('👋 Graceful shutdown complete. Exiting cleanly.');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
