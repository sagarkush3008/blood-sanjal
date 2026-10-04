import cron from 'node-cron';
import { DonorProfile } from '../modules/donors/donorProfile.model';

export const initCronJobs = () => {
  // Run every day at 8:00 AM server time
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Checking donation eligibility...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Find all users whose nextEligibleDate is exactly today
      const eligibleUsers = await DonorProfile.find({
        nextEligibleDate: { 
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }).populate('userId');

      for (const donor of eligibleUsers) {
        // Here you would send a Push Notification, e.g. using a NotificationService
        console.log(`[CRON] User ${donor.userId} is eligible to donate today!`);

        // Update their status back to ACTIVE
        donor.donorStatus = 'ACTIVE';
        donor.inactiveUntil = undefined;
        donor.inactiveReason = undefined;
        await donor.save();
      }
      
      console.log(`[CRON] Processed eligibility for ${eligibleUsers.length} donors.`);
    } catch (error) {
      console.error('[CRON] Error checking eligibility:', error);
    }
  });
};
