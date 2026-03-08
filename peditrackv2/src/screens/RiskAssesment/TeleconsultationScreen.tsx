import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SecondaryTopBar } from "@/components/SecondaryTopBar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { cancelTeleconsultationRequest, getTeleconsultationRequest, getQueuePosition, getVideoToken } from "@/services/teleconsultationService";
import { getAssessments } from "@/services/riskAssessmentService";
import { useBaby } from "@/contexts/BabyContext";
import { EXPO_PUBLIC_LIVEKIT_URL } from "@/config/config";

export const TeleconsultationScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const requestId = params.requestId as string | undefined;
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [queuePosition, setQueuePosition] = React.useState<number | null>(null);
  const [estWait, setEstWait] = React.useState<number | null>(null);
  const [status, setStatus] = React.useState<string>("pending");
  const [videoRoom, setVideoRoom] = React.useState<string | null>(null);
  const [joining, setJoining] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [request, setRequest] = React.useState<any>(null);
  const [assessment, setAssessment] = React.useState<any>(null);
  const autoJoinAttemptedRef = React.useRef(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isTablet = width >= 768;

  const handleJoinCall = React.useCallback(async () => {
    if (joining) return;
    if (!requestId) {
      Alert.alert('Unable to join', 'Missing request details. Please retry from the assessment result screen.');
      return;
    }
    if (status !== 'accepted' || !videoRoom) {
      Alert.alert('Not ready yet', 'A doctor has not accepted this request yet. Please wait in queue.');
      return;
    }

    setJoining(true);
    try {
      const identity = request?.patient?.userId || requestId;
      const { token, url } = await getVideoToken(identity, videoRoom);
      const resolvedServerUrl = url || process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

      if (!token || !resolvedServerUrl) {
        throw new Error('Missing token or LiveKit server URL');
      }

      router.push({
        pathname: "/emergency-response/videocall-screen",
        params: { token, roomName: videoRoom, identity, serverUrl: resolvedServerUrl, requestId },
      });
    } catch (err: any) {
      const message = String(err?.message || '');
      if (message.includes('403')) {
        Alert.alert('Call not authorized', 'The call room is not ready for this participant yet. Please wait for doctor acceptance.');
      } else {
        Alert.alert('Join failed', 'Failed to join video call. Please try again.');
      }
    } finally {
      setJoining(false);
    }
  }, [joining, requestId, status, videoRoom, request, router]);

  const handleCancelRequest = React.useCallback(() => {
    if (!requestId || cancelling) return;

    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this teleconsultation request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const updated = await cancelTeleconsultationRequest(requestId);
              setRequest(updated);
              setStatus(updated.status);
              setQueuePosition(null);
              setEstWait(null);
              setVideoRoom(null);
              Alert.alert('Request Cancelled', 'Your teleconsultation request has been cancelled.');
            } catch (err) {
              Alert.alert('Cancel Failed', 'Unable to cancel the request right now. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }, [requestId, cancelling]);

  const calculateAgeMonths = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return null;

    const now = new Date();
    const yearsDiff = now.getFullYear() - birthDate.getFullYear();
    const monthsDiff = now.getMonth() - birthDate.getMonth();
    const dayAdjustment = now.getDate() < birthDate.getDate() ? -1 : 0;

    return Math.max(0, yearsDiff * 12 + monthsDiff + dayAdjustment);
  };

  const childName = selectedBaby?.name || "";
  const ageMonths = calculateAgeMonths(selectedBaby?.dateOfBirth);

  const resolvedChildName = request?.patient?.name || childName || 'Unknown';

  React.useEffect(() => {
    if (!requestId) return;
    let interval: ReturnType<typeof setInterval>;
    const poll = async () => {
      try {
        const req = await getTeleconsultationRequest(requestId);
        setRequest(req);
        setStatus(req.status);
        setVideoRoom(req.videoRoom || null);
        // Fetch assessment data if assessment_id is present
        if (req.patient?.assessment_id) {
          try {
            const assessments = await getAssessments();
            const found = assessments.find((a) => a.assessment_id === req.patient.assessment_id);
            setAssessment(found || null);
          } catch (err) {
            setAssessment(null);
          }
        }
        if (req.status === "pending") {
          const pos = await getQueuePosition(requestId);
          setQueuePosition(pos.position);
          setEstWait(pos.estWait);
        } else {
          setQueuePosition(null);
          setEstWait(null);
        }
      } catch (err) {
        // handle error
      }
    };
    poll();
    interval = setInterval(poll, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [requestId]);

  React.useEffect(() => {
    if (!requestId) return;

    if (status === 'pending' || status === 'cancelled' || status === 'completed') {
      autoJoinAttemptedRef.current = false;
      return;
    }

    if (status === 'accepted' && videoRoom && !joining && !autoJoinAttemptedRef.current) {
      autoJoinAttemptedRef.current = true;
      handleJoinCall();
    }
  }, [status, videoRoom, joining, requestId, handleJoinCall]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: isCompact ? 14 : 20,
          paddingBottom: 20,
        }}
      >
        <View style={{ width: '100%', maxWidth: isTablet ? 620 : 520, alignSelf: 'center' }}>
        {/* Header */}
        <SecondaryTopBar />
        <Text style={[styles.headerTitle, { fontSize: isCompact ? 17 : 19 }]}>Teleconsultation</Text>
        {/* Queue Banner */}
        <View style={[styles.queueBanner, { paddingVertical: isCompact ? 18 : 22 }]}> 
          <Text style={styles.queueStatus}>{status === "pending" ? "WAITING IN QUEUE" : status === "accepted" ? "DOCTOR READY" : status === "cancelled" ? "CANCELLED" : "COMPLETED"}</Text>
          <Text style={styles.queueLabel}>Position in Queue</Text>
          <Text style={[styles.queueNumber, { fontSize: isCompact ? 30 : 38 }]}>{queuePosition !== null ? `#${queuePosition}` : "-"}</Text>
          <Text style={styles.queueWait}>Est. wait: {estWait !== null ? `${estWait} minutes` : "-"}</Text>
        </View>
        {/* Request Card */}
        {request && (
          <View style={[styles.requestCard, { padding: isCompact ? 12 : 16 }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.requestTitle}>Consultation Request For</Text>
              <View style={styles.avatar}><Text style={styles.avatarText}>{resolvedChildName?.[0]?.toUpperCase() || '?'}</Text></View>
            </View>
            <Text style={[styles.patientName, { fontSize: isCompact ? 15 : 17 }]}>{resolvedChildName}, Age {ageMonths !== null && ageMonths !== undefined ? (ageMonths / 12).toFixed(1) : '-'} yrs
              {assessment && assessment.risk_level && (
                <Text style={{ color: assessment.risk_level === 'high' ? '#DC2626' : assessment.risk_level === 'medium' ? '#EA580C' : '#16A34A', fontWeight: '700' }}>
                  {`  (${assessment.risk_level.toUpperCase()} Priority)`}
                </Text>
              )}
            </Text>
            <View style={styles.requestRow}><Ionicons name="calendar" size={16} color="#6366F1" style={{ marginRight: 6 }} /><Text style={styles.requestInfo}>Requested: {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : '-'}</Text></View>
            <View style={styles.requestRow}><Ionicons name="warning" size={16} color="#DC2626" style={{ marginRight: 6 }} /><Text style={styles.requestInfo}>Priority Level: <Text style={styles.highRisk}>{request.risk_level?.toUpperCase() || '?'}</Text></Text></View>
          </View>
        )}
        {/* High Priority Banner */}
        {request?.risk_level === 'high' && (
          <View style={styles.priorityBanner}>
            <Ionicons name="alert-circle" size={18} color="#EA580C" style={{ marginRight: 8 }} />
            <Text style={styles.priorityText}>Marked as <Text style={{ fontWeight: '700' }}>HIGH PRIORITY</Text> - will be reviewed shortly</Text>
          </View>
        )}
        {/* What to Expect - dynamic */}
        <Text style={styles.sectionTitle}>What to Expect</Text>
        <View style={styles.expectRow}>
          <View style={styles.expectCircle}><Text style={styles.expectNum}>1</Text></View>
          <Text style={styles.expectLabel}>
            Request Received
            <Text style={styles.expectSub}> {request?.requestedAt ? `at ${new Date(request.requestedAt).toLocaleTimeString()}` : ''}</Text>
            {status === 'pending' && <Text style={styles.expectSubBlue}> (In queue)</Text>}
            {status !== 'pending' && <Text style={styles.expectSubBlue}> (Processed)</Text>}
          </Text>
        </View>
        <View style={styles.expectRow}>
          <View style={styles.expectCircle}><Text style={styles.expectNum}>2</Text></View>
          <Text style={styles.expectLabel}>
            Doctor Assignment
            {status === 'pending' && <Text style={styles.expectSubBlue}> In progress…</Text>}
            {status === 'accepted' && <Text style={styles.expectSubBlue}> Assigned</Text>}
            {status === 'cancelled' && <Text style={styles.expectSubBlue}> Cancelled</Text>}
            {status === 'completed' && <Text style={styles.expectSubBlue}> Completed</Text>}
          </Text>
        </View>
        <View style={styles.expectRow}>
          <View style={styles.expectCircle}><Ionicons name="videocam" size={16} color="#6366F1" /></View>
          <Text style={styles.expectLabel}>
            Video Consultation
            {status === 'pending' && <Text style={styles.expectSub}> You'll be notified</Text>}
            {status === 'accepted' && <Text style={styles.expectSubBlue}> Ready to join</Text>}
            {status === 'cancelled' && <Text style={styles.expectSubBlue}> Not started</Text>}
            {status === 'completed' && <Text style={styles.expectSubBlue}> Finished</Text>}
          </Text>
        </View>
        {/* Immediate Help - dynamic (show only if status is not completed) */}
        {status !== 'completed' && status !== 'cancelled' && (
          <>
            <Text style={styles.sectionTitle}>Need Immediate Help?</Text>
            <View style={[styles.helpRow, { flexDirection: isCompact ? 'column' : 'row' }]}>
              <TouchableOpacity style={styles.helpBtn} onPress={() => {/* TODO: implement emergency call */}}>
                <Ionicons name="call" size={20} color="#6366F1" />
                <Text style={styles.helpBtnText}>Call 1990<Text style={styles.helpBtnSub}> Emergency</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.helpBtn, isCompact ? { marginTop: 8 } : null]} onPress={() => {/* TODO: implement live chat */}}>
                <Ionicons name="call" size={20} color="#6366F1" />
                <Text style={styles.helpBtnText}>Call 119<Text style={styles.helpBtnSub}> Emergency</Text></Text>
              </TouchableOpacity>
            </View>
            <View style={styles.consultInfoRow}>
              <Ionicons name="information-circle-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.consultInfoText}>Average consultation: 15-20 min. Ensure stable connection.</Text>
            </View>
          </>
        )}
        {/* Doctor Ready Banner */}
        {status === "accepted" && videoRoom && (
          <View style={{ marginVertical: 20 }}>
            <Text style={{ color: '#16A34A', fontWeight: '700', fontSize: 16, textAlign: 'center' }}>Doctor is ready! Join the video call below:</Text>
            {joining && (
              <Text style={styles.autoConnectText}>Auto-connecting to doctor…</Text>
            )}
            {!joining && (
              <TouchableOpacity
                style={[styles.helpBtn, { backgroundColor: '#6366F1', marginTop: 12 }]}
                onPress={handleJoinCall}
              >
                <Ionicons name="videocam" size={22} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Join Video Call</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {/* Footer Buttons - dynamic */}
        <View style={[styles.footerRow, { flexDirection: isCompact ? 'column' : 'row' }]}>
          {status === 'pending' && (
            <TouchableOpacity style={[styles.cancelBtn, isCompact ? { marginRight: 0 } : null]} onPress={handleCancelRequest} disabled={cancelling}>
              <Text style={styles.cancelBtnText}>{cancelling ? 'Cancelling...' : 'Cancel Request'}</Text>
            </TouchableOpacity>
          )}
          {status === 'accepted' && (
            !joining ? (
              <TouchableOpacity
                style={[styles.contactBtn, isCompact ? { marginTop: 8 } : null]}
                onPress={handleJoinCall}
              >
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={styles.contactBtnText}>Contact Doctor</Text>
              </TouchableOpacity>
            ) : null
          )}
        </View>
        </View>
      </ScrollView>
    </View>
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
    marginTop: 16,
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
  autoConnectText: {
    color: '#4338CA',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
