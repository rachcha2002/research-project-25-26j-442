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
    if (!Device.isDevice) {
      console.log('[Notifications] Must use physical device for push notifications');
      return false;
    }

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
