import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
    // We can skip the Device.isDevice check here since local notifications DO work on Android Emulators
    // This allows the Bell Icon and scheduling logic to be tested locally.

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

    const notificationIds: string[] = [];

    // Schedule a notification for each reminder time
    for (const time of medication.reminderTimes) {
      const [hours, minutes] = time.split(':').map(Number);
      
      const trigger: Notifications.DailyTriggerInput = {
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
        trigger,
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
export const getScheduledMedicationReminders = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
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
  Notifications.addNotificationResponseReceivedListener((response) => {
    const rawData = response.notification.request.content.data;
    
    if (rawData && isMedicationReminderPayload(rawData)) {
      console.log('[Notifications] User tapped medication reminder:', rawData);
      onNotificationTap(rawData);
    }
  });
};

export type ReminderStatus = 'overdue' | 'upcoming' | 'later';

export interface MedicationNotification {
  id: string;
  status: ReminderStatus;
  title: string;
  body: string;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSED_NOTIFICATIONS_KEY = '@peditrack_dismissed_notifications';

const getDismissedNotifications = async (): Promise<{ date: string; ids: string[] }> => {
  try {
    const data = await AsyncStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return { date: '', ids: [] };
};

export const dismissNotificationForToday = async (notificationId: string) => {
  const today = new Date().toISOString().split('T')[0];
  const { date, ids } = await getDismissedNotifications();
  
  let newIds = [];
  if (date === today) {
    if (!ids.includes(notificationId)) newIds = [...ids, notificationId];
    else newIds = ids;
  } else {
    newIds = [notificationId];
  }
  
  await AsyncStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify({ date: today, ids: newIds }));
};

export const dismissAllNotificationsForToday = async (notificationIds: string[]) => {
  const today = new Date().toISOString().split('T')[0];
  const { date, ids } = await getDismissedNotifications();
  
  let newIds = [];
  if (date === today) {
    newIds = [...new Set([...ids, ...notificationIds])];
  } else {
    newIds = notificationIds;
  }
  
  await AsyncStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify({ date: today, ids: newIds }));
};

/**
 * Get today's medication reminders for a specific baby, parsed into UI-friendly format.
 */
export const getTodayReminders = async (
  babyId: string
): Promise<{ badgeCount: number; notifications: MedicationNotification[] }> => {
  try {
    const scheduled = await getScheduledMedicationReminders();
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const { date: dismissedDate, ids: dismissedIds } = await getDismissedNotifications();
    const activeDismissedIds = dismissedDate === todayStr ? dismissedIds : [];

    // Filter by babyId and ignore dismissed notifications
    const babyNotifications = scheduled.filter(
      (n) => {
        const isBabyMatch = n.content.data?.babyId === babyId || (n.content.data as any)?.type === 'medication_reminder';
        const isNotDismissed = !activeDismissedIds.includes(n.identifier);
        return isBabyMatch && isNotDismissed;
      }
    );

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const notifications: MedicationNotification[] = [];
    let badgeCount = 0;

    for (const notif of babyNotifications) {
      const trigger = notif.trigger as any;
      let hour: number | undefined;
      let minute: number | undefined;

      if (trigger) {
        if (typeof trigger.hour === 'number') hour = trigger.hour;
        else if (trigger.dateComponents?.hour !== undefined) hour = trigger.dateComponents.hour;

        if (typeof trigger.minute === 'number') minute = trigger.minute;
        else if (trigger.dateComponents?.minute !== undefined) minute = trigger.dateComponents.minute;
      }

      if (hour !== undefined && minute !== undefined) {
        const triggerMinutes = hour * 60 + minute;
        
        let status: ReminderStatus = 'later';
        if (triggerMinutes < currentTimeMinutes) {
          status = 'overdue';
          badgeCount++;
        } else if (triggerMinutes - currentTimeMinutes <= 120) {
          status = 'upcoming'; // within 2 hours
          badgeCount++;
        }

        notifications.push({
          id: notif.identifier,
          status,
          title: notif.content.title || 'Medication Reminder',
          body: notif.content.body || '',
        });
      }
    }

    // Sort: overdue first, then upcoming, then later. And by time.
    const statusWeight = { overdue: 0, upcoming: 1, later: 2 };
    notifications.sort((a, b) => statusWeight[a.status] - statusWeight[b.status]);

    return {
      badgeCount,
      notifications,
    };
  } catch (error) {
    console.error('[Notifications] Error getting today reminders:', error);
    return { badgeCount: 0, notifications: [] };
  }
};
