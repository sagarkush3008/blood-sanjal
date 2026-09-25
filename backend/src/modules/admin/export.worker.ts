import { Job } from 'bullmq';
import { AdminReportsService } from './adminReports.service';

export const exportProcessor = async (job: Job) => {
  const { jobId } = job.data;
  await AdminReportsService.processExportJob(jobId);
};
