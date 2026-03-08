import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SecondaryTopBar } from "@/components/SecondaryTopBar";
import { useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import {
  AssessmentReportResponse,
  getAssessmentReportById,
  getLatestAssessmentReport,
} from "@/services/riskAssessmentService";
import { useAuth } from "@/contexts/AuthContext";

const formatRiskColor = (risk: string) => {
  if (risk === "High") return "#DC2626";
  if (risk === "Medium") return "#EA580C";
  return "#16A34A";
};

const formatLabel = (value?: string | null) => {
  if (!value) return "N/A";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const FullReportScreen: React.FC = () => {
  const params = useLocalSearchParams<{ assessmentId?: string }>();
  const { user } = useAuth();
  const [report, setReport] = useState<AssessmentReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isTablet = width >= 768;

  useEffect(() => {
    const loadReport = async () => {
      const assessmentId = params.assessmentId;

      try {
        setLoading(true);
        setError(null);

        let fetchedReport: AssessmentReportResponse;
        if (!assessmentId || typeof assessmentId !== "string") {
          fetchedReport = await getLatestAssessmentReport(user?._id);
        } else {
          fetchedReport = await getAssessmentReportById(assessmentId);
        }

        setReport(fetchedReport);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load report";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [params.assessmentId, user?._id]);

  const assessment = report?.assessment;
  const child = report?.child;

  const riskColor = useMemo(
    () => formatRiskColor(assessment?.risk || "Low"),
    [assessment?.risk]
  );

  const escapeHtml = (value?: string | number | null) => {
    if (value === null || value === undefined) return "N/A";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const createReportHtml = (reportData: AssessmentReportResponse) => {
    const reportAssessment = reportData.assessment;
    const reportChild = reportData.child;
    const symptoms = reportAssessment.symptoms
      .map((item) => `<li>${escapeHtml(formatLabel(item.label))} (${escapeHtml(formatLabel(item.severity))})</li>`)
      .join("");
    const dangerSigns = reportAssessment.dangerSigns
      .map((item) => `<li>${escapeHtml(formatLabel(item))}</li>`)
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h1 { font-size: 22px; margin-bottom: 6px; }
            h2 { font-size: 16px; margin: 18px 0 8px; color: #111827; }
            p, li { font-size: 13px; line-height: 1.45; }
            .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
            .meta { color: #4b5563; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .label { font-weight: bold; }
            ul { margin: 6px 0 0 18px; padding: 0; }
          </style>
        </head>
        <body>
          <h1>PediTrack Assessment Report</h1>
          <p class="meta">Assessment ID: ${escapeHtml(reportData.assessment_id)} | Generated: ${escapeHtml(new Date().toLocaleString())}</p>

          <div class="card">
            <h2>Child Information</h2>
            <p><span class="label">Name:</span> ${escapeHtml(reportChild.name || "Unknown Child")}</p>
            <p><span class="label">Age:</span> ${escapeHtml(reportChild.age_months)} months</p>
            <p><span class="label">Weight:</span> ${escapeHtml(reportChild.weight_kg)} kg</p>
          </div>

          <div class="card">
            <h2>Risk Summary</h2>
            <p><span class="label">Priority:</span> ${escapeHtml(reportAssessment.risk)}</p>
            <p><span class="label">Score:</span> ${escapeHtml(reportAssessment.score)} / 10</p>
            <p><span class="label">Assessed:</span> ${escapeHtml(new Date(reportAssessment.date).toLocaleString())}</p>
            <p><span class="label">Summary:</span> ${escapeHtml(reportAssessment.summary)}</p>
          </div>

          <div class="card">
            <h2>Danger Signs</h2>
            ${dangerSigns ? `<ul>${dangerSigns}</ul>` : `<p>None reported</p>`}
          </div>

          <div class="card">
            <h2>Symptoms</h2>
            ${symptoms ? `<ul>${symptoms}</ul>` : `<p>None reported</p>`}
          </div>

          <div class="card">
            <h2>Vitals</h2>
            <div class="grid">
              <p><span class="label">Temp:</span> ${escapeHtml(reportAssessment.vitals.temperature)} °C</p>
              <p><span class="label">HR:</span> ${escapeHtml(reportAssessment.vitals.heartRate)} bpm</p>
              <p><span class="label">RR:</span> ${escapeHtml(reportAssessment.vitals.respRate)} bpm</p>
              <p><span class="label">SpO₂:</span> ${escapeHtml(reportAssessment.vitals.spo2)} %</p>
              <p><span class="label">AVPU:</span> ${escapeHtml(reportAssessment.vitals.avpu)}</p>
              <p><span class="label">Pain:</span> ${escapeHtml(reportAssessment.vitals.pain)}</p>
            </div>
          </div>

          <div class="card">
            <h2>Feeding & Hydration</h2>
            <p><span class="label">Feeding Normally:</span> ${escapeHtml(formatLabel(reportAssessment.feeding.feedingNormally))}</p>
            <p><span class="label">Drinking Normally:</span> ${escapeHtml(formatLabel(reportAssessment.feeding.drinkingNormally))}</p>
            <p><span class="label">Urine Output:</span> ${escapeHtml(formatLabel(reportAssessment.feeding.urineOutput))}</p>
          </div>

          <div class="card">
            <h2>Context & History</h2>
            <p><span class="label">Chronic Conditions:</span> ${escapeHtml(reportAssessment.context.chronicConditions || "N/A")}</p>
            <p><span class="label">Medications:</span> ${escapeHtml(reportAssessment.context.medications || "N/A")}</p>
            <p><span class="label">Recent Travel:</span> ${escapeHtml(reportAssessment.context.recentTravel || "N/A")}</p>
            <p><span class="label">Environmental Exposures:</span> ${escapeHtml(reportAssessment.context.exposures || "N/A")}</p>
            <p><span class="label">Onset:</span> ${escapeHtml(reportAssessment.context.onset || "N/A")}</p>
            <p><span class="label">Trend:</span> ${escapeHtml(reportAssessment.context.trend || "N/A")}</p>
          </div>
        </body>
      </html>
    `;
  };

  const createPdfFile = async () => {
    if (!report) {
      throw new Error("Report data not available");
    }

    const html = createReportHtml(report);
    const generated = await Print.printToFileAsync({ html });
    const safeId = (report.assessment_id || "report").replace(/[^a-zA-Z0-9-_]/g, "_");
    const outputUri = `${FileSystem.documentDirectory}assessment-report-${safeId}.pdf`;

    await FileSystem.copyAsync({ from: generated.uri, to: outputUri });
    return outputUri;
  };

  const openSaveShareSheet = async (fileUri: string, dialogTitle: string) => {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert("PDF Created", `Saved in app storage:\n${fileUri}`);
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle,
    });
  };

  const handleDownloadPdf = async () => {
    try {
      setIsCreatingPdf(true);
      const fileUri = await createPdfFile();
      await openSaveShareSheet(fileUri, "Save Assessment Report PDF");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate PDF";
      Alert.alert("Download Failed", message);
    } finally {
      setIsCreatingPdf(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setIsCreatingPdf(true);
      const fileUri = await createPdfFile();
      await openSaveShareSheet(fileUri, "Share Assessment Report PDF");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to share PDF";
      Alert.alert("Share Failed", message);
    } finally {
      setIsCreatingPdf(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SecondaryTopBar />
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.stateText}>Loading assessment report...</Text>
        </View>
      </View>
    );
  }

  if (error || !report || !assessment || !child) {
    return (
      <View style={styles.container}>
        <SecondaryTopBar />
        <View style={styles.centeredState}>
          <Ionicons name="alert-circle" size={40} color="#DC2626" />
          <Text style={styles.stateText}>{error || "Assessment report not found."}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SecondaryTopBar />
      <ScrollView
        contentContainerStyle={{
          padding: isCompact ? 14 : 18,
          maxWidth: isTablet ? 700 : 560,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { fontSize: isCompact ? 17 : 19 }]}>Assessment Full Report</Text>
        {/* Child Info */}
        <View style={[styles.card, { padding: isCompact ? 14 : 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="person-circle" size={36} color="#7C3AED" style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.childName}>{child.name || "Unknown Child"}, Age {child.age_months ?? "N/A"} months</Text>
              <Text style={styles.childDetails}>Weight: {child.weight_kg ?? "N/A"} kg</Text>
            </View>
          </View>
          <Text style={styles.reportDate}>Assessed: {new Date(assessment.date).toLocaleString()}</Text>
        </View>
        {/* Risk Summary */}
        <View style={[styles.card, { borderLeftColor: riskColor, borderLeftWidth: 5, padding: isCompact ? 14 : 16 }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="warning" size={22} color={riskColor} style={{ marginRight: 8 }} />
            <Text style={[styles.riskLabel, { color: riskColor }]}>{assessment.risk} Priority</Text>
          </View>
          <Text style={styles.summary}>{assessment.summary}</Text>
        </View>
        {/* Danger Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Signs</Text>
          <View style={styles.chipRow}>
            {assessment.dangerSigns.length === 0 ? (
              <Text style={styles.emptyText}>No danger signs reported</Text>
            ) : assessment.dangerSigns.map((d) => (
              <View key={d} style={[styles.chip, { backgroundColor: '#fee2e2', borderColor: '#dc2626' }]}> 
                <Ionicons name="alert" size={14} color="#dc2626" style={{ marginRight: 4 }} />
                <Text style={styles.chipText}>{formatLabel(d)}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <View style={styles.chipRow}>
            {assessment.symptoms.length === 0 ? (
              <Text style={styles.emptyText}>No symptoms reported</Text>
            ) : assessment.symptoms.map((s) => (
              <View key={s.label} style={[styles.chip, { backgroundColor: '#f3f4f6', borderColor: '#a855f7' }]}> 
                <Ionicons name="medkit" size={14} color="#a855f7" style={{ marginRight: 4 }} />
                <Text style={styles.chipText}>{formatLabel(s.label)} <Text style={{ color: '#a855f7', fontWeight: '700' }}>({formatLabel(s.severity)})</Text></Text>
              </View>
            ))}
          </View>
        </View>
        {/* Vitals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vitals</Text>
          <View style={styles.vitalsRow}>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>Temp</Text><Text style={styles.vitalValue}>{assessment.vitals.temperature ?? 'N/A'}{assessment.vitals.temperature != null ? '°C' : ''}</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>HR</Text><Text style={styles.vitalValue}>{assessment.vitals.heartRate ?? 'N/A'}{assessment.vitals.heartRate != null ? ' bpm' : ''}</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>RR</Text><Text style={styles.vitalValue}>{assessment.vitals.respRate ?? 'N/A'}{assessment.vitals.respRate != null ? ' bpm' : ''}</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>SpO₂</Text><Text style={styles.vitalValue}>{assessment.vitals.spo2 ?? 'N/A'}{assessment.vitals.spo2 != null ? '%' : ''}</Text></View>
            <View style={styles.vitalBox}><Text style={styles.vitalLabel}>AVPU</Text><Text style={styles.vitalValue}>{assessment.vitals.avpu || 'N/A'}</Text></View>
          </View>
        </View>
        {/* Feeding & Hydration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feeding & Hydration</Text>
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: '#ede9fe', borderColor: '#7C3AED' }]}><Text style={styles.chipText}>Feeding: {formatLabel(assessment.feeding.feedingNormally)}</Text></View>
            <View style={[styles.chip, { backgroundColor: '#ede9fe', borderColor: '#7C3AED' }]}><Text style={styles.chipText}>Drinking: {formatLabel(assessment.feeding.drinkingNormally)}</Text></View>
            <View style={[styles.chip, { backgroundColor: '#ede9fe', borderColor: '#7C3AED' }]}><Text style={styles.chipText}>Urine: {formatLabel(assessment.feeding.urineOutput)}</Text></View>
          </View>
        </View>
        {/* Context & History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context & History</Text>
          <View style={styles.contextRow}><Ionicons name="medkit" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Chronic: {assessment.context.chronicConditions || 'N/A'}</Text></View>
          <View style={styles.contextRow}><Ionicons name="medkit" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Meds: {assessment.context.medications || 'N/A'}</Text></View>
          <View style={styles.contextRow}><Ionicons name="airplane" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Travel: {assessment.context.recentTravel || 'N/A'}</Text></View>
          <View style={styles.contextRow}><Ionicons name="leaf" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Exposures: {assessment.context.exposures || 'N/A'}</Text></View>
          <View style={styles.contextRow}><Ionicons name="time" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Onset: {assessment.context.onset || 'N/A'}</Text></View>
          <View style={styles.contextRow}><Ionicons name="trending-down" size={15} color="#7C3AED" style={{ marginRight: 6 }} /><Text style={styles.contextText}>Trend: {assessment.context.trend || 'N/A'}</Text></View>
        </View>
        {/* Download/Share */}
        <View style={[styles.footerRow, { flexDirection: isCompact ? 'column' : 'row' }]}>
          <TouchableOpacity
            style={[styles.footerBtn, isCreatingPdf && styles.disabledBtn]}
            onPress={handleDownloadPdf}
            disabled={isCreatingPdf}
          >
            <Ionicons name="download" size={18} color="#6366F1" style={{ marginRight: 8 }} />
            <Text style={styles.footerBtnText}>{isCreatingPdf ? "Preparing..." : "Download PDF"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              isCreatingPdf && styles.disabledBtn,
              isCompact ? { marginTop: 8 } : null,
            ]}
            onPress={handleSharePdf}
            disabled={isCreatingPdf}
          >
            <Ionicons name="share-social" size={18} color="#6366F1" style={{ marginRight: 8 }} />
            <Text style={styles.footerBtnText}>Share</Text>
          </TouchableOpacity>
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
  centeredState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 12,
    fontSize: 15,
    color: "#334155",
    textAlign: "center",
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
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 4,
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
  disabledBtn: {
    opacity: 0.65,
  },
  footerBtnText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 15,
  },
});
