import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SecondaryTopBar } from "@/components/SecondaryTopBar";

// Dummy data for demonstration
const DUMMY_REPORT = {
  child: {
    name: "Emma",
    age: 4,
    weight: 12.5,
  },
  assessment: {
    date: "2025-12-24T14:45:00Z",
    risk: "High",
    score: 8.7,
    summary: "High fever, difficulty breathing, unresponsive to voice.",
    dangerSigns: ["Unresponsive", "Severe breathing difficulty"],
    symptoms: [
      { label: "Fever", severity: "severe" },
      { label: "Difficulty breathing", severity: "severe" },
      { label: "Lethargy", severity: "moderate" },
    ],
    vitals: {
      temperature: 39.2,
      heartRate: 148,
      respRate: 38,
      spo2: 91,
      capillaryRefill: 4,
      avpu: "Voice",
      pain: 6,
    },
    feeding: {
      feedingNormally: "no",
      drinkingNormally: "no",
      urineOutput: "reduced",
    },
    context: {
      chronicConditions: "Asthma",
      medications: "Salbutamol",
      recentTravel: "None",
      exposures: "None",
      onset: "6-24hrs",
      trend: "worse",
    },
  },
};

export const FullReportScreen: React.FC = () => {
  const { child, assessment } = DUMMY_REPORT;
  const riskColor = assessment.risk === "High" ? "#DC2626" : assessment.risk === "Medium" ? "#EA580C" : "#16A34A";

  return (
    <View style={styles.container}>
      <SecondaryTopBar />
      <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Assessment Full Report</Text>
        {/* Child Info */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="person-circle" size={36} color="#7C3AED" style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.childName}>{child.name}, Age {child.age}</Text>
              <Text style={styles.childDetails}>Weight: {child.weight} kg</Text>
            </View>
          </View>
          <Text style={styles.reportDate}>Assessed: {new Date(assessment.date).toLocaleString()}</Text>
        </View>
        {/* Risk Summary */}
        <View style={[styles.card, { borderLeftColor: riskColor, borderLeftWidth: 5 }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="warning" size={22} color={riskColor} style={{ marginRight: 8 }} />
            <Text style={[styles.riskLabel, { color: riskColor }]}>{assessment.risk} RISK</Text>
            <Text style={[styles.score, { color: riskColor }]}>Score: {assessment.score}/10</Text>
          </View>
          <Text style={styles.summary}>{assessment.summary}</Text>
        </View>
        {/* Danger Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Signs</Text>
          <View style={styles.chipRow}>
            {assessment.dangerSigns.map((d) => (
              <View key={d} style={[styles.chip, { backgroundColor: '#fee2e2', borderColor: '#dc2626' }]}> 
                <Ionicons name="alert" size={14} color="#dc2626" style={{ marginRight: 4 }} />
                <Text style={styles.chipText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <View style={styles.chipRow}>
            {assessment.symptoms.map((s) => (
              <View key={s.label} style={[styles.chip, { backgroundColor: '#f3f4f6', borderColor: '#a855f7' }]}> 
                <Ionicons name="medkit" size={14} color="#a855f7" style={{ marginRight: 4 }} />
                <Text style={styles.chipText}>{s.label} <Text style={{ color: '#a855f7', fontWeight: '700' }}>({s.severity})</Text></Text>
              </View>
            ))}
          </View>
        </View>
        {/* Vitals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vitals</Text>
          <View style={styles.vitalsRow}>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>Temp</Text><Text style={styles.vitalValue}>{assessment.vitals.temperature}°C</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>HR</Text><Text style={styles.vitalValue}>{assessment.vitals.heartRate} bpm</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>RR</Text><Text style={styles.vitalValue}>{assessment.vitals.respRate} bpm</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>SpO₂</Text><Text style={styles.vitalValue}>{assessment.vitals.spo2}%</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>CR</Text><Text style={styles.vitalValue}>{assessment.vitals.capillaryRefill} s</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>AVPU</Text><Text style={styles.vitalValue}>{assessment.vitals.avpu}</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>Pain</Text><Text style={styles.vitalValue}>{assessment.vitals.pain}</Text></View>
          </View>
        </View>
        {/* Feeding & Hydration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feeding & Hydration</Text>
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: '#ede9fe', borderColor: '#7C3AED' }]}><Text style={styles.chipText}>Feeding: {assessment.feeding.feedingNormally}</Text></View>
            <View style={[styles.chip, { backgroundColor: '#ede9fe', borderColor: '#7C3AED' }]}><Text style={styles.chipText}>Drinking: {assessment.feeding.drinkingNormally}</Text></View>
            <View style={[styles.chip, { backgroundColor: '#ede9fe', borderColor: '#7C3AED' }]}><Text style={styles.chipText}>Urine: {assessment.feeding.urineOutput}</Text></View>
          </View>
        </View>
        {/* Context & History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context & History</Text>
          <View style={styles.contextRow}><Ionicons name="medkit" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Chronic: {assessment.context.chronicConditions}</Text></View>
          <View style={styles.contextRow}><Ionicons name="medkit" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Meds: {assessment.context.medications}</Text></View>
          <View style={styles.contextRow}><Ionicons name="airplane" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Travel: {assessment.context.recentTravel}</Text></View>
          <View style={styles.contextRow}><Ionicons name="leaf" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Exposures: {assessment.context.exposures}</Text></View>
          <View style={styles.contextRow}><Ionicons name="time" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Onset: {assessment.context.onset}</Text></View>
          <View style={styles.contextRow}><Ionicons name="trending-down" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Trend: {assessment.context.trend}</Text></View>
        </View>
        {/* Download/Share */}
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.footerBtn}><Ionicons name="download" size={18} color="#6366F1" style={{ marginRight: 8 }} /><Text style={styles.footerBtnText}>Download PDF</Text></TouchableOpacity>
          <TouchableOpacity style={styles.footerBtn}><Ionicons name="share-social" size={18} color="#6366F1" style={{ marginRight: 8 }} /><Text style={styles.footerBtnText}>Share</Text></TouchableOpacity>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
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
  childName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#22223B',
  },
  childDetails: {
    fontSize: 14,
    color: '#64748B',
  },
  reportDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
  score: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  summary: {
    color: '#334155',
    fontSize: 15,
    marginTop: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#22223B',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#22223B',
    fontWeight: '600',
    fontSize: 13,
  },
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  vitalBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  vitalLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  vitalValue: {
    color: '#22223B',
    fontWeight: '700',
    fontSize: 15,
    marginTop: 2,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  contextText: {
    color: '#334155',
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 20,
  },
  footerBtn: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 14,
    marginHorizontal: 4,
  },
  footerBtnText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 15,
  },
});
