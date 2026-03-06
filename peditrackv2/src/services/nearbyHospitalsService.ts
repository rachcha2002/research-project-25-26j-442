import * as Location from 'expo-location';
import { API_CONFIG } from '@/config/config';

export interface NearbyHospital {
  id: string;
  name: string;
  rating: number | null;
  distanceKm: number;
  estimatedMinutes: number | null;
  status: 'Open Now' | 'Closed' | 'Unknown';
  capabilities: string[];
  phone: string | null;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
}

interface PlacesResult {
  place_id: string;
  name: string;
  rating?: number;
  vicinity?: string;
  formatted_phone_number?: string;
  geometry?: { location?: { lat: number; lng: number } };
  opening_hours?: { open_now?: boolean };
  types?: string[];
  photos?: Array<{ photo_reference?: string }>;
}

const PLACES_PROXY_URL = API_CONFIG.PLACES_PROXY_URL;

const kmBetween = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const mapCapabilities = (types?: string[]): string[] => {
  if (!types || types.length === 0) return ['General Care'];
  const caps = new Set<string>();

  if (types.includes('hospital')) caps.add('Hospital');
  if (types.includes('doctor')) caps.add('Doctor');
  if (types.includes('health')) caps.add('Health Service');
  if (types.includes('pharmacy')) caps.add('Pharmacy');

  if (caps.size === 0) {
    caps.add('General Care');
  }

  return Array.from(caps);
};

const normalizeStatus = (openNow?: boolean): NearbyHospital['status'] => {
  if (openNow === true) return 'Open Now';
  if (openNow === false) return 'Closed';
  return 'Unknown';
};

const fetchNearbyPlaces = async (latitude: number, longitude: number): Promise<PlacesResult[]> => {
  const url = `${PLACES_PROXY_URL}/nearby-hospitals?lat=${latitude}&lng=${longitude}&radius=10000`;

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Nearby places proxy request failed (${response.status}) at ${url}${body ? `: ${body}` : ''}`
    );
  }

  const data = await response.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Nearby places API error: ${data.status}`);
  }

  return Array.isArray(data.results) ? data.results : [];
};

const fetchTravelTimes = async (
  originLat: number,
  originLng: number,
  destinations: Array<{ latitude: number; longitude: number }>
): Promise<Array<number | null>> => {
  if (destinations.length === 0) return [];

  const destinationsParam = destinations
    .map((d) => `${d.latitude},${d.longitude}`)
    .join('|');
  const url =
    `${PLACES_PROXY_URL}/travel-times` +
    `?originLat=${originLat}` +
    `&originLng=${originLng}` +
    `&destinations=${encodeURIComponent(destinationsParam)}`;

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.warn(
      `Travel times proxy request failed (${response.status}) at ${url}${body ? `: ${body}` : ''}`
    );
    return destinations.map(() => null);
  }

  const data = await response.json();
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const elements = Array.isArray(rows[0]?.elements) ? rows[0].elements : [];

  return destinations.map((_, index) => {
    const element = elements[index];
    if (!element || element.status !== 'OK') return null;
    const seconds = element.duration_in_traffic?.value ?? element.duration?.value;
    if (typeof seconds !== 'number') return null;
    return Math.max(1, Math.round(seconds / 60));
  });
};

export const requestCurrentLocation = async (): Promise<Location.LocationObjectCoords> => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Location permission denied. Please enable location access.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return location.coords;
};

export const getNearestHospitals = async (
  userLatitude: number,
  userLongitude: number,
  limit = 10
): Promise<NearbyHospital[]> => {
  const places = await fetchNearbyPlaces(userLatitude, userLongitude);

  const mapped = places
    .map((place) => {
      const latitude = place.geometry?.location?.lat;
      const longitude = place.geometry?.location?.lng;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

      const distanceKm = kmBetween(userLatitude, userLongitude, latitude, longitude);

      return {
        id: place.place_id,
        name: place.name || 'Unknown Facility',
        rating: typeof place.rating === 'number' ? place.rating : null,
        distanceKm,
        estimatedMinutes: null,
        status: normalizeStatus(place.opening_hours?.open_now),
        capabilities: mapCapabilities(place.types),
        phone: place.formatted_phone_number || null,
        address: place.vicinity || 'Address unavailable',
        latitude,
        longitude,
        imageUrl: place.photos?.[0]?.photo_reference
          ? `${PLACES_PROXY_URL}/place-photo?photoReference=${encodeURIComponent(place.photos[0].photo_reference)}&maxwidth=500`
          : null,
      } as NearbyHospital;
    })
    .filter((item): item is NearbyHospital => item !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  const times = await fetchTravelTimes(
    userLatitude,
    userLongitude,
    mapped.map((hospital) => ({ latitude: hospital.latitude, longitude: hospital.longitude }))
  );

  return mapped.map((hospital, index) => ({
    ...hospital,
    estimatedMinutes: times[index] ?? null,
  }));
};

export const openNavigationToHospital = async (
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number
) => {
  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${originLat},${originLng}` +
    `&destination=${destinationLat},${destinationLng}` +
    `&travelmode=driving`;

  return url;
};
