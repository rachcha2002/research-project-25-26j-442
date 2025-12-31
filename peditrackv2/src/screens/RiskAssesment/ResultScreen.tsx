import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

// Color and style presets for each risk level
const RISK_STYLES = {
  low: {
    color: "#16A34A",
    background: "#DCFCE7",
    glow: "#bbf7d0",
    icon: "checkmark-circle",
    label: "LOW RISK",
    explain:
      "Symptoms appear manageable, but continue monitoring. If symptoms worsen or new ones appear, reassess immediately.",
    actions: [
      { label: "Monitor Symptoms", icon: "time", color: "#6366F1" },
      { label: "Find Nearby Hospital", icon: "location", color: "#0ea5e9" },
      { label: "View Full Report", icon: "document-text", color: "#64748B" },
    ],
  },
  medium: {
    color: "#EA580C",
    background: "#FFEDD5",
    glow: "#fdba74",
    icon: "alert-circle",
    label: "MEDIUM RISK",
    explain:
      "Medical evaluation recommended soon. Your child’s symptoms warrant professional assessment within the next few hours.",
    actions: [
      { label: "Request Teleconsultation", icon: "call", color: "#6366F1" },
      { label: "Find Nearby Hospital", icon: "location", color: "#0ea5e9" },
      { label: "View Full Report", icon: "document-text", color: "#64748B" },
    ],
  },
  high: {
    color: "#DC2626",
    background: "#FEE2E2",
    glow: "#fecaca",
    icon: "warning",
    label: "HIGH RISK",
    explain:
      "Immediate medical attention is strongly recommended. Your child's symptoms indicate a potentially serious condition.",
    actions: [
      { label: "Call Emergency Services", icon: "alert", color: "#DC2626" },
      { label: "Find Nearby Hospital", icon: "location", color: "#0ea5e9" },
      { label: "View Full Report", icon: "document-text", color: "#64748B" },
    ],
  },
};
export const AssessmentResultScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract the result object passed from assessment screen
  // TODO: Replace with backend result when available
  const result = params.result
    ? JSON.parse(params.result as string)
    : { risk_level: "low", score: 2.1 };

  // Handle both risk_level and risk properties, with fallback to "low"
  const riskValue = result.risk_level || result.risk || "low";
  const normalizedRisk = riskValue.toLowerCase();
  // Validate that risk is one of the valid keys, default to "low" if not
  const risk: "low" | "medium" | "high" = (normalizedRisk === "low" || normalizedRisk === "medium" || normalizedRisk === "high")
    ? normalizedRisk as "low" | "medium" | "high"
    : "low";
  const style = RISK_STYLES[risk];
  // Dummy score for now (simulate backend)
  const score = typeof result.score === 'number' ? result.score : (risk === 'low' ? 2.1 : risk === 'medium' ? 5.2 : 8.7);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Tabs */}
        <View style={styles.tabs}>
          {(["low", "medium", "high"] as const).map((tab) => (
            <View
              key={tab}
              style={[
                styles.tab,
                risk === tab && {
                  backgroundColor: RISK_STYLES[tab].color,
                  shadowColor: RISK_STYLES[tab].color,
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                  elevation: 2,
                },
              ]}
            >
              <Text
                style={{
                  color: risk === tab ? "#fff" : "#64748B",
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </Text>
            </View>
          ))}
        </View>

        {/* Glowing Risk Icon & Score */}
        <View style={styles.center}>
          <View style={[styles.glowWrap, { shadowColor: style.glow }]}> 
            <View
              style={[
                styles.circle,
                { backgroundColor: style.background, borderColor: style.color },
              ]}
            >
              <Ionicons name={style.icon as any} size={60} color={style.color} />
            </View>
          </View>
          <Text style={[styles.riskLabel, { color: style.color }]}>
            {style.label}
          </Text>
          <Text style={[styles.scoreText, { color: style.color }]}>Risk Score: {score.toFixed(1)}/10</Text>
          <Text style={styles.timeText}>
            Assessed: {new Date().toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* What This Means Card */}
        <View style={[styles.infoCard, { borderLeftColor: style.color, borderLeftWidth: 4, shadowColor: style.color }]}> 
          <View style={styles.infoHeader}>
            <Ionicons
              name="information-circle"
              size={22}
              color={style.color}
            />
            <Text style={[styles.infoTitle, { color: style.color }]}>What This Means</Text>
          </View>
          <Text style={styles.infoBody}>{style.explain}</Text>
        </View>


        {/* Recommended Actions */}
        <Text style={styles.sectionTitle}>Recommended Actions</Text>
        {style.actions.map((a: { label: string; icon: string; color: string }, index: number) => {
          // Only connect teleconsultation/emergency for medium/high risk
            const isTeleconsult = (a.label === "Request Teleconsultation" && (risk === "medium" || risk === "high")) ||
              (a.label === "Call Emergency Services" && risk === "high");
            const isNearbyHospital = a.label === "Find Nearby Hospital" && (risk === "medium" || risk === "high");
          const isFullReport = a.label === "View Full Report";
          return (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { borderLeftColor: a.color, borderLeftWidth: 4, shadowColor: a.color }]}
              onPress={
                isTeleconsult
                  ? () => router.push("/teleconsultation")
                  : isNearbyHospital
                  ? () => router.push("/nearby-hospitals")
                  : isFullReport
                  ? () => router.push("/assesment-report")
                  : undefined
              }
            >
              <View style={[styles.actionIconWrap, { backgroundColor: a.color + '22' }]}> 
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          );
        })}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={18} color="#6366F1" style={{ marginRight: 6 }} />
          <Text style={styles.disclaimerText}>
            This assessment is not a substitute for professional medical advice. Always consult healthcare providers for medical decisions.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.footerText}>Save Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.push("/")}
        >
          <Text style={[styles.footerText, { color: "#fff" }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginHorizontal: 8,
    backgroundColor: "#E2E8F0",
    minWidth: 70,
    alignItems: 'center',
  },
  center: {
    alignItems: "center",
    marginBottom: 24,
  },
  glowWrap: {
    shadowColor: '#bbf7d0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 8,
    borderRadius: 80,
    marginBottom: 0,
  },
  circle: {
    width: 130,
    height: 130,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  riskLabel: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: 'center',
  },
  timeText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: '#bbf7d0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'column',
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  infoBody: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 8,
    color: "#334155",
  },
  actionCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: "#6366F1",
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    marginRight: 10,
  },
  doneBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    alignItems: "center",
  },
  footerText: {
    fontWeight: "600",
    fontSize: 15,
  },
});
