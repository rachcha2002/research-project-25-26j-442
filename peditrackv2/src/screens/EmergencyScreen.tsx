import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { SecondaryTopBar } from "@/components/SecondaryTopBar";
import { getMyTeleconsultationRequests } from '@/services/teleconsultationService';
import { getAssessments } from '@/services/riskAssessmentService';
import { useAuth } from '@/contexts/AuthContext';

type RecentActivityItem = {
  type: 'Assessment' | 'Teleconsultation';
  date: string;
  summary: string;
  timestamp: number;
  requestId?: string;
  assessmentId?: string;
};

const formatActivityDate = (isoDate?: string) => {
  if (!isoDate) return '-';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-CA');
};

const teleStatusText = (status: string) => {
  if (status === 'accepted') return 'Accepted by doctor';
  if (status === 'completed') return 'Consultation completed';
  if (status === 'cancelled') return 'Consultation cancelled';
  return 'Pending doctor response';
};

export const EmergencyScreen: React.FC = () => {
  const { user } = useAuth();
  const [recentActivity, setRecentActivity] = React.useState<RecentActivityItem[]>([]);
  const { width } = useWindowDimensions();

  const isCompact = width < 380;
  const isTablet = width >= 768;
  const contentMaxWidth = isTablet ? 560 : 420;
  const sectionHorizontalPadding = isCompact ? 14 : 20;
  const actionCardPadding = isCompact ? 16 : 25;
  const actionCardGap = isCompact ? 12 : 18;
  const iconSize = isCompact ? 28 : 32;
  const iconCircleSize = isCompact ? 46 : 54;

  const handleOpenActivity = (item: RecentActivityItem) => {
    if (item.type === 'Teleconsultation' && item.requestId) {
      router.push({
        pathname: '/emergency-response/teleconsultation' as any,
        params: { requestId: item.requestId },
      });
      return;
    }

    if (item.type === 'Assessment' && item.assessmentId) {
      router.push({
        pathname: '/emergency-response/assesment-report' as any,
        params: { assessmentId: item.assessmentId },
      });
      return;
    }
  };

  React.useEffect(() => {
    let isMounted = true;

    const loadRecentActivity = async () => {
      try {
        const [teleResult, assessmentResult] = await Promise.allSettled([
          getMyTeleconsultationRequests(5),
          getAssessments(),
        ]);

        const teleconsultations = teleResult.status === 'fulfilled' ? teleResult.value : [];
        const assessments = assessmentResult.status === 'fulfilled' ? assessmentResult.value : [];

        const teleEvents: RecentActivityItem[] = teleconsultations.map((request) => {
          const requestedAt = request.requestedAt || '';
          const requestedTime = new Date(requestedAt).getTime();
          const doctorLabel = request.doctorName || request.doctorId;
          return {
            type: 'Teleconsultation',
            date: formatActivityDate(requestedAt),
            summary: `${teleStatusText(request.status)}${doctorLabel ? ` • Doctor: ${doctorLabel}` : ''}`,
            timestamp: Number.isNaN(requestedTime) ? 0 : requestedTime,
            requestId: request._id,
            assessmentId: request.patient?.assessment_id,
          };
        });

        const assessmentEvents: RecentActivityItem[] = assessments
          .filter((assessment: any) => {
            if (!user?._id) return true;
            const owner = String(assessment.userId || '');
            return owner === String(user._id);
          })
          .slice(0, 8)
          .map((assessment: any) => {
            const createdAt = assessment.createdAt || assessment.timestamp || '';
            const createdTime = new Date(createdAt).getTime();
            return {
              type: 'Assessment',
              date: formatActivityDate(createdAt),
              summary: `Assessment report created • ${String(assessment.risk_level || 'unknown').toUpperCase()} priority`,
              timestamp: Number.isNaN(createdTime) ? 0 : createdTime,
              assessmentId: assessment.assessment_id,
            };
          });

        const merged = [...assessmentEvents, ...teleEvents]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 6);

        if (isMounted) {
          setRecentActivity(merged);
        }
      } catch (error) {
        if (isMounted) {
          setRecentActivity([]);
        }
      }
    };

    loadRecentActivity();

    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <SecondaryTopBar />
          {/* Main Actions */}
          <View style={[styles.actionsWrap, { maxWidth: contentMaxWidth, padding: sectionHorizontalPadding, gap: actionCardGap }]}>
            {/* ...existing code for action cards... */}
            <TouchableOpacity style={[styles.actionCard, { borderLeftColor: Colors.primary.DEFAULT, padding: actionCardPadding, gap: actionCardGap }]} onPress={() => router.push('/emergency-response/assessment' as any)}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primary.DEFAULT + '22', width: iconCircleSize, height: iconCircleSize, borderRadius: iconCircleSize / 2 }]}> 
                <MaterialCommunityIcons name="clipboard-text-search-outline" size={iconSize} color={Colors.primary.DEFAULT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: Colors.primary.DEFAULT, fontSize: isCompact ? 16 : 18 }]}>Risk Assessment</Text>
                <Text style={[styles.actionDesc, { fontSize: isCompact ? 13 : 14 }]}>Quickly assess your child's emergency risk</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </TouchableOpacity>
            <View style={[styles.actionCard, { borderLeftColor: '#F43F5E', padding: actionCardPadding, gap: actionCardGap }]} >
              <View style={[styles.iconCircle, { backgroundColor: '#F43F5E22', width: iconCircleSize, height: iconCircleSize, borderRadius: iconCircleSize / 2 }]}> 
                <MaterialCommunityIcons name="video-account" size={iconSize} color="#F43F5E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: '#F43F5E', fontSize: isCompact ? 16 : 18 }]}>Teleconsultation</Text>
                <Text style={[styles.actionDesc, { fontSize: isCompact ? 13 : 14 }]}>Connect instantly with a pediatrician</Text>
                <Text style={[styles.actionDesc, { color: '#c19a1b', fontSize: isCompact ? 13 : 14 }]}>Premium Feature</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.actionCard, { borderLeftColor: '#6366F1', padding: actionCardPadding, gap: actionCardGap }]} onPress={() => router.push('/emergency-response/nearby-hospitals' as any)}>
              <View style={[styles.iconCircle, { backgroundColor: '#6366F122', width: iconCircleSize, height: iconCircleSize, borderRadius: iconCircleSize / 2 }]}> 
                <Ionicons name="medkit" size={iconSize} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: '#6366F1', fontSize: isCompact ? 16 : 18 }]}>Nearby Hospitals</Text>
                <Text style={[styles.actionDesc, { fontSize: isCompact ? 13 : 14 }]}>Find the closest healthcare facilities</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          {/* Recent Activity */}
          <View style={[styles.recentActivityWrap, { maxWidth: contentMaxWidth, padding: isCompact ? 14 : 20 }]}>
            <Text style={styles.recentActivityTitle}>Recent Activity</Text>
            {recentActivity.length === 0 && (
              <Text style={styles.recentEmpty}>No recent teleconsultations or assessment reports yet.</Text>
            )}
            {recentActivity.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.recentItem} onPress={() => handleOpenActivity(item)}>
                <Ionicons
                  name={item.type === 'Assessment' ? 'analytics' : 'chatbubbles'}
                  size={18}
                  color={item.type === 'Assessment' ? Colors.primary.DEFAULT : '#F43F5E'}
                  style={{ marginRight: 8 }}
                />
                <View style={styles.recentTextWrap}>
                  <Text style={styles.recentType}>{item.type}</Text>
                  <Text style={styles.recentSummary}>{item.summary}</Text>
                </View>
                <Text style={[styles.recentDate, { minWidth: isCompact ? 56 : 70 }]} numberOfLines={1}>{item.date}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
  },
  emergencyTitle: {
   fontSize: 20,
   fontWeight: "700",
   color: "#d32f2f",
  },
  childDetails: {
   marginTop: 2,
   fontSize: 14,
   color: "#555",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
  },
  bottomEmergencyWrap: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(249,250,251,0.95)',
    zIndex: 10,
    gap: 15,
  },
  bottomEmergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 0,
    justifyContent: 'center',
  },
  bottomEmergencyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
    fabEmergency: {
      position: 'absolute',
      right: 28,
      top: 44,
      zIndex: 10,
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    tipsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.white,
      borderRadius: 14,
      padding: 16,
      marginBottom: 22,
      width: '100%',
      maxWidth: 420,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.primary.DEFAULT,
      marginBottom: 2,
    },
    tipsDesc: {
      fontSize: 13,
      color: Colors.inactive,
    },
    recentActivityWrap: {
      marginTop: 10,
      width: '100%',
      maxWidth: 420,
      backgroundColor: Colors.white,
      borderRadius: 14,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    recentActivityTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.dark,
      marginBottom: 10,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 4,
    },
    recentTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    recentType: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.primary.DEFAULT,
    },
    recentSummary: {
      fontSize: 13,
      color: Colors.inactive,
    },
    recentDate: {
      fontSize: 12,
      color: '#64748B',
      marginLeft: 8,
      minWidth: 70,
      textAlign: 'right',
    },
    recentEmpty: {
      fontSize: 13,
      color: Colors.inactive,
      marginBottom: 6,
    },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  subHeader: {
    fontSize: 16,
    color: Colors.inactive,
    textAlign: 'center',
    marginBottom: 28,
  },
  actionsWrap: {
    width: '100%',
    maxWidth: 420,
    gap: 18,
    marginTop: 12,
    padding: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 25,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 5,
    gap: 18,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 14,
    color: Colors.inactive,
  },
});


