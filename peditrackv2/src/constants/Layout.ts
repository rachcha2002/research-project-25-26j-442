import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: {
    width,
    height,
  },
  topBar: {
    height: 160,
  },
  bottomNav: {
    height: 70,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  iconSize: {
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
  },
} as const;
