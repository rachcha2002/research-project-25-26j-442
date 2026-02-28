import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Static Info Data ─────────────────────────────────────────────────────────
const MODELS = [
  {
    icon: '🔬',
    name: 'Growth Snapshot Model (DNN)',
    subtitle: 'Used when < 4 measurements available',
    accuracy: '77%',
    accuracyLabel: 'AUC Score',
    color: '#3B82F6',
    details: [
      'Analyses a single measurement with 15 health factors',
      'Considers birth data, allergies & vaccination status',
      'Accuracy: MAPE 25.7% on growth trajectory prediction',
    ],
  },
  {
    icon: '🧬',
    name: 'Growth Timeline Model (LSTM)',
    subtitle: 'Used when ≥ 4 measurements available',
    accuracy: '94%',
    accuracyLabel: 'AUC Score',
    color: '#8B5CF6',
    details: [
      'Analyses patterns across your last 3 measurements',
      'Understands growth velocity and trajectory trends',
      'Higher accuracy — improves as more data is added',
    ],
  },
];

const HOW_IT_WORKS = [
  { step: '1', text: 'We collect your child\'s measurements, nutrition, sleep, and health records' },
  { step: '2', text: 'The AI selects the best model based on how much data is available' },
  { step: '3', text: 'Predictions are made and compared against WHO 2006 Growth Standards' },
  { step: '4', text: 'Results are expressed as plain risk levels and actionable recommendations' },
];

const RISK_LEVELS = [
  { label: 'Low Risk', color: '#10B981', desc: 'Growing as expected — keep going!' },
  { label: 'Moderate Risk', color: '#F59E0B', desc: 'Worth monitoring — see recommendations' },
  { label: 'High Risk', color: '#EF4444', desc: 'Consult your pediatrician soon' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const ModelPerformanceScreen: React.FC = () => (
  <>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.heroIcon}>🤖</Text>
          <Text style={styles.heroTitle}>About Our AI</Text>
          <Text style={styles.heroSub}>
            PediTrack uses two machine learning models trained on over 50,000 pediatric
            growth records to predict your child's health trajectory.
          </Text>
        </LinearGradient>

        {/* Models */}
        <Text style={styles.sectionTitle}>Our AI Models</Text>
        {MODELS.map((m) => (
          <View key={m.name} style={[styles.modelCard, { borderLeftColor: m.color }]}>
            <View style={styles.modelTopRow}>
              <Text style={styles.modelIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.modelName}>{m.name}</Text>
                <Text style={styles.modelSub}>{m.subtitle}</Text>
              </View>
              <View style={[styles.accBadge, { backgroundColor: m.color + '20', borderColor: m.color }]}>
                <Text style={[styles.accScore, { color: m.color }]}>{m.accuracy}</Text>
                <Text style={[styles.accLabel, { color: m.color }]}>{m.accuracyLabel}</Text>
              </View>
            </View>
            <View style={styles.detailsList}>
              {m.details.map((d, i) => (
                <View key={i} style={styles.detailRow}>
                  <Ionicons name="checkmark-circle" size={16} color={m.color} />
                  <Text style={styles.detailText}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* How it works */}
        <Text style={styles.sectionTitle}>How Predictions Work</Text>
        <View style={styles.stepsCard}>
          {HOW_IT_WORKS.map(({ step, text }) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNum}>{step}</Text>
              </View>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* WHO Standards note */}
        <View style={styles.whoCard}>
          <Ionicons name="globe-outline" size={22} color="#3B82F6" />
          <View style={{ flex: 1 }}>
            <Text style={styles.whoTitle}>WHO Growth Standards (2006)</Text>
            <Text style={styles.whoDesc}>
              All predictions are benchmarked against World Health Organization growth
              standards for children aged 0–84 months. Percentiles and z-scores are
              calculated per WHO's LMS method.
            </Text>
          </View>
        </View>

        {/* Risk legend */}
        <Text style={styles.sectionTitle}>Risk Levels Explained</Text>
        {RISK_LEVELS.map(({ label, color, desc }) => (
          <View key={label} style={styles.riskLegendRow}>
            <View style={[styles.riskDot, { backgroundColor: color }]} />
            <View>
              <Text style={[styles.riskLegendLabel, { color }]}>{label}</Text>
              <Text style={styles.riskLegendDesc}>{desc}</Text>
            </View>
          </View>
        ))}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.disclaimerText}>
            AI predictions are for informational purposes only and do not replace
            professional medical advice. Always consult your pediatrician for clinical decisions.
          </Text>
        </View>

        {/* Version info */}
        <Text style={styles.versionText}>PediTrack AI v1.0 · Models trained Feb 2026</Text>
      </ScrollView>
    </SafeAreaView>
  </>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll:    { flex: 1 },
  content:   { padding: 16, paddingBottom: 40, gap: 16 },

  hero: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  heroIcon:  { fontSize: 42 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },

  modelCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  modelTopRow:{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modelIcon:  { fontSize: 24 },
  modelName:  { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  modelSub:   { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  accBadge:   { borderRadius: 10, borderWidth: 1, padding: 8, alignItems: 'center' },
  accScore:   { fontSize: 18, fontWeight: '800' },
  accLabel:   { fontSize: 10, fontWeight: '600' },
  detailsList:{ gap: 6 },
  detailRow:  { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  detailText: { fontSize: 13, color: '#374151', flex: 1, lineHeight: 18 },

  stepsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  stepRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  stepNum:    { fontSize: 13, fontWeight: '800', color: '#3B82F6' },
  stepText:   { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },

  whoCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
  },
  whoTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  whoDesc:  { fontSize: 12, color: '#3B82F6', lineHeight: 18, marginTop: 4 },

  riskLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  riskDot:         { width: 14, height: 14, borderRadius: 7 },
  riskLegendLabel: { fontSize: 14, fontWeight: '700' },
  riskLegendDesc:  { fontSize: 12, color: '#6B7280', marginTop: 2 },

  disclaimerCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  disclaimerText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18 },
  versionText: { textAlign: 'center', fontSize: 11, color: '#9CA3AF' },
});
