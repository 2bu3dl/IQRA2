/**
 * @format
 */

import { AppRegistry } from 'react-native';
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

// Track player service temporarily disabled for debugging
// import TrackPlayer from 'react-native-track-player';
// import { PlaybackService } from './src/services/PlaybackService';

// Register the track player service
// TrackPlayer.registerPlaybackService(() => PlaybackService);
