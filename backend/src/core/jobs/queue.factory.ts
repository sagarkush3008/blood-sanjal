import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { redisConnection } from './redis.client';
import { logger } from '../../config/logger.config';

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false, // Keep failed jobs for dead-letter visibility
};

export function createQueue(name: string) {
  return new Queue(name, { 
    connection: redisConnection, 
    defaultJobOptions 
  });
}

export function createWorker(
  name: string,
  processor: (job: Job) => Promise<any>,
  concurrency = 1
) {
  const worker = new Worker(name, processor, {
    connection: redisConnection,
    concurrency,
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed in queue ${name}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed in queue ${name}: ${err.message}`);
  });

  return worker;
}

export function createQueueEvents(name: string) {
  return new QueueEvents(name, { connection: redisConnection });
}
