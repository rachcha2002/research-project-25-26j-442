# Assets Directory

This directory contains all static assets for the PediTrack app.

## Required Assets

To complete the setup, you'll need to add the following image files:

### 1. App Icon (`icon.png`)
- Size: 1024x1024 pixels
- Format: PNG with transparency
- Content: PediTrack logo (baby footprint with purple gradient)

### 2. Splash Screen (`splash.png`)
- Size: 1284x2778 pixels (iPhone 14 Pro Max)
- Format: PNG
- Background: Purple (#7C3AED)
- Content: PediTrack logo centered

### 3. Adaptive Icon (`adaptive-icon.png`)
- Size: 1024x1024 pixels
- Format: PNG with transparency
- Content: PediTrack logo (will be used on Android with adaptive backgrounds)

### 4. Favicon (`favicon.png`)
- Size: 48x48 pixels
- Format: PNG
- Content: Simplified PediTrack logo for web

## Temporary Placeholders

For development purposes, you can use placeholder images. The app will still run without these assets, though you may see warnings.

## Creating Assets

You can use design tools like:
- Figma
- Adobe Illustrator
- Sketch
- Canva (free option)

Or use the Expo asset generator:
```bash
npx expo-asset-generator --help
```

## Notes

- All assets should maintain the purple color scheme (#7C3AED, #6366F1)
- Icons should be simple and recognizable at small sizes
- Follow iOS and Android design guidelines for app icons
