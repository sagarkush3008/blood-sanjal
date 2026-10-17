import { Redis } from 'ioredis';
import { env } from '../../config/env.config';

const isRediss = env.REDIS_URL.startsWith('rediss://');

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  family: 4, // Force IPv4 to prevent Windows IPv6 DNS ENOTFOUND timeouts
  enableReadyCheck: false,
  keepAlive: 10000,
  retryStrategy(times) {
    const delay = Math.min(times * 1000, 10000);
    return delay;
  },
  ...(isRediss ? { tls: { rejectUnauthorized: false } } : {})
});

redisConnection.on('error', (err) => {
  // Prevent unhandled error event crash when redis is down
  console.error('[Redis Error]', err.message);
});
