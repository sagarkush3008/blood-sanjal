import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error('REDIS_URL not found in .env');
    process.exit(1);
  }
  
  console.log(`Connecting to: ${url.substring(0, 15)}...`);
  
  const redis = new Redis(url, { maxRetriesPerRequest: 1 });
  
  redis.on('error', (err) => {
    console.error('Redis Connection Error:', err.message);
    process.exit(1);
  });
  
  try {
    const res = await redis.ping();
    console.log('Redis PING response:', res);
    console.log('Redis is successfully connected!');
    await redis.quit();
    process.exit(0);
  } catch (err: any) {
    console.error('Failed to ping Redis:', err.message);
    process.exit(1);
  }
}

testRedis();
