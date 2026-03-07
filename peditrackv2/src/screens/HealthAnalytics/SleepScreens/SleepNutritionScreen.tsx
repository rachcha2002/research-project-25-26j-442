import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useFocusEffect } from 'expo-router';
import { useBaby } from '@/contexts/BabyContext';
import Slider from '@react-native-community/slider';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import {
  getSleepLogs, logSleep, deleteSleepLog, SleepLog,
  getFeedingLogs, logFeeding, deleteFeedingLog, FeedingLog,
} from '@/services/healthAnalyticsService';

// ── Types ─────────────────────────────────────────────────────────────────────

type SleepQuality = 'sleepsWell' | 'wakes1-2times' | 'wakesFrequently' | 'difficultyFallingAsleep' | 'restless';
type ActiveTab = 'sleep' | 'nutrition';

// ── Helpers ───────────────────────────────────────────────────────────────────

const toDateStr = (d: string | Date) => new Date(d).toISOString().split('T')[0];

const SLEEP_QUALITY_OPTIONS: { value: SleepQuality; emoji: string; label: string; color: string }[] = [
  { value: 'sleepsWell',              emoji: '😴', label: 'Sleeps Well',     color: '#10B981' },
  { value: 'wakes1-2times',          emoji: '😪', label: 'Wakes 1–2×',      color: '#6EE7B7' },
  { value: 'wakesFrequently',        emoji: '😮‍💨', label: 'Wakes Often',    color: '#F59E0B' },
  { value: 'difficultyFallingAsleep',emoji: '🥱', label: 'Hard to Sleep',   color: '#F97316' },
  { value: 'restless',               emoji: '😫', label: 'Restless',        color: '#EF4444' },
];

const sleepColor = (q: SleepQuality) =>
  SLEEP_QUALITY_OPTIONS.find(o => o.value === q)?.color ?? '#10B981';

/** Count how many food group fields have a non-null value (excl babyId/date/notes/_id) */
const nutritionScore = (log?: FeedingLog): number => {
  if (!log) return 0;
  const fields: (keyof FeedingLog)[] = [
    'ricePortions', 'otherCarbs', 'proteinMeat', 'eggsPerWeek',
    'lentils', 'milkCups', 'otherDairy', 'fruitServings', 'vegServings', 'supplements',
  ];
  return fields.filter(f => {
    const v = log[f];
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0 && !(v.length === 1 && v[0] === 'none');
    return true;
  }).length;
};

const nutritionCellColor = (score: number) => {
  if (score === 0) return null;
  if (score >= 7) return '#22C55E'; // green — great
  if (score >= 4) return '#F59E0B'; // amber — partial
  return '#94A3B8';                  // slate — minimal
};

