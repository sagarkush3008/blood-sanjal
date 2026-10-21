import * as Notifications from 'expo-notifications';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Schedules a local push notification exactly on the 90-day cooldown date
 * @param nextEligibleDate Date or ISO string representing the eligibility date
 */
export const scheduleEligibilityNotification = async (nextEligibleDate: Date | string): Promise<string | null> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Notification] Permission not granted to schedule local notification');
      return null;
    }

    const triggerDate = new Date(nextEligibleDate);
    if (isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) {
      console.warn('[Notification] Invalid or past date provided for scheduling:', nextEligibleDate);
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Blood Sanjal Nepal 🩸',
        body: 'You are eligible to donate blood again! Save a life today.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log('[Notification] Scheduled 90-day cooldown notification ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.warn('[Notification] Failed to schedule local notification:', error);
    return null;
  }
};
