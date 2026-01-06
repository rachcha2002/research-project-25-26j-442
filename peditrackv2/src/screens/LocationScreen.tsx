import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { TopBar } from '@/components/TopBar';

export const LocationScreen: React.FC = () => {
  // Dummy recent activity data

  const childName = "Thisal";
  const childAge = 1.2; // in years
  const childWeight = 3; // in kg

  const recentActivity = [
    { type: 'Assessment', date: '2025-12-23', summary: 'Moderate risk, home care advised' },
    { type: 'Teleconsultation', date: '2025-12-20', summary: 'Consulted Dr. Smith' },
  ];

  const handleEmergencyCall = () => {
    const phone = '119'; 
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call');
    });
  };
  const handleSuwaseriyaCall = () => {
    const phone = '1990';
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <TopBar />
          {/* Main Actions */}
          <View style={styles.actionsWrap}>
            {/* ...existing code for action cards... */}
            <TouchableOpacity style={[styles.actionCard, { borderLeftColor: Colors.primary.DEFAULT }]} onPress={() => router.push('/assessment')}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primary.DEFAULT + '22' }]}> 
                <MaterialCommunityIcons name="clipboard-text-search-outline" size={32} color={Colors.primary.DEFAULT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: Colors.primary.DEFAULT }]}>Risk Assessment</Text>
                <Text style={styles.actionDesc}>Quickly assess your child's emergency risk</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { borderLeftColor: '#F43F5E' }]} onPress={() => router.push('/teleconsultation')}>
              <View style={[styles.iconCircle, { backgroundColor: '#F43F5E22' }]}> 
                <MaterialCommunityIcons name="video-account" size={32} color="#F43F5E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: '#F43F5E' }]}>Teleconsultation</Text>
                <Text style={styles.actionDesc}>Connect instantly with a pediatrician</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { borderLeftColor: '#6366F1' }]} onPress={() => router.push('/nearby-hospitals')}>
              <View style={[styles.iconCircle, { backgroundColor: '#6366F122' }]}> 
                <Ionicons name="medkit" size={32} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: '#6366F1' }]}>Nearby Hospitals</Text>
                <Text style={styles.actionDesc}>Find the closest pediatric care centers</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          {/* Recent Activity */}
          <View style={styles.recentActivityWrap}>
            <Text style={styles.recentActivityTitle}>Recent Activity</Text>
            {recentActivity.map((item, idx) => (
              <View key={idx} style={styles.recentItem}>
                <Ionicons
                  name={item.type === 'Assessment' ? 'analytics' : 'chatbubbles'}
                  size={18}
                  color={item.type === 'Assessment' ? Colors.primary.DEFAULT : '#F43F5E'}
                  style={{ marginRight: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentType}>{item.type}</Text>
                  <Text style={styles.recentSummary}>{item.summary}</Text>
                </View>
                <Text style={styles.recentDate}>{item.date}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        {/* Bottom Emergency Buttons - fixed at bottom */}
        <View style={styles.bottomEmergencyWrap}>
          <TouchableOpacity style={[styles.bottomEmergencyBtn, { backgroundColor: '#EF4444' }]} onPress={handleEmergencyCall}>
            <Ionicons name="call" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.bottomEmergencyText}>Emergency Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bottomEmergencyBtn, { backgroundColor: '#0EA5E9' }]} onPress={handleSuwaseriyaCall}>
            <MaterialCommunityIcons name="ambulance" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.bottomEmergencyText}>Suwaseriya 1990</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
  },
  emergencyTitle: {
   fontSize: 20,
   fontWeight: "700",
   color: "#d32f2f",
  },
  childDetails: {
   marginTop: 2,
   fontSize: 14,
   color: "#555",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
  },
  bottomEmergencyWrap: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(249,250,251,0.95)',
    zIndex: 10,
    gap: 15,
  },
  bottomEmergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 0,
    justifyContent: 'center',
  },
  bottomEmergencyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
    fabEmergency: {
      position: 'absolute',
      right: 28,
      top: 44,
      zIndex: 10,
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    tipsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.white,
      borderRadius: 14,
      padding: 16,
      marginBottom: 22,
      width: '100%',
      maxWidth: 420,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.primary.DEFAULT,
      marginBottom: 2,
    },
    tipsDesc: {
      fontSize: 13,
      color: Colors.inactive,
    },
    recentActivityWrap: {
      marginTop: 10,
      width: '100%',
      maxWidth: 420,
      backgroundColor: Colors.white,
      borderRadius: 14,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    recentActivityTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.dark,
      marginBottom: 10,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 4,
    },
    recentType: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.primary.DEFAULT,
    },
    recentSummary: {
      fontSize: 13,
      color: Colors.inactive,
    },
    recentDate: {
      fontSize: 12,
      color: '#64748B',
      marginLeft: 8,
      minWidth: 70,
      textAlign: 'right',
    },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  subHeader: {
    fontSize: 16,
    color: Colors.inactive,
    textAlign: 'center',
    marginBottom: 28,
  },
  actionsWrap: {
    width: '100%',
    maxWidth: 420,
    gap: 18,
    marginTop: 12,
    padding: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 25,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 5,
    gap: 18,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 14,
    color: Colors.inactive,
  },
});


