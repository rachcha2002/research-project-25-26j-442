// Lazy import of expo-notifications to avoid the DevicePushTokenAutoRegistration
// side-effect that crashes Expo Go SDK 53 on Android. The module is only loaded
// when a notification function is actually invoked, not at startup.
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMedications } from './healthAnalyticsService';

type NotificationsModule = typeof import('expo-notifications');

let _notificationsModule: NotificationsModule | null = null;

const getNotifications = async (): Promise<NotificationsModule> => {
  if (!_notificationsModule) {
    _notificationsModule = await import('expo-notifications');
    // Configure how notifications appear when the app is in the foreground
    _notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
  return _notificationsModule;
};

// Add type for reminder status
export type ReminderStatus = 'overdue' | 'upcoming' | 'later';

export type MedicationNotification = {
  id: string;
  title: string;
  body: string;
  status: ReminderStatus;
};

export interface MedicationReminderData {
  medicationId: string;
  medicationName: string;
  dosage: string;
  babyId: string;
}

type MedicationReminderPayload = MedicationReminderData & {
  type: 'medication_reminder';
} & Record<string, unknown>;

const isMedicationReminderPayload = (data: Record<string, unknown>): data is MedicationReminderPayload => {
  return (
    data.type === 'medication_reminder' &&
    typeof data.medicationId === 'string' &&
    typeof data.medicationName === 'string' &&
    typeof data.dosage === 'string' &&
    typeof data.babyId === 'string'
  );
};

/**
 * Request notification permissions from the user
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (!Device.isDevice) {
      console.log('[Notifications] Must use physical device for push notifications');
      return false;
    }

    const Notifications = await getNotifications();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    console.log('[Notifications] Permission granted');
    return true;
  } catch (error) {
    console.error('[Notifications] Error requesting permissions:', error);
    return false;
  }
};

/**
 * Schedule medication reminder notifications
 * @param medication - Medication object with reminder times
 */
export const scheduleMedicationReminder = async (medication: {
  _id: string;
  name: string;
  dosage: { amount: number; unit: string };
  reminderEnabled: boolean;
  reminderTimes: string[];
  babyId: string;
}): Promise<string[]> => {
  try {
    if (!medication.reminderEnabled || !medication.reminderTimes || medication.reminderTimes.length === 0) {
      console.log('[Notifications] Reminders not enabled for medication');
      return [];
    }

    // First cancel any existing notifications for this medication
    await cancelMedicationReminder(medication._id);

    const Notifications = await getNotifications();
    const notificationIds: string[] = [];

    // Schedule a notification for each reminder time
    for (const time of medication.reminderTimes) {
      const [hours, minutes] = time.split(':').map(Number);
      
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      };

      const payload: MedicationReminderPayload = {
        medicationId: medication._id,
        medicationName: medication.name,
        dosage: `${medication.dosage.amount}${medication.dosage.unit}`,
        babyId: medication.babyId,
        type: 'medication_reminder',
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medication Reminder',
          body: `Time to take ${medication.name} (${medication.dosage.amount}${medication.dosage.unit})`,          
          data: payload,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger as Notifications.NotificationTriggerInput,
      });

      notificationIds.push(notificationId);
      console.log(`[Notifications] Scheduled reminder for ${medication.name} at ${time}, ID: ${notificationId}`);
    }

    return notificationIds;
  } catch (error) {
    console.error('[Notifications] Error scheduling medication reminder:', error);
    throw error;
  }
};

/**
 * Cancel all notifications for a specific medication
 */
export const cancelMedicationReminder = async (medicationId: string): Promise<void> => {
  try {
    const Notifications = await getNotifications();
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    const medicationNotifications = scheduledNotifications.filter(
      (notification) => notification.content.data?.medicationId === medicationId
    );

    for (const notification of medicationNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log(`[Notifications] Cancelled notification ${notification.identifier} for medication ${medicationId}`);
    }
  } catch (error) {
    console.error('[Notifications] Error cancelling medication reminder:', error);
    throw error;
  }
};

/**
 * Cancel all pending medication notifications
 */
export const cancelAllMedicationReminders = async (): Promise<void> => {
  try {
    const Notifications = await getNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Cancelled all medication reminders');
  } catch (error) {
    console.error('[Notifications] Error cancelling all reminders:', error);
    throw error;
  }
};

/**
 * Get all scheduled medication notifications
 */
export const getScheduledMedicationReminders = async () => {
  try {
    const Notifications = await getNotifications();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const medicationReminders = scheduled.filter(
      (notification) => notification.content.data?.type === 'medication_reminder'
    );
    console.log(`[Notifications] Found ${medicationReminders.length} scheduled medication reminders`);
    return medicationReminders;
  } catch (error) {
    console.error('[Notifications] Error getting scheduled reminders:', error);
    return [];
  }
};

