import { createQueue } from './queue.factory';

export const emailQueue = createQueue('email');
export const notificationQueue = createQueue('notification');
export const exportQueue = createQueue('export');
export const cleanupQueue = createQueue('cleanup');
