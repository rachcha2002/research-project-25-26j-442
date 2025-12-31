import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const HOSPITALS = [
  {
    name: "City Children's Hospital",
    rating: 4.8,
    distance: 2.3,
    time: 8,
    status: "Available",
    statusColor: "#22c55e",
    statusBg: "#dcfce7",
    capabilities: ["Ward", "HDU", "PICU"],
    phone: "1234-5678",
    address: "123 Medical Center Blvd",
  },
  {
    name: "Pediatric Care Center",
    rating: 4.6,
    distance: 3.7,
    time: 12,
    status: "Limited",
    statusColor: "#f59e42",
    statusBg: "#ffedd5",
    capabilities: ["Ward", "HDU"],
    phone: "1234-9012",
    address: "456 Health Street",
  },
  {
    name: "Emergency Kids Clinic",
    rating: 4.5,
    distance: 5.1,
    time: 18,
    status: "Available",
    statusColor: "#22c55e",
    statusBg: "#dcfce7",
    capabilities: ["Ward"],
    phone: "1234-3456",
    address: "789 Care Avenue",
  },
];

export const NearbyHospitalsScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = React.useState("All Facilities");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Nearby Hospitals</Text>
        {/* Tabs */}
        <View style={styles.tabs}>
          {["All Facilities", "PICU Available", "Available Now"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Real-time traffic info */}
        <View style={styles.trafficCard}>
          <Ionicons name="car" size={18} color="#6366F1" style={{ marginRight: 8 }} />
          <Text style={styles.trafficText}>Real-time traffic data</Text>
          <Text style={styles.trafficSub}>Travel times updated based on current conditions</Text>
        </View>
        {/* Hospital Cards */}
        {HOSPITALS.map((h, idx) => (
          <View key={h.name} style={styles.hospitalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="star" size={15} color="#fbbf24" style={{ marginRight: 4 }} />
              <Text style={styles.rating}>{h.rating}</Text>
              <View style={[styles.statusBadge, { backgroundColor: h.statusBg }]}>
                <Text style={[styles.statusText, { color: h.statusColor }]}>{h.status}</Text>
              </View>
            </View>
            <Text style={styles.hospitalName}>{h.name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={15} color="#6366F1" style={{ marginRight: 4 }} />
              <Text style={styles.infoText}>{h.distance} km</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.infoText}>{h.time} min</Text>
              <Text style={styles.infoText}>away</Text>
            </View>
            <View style={styles.capabilitiesRow}>
              <Text style={styles.capLabel}>Capabilities:</Text>
              {h.capabilities.map((c) => (
                <View key={c} style={styles.capBadge}><Text style={styles.capBadgeText}>{c}</Text></View>
              ))}
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={15} color="#6366F1" style={{ marginRight: 4 }} />
              <Text style={styles.infoText}>{h.phone}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.infoText}>{h.address}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.navigateBtn}
                onPress={() => {
                  // Dummy coordinates for now (e.g., Times Square, NY)
                  const lat = 40.758;
                  const lng = -73.9855;
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                  Linking.openURL(url).catch(() => {
                    Alert.alert('Error', 'Unable to open Google Maps');
                  });
                }}
              >
                <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.navigateText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn}>
                <Ionicons name="call" size={18} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {/* View on Map */}
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => {
            // Dummy coordinates for now (e.g., Times Square, NY)
            const lat = 40.758;
            const lng = -73.9855;
            const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Unable to open Google Maps');
            });
          }}
        >
          <Ionicons name="map" size={18} color="#6366F1" style={{ marginRight: 8 }} />
          <Text style={styles.mapBtnText}>View on Map</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#ede9fe',
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#fff',
  },
  trafficCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    alignItems: 'center',
    padding: 10,
    marginBottom: 14,
  },
  trafficText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 8,
  },
  trafficSub: {
    color: '#64748B',
    fontSize: 13,
  },
  hospitalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rating: {
    color: '#fbbf24',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  statusText: {
    fontWeight: '700',
    fontSize: 13,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22223B',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoText: {
    color: '#334155',
    fontSize: 14,
    marginRight: 4,
  },
  dot: {
    color: '#cbd5e1',
    marginHorizontal: 2,
    fontSize: 14,
  },
  capabilitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 2,
  },
  capLabel: {
    color: '#64748B',
    fontSize: 13,
    marginRight: 6,
  },
  capBadge: {
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  capBadgeText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 13,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  navigateBtn: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    marginRight: 8,
  },
  navigateText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 14,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  mapBtnText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 15,
  },
});
