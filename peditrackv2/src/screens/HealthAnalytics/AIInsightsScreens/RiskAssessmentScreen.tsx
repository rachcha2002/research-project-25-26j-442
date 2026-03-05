import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { useAuth } from '../../../contexts/AuthContext';
import { useBaby } from '../../../contexts/BabyContext';
import {
  getRiskAssessment, RisksResponse,
  riskLevelColor, confidenceBadge, hoursAgo,
} from '../../../services/aiService';

// ─── Circular progress ────────────────────────────────────────────────────────
const CircularProgress = ({ pct, size = 64, color }: { pct: number; size?: number; color: string }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#F3F4F6" strokeWidth={7} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={7} fill="none"
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ fontSize: 13, fontWeight: '800', color }}>{pct}%</Text>
    </View>
  );
};

// ─── Risk Category Card ───────────────────────────────────────────────────────
const RiskCard = ({
  icon, label, score, level, color,
}: { icon: string; label: string; score: number; level: string; color: string }) => (
  <View style={styles.riskCard}>
    <Text style={styles.riskIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.riskCardLabel}>{label}</Text>
      <View style={styles.riskBarTrack}>
        <View style={[styles.riskBarFill, { width: `${score * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
    <View style={{ alignItems: 'flex-end', gap: 2 }}>
      <CircularProgress pct={Math.round((1 - score) * 100)} size={52} color={color} />
      <Text style={[styles.riskLevelText, { color }]}>{level}</Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const RiskAssessmentScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedBaby } = useBaby();
  const [data, setData]     = useState<RisksResponse | null>(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.isPro || !selectedBaby) {
      setLoad(false);
      return;
    }
    setLoad(true); setError(null);
    try { setData(await getRiskAssessment(selectedBaby._id)); }
    catch (e: any) { setError(e.message || 'Failed to load risk assessment'); }
    finally { setLoad(false); }
  }, [selectedBaby, user?.isPro]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const overallColor = data ? riskLevelColor(data.overallRisk) : '#10B981';
  const overallPct   = data ? Math.round((1 - data.overallScore / 100) * 100) : 0;
  const badge        = data ? confidenceBadge(data.confidenceLevel) : null;

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={typeof Colors.primary === 'string' ? Colors.primary : Colors.primary.DEFAULT || '#7C3AED'} />
            <Text style={styles.loadingText}>Analysing health risks…</Text>
          </View>
        ) : !user?.isPro ? (
          <View style={styles.center}>
            <Ionicons name="lock-closed-outline" size={64} color="#F59E0B" />
            <Text style={styles.proTitle}>PRO Version Required</Text>
            <Text style={styles.proDesc}>
              Upgrade to PRO to unlock detailed health risk assessments and actionable recommendations.
            </Text>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/profile/subscription' as any)}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.upgradeBtnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="star" size={20} color="#fff" />
                <Text style={styles.upgradeBtnText}>Upgrade to PRO</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !data ? null : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>

            {/* Overall Health Risk */}
            <View style={[styles.overallCard, { borderColor: overallColor }]}>
              <View style={styles.overallLeft}>
                <Text style={styles.overallTitle}>Overall Health Risk</Text>
                <Text style={[styles.overallLevel, { color: overallColor }]}>
                  {data.overallRisk.charAt(0).toUpperCase() + data.overallRisk.slice(1)} Risk
                </Text>
                <Text style={styles.overallSub}>{selectedBaby?.name}</Text>
                {badge && (
                  <View style={[styles.confBadge, { borderColor: badge.color }]}>
                    <Text style={[styles.confBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                )}
                <Text style={styles.modelTag}>{data.modelUsed} Model</Text>
                {data.cached && (
                  <Text style={styles.cachedNote}>⏱ {hoursAgo(data.lastCalculated)}</Text>
                )}
              </View>
              <CircularProgress pct={overallPct} size={90} color={overallColor} />
            </View>

            {/* Risk Categories */}
            <Text style={styles.sectionTitle}>Risk Categories</Text>
            <RiskCard icon="📏" label="Growth & Development"
              score={data.riskCategories.growth.score}
              level={data.riskCategories.growth.level}
              color={data.riskCategories.growth.color} />
            <RiskCard icon="🥗" label="Nutritional"
              score={data.riskCategories.nutrition.score}
              level={data.riskCategories.nutrition.level}
              color={data.riskCategories.nutrition.color} />
            <RiskCard icon="🧠" label="Developmental"
              score={data.riskCategories.development.score}
              level={data.riskCategories.development.level}
              color={data.riskCategories.development.color} />
            <RiskCard icon="😊" label="Behavioral"
              score={data.riskCategories.behavioral.score}
              level={data.riskCategories.behavioral.level}
              color={data.riskCategories.behavioral.color} />

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recommended Actions</Text>
                {data.recommendations.map((rec, i) => (
                  <View key={i} style={[styles.recCard, rec.priority === 'urgent' && styles.recCardUrgent]}>
                    <View style={styles.recTopRow}>
                      <Text style={styles.recIcon}>{rec.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recTitle}>{rec.title}</Text>
                        <Text style={styles.recDesc}>{rec.description}</Text>
                      </View>
                      <View style={[styles.priorityPill, {
                        backgroundColor: rec.priority === 'urgent' ? '#FEE2E2' : rec.priority === 'high' ? '#FEF3C7' : '#F0FDF4',
                      }]}>
                        <Text style={[styles.priorityText, {
                          color: rec.priority === 'urgent' ? '#DC2626' : rec.priority === 'high' ? '#D97706' : '#16A34A',
                        }]}>{rec.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                    {rec.actions.length > 0 && (
                      <View style={styles.actionsList}>
                        {rec.actions.map((action, j) => (
                          <View key={j} style={styles.actionItem}>
                            <Text style={styles.actionBullet}>•</Text>
                            <Text style={styles.actionText}>{action}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  errorText:   { fontSize: 15, color: '#EF4444', textAlign: 'center' },
  retryBtn:    { backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:{ color: '#fff', fontWeight: '600', fontSize: 15 },

  overallCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 2, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  overallLeft: { flex: 1, gap: 4 },
  overallTitle:{ fontSize: 13, color: '#6B7280', fontWeight: '600' },
  overallLevel:{ fontSize: 22, fontWeight: '800' },
  overallSub:  { fontSize: 12, color: '#9CA3AF' },
  confBadge:   { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  confBadgeText:{ fontSize: 11, fontWeight: '600' },
  modelTag:    { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  cachedNote:  { fontSize: 11, color: '#F59E0B', fontStyle: 'italic' },

  sectionTitle:{ fontSize: 15, fontWeight: '700', color: '#1F2937' },

  riskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  riskIcon:      { fontSize: 22 },
  riskCardLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  riskBarTrack:  { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  riskBarFill:   { height: '100%', borderRadius: 3 },
  riskLevelText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  recCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  recCardUrgent: { borderLeftWidth: 3, borderLeftColor: '#EF4444' },
  recTopRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  recIcon:       { fontSize: 22 },
  recTitle:      { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  recDesc:       { fontSize: 12, color: '#6B7280', marginTop: 2 },
  priorityPill:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  priorityText:  { fontSize: 10, fontWeight: '700' },
  actionsList:   { gap: 4, paddingLeft: 8 },
  actionItem:    { flexDirection: 'row', gap: 6 },
  actionBullet:  { color: '#9CA3AF', fontSize: 13 },
  actionText:    { fontSize: 13, color: '#374151', flex: 1 },

  proTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginTop: 8 },
  proDesc: { fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  upgradeBtn: { marginTop: 12, width: '100%', paddingHorizontal: 20 },
  upgradeBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
  },
  upgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
