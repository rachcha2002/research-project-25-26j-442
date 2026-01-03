export const Fonts = {
  SFProRounded: {
    Bold: require('../../assets/fonts/SF-Pro-Rounded-Bold.otf'),
    Regular: require('../../assets/fonts/SF-Pro-Rounded-Regular.otf'),
    Semibold: require('../../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
    Thin: require('../../assets/fonts/SF-Pro-Rounded-Thin.otf'),
  },
} as const;

export type FontFamily = keyof typeof Fonts;
export type FontWeight = keyof typeof Fonts.SFProRounded;
