import { Redis } from 'ioredis';
import { env } from '../../config/env.config';

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  // Prevent unhandled error event crash when redis is down
  console.error('[Redis Error]', err.message);
});
