module.exports = {
  assets: ['./src/assets/fonts/'],
  // Suppress legacy architecture warning
  experimentalImportSupport: true,
  suppressLegacyArchitectureWarning: true,
  dependencies: {
    'react-native-track-player': {
      platforms: {
        android: null, // Disable for Android
        ios: {}, // Enable for iOS
      },
    },
  },
}; 