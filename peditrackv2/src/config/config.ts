/**
 * Application Configuration
 * Centralized configuration for API endpoints and app settings
 */

// Determine the correct API base URL based on the environment
// For Android Emulator: use 10.0.2.2
// For iOS Simulator: use localhost
// For Physical Device: use your computer's IP address

// Get your computer's IP by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
const COMPUTER_IP = '172.20.10.2'; // Update this with your actual IP

// Detect if running in Expo Go vs production
const __DEV__ = process.env.NODE_ENV !== 'production';

export const API_CONFIG = {
  // User Service API (port 5002)
  USER_SERVICE_URL: __DEV__
    ? `http://${COMPUTER_IP}:5002/api`
    : 'https://your-production-user-service.com/api',

  // Health Analytics Service API (port 5001)
  HEALTH_SERVICE_URL: __DEV__
    ? `http://${COMPUTER_IP}:5001/api`
    : 'https://your-production-health-service.com/api',

  // Risk Assessment Service API (port 4000)
  RISK_ASSESSMENT_URL: __DEV__
    ? `http://${COMPUTER_IP}:4000/api`
    : 'https://your-production-risk-assessment.com/api',

  // Teleconsultation Service API (port 4001)
  TELECONSULTATION_URL: __DEV__
    ? `http://${COMPUTER_IP}:4001/api/teleconsultation`
    : 'https://your-production-teleconsultation.com/api',

  // Places Proxy API (port 4002)
  PLACES_PROXY_URL: __DEV__
    ? `http://${COMPUTER_IP}:4002/api`
    : 'https://your-production-places-proxy.com/api',

  // Admin Service API (port 3012)
  AUTH_USER_URL: __DEV__
    ? `http://${COMPUTER_IP}:3012/api/doctors`
    : 'https://your-production-admin-service.com/api',

  // Meal Recommendation Service API (port 5050)
  MEAL_RECOMMENDATION_SERVICE_URL: __DEV__
    ? `http://${COMPUTER_IP}:5050`
    : 'https://your-production-meal-service.com',


  // Nutrition Extraction Service API (port 5560)
  NUTRITION_EXTRACTION_SERVICE_URL: __DEV__
    ? `http://${COMPUTER_IP}:5560`
    : 'https://your-production-nutrition-extraction-service.com',
  // Request timeout in milliseconds
  REQUEST_TIMEOUT: 30000,
};

// Google OAuth Configuration
export const GOOGLE_CONFIG = {
  // Web Client ID from Google Cloud Console (used by mobile Google Sign-In SDK)
  WEB_CLIENT_ID: '940950846010-07cph3uprj79bimn2vrb376ksv0ikfv1.apps.googleusercontent.com',
  IOS_CLIENT_ID: '', // Set if you have a separate iOS client ID
  ANDROID_CLIENT_ID: '', // Set if you have a separate Android client ID
};

// Google Places API Configuration
export const GOOGLE_PLACES_API_KEY = {
  GOOGLE_PLACES_API_KEY: 'AIzaSyDOP3Wpo_qanxpa3xJe-q2O6DoehNreuQw', 
};

// LiveKit Configuration
export const EXPO_PUBLIC_LIVEKIT_URL={
  EXPO_PUBLIC_LIVEKIT_URL:'wss://peditrack-r6dlgmxt.livekit.cloud'
}

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'PediTrack',
  APP_VERSION: '2.0.0',

  // Token Storage Keys
  ACCESS_TOKEN_KEY: 'peditrack_access_token',
  REFRESH_TOKEN_KEY: 'peditrack_refresh_token',
  USER_DATA_KEY: 'peditrack_user_data',
  SELECTED_BABY_KEY: 'peditrack_selected_baby',

  // File Upload Configuration
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],

  // Validation
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Helper function to get API URL based on platform
export const getApiUrl = (service: 'user' | 'health') => {
  if (service === 'user') {
    return API_CONFIG.USER_SERVICE_URL;
  }
  return API_CONFIG.HEALTH_SERVICE_URL;
};

export default {
  API_CONFIG,
  GOOGLE_CONFIG,
  APP_CONFIG,
  GOOGLE_PLACES_API_KEY,
  EXPO_PUBLIC_LIVEKIT_URL,
  getApiUrl,
};
