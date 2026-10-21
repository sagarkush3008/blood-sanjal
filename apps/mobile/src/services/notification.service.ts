import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';

/**
 * Notice: With Expo SDK 53+, Android push notifications were removed from Expo Go.
 * Calling or statically importing expo-notifications on Android in Expo Go throws an Uncaught Error.
 * We safely guard and conditionally load expo-notifications so Expo Go never crashes,
 * while standalone/dev-client builds retain full push notification scheduling.
 */

let Notifications: any = null;
const isExpoGoAndroid = isRunningInExpoGo() && Platform.OS === 'android';

if (!isExpoGoAndroid) {
  try {
    // Dynamic require prevents Expo Go from executing warnOfExpoGoPushUsage on Android at module bundle time
    Notifications = require('expo-notifications');
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (err) {
    console.warn('[Notification] expo-notifications could not be loaded:', err);
  }
}

/**
 * Schedules a local push notification on next_eligible_date.
 * Safely bypassed in Expo Go (Android) to prevent crashes.
 *
 * @param nextEligibleDate Date or ISO string representing the eligibility date
 */
export const scheduleEligibilityNotification = async (
  nextEligibleDate: Date | string
): Promise<string | null> => {
  // Expo Go Android safety bypass
  if (isExpoGoAndroid) {
    console.log(
      '[Notification] Running in Expo Go on Android: Local/remote push notifications require a development build as of Expo SDK 53+. Skipping native notification scheduling.'
    );
    return null;
  }

  if (!Notifications) {
    try {
      Notifications = require('expo-notifications');
    } catch {
      return null;
    }
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Notification] Permission not granted to schedule notification');
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
        priority: Notifications.AndroidNotificationPriority?.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.DATE || 'date',
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
