import React, { useState } from "react";
import { classifySkinImage, submitAssessment } from "@/services/riskAssessmentService";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { SecondaryTopBar } from "@/components/SecondaryTopBar";
import { useAuth } from "@/contexts/AuthContext";
import { useBaby } from "@/contexts/BabyContext";

const Colors = {
  background: "#FAFAFF",
  dark: "#0F172A",
  inactive: "#64748B",
  primary: "#7C3AED", 
  danger: "#EF4444",
  card: "#fff",
  border: "#E6E9F2",
  success: "#10B981",
};

type Symptom = {
  key: string;
  label: string;
  selected?: boolean;
  severity?: "mild" | "moderate" | "severe";
  details?: string;
};

export const EmergencyAssessmentScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedBaby } = useBaby();

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
  const weightKg = selectedBaby?.birthWeight ?? null;

  // Vitals (ED-PEWS)
  const [temperature, setTemperature] = useState(""); 
  const [heartRate, setHeartRate] = useState("");
  const [respRate, setRespRate] = useState("");
  const [spo2, setSpo2] = useState("");

  const [avpu, setAvpu] = useState<"Alert" | "Voice" | "Pain" | "Unresponsive">(
    "Alert"
  );

  // Symptoms list with severity & details
  const initialSymptoms: Symptom[] = [
    { key: "fast_breathing", label: "Fast breathing" },
    { key: "chest_indrawing", label: "Chest indrawing" },
    { key: "noisy_breathing", label: "Noisy breathing" },
    { key: "wheezing", label: "Wheezing" },
    { key: "cough", label: "Cough" },
    { key: "fever", label: "Fever" },
    { key: "rash", label: "Rash" },
    { key: "vomiting", label: "Vomiting" },
    { key: "diarrhea", label: "Diarrhea" },
    { key: "reduced_urine", label: "Reduced urine output" },
    { key: "seizure", label: "Seizure" },
    { key: "confusion", label: "Confusion / Disorientation" },
    { key: "lethargy", label: "Excessive sleepiness / Lethargy" },
    { key: "trauma", label: "Injury / Trauma" },
  ];
  const [symptoms, setSymptoms] = useState<Symptom[]>(initialSymptoms);

  // UI state for collapsible symptom groups
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    Respiratory: true,
    Digestive: false,
    Neurological: false,
    General: false,
  });

  // Group symptoms for collapsible sections
  const symptomGroups = [
    {
      key: "Respiratory",
      icon: "swap-vertical",
      color: "#06b6d4",
      symptoms: ["fast_breathing", "chest_indrawing", "noisy_breathing", "wheezing", "cough"],
    },
    {
      key: "Digestive",
      icon: "restaurant",
      color: "#f59e42",
      symptoms: ["vomiting", "diarrhea", "reduced_urine"],
    },
    {
      key: "Neurological",
      icon: "git-branch",
      color: "#a855f7",
      symptoms: ["seizure", "confusion", "lethargy"],
    },
    {
      key: "General",
      icon: "sparkles",
      color: "#ec4899",
      symptoms: ["fever", "rash", "trauma"],
    },
  ];

  // Danger signs (ETAT)
  const [dangerSigns, setDangerSigns] = useState<string[]>([]);

  // Feeding & hydration
  const [feedingNormally, setFeedingNormally] = useState<"yes" | "no" | "unknown">(
    "unknown"
  );
  const [drinkingNormally, setDrinkingNormally] = useState<
    "yes" | "no" | "unknown"
  >("unknown");
  const [urineOutputLast12h, setUrineOutputLast12h] = useState<
    "normal" | "reduced" | "none" | "unknown"
  >("unknown");

  // History / context
  const [chronicConditions, setChronicConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [recentTravel, setRecentTravel] = useState("");
  const [environmentExposures, setEnvironmentExposures] = useState("");
  const [symptomOnset, setSymptomOnset] = useState<
    "<1hr" | "1-6hrs" | "6-24hrs" | "1+ days"
  >("<1hr");
  const [symptomTrend, setSymptomTrend] = useState<"worse" | "same" | "better">(
    "same"
  );

  // Optional photo (placeholder)
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isTablet = width >= 768;

  // UI Helpers
  const toggleSymptom = (key: string) => {
    setSymptoms((prev) =>
      prev.map((s) => (s.key === key ? { ...s, selected: !s.selected } : s))
    );
  };
  const setSymptomSeverity = (key: string, severity: Symptom["severity"]) => {
    setSymptoms((prev) => prev.map((s) => (s.key === key ? { ...s, severity } : s)));
  };
  const updateSymptomDetails = (key: string, details: string) => {
    setSymptoms((prev) => prev.map((s) => (s.key === key ? { ...s, details } : s)));
  };

  const toggleDangerSign = (k: string) => {
    setDangerSigns((prev) => (prev.includes(k) ? prev.filter((p) => p !== k) : [...prev, k]));
  };

  const pickRashImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Please grant photo library access to upload rash images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // ED-PEWS Validation Helpers
  const validateVitalRange = (value: string, fieldName: string): { valid: boolean; error?: string } => {
    if (!value || value.trim() === "") {
      return { valid: true }; // Optional field, empty is OK
    }

    const num = Number(value);
    if (Number.isNaN(num)) {
      return { valid: false, error: `${fieldName} must be a valid number. You entered: "${value}"` };
    }

    // Pediatric plausible ranges
    if (fieldName === "Temperature") {
      if (num < 35 || num > 41) {
        return { valid: false, error: `Temperature ${num}°C is outside plausible pediatric range (35-41°C). Please verify.` };
      }
    } else if (fieldName === "Heart rate") {
      if (num < 40 || num > 220) {
        return { valid: false, error: `Heart rate ${num} bpm is outside plausible pediatric range (40-220 bpm). Please verify.` };
      }
    } else if (fieldName === "Respiratory rate") {
      if (num < 10 || num > 80) {
        return { valid: false, error: `Respiratory rate ${num} bpm is outside plausible pediatric range (10-80 bpm). Please verify.` };
      }
    } else if (fieldName === "SpO2") {
      if (num < 50 || num > 100) {
        return { valid: false, error: `SpO₂ ${num}% is outside plausible range (50-100%). Please verify.` };
      }
    }

    return { valid: true };
  };

  const checkEDPEWSCompleteness = (): { isIncomplete: boolean; message?: string; providedCount?: number } => {
    const vitalsProvided = [
      temperature.trim() !== "",
      heartRate.trim() !== "",
      respRate.trim() !== "",
      spo2.trim() !== "",
    ];
    const providedCount = vitalsProvided.filter((v) => v).length;

    // If user provided some but not all vitals, warn them but allow submission
    if (providedCount > 0 && providedCount < 4) {
      return {
        isIncomplete: true,
        message: `ED-PEWS Assessment is incomplete (${providedCount}/4 vital signs provided). For better triage results in this low-resource setting, please provide all available vital signs. Proceed anyway?`,
        providedCount,
      };
    }

    return { isIncomplete: false };
  };

  const validateConsistency = (): { consistent: boolean; warning?: string } => {
    // If AVPU is "Pain" or "Unresponsive", flag it as a concern
    if (avpu === "Unresponsive" && !dangerSigns.includes("unresponsive")) {
      return {
        consistent: false,
        warning: `Child is marked as Unresponsive (AVPU). This is a danger sign. Please mark "Unresponsive / Not waking" in the danger signs section to ensure proper escalation.`,
      };
    }

    // If danger signs present, AVPU should NOT be "Alert"
    if (dangerSigns.length > 0 && avpu === "Alert") {
      return {
        consistent: false,
        warning: `Danger signs are selected, but responsiveness is set to "Alert". Please verify the child's actual state and update AVPU if needed.`,
      };
    }

    return { consistent: true };
  };

  const validateAllInputs = (): boolean => {
    // Validate individual vital ranges
    const tempCheck = validateVitalRange(temperature, "Temperature");
    if (!tempCheck.valid) {
      Alert.alert("Invalid Temperature", tempCheck.error || "Please enter a valid temperature.");
      return false;
    }

    const hrCheck = validateVitalRange(heartRate, "Heart rate");
    if (!hrCheck.valid) {
      Alert.alert("Invalid Heart Rate", hrCheck.error || "Please enter a valid heart rate.");
      return false;
    }

    const rrCheck = validateVitalRange(respRate, "Respiratory rate");
    if (!rrCheck.valid) {
      Alert.alert("Invalid Respiratory Rate", rrCheck.error || "Please enter a valid respiratory rate.");
      return false;
    }

    const spo2Check = validateVitalRange(spo2, "SpO2");
    if (!spo2Check.valid) {
      Alert.alert("Invalid SpO2", spo2Check.error || "Please enter a valid SpO2 value.");
      return false;
    }

    // Check consistency
    const consistency = validateConsistency();
    if (!consistency.consistent) {
      Alert.alert("Triage Consistency Warning", consistency.warning || "Please review the selected values.");
      return false;
    }

    return true;
  };

  // Basic validation & submit
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!selectedBaby) {
      Alert.alert("No baby profile", "Please select or create a baby profile first.");
      return;
    }

    // Basic required fields: age or name, at least one symptom or vitals
    if (!ageMonths && !childName) {
      Alert.alert("Missing info", "Please enter child's age (months) or name.");
      return;
    }

    // Validate ED-PEWS vitals (ranges and consistency)
    if (!validateAllInputs()) {
      return;
    }

    // Check ED-PEWS completeness (non-blocking, but warn user)
    const completeness = checkEDPEWSCompleteness();
    if (completeness.isIncomplete) {
      return Alert.alert(
        "Incomplete ED-PEWS Data",
        completeness.message,
        [
          { text: "Cancel", onPress: () => {}, style: "cancel" },
          { text: "Continue Anyway", onPress: () => proceedWithSubmission() },
        ]
      );
    }

    // If ED-PEWS is complete, proceed directly
    proceedWithSubmission();
  };

  const proceedWithSubmission = async () => {
    const selectedSymptoms = symptoms.filter((s) => s.selected).map((s) => ({
      key: s.key,
      severity: s.severity ?? "moderate",
      details: s.details ?? "",
    }));

    const hasRash = selectedSymptoms.some((s) => s.key === "rash");
    if (hasRash && !photoUri) {
      Alert.alert("Rash image required", "Please upload an image of the rash.");
      return;
    }

    // If any danger sign present -> immediate navigation to high-risk flow
    const hasImmediateFlag = dangerSigns.length > 0 || avpu === "Unresponsive" || selectedSymptoms.some(s=>s.key==="seizure");

    setIsSubmitting(true);

    let skinFindings = null;
    if (hasRash && photoUri) {
      try {
        skinFindings = await classifySkinImage(photoUri);
      } catch (err) {
        Alert.alert(
          "Skin model unavailable",
          "Could not classify the rash image right now. Please try again in a moment."
        );
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      userId: user?._id || null,
      child: {
        name: childName || null,
        age_months: ageMonths,
        weight_kg: weightKg,
      },
      vitals: {
        temperature_c: temperature ? Number(temperature) : null,
        heart_rate_bpm: heartRate ? Number(heartRate) : null,
        respiratory_rate_bpm: respRate ? Number(respRate) : null,
        spo2_percent: spo2 ? Number(spo2) : null,

        avpu: avpu,
      },
      symptoms: selectedSymptoms,
      danger_signs: dangerSigns,
      feeding: {
        feeding_normally: feedingNormally,
        drinking_normally: drinkingNormally,
        urine_output_last_12h: urineOutputLast12h,
      },
      context: {
        chronic_conditions: chronicConditions,
        medications: medications,
        recent_travel: recentTravel,
        environmental_exposures: environmentExposures,
        onset: symptomOnset,
        trend: symptomTrend,
      },
      optional: {
        photo_uri: photoUri,
        timestamp: new Date().toISOString(),
      },
      skin_findings: skinFindings,
      immediate_flag: hasImmediateFlag,
    }

    try {
      const result = await submitAssessment(payload);
      // Navigate directly to result screen
      router.push({
        pathname: "/emergency-response/assessment-result",
        params: {
          result: JSON.stringify({
            ...result,
            child: payload.child,
          }),
        },
      });
    } catch (err) {
      console.warn("submit error", err);
      // For development, navigate to result screen with simulated result
      router.push({
        pathname: "/emergency-response/assessment-result",
        params: { result: JSON.stringify({ risk: "medium", payload }) },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Danger sign labels
  const dangerOptions = [
    { key: "convulsion", label: "Convulsion / Seizure" },
    { key: "unresponsive", label: "Unresponsive / Not waking" },
    { key: "vomits_everything", label: "Vomits everything" },
    { key: "severe_breathing", label: "Severe breathing difficulty" },
    { key: "cannot_drink", label: "Cannot drink / feed" },
    { key: "cyanosis", label: "Blue lips / skin (cyanosis)" },
  ];

  return (
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: isCompact ? 14 : 18,
            maxWidth: isTablet ? 680 : 520,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SecondaryTopBar  />
        <Text style={[styles.title, { fontSize: isCompact ? 17 : 18 }]}>Emergency Assessment</Text>

        {/* Demographics (Profile Info) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Child Info</Text>
          <View style={styles.profileRow}>
            <Ionicons name="person-circle" size={44} color={Colors.primary} style={{ marginRight: 14 }} />
            <View>
              <Text style={styles.profileName}>{childName}</Text>
              <Text style={styles.profileDetails}>Age: {ageMonths ?? '-'} months</Text>
              <Text style={styles.profileDetails}>Weight: {weightKg ?? '-'} kg</Text>
            </View>
          </View>
        </View>

        {/* Vital Signs (Modern Card) */}
        <View style={[styles.sectionCard, { padding: isCompact ? 14 : 18, borderRadius: isCompact ? 14 : 18 }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="pulse" size={20} color={Colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.cardTitle, { color: Colors.danger }]}>Vital Signs</Text>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Temperature (°C)</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. 38.5"
                keyboardType="numeric"
                value={temperature}
                onChangeText={setTemperature}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>SpO₂ (%) (optional)</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. 96"
                keyboardType="numeric"
                value={spo2}
                onChangeText={setSpo2}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Heart rate (bpm)</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. 120"
                keyboardType="numeric"
                value={heartRate}
                onChangeText={setHeartRate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Resp. rate (bpm)</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. 28"
                keyboardType="numeric"
                value={respRate}
                onChangeText={setRespRate}
              />
            </View>
          </View>
          <View >
            <View style={[styles.input, { flex: 1, justifyContent: "center", backgroundColor: '#f3f4f6', borderWidth: 0 }]}> 
              <Text style={{ color: Colors.inactive, marginBottom: 6 }}>Responsiveness</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {(["Alert", "Voice", "Pain", "Unresponsive"] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setAvpu(v)}
                    style={[styles.avpuBtn, avpu === v && { borderColor: Colors.primary, borderWidth: 1.5 }]}
                  >
                    <Text style={{ color: avpu === v ? Colors.primary : Colors.dark }}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Symptoms (Collapsible Groups) */}
        <View style={[styles.sectionCard, { padding: isCompact ? 14 : 18, borderRadius: isCompact ? 14 : 18 }]}>
          <Text style={styles.cardTitle}>Symptoms</Text>
          {symptomGroups.map((group) => (
            <View key={group.key} style={styles.symptomGroupCard}>
              <TouchableOpacity
                style={styles.symptomGroupHeader}
                onPress={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                activeOpacity={0.7}
              >
                <Ionicons name={group.icon as any} size={22} color={group.color} style={{ marginRight: 8 }} />
                <Text style={[styles.symptomGroupTitle, { color: group.color }]}>{group.key}</Text>
                <Ionicons
                  name={openGroups[group.key] ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={Colors.inactive}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
              {openGroups[group.key] && (
                <View style={styles.symptomGroupContent}>
                  {group.symptoms.map((symKey) => {
                    const s = symptoms.find((sym) => sym.key === symKey);
                    if (!s) return null;
                    return (
                      <View key={s.key} style={{ marginBottom: 10 }}>
                        <TouchableOpacity
                          onPress={() => toggleSymptom(s.key)}
                          style={[
                            styles.symptomBtn,
                            s.selected && { backgroundColor: "#FEF3C7", borderColor: Colors.primary },
                          ]}
                        >
                          <Text style={{ color: Colors.dark }}>{s.label}</Text>
                        </TouchableOpacity>
                        {s.selected && (
                          <View style={{ flexDirection: "row", marginTop: 6 }}>
                            {(["mild", "moderate", "severe"] as Symptom["severity"][]).map((sev) => (
                              <TouchableOpacity
                                key={sev}
                                onPress={() => setSymptomSeverity(s.key, sev)}
                                style={[
                                  styles.severityBtn,
                                  s.severity === sev && { borderColor: Colors.primary, borderWidth: 1.5 },
                                ]}
                              >
                                <Text style={{ color: s.severity === sev ? Colors.primary : Colors.dark }}>
                                  {sev}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                        {s.selected && (
                          <View>
                            <Text style={styles.label}>Additional details (optional)</Text>
                            <TextInput
                              placeholder="Describe what you observed"
                              style={[styles.input, { marginTop: 2 }]}
                              value={s.details}
                              onChangeText={(text) => updateSymptomDetails(s.key, text)}
                            />
                          </View>
                        )}
                        {s.selected && s.key === "rash" && (
                          <View style={styles.rashImageBlock}>
                            <Text style={styles.label}>Rash Image</Text>
                            <TouchableOpacity style={styles.uploadBtn} onPress={pickRashImage}>
                              <Ionicons name="camera" size={20} color={Colors.dark} />
                              <Text style={{ marginLeft: 8 }}>
                                {photoUri ? "Change rash image" : "Upload rash image"}
                              </Text>
                            </TouchableOpacity>
                            {photoUri && (
                              <View style={styles.previewWrap}>
                                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                                <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.removeBtn}>
                                  <Text style={styles.removeBtnText}>Remove</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Danger Signs (Modern Card) */}
        <View style={[styles.sectionCard, { padding: isCompact ? 14 : 18, borderRadius: isCompact ? 14 : 18 }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="alert" size={20} color={Colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.cardTitle, { color: Colors.danger }]}>Danger Signs (ETAT)</Text>
          </View>
          <View style={styles.dangerChipRow}>
            {dangerOptions.map((d) => (
              <TouchableOpacity
                key={d.key}
                onPress={() => toggleDangerSign(d.key)}
                style={[
                  styles.dangerChip,
                  dangerSigns.includes(d.key) && { backgroundColor: Colors.danger, borderColor: Colors.danger },
                ]}
              >
                <Ionicons name="warning" size={16} color={dangerSigns.includes(d.key) ? "#fff" : Colors.danger} style={{ marginRight: 6 }} />
                <Text style={{ color: dangerSigns.includes(d.key) ? "#fff" : Colors.dark, fontWeight: '600' }}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feeding & Hydration (Modern Card) */}
        <View style={[styles.sectionCard, { padding: isCompact ? 14 : 18, borderRadius: isCompact ? 14 : 18 }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="restaurant" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.cardTitle, { color: Colors.primary }]}>Feeding & Hydration</Text>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Feeding normally?</Text>
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                {(["yes", "no", "unknown"] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setFeedingNormally(v)}
                    style={[styles.smallBtn, feedingNormally === v && { borderColor: Colors.primary, backgroundColor: '#ede9fe' }]}
                  >
                    <Text style={{ color: feedingNormally === v ? Colors.primary : Colors.dark, fontWeight: feedingNormally === v ? '700' : '500' }}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Drinking normally?</Text>
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                {(["yes", "no", "unknown"] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setDrinkingNormally(v)}
                    style={[styles.smallBtn, drinkingNormally === v && { borderColor: Colors.primary, backgroundColor: '#ede9fe' }]}
                  >
                    <Text style={{ color: drinkingNormally === v ? Colors.primary : Colors.dark, fontWeight: drinkingNormally === v ? '700' : '500' }}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Urine output (12h)</Text>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              {(["normal", "reduced", "none", "unknown"] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setUrineOutputLast12h(v)}
                  style={[styles.smallBtn, urineOutputLast12h === v && { borderColor: Colors.primary, backgroundColor: '#ede9fe' }]}
                >
                  <Text style={{ color: urineOutputLast12h === v ? Colors.primary : Colors.dark, fontWeight: urineOutputLast12h === v ? '700' : '500' }}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Context & History (Modern Card) */}
        <View style={[styles.sectionCard, { padding: isCompact ? 14 : 18, borderRadius: isCompact ? 14 : 18 }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="book" size={20} color={Colors.success} style={{ marginRight: 8 }} />
            <Text style={[styles.cardTitle, { color: Colors.success }]}>Context & History</Text>
          </View>
          <Text style={styles.label}>Chronic conditions</Text>
          <TextInput
            placeholder="Chronic conditions (asthma, epilepsy, etc.)"
            style={styles.input}
            value={chronicConditions}
            onChangeText={setChronicConditions}
          />
          <Text style={styles.label}>Current medications</Text>
          <TextInput
            placeholder="Current medications"
            style={styles.input}
            value={medications}
            onChangeText={setMedications}
          />
          <Text style={styles.label}>Recent travel</Text>
          <TextInput
            placeholder="Recent travel / exposures"
            style={styles.input}
            value={recentTravel}
            onChangeText={setRecentTravel}
          />
          <Text style={styles.label}>Environmental exposures</Text>
          <TextInput
            placeholder="Environment exposures (smoke, allergens)"
            style={styles.input}
            value={environmentExposures}
            onChangeText={setEnvironmentExposures}
          />
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>When did symptoms start?</Text>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              {(["<1hr", "1-6hrs", "6-24hrs", "1+ days"] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setSymptomOnset(v)}
                  style={[styles.smallBtn, symptomOnset === v && { borderColor: Colors.primary, backgroundColor: '#bbf7d0' }]}
                >
                  <Text style={{ color: symptomOnset === v ? Colors.success : Colors.dark, fontWeight: symptomOnset === v ? '700' : '500' }}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Trend</Text>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              {(["worse", "same", "better"] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setSymptomTrend(v)}
                  style={[styles.smallBtn, symptomTrend === v && { borderColor: Colors.primary, backgroundColor: '#bbf7d0' }]}
                >
                  <Text style={{ color: symptomTrend === v ? Colors.success : Colors.dark, fontWeight: symptomTrend === v ? '700' : '500' }}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        {/* Submit */}
        <View style={{ marginVertical: 20 }}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600" }}>Get Risk Assessment</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 18,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark,
    marginBottom: 12,
    marginTop: 20,
    marginLeft:'auto',
    marginRight:'auto',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderColor: '#f3f4f6',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  symptomGroupCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 10,
    borderColor: '#ede9fe',
    borderWidth: 1,
    overflow: 'hidden',
  },
  symptomGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
  symptomGroupTitle: {
    fontWeight: '600',
    fontSize: 15,
  },
  symptomGroupContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#f9fafb',
  },
   sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark,
  },
  profileDetails: {
    fontSize: 14,
    color: Colors.inactive,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    color: Colors.dark,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avpuBtn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  painBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  symptomBtn: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
  },
  severityBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    marginRight: 6,
  },
  dangerChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  dangerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.danger,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 1,
  },
  label: {
    color: Colors.inactive,
    marginBottom: 6,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    marginRight: 8,
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rashImageBlock: {
    marginTop: 8,
  },
  previewWrap: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewImage: {
    width: 88,
    height: 88,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtn: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeBtnText: {
    color: Colors.danger,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
