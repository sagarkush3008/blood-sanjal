import mongoose from 'mongoose';
import { env } from './env.config';
import { logger } from './logger.config';

// Attach runtime database connection event listeners to safeguard against unexpected dropouts
mongoose.connection.on('error', (err) => {
  logger.error(`❌ [Database Runtime Error]: ${err.message || err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ [Database] Disconnected from MongoDB. Mongoose is attempting reconnection...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔄 [Database] Reconnected to MongoDB successfully.');
});

export const connectDB = async (maxRetries = 5, retryDelayMs = 2000): Promise<typeof mongoose> => {
  const safeUri = env.MONGODB_URI.replace(/:([^@]+)@/, ':****@');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[Database] Connecting to MongoDB... (Attempt ${attempt}/${maxRetries})`);
      const connection = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info(`✅ [Database] Successfully connected to MongoDB at ${safeUri}`);
      return connection;
    } catch (error: any) {
      console.error(`❌ [Database Connection Error] Attempt ${attempt}/${maxRetries} failed:`);
      console.error(`   Reason: ${error?.message || error}`);
      console.error(`   Target URI: ${safeUri}`);

      if (attempt < maxRetries) {
        logger.info(`⏳ [Database] Retrying in ${retryDelayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      } else {
        console.error('💥 [Database Fatal Error] All connection attempts exhausted. Database is unreachable.');
        console.error('   Please check that your MongoDB service is running (e.g. "mongod" or MongoDB Compass / Docker).');
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${error.message || error}`);
      }
    }
  }
  throw new Error('Database connection exhausted without connecting.');
};