// ── Chip component ────────────────────────────────────────────────────────────
interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}
const Chip: React.FC<ChipProps> = ({ label, selected, onPress, color = Colors.primary.DEFAULT }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      selected && { backgroundColor: color + '22', borderColor: color },
    ]}
  >
    <Text style={[styles.chipText, selected && { color, fontWeight: '600' }]}>{label}</Text>
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export const SleepNutritionScreen: React.FC = () => {
  const { selectedBaby } = useBaby();

  // Calendar data
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [activeTab, setActiveTab] = useState<ActiveTab>('sleep');
  const [saving, setSaving] = useState(false);

  // Sleep fields
  const [hours, setHours] = useState(10);
  const [quality, setQuality] = useState<SleepQuality>('sleepsWell');
  const [sleepNotes, setSleepNotes] = useState('');
  const [currentSleepId, setCurrentSleepId] = useState<string | undefined>();

  // Nutrition fields
  const [ricePortions, setRicePortions]   = useState<FeedingLog['ricePortions']>(undefined);
  const [otherCarbs, setOtherCarbs]       = useState<FeedingLog['otherCarbs']>(undefined);
  const [proteinMeat, setProteinMeat]     = useState<FeedingLog['proteinMeat']>(undefined);
  const [eggsPerWeek, setEggsPerWeek]     = useState<FeedingLog['eggsPerWeek']>(undefined);
  const [lentils, setLentils]             = useState<FeedingLog['lentils']>(undefined);
  const [milkCups, setMilkCups]           = useState<FeedingLog['milkCups']>(undefined);
  const [otherDairy, setOtherDairy]       = useState<FeedingLog['otherDairy']>(undefined);
  const [fruitServings, setFruitServings] = useState<FeedingLog['fruitServings']>(undefined);
  const [vegServings, setVegServings]     = useState<FeedingLog['vegServings']>(undefined);
  const [supplements, setSupplements]     = useState<string[]>(['none']);
  const [feedNotes, setFeedNotes]         = useState('');
  const [currentFeedId, setCurrentFeedId] = useState<string | undefined>();

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!selectedBaby) return;
    try {
      setLoading(true);
      const [slResult, flResult] = await Promise.allSettled([
        getSleepLogs(selectedBaby._id),
        getFeedingLogs(selectedBaby._id),
      ]);
      if (slResult.status === 'fulfilled') setSleepLogs(slResult.value);
      if (flResult.status === 'fulfilled') setFeedingLogs(flResult.value);
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedBaby]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  // ── Calendar marks ──────────────────────────────────────────────────────────
  const buildMarkedDates = () => {
    const marks: any = {};

    sleepLogs.forEach(log => {
      const d = toDateStr(log.date);
      marks[d] = { ...marks[d], sleepColor: sleepColor(log.quality), sleepId: log._id };
    });
    feedingLogs.forEach(log => {
      const d = toDateStr(log.date);
      const nc = nutritionCellColor(nutritionScore(log));
      marks[d] = { ...marks[d], nutColor: nc, feedId: log._id };
    });

    // Convert to react-native-calendars format with custom dot pair
    const result: any = {};
    Object.entries(marks).forEach(([date, data]: any) => {
      result[date] = {
        customStyles: {
          container: {
            borderRadius: 8,
            overflow: 'hidden',
          },
          text: { color: '#1F2937', fontWeight: '600' },
        },
        _meta: data,
      };
    });

    // Selected date ring
    result[selectedDate] = {
      ...(result[selectedDate] || {}),
      customStyles: {
        container: {
          borderWidth: 2,
          borderColor: Colors.primary.DEFAULT,
          borderRadius: 8,
        },
        text: { color: Colors.primary.DEFAULT, fontWeight: '700' },
      },
    };

    return result;
  };

  // ── Day press ───────────────────────────────────────────────────────────────
  const handleDayPress = (day: DateData) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);

    // Fill sleep
    const sl = sleepLogs.find(l => toDateStr(l.date) === dateStr);
    if (sl) {
      setHours(sl.hours);
      setQuality(sl.quality as SleepQuality);
      setSleepNotes(sl.notes || '');
      setCurrentSleepId(sl._id);
    } else {
      setHours(10); setQuality('sleepsWell'); setSleepNotes(''); setCurrentSleepId(undefined);
    }

    // Fill nutrition
    const fl = feedingLogs.find(l => toDateStr(l.date) === dateStr);
    if (fl) {
      setRicePortions(fl.ricePortions); setOtherCarbs(fl.otherCarbs);
      setProteinMeat(fl.proteinMeat); setEggsPerWeek(fl.eggsPerWeek);
      setLentils(fl.lentils); setMilkCups(fl.milkCups);
      setOtherDairy(fl.otherDairy); setFruitServings(fl.fruitServings);
      setVegServings(fl.vegServings);
      setSupplements(fl.supplements || ['none']);
      setFeedNotes(fl.notes || '');
      setCurrentFeedId(fl._id);
    } else {
      setRicePortions(undefined); setOtherCarbs(undefined); setProteinMeat(undefined);
      setEggsPerWeek(undefined); setLentils(undefined); setMilkCups(undefined);
      setOtherDairy(undefined); setFruitServings(undefined); setVegServings(undefined);
      setSupplements(['none']); setFeedNotes(''); setCurrentFeedId(undefined);
    }

    setModalVisible(true);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedBaby) return;
    try {
      setSaving(true);
      if (activeTab === 'sleep') {
        await logSleep({ babyId: selectedBaby._id, date: selectedDate, hours, quality, notes: sleepNotes.trim() });
      } else {
        await logFeeding({
          babyId: selectedBaby._id, date: selectedDate,
          ricePortions, otherCarbs, proteinMeat, eggsPerWeek, lentils,
          milkCups, otherDairy, fruitServings, vegServings,
          supplements: supplements as FeedingLog['supplements'],
          notes: feedNotes.trim(),
        });
      }
      setModalVisible(false);
      fetchAll();
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    const id = activeTab === 'sleep' ? currentSleepId : currentFeedId;
    if (!id) return;
    Alert.alert('Delete', `Delete this ${activeTab} log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            if (activeTab === 'sleep') await deleteSleepLog(id);
            else await deleteFeedingLog(id);
            setModalVisible(false);
            fetchAll();
          } catch { Alert.alert('Error', 'Failed to delete'); }
        },
      },
    ]);
  };

  const toggleSupplement = (val: string) => {
    if (val === 'none') { setSupplements(['none']); return; }
    setSupplements(prev => {
      const without = prev.filter(s => s !== 'none');
      return without.includes(val) ? without.filter(s => s !== val) : [...without, val];
    });
  };

  // ── Render calendar day with dual color bars ────────────────────────────────
  const markedDates = buildMarkedDates();

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Sleep & Nutrition</Text>
          {loading && <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />}
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            maxDate={toDateStr(new Date())}
            onDayPress={handleDayPress}
            markingType="custom"
            markedDates={markedDates}
            dayComponent={({ date, state, marking }: any) => {
              const meta = marking?._meta || {};
              const isSelected = date?.dateString === selectedDate;
              const isToday = date?.dateString === toDateStr(new Date());
              return (
                <TouchableOpacity
                  onPress={() => handleDayPress(date)}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    state === 'disabled' && styles.dayTextDisabled,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && { color: Colors.primary.DEFAULT },
                  ]}>
                    {date?.day}
                  </Text>
                  {/* Dual-color indicator bar */}
                  <View style={styles.indicatorRow}>
                    <View style={[
                      styles.indicator,
                      { backgroundColor: meta.sleepColor || '#E5E7EB' },
                    ]} />
                    <View style={[
                      styles.indicator,
                      { backgroundColor: meta.nutColor || '#E5E7EB' },
                    ]} />
                  </View>
                </TouchableOpacity>
              );
            }}
            theme={{
              todayTextColor: Colors.primary.DEFAULT,
              arrowColor: Colors.primary.DEFAULT,
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              calendarBackground: 'white',
            }}
          />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>🌙 Sleep</Text>
          {SLEEP_QUALITY_OPTIONS.map(o => (
            <View key={o.value} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: o.color }]} />
            </View>
          ))}
          <Text style={styles.legendDivider}>|</Text>
          <Text style={styles.legendTitle}>🥗 Nutrition</Text>
          {[['#22C55E', 'All'], ['#F59E0B', 'Partial'], ['#94A3B8', 'Some']].map(([c, l]) => (
            <View key={l} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: c }]} />
              <Text style={styles.legendText}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Sheet Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.overlay}>
              <TouchableWithoutFeedback>
                <View style={styles.sheet}>

              {/* Handle bar */}
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetDate}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                {(activeTab === 'sleep' ? currentSleepId : currentFeedId) && (
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Tabs */}
              <View style={styles.tabs}>
                {(['sleep', 'nutrition'] as ActiveTab[]).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                      {tab === 'sleep' ? '🌙  Sleep' : '🥗  Nutrition'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
                {activeTab === 'sleep' ? (
                  // ── Sleep Tab ──────────────────────────────────────────────
                  <>
                    <View style={styles.section}>
                      <View style={styles.sectionRow}>
                        <Text style={styles.label}>Hours of Sleep</Text>
                        <Text style={styles.value}>{hours}h</Text>
                      </View>
                      <Slider
                        value={hours} onValueChange={v => setHours(Math.round(v * 2) / 2)}
                        minimumValue={0} maximumValue={24} step={0.5}
                        minimumTrackTintColor={Colors.primary.DEFAULT}
                        maximumTrackTintColor="#E5E7EB"
                        thumbTintColor={Colors.primary.DEFAULT}
                        style={{ width: '100%', height: 40 }}
                      />
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.label}>Sleep Quality</Text>
                      <View style={styles.qualityGrid}>
                        {SLEEP_QUALITY_OPTIONS.map(o => (
                          <TouchableOpacity
                            key={o.value}
                            style={[
                              styles.qualityBtn,
                              quality === o.value && { borderColor: o.color, backgroundColor: o.color + '15' },
                            ]}
                            onPress={() => setQuality(o.value)}
                          >
                            <Text style={styles.qualityEmoji}>{o.emoji}</Text>
                            <Text style={[styles.qualityLabel, quality === o.value && { color: o.color, fontWeight: '600' }]}>
                              {o.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.label}>Notes</Text>
                      <TextInput
                        style={styles.input} value={sleepNotes} onChangeText={setSleepNotes}
                        placeholder="Optional notes..." placeholderTextColor={Colors.inactive}
                        multiline
                      />
                    </View>
                  </>
                ) : (
                  // ── Nutrition Tab ──────────────────────────────────────────
                  <>
                    {/* Q14a – Rice */}
                    <View style={styles.section}>
                      <Text style={styles.label}>🍚  Rice (cups/day)</Text>
                      <View style={styles.chipRow}>
                        {(['0','0.5','1','1.5','2','2.5','3','3plus'] as const).map(v => (
                          <Chip key={v} label={v === '3plus' ? '3+' : v} selected={ricePortions === v} onPress={() => setRicePortions(ricePortions === v ? undefined : v)} />
                        ))}
                      </View>
                    </View>

                    {/* Q14b – Other Carbs */}
                    <View style={styles.section}>
                      <Text style={styles.label}>🍞  Other Carbs</Text>
                      <View style={styles.chipRow}>
                        {[['bread','Bread'],['roti','Roti'],['stringHoppers','String Hoppers'],['combination','Combo'],['rarely','Rarely']] .map(([v,l]) => (
                          <Chip key={v} label={l} selected={otherCarbs === v} onPress={() => setOtherCarbs(otherCarbs === v ? undefined : v as any)} />
                        ))}
                      </View>
                    </View>

                    {/* Q15a – Protein */}
                    <View style={styles.section}>
                      <Text style={styles.label}>🐟  Fish / Meat / Chicken</Text>
                      <View style={styles.chipRow}>
                        {[['never','Never'],['1small','1 small'],['2to3','2–3'],['3plus','3+']] .map(([v,l]) => (
                          <Chip key={v} label={l} selected={proteinMeat === v} onPress={() => setProteinMeat(proteinMeat === v ? undefined : v as any)} />
                        ))}
                      </View>
                    </View>

                    {/* Q15b – Eggs */}
                    <View style={styles.section}>
                      <Text style={styles.label}>🥚  Eggs (per week)</Text>
                      <View style={styles.chipRow}>
                        {[['none','None'],['1to2','1–2'],['3to5','3–5'],['6to7','6–7'],['7plus','7+']] .map(([v,l]) => (
                          <Chip key={v} label={l} selected={eggsPerWeek === v} onPress={() => setEggsPerWeek(eggsPerWeek === v ? undefined : v as any)} />
                        ))}
                      </View>
                    </View>

                    {/* Q15c – Lentils */}
                    <View style={styles.section}>
                      <Text style={styles.label}>🫘  Dhal / Lentils</Text>
                      <View style={styles.chipRow}>
                        {[['daily','Daily'],['3to5perWeek','3–5×/wk'],['1to2perWeek','1–2×/wk'],['rarely','Rarely']] .map(([v,l]) => (
                          <Chip key={v} label={l} selected={lentils === v} onPress={() => setLentils(lentils === v ? undefined : v as any)} />
                        ))}
                      </View>
                    </View>

                    {/* Q16a – Milk */}
                    <View style={styles.section}>
                      <Text style={styles.label}>🥛  Milk (cups/day)</Text>
                      <View style={styles.chipRow}>
                        {[['none','None'],['lessThan1','< 1'],['1to2','1–2'],['2to3','2–3'],['3plus','3+']] .map(([v,l]) => (
                          <Chip key={v} label={l} selected={milkCups === v} onPress={() => setMilkCups(milkCups === v ? undefined : v as any)} />
                        ))}
                      </View>
                    </View>

                    {/* Q16b – Other Dairy */}
                    <View style={styles.section}>
                      <Text style={styles.label}>🧀  Other Dairy</Text>
                      <View style={styles.chipRow}>
                        {[['daily','Daily'],['fewPerWeek','Few/wk'],['rarely','Rarely'],['never','Never']] .map(([v,l]) => (
                          <Chip key={v} label={l} selected={otherDairy === v} onPress={() => setOtherDairy(otherDairy === v ? undefined : v as any)} />
                        ))}
                      </View>
                    </View>

                    {/* Q17a – Fruit */}
                    <View style={styles.section}>
                      <Text style={styles.label}>🍎  Fruit servings</Text>
                      <View style={styles.chipRow}>
                        {[['none','None'],['1','1'],['2','2'],['3plus','3+']] .map(([v,l]) => (
                          <Chip key={v} label={l} selected={fruitServings === v} onPress={() => setFruitServings(fruitServings === v ? undefined : v as any)} />
                        ))}
                      </View>
                    </View>

                    {/* Q17b – Veg */}
                    <View style={styles.section}>
                      <Text style={styles.label}>🥦  Vegetables</Text>
                      <View style={styles.chipRow}>
                        {[['none','None'],['with1meal','1 meal'],['with2meals','2 meals'],['withAllMeals','All meals']] .map(([v,l]) => (
                          <Chip key={v} label={l} selected={vegServings === v} onPress={() => setVegServings(vegServings === v ? undefined : v as any)} />
                        ))}
                      </View>
                    </View>

                    {/* Q18 – Supplements */}
                    <View style={styles.section}>
                      <Text style={styles.label}>💊  Supplements</Text>
                      <View style={styles.chipRow}>
                        {[['multivitamin','Multi-vit'],['vitaminD','Vit D'],['iron','Iron'],['other','Other'],['none','None']] .map(([v,l]) => (
                          <Chip key={v} label={l} selected={supplements.includes(v)} onPress={() => toggleSupplement(v)} color="#8B5CF6" />
                        ))}
                      </View>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.label}>Notes</Text>
                      <TextInput
                        style={styles.input} value={feedNotes} onChangeText={setFeedNotes}
                        placeholder="Optional notes..." placeholderTextColor={Colors.inactive}
                        multiline
                      />
                    </View>
                  </>
                )}

                {/* Save */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.saveBtnText}>Save {activeTab === 'sleep' ? 'Sleep' : 'Nutrition'} Log</Text>
                  }
                </TouchableOpacity>
                <View style={{ height: 32 }} />
              </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.dark },

  calendarContainer: {
    marginHorizontal: 16, borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'white', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    marginTop: 8,
  },

  // Custom day cell
  dayCell: { alignItems: 'center', paddingVertical: 4, width: 38, borderRadius: 8 },
  dayCellSelected: { borderWidth: 2, borderColor: Colors.primary.DEFAULT },
  dayCellToday: { backgroundColor: Colors.primary.DEFAULT + '12' },
  dayText: { fontSize: 14, fontWeight: '500', color: '#1F2937', marginBottom: 3 },
  dayTextDisabled: { color: '#D1D5DB' },
  dayTextSelected: { color: Colors.primary.DEFAULT, fontWeight: '700' },
  indicatorRow: { flexDirection: 'row', gap: 2 },
  indicator: { width: 13, height: 5, borderRadius: 3 },

  // Legend
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingHorizontal: 16 },
  legendTitle: { fontSize: 12, fontWeight: '600', color: Colors.dark },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: Colors.inactive },
  legendDivider: { fontSize: 16, color: '#D1D5DB', marginHorizontal: 4 },

  // Bottom sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetDate: { fontSize: 18, fontWeight: '700', color: Colors.dark },
  deleteBtn: { padding: 8 },
  sheetScroll: { flex: 1 },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.inactive },
  tabTextActive: { fontWeight: '700', color: Colors.dark },

  // Form
  section: { marginBottom: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.dark, marginBottom: 10 },
  value: { fontSize: 18, fontWeight: '700', color: Colors.primary.DEFAULT },

  qualityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qualityBtn: { width: '30%', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  qualityEmoji: { fontSize: 26, marginBottom: 4 },
  qualityLabel: { fontSize: 11, color: Colors.dark, textAlign: 'center' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  chipText: { fontSize: 13, color: Colors.dark },

  input: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 72, textAlignVertical: 'top' },

  saveBtn: { backgroundColor: Colors.primary.DEFAULT, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: Colors.primary.DEFAULT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
