import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { SecondaryTopBar } from "@/components/SecondaryTopBar";
import {
  getNearestHospitals,
  NearbyHospital,
  openNavigationToHospital,
  requestCurrentLocation,
} from "@/services/nearbyHospitalsService";

const tabOptions = ["All Facilities", "Open Now"] as const;
type NearbyTab = (typeof tabOptions)[number];

export const NearbyHospitalsScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = React.useState<NearbyTab>("All Facilities");
  const [hospitals, setHospitals] = React.useState<NearbyHospital[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [showMap, setShowMap] = React.useState(true);

  const loadNearbyHospitals = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const current = await requestCurrentLocation();
      setCoords({ latitude: current.latitude, longitude: current.longitude });

      const nearest = await getNearestHospitals(current.latitude, current.longitude, 12);
      setHospitals(nearest);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load nearby facilities";
      setError(message);
      setHospitals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadNearbyHospitals();
  }, [loadNearbyHospitals]);

  const filteredHospitals = React.useMemo(() => {
    if (selectedTab === "Open Now") {
      return hospitals.filter((hospital) => hospital.status === "Open Now");
    }

    return hospitals;
  }, [hospitals, selectedTab]);

  const facilitiesWithin10Km = React.useMemo(
    () => hospitals.filter((hospital) => hospital.distanceKm <= 10),
    [hospitals]
  );

  const mapHtml = React.useMemo(() => {
    if (!coords) return "";

    const markersJson = JSON.stringify(
      facilitiesWithin10Km.map((hospital) => ({
        name: hospital.name,
        lat: hospital.latitude,
        lng: hospital.longitude,
        distanceKm: Number(hospital.distanceKm.toFixed(1)),
      }))
    );

    return `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const center = [${coords.latitude}, ${coords.longitude}];
            const map = L.map('map').setView(center, 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            L.circle(center, {
              radius: 10000,
              color: '#6366F1',
              fillColor: '#C7D2FE',
              fillOpacity: 0.18,
              weight: 2
            }).addTo(map).bindPopup('10 km radius from your location');

            L.marker(center).addTo(map).bindPopup('Your location');

            const facilities = ${markersJson};
            facilities.forEach((facility) => {
              L.marker([facility.lat, facility.lng])
                .addTo(map)
                .bindPopup('<b>' + facility.name + '</b><br/>' + facility.distanceKm + ' km away');
            });
          </script>
        </body>
      </html>
    `;
  }, [coords, facilitiesWithin10Km]);

  const handleNavigate = async (hospital: NearbyHospital) => {
    if (!coords) {
      Alert.alert("Location unavailable", "Unable to get your current location. Please refresh.");
      return;
    }

    try {
      const url = await openNavigationToHospital(
        coords.latitude,
        coords.longitude,
        hospital.latitude,
        hospital.longitude
      );
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Unable to open Google Maps");
    }
  };

  const handleCall = (phone: string | null) => {
    if (!phone) {
      Alert.alert("Phone unavailable", "Phone number is not available for this facility.");
      return;
    }

    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Error", "Unable to place a call");
    });
  };

  const statusMeta = (status: NearbyHospital["status"]) => {
    if (status === "Open Now") {
      return { color: "#22c55e", bg: "#dcfce7" };
    }
    if (status === "Closed") {
      return { color: "#ef4444", bg: "#fee2e2" };
    }
    return { color: "#64748b", bg: "#f1f5f9" };
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadNearbyHospitals(true)} />
        }
      >
        <SecondaryTopBar />
        <Text style={styles.headerTitle}>Nearby Health Facilities</Text>
        {/* Tabs */}
        <View style={styles.tabs}>
          {tabOptions.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => setShowMap((prev) => !prev)}
        >
          <Ionicons name="map" size={18} color="#6366F1" style={{ marginRight: 8 }} />
          <Text style={styles.mapBtnText}>{showMap ? "Hide Health Facility Map" : "View Health Facility Map"}</Text>
        </TouchableOpacity>

        {showMap && coords && (
          <View style={styles.mapContainer}>
            <Text style={styles.mapCaption}>
              Showing {facilitiesWithin10Km.length} facilities within 10 km radius
            </Text>
            <WebView source={{ html: mapHtml }} style={styles.mapWebView} originWhitelist={["*"]} />
          </View>
        )}
        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.stateText}>Finding nearby health facilities...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateWrap}>
            <Ionicons name="alert-circle" size={24} color="#DC2626" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadNearbyHospitals()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredHospitals.length === 0 ? (
          <View style={styles.stateWrap}>
            <Ionicons name="search" size={24} color="#64748B" />
            <Text style={styles.stateText}>No facilities found for this filter.</Text>
          </View>
        ) : null}
        {/* Hospital Cards */}
        {filteredHospitals.map((h) => {
          const status = statusMeta(h.status);
          return (
          <View key={h.name} style={styles.hospitalCard}>
            {h.imageUrl ? (
              <Image source={{ uri: h.imageUrl }} style={styles.facilityImage} resizeMode="cover" />
            ) : (
              <View style={styles.imageFallback}>
                <Ionicons name="image-outline" size={28} color="#94A3B8" />
                <Text style={styles.imageFallbackText}>No Image</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="star" size={15} color="#fbbf24" style={{ marginRight: 4 }} />
              <Text style={styles.rating}>{h.rating ?? "N/A"}</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{h.status}</Text>
              </View>
            </View>
            <Text style={styles.hospitalName}>{h.name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={15} color="#6366F1" style={{ marginRight: 4 }} />
              <Text style={styles.infoText}>{h.distanceKm.toFixed(1)} km</Text>
              <Text style={styles.dot}>•</Text>
            </View>
            <View style={styles.capabilitiesRow}>
              <Text style={styles.capLabel}>Capabilities:</Text>
              {h.capabilities.map((c) => (
                <View key={c} style={styles.capBadge}><Text style={styles.capBadgeText}>{c}</Text></View>
              ))}
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={15} color="#6366F1" style={{ marginRight: 4 }} />
              <Text style={styles.infoText}>{h.phone ?? "N/A"}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.infoText}>{h.address}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.navigateBtn}
                onPress={() => handleNavigate(h)}
              >
                <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.navigateText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(h.phone)}>
                <Ionicons name="call" size={18} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>
        )})}
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
    marginTop: 20,
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
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  stateText: {
    marginTop: 8,
    color: '#334155',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 10,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
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
  facilityImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
  },
  imageFallback: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: '#64748B',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
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
  mapContainer: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  mapCaption: {
    padding: 10,
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: '#F8FAFC',
  },
  mapWebView: {
    width: '100%',
    height: 320,
  },
});
