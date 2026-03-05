import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication } from './healthAnalyticsService';

/**
 * Configure how notifications appear when the app is in the foreground.
 * We want them to show up as alerts, play a sound, and set a badge.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request necessary permissions for push notifications.
 * Safe to call multiple times (returns early if already granted).
 */
export const requestPushPermissionsAsync = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    console.log('[Push] Must use physical device for Push Notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Failed to get push token for push notification!');
    return false;
  }

  // Required for Android 8.0+
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medication-reminders', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  return true;
};

/**
 * Cancel previously scheduled notifications for a given medication to avoid 
 * duplicates when the user edits or deletes it. We reconstruct the deterministic 
 * IDs to cancel them cleanly without needing to store them in the database.
 */
export const cancelMedicationReminders = async (
  medicationId: string,
  previousTimes: string[]
) => {
  for (const time of previousTimes) {
    const notificationId = `med_${medicationId}_${time.replace(':', '')}`;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`[Push] Cancelled reminder: ${notificationId}`);
    } catch (err) {
      console.log(`[Push] Failed to cancel ${notificationId}:`, err);
    }
  }
};

/**
 * Schedule daily recurring local notifications for each reminder time.
 */
export const scheduleMedicationReminders = async (medication: Medication) => {
  if (!medication._id || !medication.reminderEnabled || !medication.reminderTimes || medication.reminderTimes.length === 0) {
    return; // Nothing to schedule
  }

  const hasPermission = await requestPushPermissionsAsync();
  if (!hasPermission) return;

  const dosageStr = `${medication.dosage?.amount ?? ''}${medication.dosage?.unit ?? ''}`;
  const route = medication.route ? ` · ${medication.route.charAt(0).toUpperCase() + medication.route.slice(1)}` : '';

  for (const time of medication.reminderTimes) {
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Deterministic ID so we can cancel it later just by knowing the Medication ID and time
    const notificationId = `med_${medication._id}_${hourStr}${minuteStr}`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: `Time for ${medication.name}`,
          body: `Due at ${time} (${dosageStr}${route})`,
          data: { medicationId: medication._id, type: 'medication_reminder' },
          sound: true,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
          channelId: 'medication-reminders',
        } as Notifications.NotificationTriggerInput,
      });
      console.log(`[Push] Scheduled reminder ${notificationId} for ${time} daily.`);
    } catch (err) {
      console.error(`[Push] Error scheduling ${notificationId}:`, err);
    }
  }
};
