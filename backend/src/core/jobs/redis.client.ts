import { Redis } from 'ioredis';
import { env } from '../../config/env.config';

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
