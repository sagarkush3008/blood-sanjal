import { Job } from 'bullmq';
import { EmailService } from './email.service';

export const emailProcessor = async (job: Job) => {
  const { eventId, text, html } = job.data;
  await EmailService.processEmail(eventId, text, html);
};
