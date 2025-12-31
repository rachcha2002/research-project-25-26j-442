import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export const TeleconsultationScreen: React.FC = () => {
  // Dummy state for notification toggle
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>Teleconsultation</Text>
        {/* Queue Banner */}
        <View style={styles.queueBanner}>
          <Text style={styles.queueStatus}>WAITING IN QUEUE</Text>
          <Text style={styles.queueLabel}>Position in Queue</Text>
          <Text style={styles.queueNumber}>#3</Text>
          <Text style={styles.queueWait}>Est. wait: 8-12 minutes</Text>
        </View>
        {/* Request Card */}
        <View style={styles.requestCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.requestTitle}>Consultation Request For</Text>
            <View style={styles.avatar}><Text style={styles.avatarText}>E</Text></View>
          </View>
          <Text style={styles.patientName}>Emma, Age 4</Text>
          <View style={styles.requestRow}><Ionicons name="calendar" size={16} color="#6366F1" style={{ marginRight: 6 }} /><Text style={styles.requestInfo}>Requested: Today at 2:45 PM</Text></View>
          <View style={styles.requestRow}><Ionicons name="warning" size={16} color="#DC2626" style={{ marginRight: 6 }} /><Text style={styles.requestInfo}>Risk Level: <Text style={styles.highRisk}>High</Text></Text></View>
          <View style={styles.requestRow}><Ionicons name="thermometer" size={16} color="#f59e42" style={{ marginRight: 6 }} /><Text style={styles.requestInfo}>High fever, difficulty breathing</Text></View>
          <View style={styles.requestRow}><Ionicons name="medkit" size={16} color="#06b6d4" style={{ marginRight: 6 }} /><Text style={styles.requestInfo}>Pediatric Emergency Care</Text></View>
        </View>
        {/* High Priority Banner */}
        <View style={styles.priorityBanner}>
          <Ionicons name="alert-circle" size={18} color="#EA580C" style={{ marginRight: 8 }} />
          <Text style={styles.priorityText}>Marked as <Text style={{ fontWeight: '700' }}>HIGH PRIORITY</Text> - will be reviewed shortly</Text>
        </View>
        {/* What to Expect */}
        <Text style={styles.sectionTitle}>What to Expect</Text>
        <View style={styles.expectRow}><View style={styles.expectCircle}><Text style={styles.expectNum}>1</Text></View><Text style={styles.expectLabel}>Request Received <Text style={styles.expectSub}>In queue - 2:45 PM</Text></Text></View>
        <View style={styles.expectRow}><View style={styles.expectCircle}><Text style={styles.expectNum}>2</Text></View><Text style={styles.expectLabel}>Doctor Assignment <Text style={styles.expectSubBlue}>In progress…</Text></Text></View>
        <View style={styles.expectRow}><View style={styles.expectCircle}><Ionicons name="videocam" size={16} color="#6366F1" /></View><Text style={styles.expectLabel}>Video Consultation <Text style={styles.expectSub}>You'll be notified</Text></Text></View>
        {/* Notifications Toggle */}
        <View style={styles.notifyRow}>
          <Ionicons name="notifications" size={18} color="#6366F1" style={{ marginRight: 8 }} />
          <Text style={styles.notifyLabel}>Notifications Enabled</Text>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} thumbColor={notificationsEnabled ? "#6366F1" : "#e5e7eb"} trackColor={{ true: "#c7d2fe", false: "#e5e7eb" }} />
        </View>
        <Text style={styles.notifySub}>We'll alert you when ready</Text>
        {/* Immediate Help */}
        <Text style={styles.sectionTitle}>Need Immediate Help?</Text>
        <View style={styles.helpRow}>
          <TouchableOpacity style={styles.helpBtn}>
            <Ionicons name="call" size={20} color="#6366F1" />
            <Text style={styles.helpBtnText}>Call 1990{''}<Text style={styles.helpBtnSub}>Emergency</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpBtn}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#6366F1" />
            <Text style={styles.helpBtnText}>Live Chat{''}<Text style={styles.helpBtnSub}>Support</Text></Text>
          </TouchableOpacity>
        </View>
        <View style={styles.consultInfoRow}>
          <Ionicons name="information-circle-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={styles.consultInfoText}>Average consultation: 15-20 min. Ensure stable</Text>
        </View>
        {/* Footer Buttons */}
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel Request</Text></TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn}><Ionicons name="call" size={18} color="#fff" /><Text style={styles.contactBtnText}>Contact Doctor</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#22223B",
    marginBottom: 10,
    textAlign: 'center',
  },
  queueBanner: {
    backgroundColor: "#8B5CF6",
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 22,
    marginBottom: 18,
    marginTop: 2,
  },
  queueStatus: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 2,
    letterSpacing: 1.1,
    backgroundColor: '#a78bfa',
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  queueLabel: {
    color: "#ede9fe",
    fontSize: 14,
    marginTop: 8,
  },
  queueNumber: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "800",
    marginVertical: 2,
  },
  queueWait: {
    color: "#ede9fe",
    fontSize: 14,
    marginTop: 2,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requestTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 16,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#22223B',
    marginBottom: 8,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  requestInfo: {
    color: '#334155',
    fontSize: 14,
  },
  highRisk: {
    color: '#DC2626',
    fontWeight: '700',
  },
  priorityBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  priorityText: {
    color: '#EA580C',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#22223B',
    marginTop: 10,
    marginBottom: 8,
  },
  expectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expectCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  expectNum: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 15,
  },
  expectLabel: {
    color: '#22223B',
    fontSize: 14,
    fontWeight: '500',
  },
  expectSub: {
    color: '#64748B',
    fontWeight: '400',
    fontSize: 13,
  },
  expectSubBlue: {
    color: '#6366F1',
    fontWeight: '500',
    fontSize: 13,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 2,
  },
  notifyLabel: {
    color: '#22223B',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  notifySub: {
    color: '#64748B',
    fontSize: 13,
    marginLeft: 34,
    marginBottom: 8,
  },
  helpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  helpBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  helpBtnText: {
    color: '#22223B',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  helpBtnSub: {
    color: '#64748B',
    fontWeight: '400',
    fontSize: 12,
  },
  consultInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  consultInfoText: {
    color: '#64748B',
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#fff1f2',
    borderRadius: 10,
    alignItems: 'center',
    padding: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },
  contactBtn: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 14,
  },
  contactBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
});
