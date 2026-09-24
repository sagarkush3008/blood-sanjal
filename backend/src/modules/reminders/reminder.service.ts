import { DonorProfile } from '../donors/donorProfile.model';
import { ReminderJob } from './reminderJob.model';
import { SystemConfig } from '../admin/systemConfig.model';
import { logger } from '../../config/logger.config';

export class ReminderService {
  static async getConfig() {
    let config = await SystemConfig.findOne({ key: 'REMINDER_POLICY' });
    if (!config) {
      config = await SystemConfig.create({
        key: 'REMINDER_POLICY',
        value: {
          enabled: true,
          daysAfterDonation: 90
        }
      });
    }
    return config.value;
  }

  static async updateConfig(value: any) {
    return SystemConfig.findOneAndUpdate(
      { key: 'REMINDER_POLICY' },
      { value },
      { upsert: true, new: true }
    );
  }

  static async processReminders(targetDate?: Date) {
    const config = await ReminderService.getConfig();
    if (!config.enabled) {
      logger.info('Reminder policy is disabled. Skipping.');
      return 0;
    }

    const processDate = targetDate || new Date();
    processDate.setHours(0, 0, 0, 0);

    const dueDonors = await DonorProfile.find({
      reminderDate: { $lte: processDate },
      donorStatus: 'ACTIVE',
      notificationPreference: { $nin: ['NONE', 'EMERGENCY_ONLY'] }
    }).populate('userId');

    let processedCount = 0;

    for (const donor of dueDonors) {
      const user = donor.userId as any;
      if (!user || !user.email) continue;
      
      const existingJob = await ReminderJob.findOne({
        donorProfileId: donor._id,
        reminderType: 'ELIGIBILITY',
        scheduledDate: donor.reminderDate
      });

      if (existingJob) continue;

      const job = await ReminderJob.create({
        donorProfileId: donor._id,
        reminderType: 'ELIGIBILITY',
        scheduledDate: donor.reminderDate,
        status: 'PENDING'
      });

      try {
        const message = `Hello ${user.name}, it has been a while since your last donation. You may be eligible to donate again. Please follow the guidance of your relevant blood donation service or healthcare provider to confirm your eligibility.`;
        
        logger.info(`[MAIL_MOCK] Sending reminder to ${user.email}: ${message}`);
        
        job.status = 'SENT';
        job.sentAt = new Date();
        await job.save();
        
        processedCount++;
      } catch (error) {
        job.status = 'FAILED';
        await job.save();
        logger.error(`Failed to send reminder for donor ${donor._id}`, error);
      }
    }

    return processedCount;
  }
}
