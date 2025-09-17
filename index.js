/**
 * @format
 */

console.log('🚀 index.js: Starting app registration...');

import { AppRegistry } from 'react-native';
console.log('✅ index.js: AppRegistry imported');

import App from './App';
console.log('✅ index.js: App component imported');

import { name as appName } from './app.json';
console.log('✅ index.js: App name loaded:', appName);

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

console.log('📱 index.js: Registering app component...');
AppRegistry.registerComponent(appName, () => {
  console.log('🎯 index.js: App component wrapper called');
  return App;
});
console.log('✅ index.js: App component registered successfully');
