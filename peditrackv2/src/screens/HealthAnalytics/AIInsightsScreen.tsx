import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBaby } from '../../contexts/BabyContext';
import {
  getHealthScore, HealthScoreResponse,
  confidenceBadge, riskLevelColor, hoursAgo,
} from '../../services/aiService';

// ─── Sub-components ───────────────────────────────────────────────────────────

const FactorBar = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.factorRow}>
    <Text style={styles.factorLabel}>{label}</Text>
    <View style={styles.factorBarTrack}>
      <View style={[styles.factorBarFill, { width: `${value}%` }]} />
    </View>
    <Text style={styles.factorPct}>{value}%</Text>
  </View>
);

const ConfidenceBadge = ({ level }: { level: string }) => {
  const badge = confidenceBadge(level as any);
  return (
    <View style={[styles.confidenceBadge, { borderColor: badge.color }]}>
      <Text style={[styles.confidenceText, { color: badge.color }]}>{badge.label}</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const AIInsightsScreen: React.FC = () => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const [data, setData] = useState<HealthScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selectedBaby) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHealthScore(selectedBaby._id);
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Failed to load health score');
    } finally {
      setLoading(false);
    }
  }, [selectedBaby]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const riskColor = data ? riskLevelColor(data.riskLevel) : '#10B981';
  const scoreGradient: [string, string] =
    data?.riskLevel === 'high'     ? ['#F87171', '#EF4444'] :
    data?.riskLevel === 'moderate' ? ['#FCD34D', '#F59E0B'] :
                                     ['#60A5FA', '#3B82F6'];

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Calculating health score…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !selectedBaby ? (
          <View style={styles.centerState}>
            <Ionicons name="person-add-outline" size={52} color="#7C3AED" />
            <Text style={styles.errorText}>Add a baby profile to see AI insights</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Health Score Card */}
            <LinearGradient
              colors={scoreGradient}
              style={styles.scoreCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.scoreTopRow}>
                <View>
                  <View style={styles.scoreValueRow}>
                    <Text style={styles.scoreValue}>{Math.round(data!.healthScore)}</Text>
                    <Text style={styles.scoreTotal}>/100</Text>
                  </View>
                  <Text style={styles.scoreLabel}>Health Score</Text>
                </View>
                <View>
                  <ConfidenceBadge level={data!.confidenceLevel} />
                  <Text style={styles.modelBadge}>{data!.modelUsed} Model</Text>
                </View>
              </View>

              <View style={styles.scoreDetails}>
                <View style={styles.scoreDetailRow}>
                  <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
                  <Text style={styles.scoreDetailText}>
                    Risk Level: {data!.riskLevel.charAt(0).toUpperCase() + data!.riskLevel.slice(1)}
                  </Text>
                </View>
                <Text style={styles.scoreDetailText}>
                  Confidence: {Math.round(data!.confidence * 100)}%
                </Text>
              </View>

              {data!.cached && (
                <Text style={styles.cachedNote}>
                  ⏱ Cached · Updated {hoursAgo(data!.lastCalculated)}
                </Text>
              )}
            </LinearGradient>

            {/* Factor Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>What Affects{'\n'}Your Score?</Text>
                <Text style={styles.subNote}>AI-calculated weights</Text>
              </View>
              <View style={styles.factorsList}>
                <FactorBar label="Growth"       value={data!.factors.growth} />
                <FactorBar label="Nutrition"    value={data!.factors.nutrition} />
                <FactorBar label="Development"  value={data!.factors.development} />
                <FactorBar label="Behavior"     value={data!.factors.behavior} />
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/health-analytics/growth-details/ai-predictions' as any)}
              >
                <Ionicons name="trending-up" size={22} color="#3B82F6" />
                <Text style={styles.actionLabel}>Growth{'\n'}Predictions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/health-analytics/ai-insights/risk-assessment' as any)}
              >
                <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                <Text style={styles.actionLabel}>Risk{'\n'}Assessment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/health-analytics/ai-insights/model-performance' as any)}
              >
                <Ionicons name="information-circle" size={22} color="#F59E0B" />
                <Text style={styles.actionLabel}>About{'\n'}Our AI</Text>
              </TouchableOpacity>
            </View>

            {/* Baby info */}
            <View style={styles.babyInfoCard}>
              <Ionicons name="person-circle-outline" size={20} color="#7C3AED" />
              <Text style={styles.babyInfoText}>
                Showing insights for <Text style={styles.babyName}>{selectedBaby.name}</Text>
              </Text>
            </View>
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
  content: { padding: 16, paddingBottom: 32, gap: 16 },

  // States
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  loadingText: { fontSize: 15, color: '#6B7280', marginTop: 8 },
  errorText:   { fontSize: 15, color: '#EF4444', textAlign: 'center' },
  retryBtn:    { backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:{ color: '#fff', fontWeight: '600', fontSize: 15 },

  // Score card
  scoreCard:   { borderRadius: 20, padding: 20, gap: 12 },
  scoreTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  scoreValueRow:{ flexDirection: 'row', alignItems: 'flex-end' },
  scoreValue:  { fontSize: 56, fontWeight: '800', color: '#fff' },
  scoreTotal:  { fontSize: 22, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  scoreLabel:  { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  scoreDetails:{ gap: 4 },
  scoreDetailRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  riskDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  scoreDetailText:{ color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  cachedNote:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontStyle: 'italic' },
  modelBadge:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'right', marginTop: 4 },

  // Confidence badge
  confidenceBadge: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  confidenceText:  { fontSize: 11, fontWeight: '600' },

  // Factors
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  subNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'right' },
  factorsList: { gap: 10 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factorLabel: { width: 90, fontSize: 13, color: '#374151' },
  factorBarTrack: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  factorBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  factorPct: { width: 36, fontSize: 12, color: '#6B7280', textAlign: 'right' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  actionLabel: { fontSize: 12, color: '#374151', fontWeight: '600', textAlign: 'center' },

  // Baby info
  babyInfoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12,
  },
  babyInfoText: { fontSize: 13, color: '#374151' },
  babyName: { fontWeight: '700', color: '#3B82F6' },
});
