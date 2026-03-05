import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../../contexts/AuthContext';
import { useBaby } from '../../../contexts/BabyContext';
import {
  getGrowthPredictions, PredictionsResponse,
  riskLevelColor, confidenceBadge, hoursAgo,
} from '../../../services/aiService';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────

export const AIPredictionsScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedBaby } = useBaby();
  const [data, setData]       = useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selectedBaby) return;
    setLoading(true); setError(null);
    try {
      setData(await getGrowthPredictions(selectedBaby._id));
    } catch (e: any) {
      setError(e.message || 'Could not load predictions');
    } finally { setLoading(false); }
  }, [selectedBaby]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Format a trajectory label: ISO date → "MMM 'YY", future tags (+3m) pass through
  const formatTrajLabel = (m: number | string | null): string => {
    if (m == null) return '?';
    if (typeof m === 'number') return m === 0 ? 'Now' : `+${m}mo`;
    // Future relative labels like '+3m' pass through
    if (typeof m === 'string' && m.startsWith('+')) return m;
    // Try to parse as ISO date
    const d = new Date(m as string);
    if (isNaN(d.getTime())) return m as string;
    const monthStr = d.toLocaleString('en-US', { month: 'short' });
    const yearStr = String(d.getFullYear()).slice(2);
    return `${monthStr} '${yearStr}`;
  };

  // ── Find the index where predictions start
  const predictionStartIndex = data?.trajectory?.months.findIndex(m => 
    typeof m === 'string' && m.startsWith('+')
  ) ?? -1;

  const chartData = data && data.trajectory && data.trajectory.heights
    ? {
        labels: data.trajectory.months.map(formatTrajLabel),
        datasets: [{
          data: data.trajectory.heights,
          color: () => '#3B82F6',
          strokeWidth: 3,
        }],
      }
    : { labels: [], datasets: [{ data: [0] }] };

  const chartDataWeight = data && data.trajectory && data.trajectory.weights
    ? {
        labels: data.trajectory.months.map(formatTrajLabel),
        datasets: [{
          data: data.trajectory.weights,
          color: () => '#10B981',
          strokeWidth: 3,
        }],
      }
    : { labels: [], datasets: [{ data: [0] }] };

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={typeof Colors.primary === 'string' ? Colors.primary : Colors.primary.DEFAULT || '#3B82F6'} />
            <Text style={styles.loadingText}>Generating 12-month forecast…</Text>
          </View>
        ) : !user?.isPro ? (
          <View style={styles.center}>
            <Ionicons name="lock-closed-outline" size={64} color="#F59E0B" />
            <Text style={styles.proTitle}>PRO Version Required</Text>
            <Text style={styles.proDesc}>
              Upgrade to PRO to unlock AI Growth Predictions and visualize your baby's future trajectory.
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
            {error.includes('4+') && (
              <Text style={styles.hintText}>
                Add more measurements to unlock growth predictions.
              </Text>
            )}
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !data ? null : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>

            {/* Header badge */}
            <View style={styles.aiModeBadge}>
              <Ionicons name="sparkles" size={18} color="#3B82F6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.aiModeTitle}>AI Growth Predictions</Text>
                <Text style={styles.aiModeSubtitle}>
                  {data.cached
                    ? `Cached · ${hoursAgo(data.lastCalculated)}`
                    : `LSTM model · ${Math.round((data.trajectory.confidences[0] ?? 0.94) * 100)}% starting confidence`}
                </Text>
              </View>
              {data.cached && <Text style={styles.cachedTag}>CACHED</Text>}
            </View>

            {/* Data Quality Note */}
            <View style={[styles.aiModeBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 }]}>
              <Ionicons name="bulb-outline" size={20} color="#D97706" />
              <Text style={{ flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 }}>
                <Text style={{ fontWeight: '700' }}>Pro Tip: </Text>
                Consistently store measurements, milestones, and daily records in the app to feed the AI and get the most accurate insights.
              </Text>
            </View>

            {/* Line chart (Height) */}
            {data.trajectory.heights.length > 3 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Height Trajectory (cm)</Text>
                <LineChart
                  data={chartData}
                  width={width - 48}
                  height={180}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    labelColor: () => '#9CA3AF',
                    propsForDots: { r: '5', strokeWidth: '2' },
                  }}
                  getDotColor={(dataPoint, dataPointIndex) => 
                    predictionStartIndex !== -1 && dataPointIndex >= predictionStartIndex ? '#F59E0B' : '#3B82F6'
                  }
                  bezier
                  style={{ borderRadius: 12 }}
                  withShadow={false}
                />
              </View>
            )}

            {/* Line chart (Weight) */}
            {data.trajectory.weights.length > 3 && (
              <View style={[styles.chartCard, { marginTop: 12 }]}>
                <Text style={styles.chartTitle}>Weight Trajectory (kg)</Text>
                <LineChart
                  data={chartDataWeight}
                  width={width - 48}
                  height={180}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: () => '#9CA3AF',
                    propsForDots: { r: '5', strokeWidth: '2' },
                  }}
                  getDotColor={(dataPoint, dataPointIndex) => 
                    predictionStartIndex !== -1 && dataPointIndex >= predictionStartIndex ? '#F59E0B' : '#10B981'
                  }
                  bezier
                  style={{ borderRadius: 12 }}
                  withShadow={false}
                />
              </View>
            )}

            {/* Forecast cards */}
            <Text style={styles.sectionTitle}>Milestones</Text>
            <View style={styles.forecastRow}>
              {[
                { label: '3 Months', pred: data.predictions.threeMonths },
                { label: '6 Months', pred: data.predictions.sixMonths },
                { label: '12 Months', pred: data.predictions.twelveMonths },
              ].map(({ label, pred }) => pred && (
                <View key={label} style={styles.forecastCard}>
                  <Text style={styles.forecastPeriod}>{label}</Text>
                  <Text style={styles.forecastHeight}>{pred.height_cm.toFixed(1)} cm</Text>
                  <Text style={styles.forecastWeight}>{pred.weight_kg.toFixed(1)} kg</Text>
                  <Text style={styles.forecastConf}>{Math.round(pred.confidence * 100)}% conf.</Text>
                </View>
              ))}
            </View>

            {/* Current metrics */}
            <View style={styles.currentCard}>
              <Text style={styles.sectionTitle}>Current Measurements</Text>
              <View style={styles.metricsRow}>
                {[
                  { label: 'Height', val: `${data.current.height?.toFixed(1)} cm` },
                  { label: 'Weight', val: `${data.current.weight?.toFixed(1)} kg` },
                  { label: 'BMI',    val: data.current.bmi?.toFixed(1) ?? '—' },
                ].map(({ label, val }) => (
                  <View key={label} style={styles.metricItem}>
                    <Text style={styles.metricVal}>{val}</Text>
                    <Text style={styles.metricLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Warnings */}
            {data.warnings.length > 0 && (
              <View style={styles.warningsCard}>
                <Text style={styles.sectionTitle}>⚠️ Clinical Notes</Text>
                {data.warnings.map((w, i) => (
                  <View key={i} style={[styles.warningRow,
                    { borderLeftColor: w.severity === 'high' ? '#EF4444' : w.severity === 'medium' ? '#F59E0B' : '#60A5FA' }]}>
                    <Text style={styles.warningText}>{w.message}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {data.recommendations.slice(0, 3).map((rec, i) => (
              <View key={i} style={styles.recCard}>
                <Text style={styles.recIcon}>{rec.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recDesc} numberOfLines={2}>{rec.description}</Text>
                </View>
                <View style={[styles.priorityTag,
                  { backgroundColor: rec.priority === 'urgent' ? '#FEE2E2' : rec.priority === 'high' ? '#FEF3C7' : '#F0FDF4' }]}>
                  <Text style={[styles.priorityText,
                    { color: rec.priority === 'urgent' ? '#DC2626' : rec.priority === 'high' ? '#D97706' : '#16A34A' }]}>
                    {rec.priority}
                  </Text>
                </View>
              </View>
            ))}
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
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  errorText:   { fontSize: 15, color: '#EF4444', textAlign: 'center' },
  hintText:    { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  retryBtn:    { backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:{ color: '#fff', fontWeight: '600', fontSize: 15 },

  aiModeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
  },
  aiModeTitle:   { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  aiModeSubtitle:{ fontSize: 12, color: '#6B7280' },
  cachedTag:     { fontSize: 10, color: '#F59E0B', fontWeight: '700',
                   backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },

  periodSelector:{ flexDirection: 'row', gap: 8 },
  periodBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  periodBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  periodLabel:     { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  periodLabelActive:{ color: 'rgba(255,255,255,0.8)' },
  periodVal:       { fontSize: 13, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  periodValActive: { color: '#fff' },

  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  chartTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },

  forecastRow: { flexDirection: 'row', gap: 10 },
  forecastCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  forecastPeriod:{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  forecastHeight:{ fontSize: 17, fontWeight: '800', color: '#1F2937', marginTop: 4 },
  forecastWeight:{ fontSize: 13, color: '#6B7280' },
  forecastConf:  { fontSize: 11, color: '#10B981', marginTop: 4, fontWeight: '600' },

  currentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12 },
  metricsRow:  { flexDirection: 'row', justifyContent: 'space-around' },
  metricItem:  { alignItems: 'center', gap: 2 },
  metricVal:   { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  metricLabel: { fontSize: 12, color: '#9CA3AF' },

  warningsCard: { backgroundColor: '#FFF7ED', borderRadius: 16, padding: 14, gap: 8 },
  warningRow:   { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 4 },
  warningText:  { fontSize: 13, color: '#374151' },

  recCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  recIcon:  { fontSize: 24 },
  recTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  recDesc:  { fontSize: 12, color: '#6B7280', marginTop: 2 },
  priorityTag:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  priorityText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  
  // PRO Lock
  proTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginTop: 8 },
  proDesc: { fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  upgradeBtn: { marginTop: 12, width: '100%', paddingHorizontal: 20 },
  upgradeBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
  },
  upgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
