import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useBaby } from '@/contexts/BabyContext';
import {
  getTodayReminders,
  dismissAllNotificationsForToday,
  MedicationNotification,
  ReminderStatus,
} from '@/services/notificationService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ReminderStatus, { label: string; bg: string; text: string; icon: string }> = {
  overdue:  { label: 'Overdue',  bg: '#FEE2E2', text: '#DC2626', icon: 'alert-circle' },
  upcoming: { label: 'Upcoming', bg: '#FEF3C7', text: '#D97706', icon: 'time' },
  later:    { label: 'Later',    bg: '#EFF6FF', text: '#3B82F6', icon: 'calendar-outline' },
};

// ── Single notification card ──────────────────────────────────────────────────
const NotifCard = ({
  notif,
  onPress,
}: {
  notif: MedicationNotification;
  onPress: () => void;
}) => {
  const cfg = STATUS_CONFIG[notif.status];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.cardIconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={20} color={cfg.text} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{notif.title}</Text>
        <Text style={styles.cardBody2}>{notif.body}</Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.statusPillText, { color: cfg.text }]}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ label, count }: { label: string; count: number }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.sectionBadge}>
      <Text style={styles.sectionBadgeText}>{count}</Text>
    </View>
  </View>
);

// ── Main panel ────────────────────────────────────────────────────────────────
export const NotificationsPanel: React.FC<Props> = ({ visible, onClose }) => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<MedicationNotification[]>([]);

  useEffect(() => {
    if (visible && selectedBaby) {
      setLoading(true);
      getTodayReminders(selectedBaby._id)
        .then(({ notifications: n }) => setNotifications(n))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [visible, selectedBaby]);

  const overdue  = notifications.filter(n => n.status === 'overdue');
  const upcoming = notifications.filter(n => n.status === 'upcoming');
  const later    = notifications.filter(n => n.status === 'later');

  const handleCardPress = () => {
    onClose();
    router.push('/health-analytics/medications' as any);
  };

  const handleDismissAll = async () => {
    if (notifications.length === 0 || !selectedBaby?._id) return;
    const ids = notifications.map(n => n.id);
    await dismissAllNotificationsForToday(ids, selectedBaby._id);
    setNotifications([]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Panel */}
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.panelHeader}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="notifications" size={18} color={Colors.primary.DEFAULT} />
            <Text style={styles.panelTitle}>Today's Reminders</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleDismissAll}>
                <Text style={{ color: Colors.primary.DEFAULT, fontWeight: '600', fontSize: 13 }}>Dismiss All</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Body */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Loading reminders…</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle-outline" size={44} color="#10B981" />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptyDesc}>No medication reminders for today.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {overdue.length > 0 && (
              <>
                <SectionHeader label="Overdue" count={overdue.length} />
                {overdue.map(n => <NotifCard key={n.id} notif={n} onPress={handleCardPress} />)}
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <SectionHeader label="Upcoming (next 2 h)" count={upcoming.length} />
                {upcoming.map(n => <NotifCard key={n.id} notif={n} onPress={handleCardPress} />)}
              </>
            )}
            {later.length > 0 && (
              <>
                <SectionHeader label="Later today" count={later.length} />
                {later.map(n => <NotifCard key={n.id} notif={n} onPress={handleCardPress} />)}
              </>
            )}
          </ScrollView>
        )}

        {/* Footer */}
        <TouchableOpacity style={styles.footerBtn} onPress={handleCardPress}>
          <Text style={styles.footerBtnText}>View All Medications</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primary.DEFAULT} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    position: 'absolute',
    top: 90,           // below the SecondaryTopBar (~header height)
    right: 12,
    left: 12,
    maxHeight: 480,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  closeBtn: { padding: 4 },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  loadingText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  emptyDesc:  { fontSize: 13, color: '#6B7280', textAlign: 'center' },

  scroll: { maxHeight: 340 },
  scrollContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, gap: 6 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBadge: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  sectionBadgeText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FAFAFA', borderRadius: 10, padding: 12,
  },
  cardIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardBody:  { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  cardBody2: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  footerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  footerBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary.DEFAULT },
});
