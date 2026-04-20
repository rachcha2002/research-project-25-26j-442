// Lazy import of expo-notifications to avoid the DevicePushTokenAutoRegistration
// side-effect that crashes Expo Go SDK 53 on Android. This file is safe to import
// statically; the native module is only loaded when a function is actually called.
import { Platform } from 'react-native';
import { Medication, Vaccination } from './healthAnalyticsService';

type NotificationsModule = typeof import('expo-notifications');

let _notificationsModule: NotificationsModule | null = null;

const getNotifications = async (): Promise<NotificationsModule> => {
  if (!_notificationsModule) {
    _notificationsModule = await import('expo-notifications');
    // Configure how notifications appear when the app is in the foreground.
    // NOTE: This requires a development build (SDK 53+) for remote push on Android.
    _notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return _notificationsModule;
};

/**
 * Request necessary permissions for push notifications.
 * Safe to call multiple times (returns early if already granted).
 */
export const requestPushPermissionsAsync = async (): Promise<boolean> => {
  try {
    const Notifications = await getNotifications();
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
  } catch (error) {
    console.warn('[Push] Error requesting permissions:', error);
    return false;
  }
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
  try {
    const Notifications = await getNotifications();
    for (const time of previousTimes) {
      const notificationId = `med_${medicationId}_${time.replace(':', '')}`;
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        console.log(`[Push] Cancelled reminder: ${notificationId}`);
      } catch (err) {
        console.log(`[Push] Failed to cancel ${notificationId}:`, err);
      }
    }
  } catch (error) {
    console.warn('[Push] Error cancelling medication reminders:', error);
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

  try {
    const Notifications = await getNotifications();
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
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'medication-reminders',
          } as import('expo-notifications').NotificationTriggerInput,
        });
        console.log(`[Push] Scheduled reminder ${notificationId} for ${time} daily.`);
      } catch (err) {
        console.error(`[Push] Error scheduling ${notificationId}:`, err);
      }
    }
  } catch (error) {
    console.warn('[Push] Error scheduling medication reminders:', error);
  }
};

/**
 * Cancel previously scheduled notification for a given vaccination.
 */
export const cancelVaccinationReminder = async (vaccinationId: string) => {
  try {
    const Notifications = await getNotifications();
    const notificationId = `vac_${vaccinationId}`;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`[Push] Cancelled vaccine reminder: ${notificationId}`);
    } catch (err) {
      console.log(`[Push] Failed to cancel vaccine reminder ${notificationId}:`, err);
    }
  } catch (error) {
    console.warn('[Push] Error cancelling vaccination reminder:', error);
  }
};

/**
 * Schedule a one-time push notification for 9:00 AM on the date of a scheduled vaccination.
 */
export const scheduleVaccinationReminder = async (vaccination: Vaccination) => {
  // Only schedule if the status is strictly 'scheduled' and we have an ID + date
  // Also skip if reminderEnabled is explicitly set to false
  if (vaccination.status !== 'scheduled' || !vaccination._id || !vaccination.scheduledDate || vaccination.reminderEnabled === false) {
    return;
  }

  const scheduledDate = new Date(vaccination.scheduledDate);
  const now = new Date();
  const offsetDays = vaccination.reminderOffsetDays ?? 1; // Default to 1 day before if not set

  // Set the reminder time exactly to 9:00 AM on that date, minus offset days
  const reminderDate = new Date(scheduledDate);
  reminderDate.setDate(reminderDate.getDate() - offsetDays);
  reminderDate.setHours(9, 0, 0, 0);

  // If the reminder date is already in the past, do not schedule
  if (reminderDate <= now) {
    console.log(`[Push] Vaccine reminder for ${reminderDate.toISOString()} is in the past, skipping.`);
    return;
  }

  // Format human-readable string for the message body
  let dayString = 'today';
  if (offsetDays === 1) dayString = 'tomorrow';
  else if (offsetDays > 1) dayString = `in ${offsetDays} days`;

  const hasPermission = await requestPushPermissionsAsync();
  if (!hasPermission) return;

  try {
    const Notifications = await getNotifications();
    const notificationId = `vac_${vaccination._id}`;

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: `Vaccination Reminder: ${vaccination.vaccineName}`,
        body: `Due ${dayString}! (Dose ${vaccination.doseNumber} of ${vaccination.totalDoses})`,
        data: { vaccinationId: vaccination._id, type: 'vaccination_reminder' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      } as import('expo-notifications').NotificationTriggerInput,
    });
    console.log(`[Push] Scheduled vaccine reminder ${notificationId} for ${reminderDate.toLocaleString()}`);
  } catch (err) {
    console.error(`[Push] Error scheduling vaccine reminder:`, err);
  }
};
