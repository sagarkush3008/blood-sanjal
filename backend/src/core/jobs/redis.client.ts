import { Redis } from 'ioredis';
import { env } from '../../config/env.config';

const isRediss = env.REDIS_URL.startsWith('rediss://');

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  family: 0, // Favor IPv4 for Upstash
  enableReadyCheck: false,
  keepAlive: 10000,
  ...(isRediss ? { tls: { rejectUnauthorized: false } } : {})
});

redisConnection.on('error', (err) => {
  // Prevent unhandled error event crash when redis is down
  console.error('[Redis Error]', err.message);
});
