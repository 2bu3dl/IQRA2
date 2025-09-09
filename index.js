/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Suppress legacy architecture warning
global.__suppressLegacyArchitectureWarning = true;

// Override console.warn to suppress legacy architecture warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  if (message.includes('Legacy Architecture') || 
      message.includes('OldArchDeprecatedWarning') ||
      message.includes('deprecated') && message.includes('architecture')) {
    return; // Suppress legacy architecture warnings
  }
  originalWarn.apply(console, args);
};

AppRegistry.registerComponent(appName, () => App);

// Initialize track player service after app registration (iOS only)
if (Platform.OS === 'ios') {
  const TrackPlayer = require('react-native-track-player').default;
  const { PlaybackService } = require('./src/services/PlaybackService');
  
  // Register the track player service with proper error handling
  try {
    TrackPlayer.registerPlaybackService(() => PlaybackService);
    console.log('[TrackPlayer] Service registered successfully for iOS');
  } catch (error) {
    console.warn('[TrackPlayer] Failed to register service:', error);
  }
}
