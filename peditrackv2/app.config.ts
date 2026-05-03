import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'PediTrack',
  slug: 'peditrack',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'peditrack',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#7C3AED',
  },
  extra: {
    eas: {
      projectId: "891e7c97-c89d-42d5-80db-311915a50e3b"
    }
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.peditrack.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#7C3AED',
    },
    package: 'com.peditrack.app',
    permissions: ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS'],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-web-browser',
    '@react-native-google-signin/google-signin',
    [
      'expo-av',
      {
        microphonePermission: 'Allow PediTrack to access your microphone for voice chat.',
      },
    ],
    '@livekit/react-native-expo-plugin',
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
