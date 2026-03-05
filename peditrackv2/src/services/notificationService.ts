/**
 * notificationService.ts
 * Computes today's in-app medication reminders from active medications.
 * No push notifications — purely derived from stored data.
 */
import { getMedications, Medication } from './healthAnalyticsService';

export type ReminderStatus = 'overdue' | 'upcoming' | 'later';

export interface MedicationNotification {
  id: string;             // `${medicationId}_${time}`
  type: 'medication';
  title: string;          // "Amoxicillin 250mg"
  body: string;           // "Due at 08:00 · Oral"
  time: string;           // "08:00"
  status: ReminderStatus;
  medicationId: string;
  medicationName: string;
  dosage: string;
}

/** True if today falls within the medication's course dates */
const isActiveToday = (med: Medication): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const start = med.startDate ? new Date(med.startDate) : null;
  const end   = med.endDate   ? new Date(med.endDate)   : null;

  if (start && new Date(start.getFullYear(), start.getMonth(), start.getDate()) > today) return false;
  if (end   && new Date(end.getFullYear(),   end.getMonth(),   end.getDate())   < today) return false;
  return true;
};

/** Convert "HH:MM" string to minutes since midnight */
const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const nowMinutes = (): number => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const statusForTime = (time: string): ReminderStatus => {
  const diff = toMinutes(time) - nowMinutes();
  if (diff < 0)   return 'overdue';
  if (diff <= 120) return 'upcoming';
  return 'later';
};

const statusOrder: Record<ReminderStatus, number> = { overdue: 0, upcoming: 1, later: 2 };

/**
 * Fetch active medications for a baby and return today's reminder notifications,
 * sorted overdue → upcoming → later, then by time within each group.
 */
export const getTodayReminders = async (
  babyId: string,
): Promise<{ notifications: MedicationNotification[]; badgeCount: number }> => {
  try {
    const medications = await getMedications(babyId, { status: 'active' });

    const notifications: MedicationNotification[] = [];

    for (const med of medications) {
      if (!med.reminderEnabled) continue;
      if (!isActiveToday(med)) continue;
      if (!med.reminderTimes || med.reminderTimes.length === 0) continue;

      const dosageStr = `${med.dosage?.amount ?? ''}${med.dosage?.unit ?? ''}`;
      const route = med.route ? ` · ${med.route.charAt(0).toUpperCase() + med.route.slice(1)}` : '';

      for (const time of med.reminderTimes) {
        notifications.push({
          id: `${med._id}_${time}`,
          type: 'medication',
          title: `${med.name}${dosageStr ? ` ${dosageStr}` : ''}`,
          body: `Due at ${time}${route}`,
          time,
          status: statusForTime(time),
          medicationId: med._id ?? '',
          medicationName: med.name,
          dosage: dosageStr,
        });
      }
    }

    // Sort: overdue → upcoming → later, then by time within group
    notifications.sort((a, b) => {
      const od = statusOrder[a.status] - statusOrder[b.status];
      if (od !== 0) return od;
      return toMinutes(a.time) - toMinutes(b.time);
    });

    const badgeCount = notifications.filter(n => n.status === 'overdue' || n.status === 'upcoming').length;

    return { notifications, badgeCount };
  } catch {
    return { notifications: [], badgeCount: 0 };
  }
};
