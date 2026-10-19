import mongoose from 'mongoose';
import { env } from './env.config';
import { logger } from './logger.config';

export const connectDB = async (maxRetries = 5, retryDelayMs = 3000): Promise<typeof mongoose> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[Database] Connecting to database... (Attempt ${attempt}/${maxRetries})`);
      const connection = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info('✅ [Database] Successfully connected to database.');
      return connection;
    } catch (error: any) {
      logger.error(`❌ [Database] Connection attempt ${attempt} failed: ${error.message || error}`);
      if (attempt < maxRetries) {
        logger.info(`⏳ [Database] Waiting ${retryDelayMs / 1000}s before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      } else {
        logger.error('💥 [Database] All connection attempts exhausted. Database is unreachable.');
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${error.message || error}`);
      }
    }
  }
  throw new Error('Database connection exhausted without connecting.');
};
