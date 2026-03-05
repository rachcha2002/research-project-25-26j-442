import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBaby } from '@/contexts/BabyContext';
import { getSleepLogs, logSleep, deleteSleepLog, SleepLog } from '@/services/healthAnalyticsService';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import Slider from '@react-native-community/slider';

export const SleepTrackerScreen: React.FC = () => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  
  // State
  const [markedDates, setMarkedDates] = useState<any>({});
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(12);
  const [quality, setQuality] = useState<SleepLog['quality']>('sleepsWell');
  const [notes, setNotes] = useState('');
  const [currentLogId, setCurrentLogId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    if (!selectedBaby) return;
    try {
      setLoading(true);
      const data = await getSleepLogs(selectedBaby._id);
      setLogs(data);
      updateMarkedDates(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBaby]);

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [fetchLogs])
  );

  const updateMarkedDates = (data: SleepLog[]) => {
    const marks: any = {};
    data.forEach(log => {
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      let color = '#EF4444'; // restless / other - Red
      if (log.quality === 'sleepsWell') color = '#10B981'; // Good - Green
      else if (log.quality === 'wakes1-2times') color = '#F59E0B'; // Fair - Amber
      
      marks[dateStr] = {
        customStyles: {
          container: { backgroundColor: color },
          text: { color: 'white', fontWeight: 'bold' }
        }
      };
    });
    setMarkedDates(marks);
  };

  const handleDayPress = (day: DateData) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    
    // Check if log exists for this date
    const existingLog = logs.find(l => new Date(l.date).toISOString().split('T')[0] === dateStr);
    
    if (existingLog) {
      setHours(existingLog.hours);
      setQuality(existingLog.quality);
      setNotes(existingLog.notes || '');
      setCurrentLogId(existingLog._id);
    } else {
      setHours(12); // Default
      setQuality('sleepsWell');
      setNotes('');
      setCurrentLogId(undefined);
    }
    
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedBaby) return;
    try {
      setSaving(true);
      await logSleep({
        babyId: selectedBaby._id,
        date: selectedDate,
        hours,
        quality,
        notes: notes.trim()
      });
      setModalVisible(false);
      fetchLogs(); // Refresh calendar
    } catch (error) {
      Alert.alert('Error', 'Failed to save sleep log');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentLogId) return;
    Alert.alert('Delete', 'Delete log for this day?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
            try {
                await deleteSleepLog(currentLogId);
                setModalVisible(false);
                fetchLogs();
            } catch (error) {
                Alert.alert('Error', 'Failed to delete');
            }
        }
      }
    ]);
  };

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
            <Text style={styles.title}>Sleep Tracker</Text>
        </View>

        <View style={styles.calendarContainer}>
            <Calendar
                onDayPress={handleDayPress}
                markingType={'custom'}
                markedDates={{
                    ...markedDates,
                    [selectedDate]: {
                    ...markedDates[selectedDate],
                    customStyles: {
                        ...markedDates[selectedDate]?.customStyles,
                        container: {
                            borderWidth: 2,
                            borderColor: Colors.primary.DEFAULT,
                            backgroundColor: markedDates[selectedDate]?.customStyles?.container?.backgroundColor || 'transparent',
                            borderRadius: 20
                        },
                        text: {
                            color: markedDates[selectedDate] ? 'white' : 'black'
                        }
                    }
                    }
                }}
                theme={{
                    todayTextColor: Colors.primary.DEFAULT,
                    arrowColor: Colors.primary.DEFAULT,
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '600'
                }}
            />
        </View>
        
        <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#10B981'}]} /><Text style={styles.legendText}>Good</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#F59E0B'}]} /><Text style={styles.legendText}>Fair</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#EF4444'}]} /><Text style={styles.legendText}>Poor</Text></View>
        </View>

        {/* Simplified Log Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={() => setModalVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalContent} 
                    activeOpacity={1} 
                    onPress={e => e.stopPropagation()}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            Sleep Log ({new Date(selectedDate).toLocaleDateString('en-US', {month:'short', day:'numeric'})})
                        </Text>
                        {currentLogId && (
                             <TouchableOpacity onPress={handleDelete} style={{padding: 8}}>
                                <Ionicons name="trash-outline" size={24} color="#EF4444" />
                             </TouchableOpacity>
                        )}
                    </View>

                    {/* Hours */}
                    <View style={styles.section}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
                             <Text style={styles.label}>Hours of Sleep</Text>
                             <Text style={styles.valueText}>{hours}h</Text>
                        </View>
                        <Slider
                            style={{width: '100%', height: 40}}
                            value={hours}
                            onValueChange={v => setHours(Math.round(v * 2) / 2)} // 0.5 steps
                            minimumValue={0}
                            maximumValue={24}
                            step={0.5}
                            minimumTrackTintColor={Colors.primary.DEFAULT}
                            maximumTrackTintColor="#E5E7EB"
                            thumbTintColor={Colors.primary.DEFAULT}
                        />
                    </View>

                    {/* Quality */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Quality</Text>
                        <View style={styles.qualityRow}>
                            {(['sleepsWell', 'wakes1-2times', 'restless'] as const).map(q => (
                                <TouchableOpacity
                                    key={q}
                                    style={[
                                        styles.qualityBtn,
                                        quality === q && styles.qualityBtnActive,
                                        {borderColor: q === 'sleepsWell' ? '#10B981' : q === 'wakes1-2times' ? '#F59E0B' : '#EF4444'}
                                    ]}
                                    onPress={() => setQuality(q)}
                                >
                                    <Text style={{fontSize: 28, marginBottom: 4}}>{q === 'sleepsWell' ? '😊' : q === 'wakes1-2times' ? '😐' : '😫'}</Text>
                                    <Text style={[styles.qualityText, {fontWeight: quality === q ? '700' : '400'}]}>
                                        {q === 'sleepsWell' ? 'Good' : q === 'wakes1-2times' ? 'Fair' : 'Poor'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    
                    {/* Notes */}
                    <View style={styles.section}>
                         <Text style={styles.label}>Notes</Text>
                         <TextInput
                            style={styles.input}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Optional notes..."
                            placeholderTextColor={Colors.inactive}
                            multiline
                         />
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Log</Text>}
                    </TouchableOpacity>

                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.dark },
  
  calendarContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 10
  },
  
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 13, color: Colors.dark, fontWeight: '500' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.dark },
  
  section: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 12, color: Colors.dark },
  valueText: { fontSize: 18, fontWeight: '700', color: Colors.primary.DEFAULT },
  
  qualityRow: { flexDirection: 'row', gap: 12 },
  qualityBtn: { 
    flex: 1, 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    backgroundColor: '#F9FAFB',
    opacity: 0.7 
  },
  qualityBtnActive: { opacity: 1, backgroundColor: '#FFFFFF', borderWidth: 2, transform: [{scale: 1.02}] },
  qualityText: { fontSize: 13, color: Colors.dark },
  
  input: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 15,
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  
  saveBtn: { 
    backgroundColor: Colors.primary.DEFAULT, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 8,
    shadowColor: Colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