/**
 * Set up notification response handler (when user taps notification)
 */
export const setupNotificationResponseHandler = (
  onNotificationTap: (data: MedicationReminderData) => void
): void => {
  getNotifications().then((Notifications) => {
    Notifications.addNotificationResponseReceivedListener((response) => {
      const rawData = response.notification.request.content.data;
      
      if (rawData && isMedicationReminderPayload(rawData)) {
        console.log('[Notifications] User tapped medication reminder:', rawData);
        onNotificationTap(rawData);
      }
    });
  });
};

/**
 * Get the current date string (YYYY-MM-DD) for local storage keys
 */
const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

/**
 * Get all active medications with reminders and classify them for today
 */
export const getTodayReminders = async (babyId: string): Promise<{ notifications: MedicationNotification[], badgeCount: number }> => {
  try {
    const activeMedications = await getMedications(babyId, { status: 'active' });
    const notifications: MedicationNotification[] = [];
    let badgeCount = 0;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    // Load dismissed notifications for today
    const dateStr = getTodayDateString();
    const dismissedKey = `dismissed_notifications_${dateStr}_${babyId}`;
    const dismissedDataStr = await AsyncStorage.getItem(dismissedKey);
    const dismissedIds: string[] = dismissedDataStr ? JSON.parse(dismissedDataStr) : [];

    activeMedications.forEach(med => {
      if (med.reminderEnabled && med.reminderTimes && med.reminderTimes.length > 0) {
        med.reminderTimes.forEach((timeStr, index) => {
          const id = `${med._id}-${index}`;
          
          // Skip if already dismissed today
          if (dismissedIds.includes(id)) {
            return;
          }

          const [hours, minutes] = timeStr.split(':').map(Number);
          const reminderTimeMinutes = hours * 60 + minutes;
          const diffMinutes = reminderTimeMinutes - currentTimeMinutes;

          let status: ReminderStatus = 'later';
          if (diffMinutes < 0) {
            status = 'overdue';
            badgeCount++;
          } else if (diffMinutes <= 120) { // within 2 hours
            status = 'upcoming';
            badgeCount++;
          }

          notifications.push({
            id,
            title: med.name,
            body: `Dosage: ${med.dosage.amount}${med.dosage.unit}`,
            status
          });
        });
      }
    });

    // Sort by status: overdue > upcoming > later
    notifications.sort((a, b) => {
      const rank = { overdue: 0, upcoming: 1, later: 2 };
      return rank[a.status] - rank[b.status];
    });

    return { notifications, badgeCount };
  } catch (error) {
    console.error('[Notifications] Error getting today reminders:', error);
    return { notifications: [], badgeCount: 0 };
  }
};

/**
 * Dismiss specific notifications for today
 */
export const dismissAllNotificationsForToday = async (ids: string[], babyId?: string): Promise<void> => {
  try {
    const dateStr = getTodayDateString();
    // Default to 'default' if babyId is not provided (though it should be for accuracy)
    const storeBabyId = babyId || 'default'; 
    const dismissedKey = `dismissed_notifications_${dateStr}_${storeBabyId}`;
    
    // Get currently dismissed
    const dismissedDataStr = await AsyncStorage.getItem(dismissedKey);
    const dismissedIds: string[] = dismissedDataStr ? JSON.parse(dismissedDataStr) : [];
    
    // Add new ones
    const updatedDismissedIds = [...new Set([...dismissedIds, ...ids])];
    
    await AsyncStorage.setItem(dismissedKey, JSON.stringify(updatedDismissedIds));
    console.log(`[Notifications] Saved ${ids.length} dismissed notifications to storage`);
  } catch (err) {
    console.error('[Notifications] Failed to save dismissed notifications', err);
  }
};

/**
 * Clear dismissed status for a specific medication (used when editing a medication)
 */
export const clearDismissedMedicationReminder = async (medicationId: string, babyId: string): Promise<void> => {
  try {
    const dateStr = getTodayDateString();
    const dismissedKey = `dismissed_notifications_${dateStr}_${babyId}`;
    
    const dismissedDataStr = await AsyncStorage.getItem(dismissedKey);
    if (!dismissedDataStr) return;
    
    const dismissedIds: string[] = JSON.parse(dismissedDataStr);
    
    // Filter out any IDs that start with this medicationId (since IDs are formatted as "medId-index")
    const updatedDismissedIds = dismissedIds.filter(id => !id.startsWith(`${medicationId}-`));
    
    if (updatedDismissedIds.length !== dismissedIds.length) {
      await AsyncStorage.setItem(dismissedKey, JSON.stringify(updatedDismissedIds));
      console.log(`[Notifications] Cleared dismissed status for medication ${medicationId}`);
    }
  } catch (err) {
    console.error('[Notifications] Failed to clear dismissed status', err);
  }
};
