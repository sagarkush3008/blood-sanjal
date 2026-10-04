import cron from 'node-cron';
import { DonorProfile } from '../modules/donors/donorProfile.model';

// Mock Push Notification Service
const sendPushNotification = async (userId: string, message: string) => {
  // TODO: Integrate Firebase FCM / Expo Push Notifications here
  console.log(`[PUSH NOTIFICATION to ${userId}]: ${message}`);
};

export const startCronJobs = () => {
  // Run every day at 8:00 AM server time
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Running daily donation eligibility check...');

    try {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Find donors whose reminderDate is exactly today
      const newlyEligibleDonors = await DonorProfile.find({
        reminderDate: { $gte: todayStart, $lte: todayEnd },
        donorStatus: 'UNAVAILABLE'
      });

      for (const donor of newlyEligibleDonors) {
        // 1. Update status back to ACTIVE in MongoDB
        donor.donorStatus = 'ACTIVE';
        donor.inactiveUntil = null;
        donor.inactiveReason = null;
        donor.reminderDate = undefined;
        await donor.save();

        // 2. Trigger Push Notification
        await sendPushNotification(
          donor.userId.toString(),
          "You are now eligible to donate blood again and save a life!"
        );
      }

      console.log(`[CRON] Activated and notified ${newlyEligibleDonors.length} donors today.`);
    } catch (error) {
      console.error('[CRON] Error checking donation eligibility:', error);
    }
  });
};
