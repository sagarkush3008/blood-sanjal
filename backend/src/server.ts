// ============================================================================
// 1. BULLETPROOF ENVIRONMENT LOADING (Absolute First Line Executed)
// ============================================================================
import dotenv from 'dotenv';
dotenv.config();

// Global crash preventers for unhandled rejections and exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('💥 [FATAL] Uncaught Exception detected:');
  console.error(error.stack || error.message || error);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ [WARNING] Unhandled Promise Rejection detected:');
  console.error(reason?.stack || reason?.message || reason);
});

import http from 'http';
import { execSync } from 'child_process';
import mongoose from 'mongoose';
import app from './app';
import { connectDB } from './config/db.config';
import { logger } from './config/logger.config';
import { env } from './config/env.config';
import { redisConnection } from './core/jobs/redis.client';
import { startCronJobs } from './services/cron.service';

let server: http.Server | null = null;
let availabilityCron: NodeJS.Timeout | null = null;
let isShuttingDown = false;

/**
 * Automatically releases any orphaned or zombie process holding the target port.
 * Permanently resolves "EADDRINUSE" errors across Windows, macOS, and Linux.
 */
function freePort(port: number): void {
  try {
    if (process.platform === 'win32') {
      const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      const lines = output.split(/\r?\n/);
      const killedPids = new Set<string>();

      for (const line of lines) {
        // Look for LISTENING sockets on the specific port (e.g. :5000 followed by whitespace)
        if (line.includes('LISTENING') && (line.includes(`:${port} `) || line.includes(`:${port}\t`))) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && Number(pid) > 0 && Number(pid) !== process.pid && Number(pid) !== process.ppid && !killedPids.has(pid)) {
            killedPids.add(pid);
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(`🧹 [Port Auto-Recovery] Cleaned up orphaned process with PID ${pid} holding port ${port}`);
            } catch {}
          }
        }
      }
    } else {
      execSync(`fuser -k ${port}/tcp 2>/dev/null || true`);
    }
  } catch {
    // Port was already clean or no foreign process holding it
  }
}

/**
 * Boots database, background cron tasks, and starts HTTP server with auto-port-recovery.
 */
const startServer = async () => {
  try {
    // 2. DATABASE INITIALIZATION WITH AUTO-RETRY & CLEAR LOGGING
    try {
      await connectDB(5, 2000);
    } catch (dbErr: any) {
      console.error('💥 [FATAL] Database initialization failed on startup:');
      console.error(`   Reason: ${dbErr?.message || dbErr}`);
      console.error('   Ensure your MongoDB service is running and MONGODB_URI in .env is reachable.');
      process.exit(1);
    }

    // 3. SERVER INITIALIZATION & RESILIENT PORT BINDING
    const PORT = Number(env.PORT) || 5000;

    // Proactively clean up any stale orphaned processes holding our port from terminated terminals
    freePort(PORT);

    const bindServer = (): Promise<http.Server> => {
      return new Promise((resolve, reject) => {
        const s = app.listen(PORT, '0.0.0.0', () => {
          logger.info(`🚀 Server running on port ${PORT} (0.0.0.0) in ${env.NODE_ENV} mode`);
          resolve(s);
        });

        s.once('error', async (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️ [Port In Use] Port ${PORT} is occupied. Attempting automatic port recovery...`);
            try {
              s.close();
            } catch {}
            freePort(PORT);
            await new Promise((r) => setTimeout(r, 600));

            try {
              const retryServer = app.listen(PORT, '0.0.0.0', () => {
                logger.info(`🚀 [Recovered] Server running on port ${PORT} (0.0.0.0) in ${env.NODE_ENV} mode`);
                resolve(retryServer);
              });
              retryServer.on('error', (retryErr: any) => {
                console.error(`💥 [Fatal] Failed to bind to port ${PORT} after cleanup:`, retryErr);
                process.exit(1);
              });
            } catch (retryFailed) {
              reject(retryFailed);
            }
          } else {
            console.error('❌ Server startup error:', err);
            reject(err);
          }
        });
      });
    };

    server = await bindServer();

    // 4. BACKGROUND WORKERS & HELPERS
    startCronJobs();

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
    console.error('💥 Failed to boot server after exhausting retries:', error);
    process.exit(1);
  }
};

/**
 * 5. GRACEFUL SHUTDOWN HANDLER
 * Guarantees that HTTP sockets, DB pool, and Redis connections are closed cleanly.
 */
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 [${signal}] Signal received. Starting graceful shutdown...`);

  if (availabilityCron) {
    clearInterval(availabilityCron);
    availabilityCron = null;
  }

  // Force shutdown safeguard if clean closure takes more than 3 seconds
  const forceKillTimer = setTimeout(() => {
    console.error('⏰ Forceful shutdown timeout exceeded (3s). Killing process.');
    process.exit(1);
  }, 3000);
  forceKillTimer.unref();

  try {
    if (server) {
      try {
        if (typeof (server as any).closeIdleConnections === 'function') {
          (server as any).closeIdleConnections();
        }
        if (typeof (server as any).closeAllConnections === 'function') {
          (server as any).closeAllConnections();
        }
      } catch {}

      await new Promise<void>((resolve) => {
        server!.close((err) => {
          if (err) {
            console.warn('⚠️ HTTP server close warning:', err.message);
          } else {
            console.log('✅ HTTP server closed. Port cleanly released.');
          }
          resolve();
        });
      });
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✅ Database connection pool closed cleanly.');
    }

    try {
      if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.quit();
        console.log('✅ Redis connection closed.');
      }
    } catch {}

    console.log('👋 Graceful shutdown complete. Exiting cleanly.');
    if (signal === 'SIGUSR2') {
      // Nodemon restart signal - pass control back to nodemon
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
};

// Listen for process termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

startServer();
