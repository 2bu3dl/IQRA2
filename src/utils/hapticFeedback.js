import { Platform, Vibration } from 'react-native';

// Import haptic feedback for both platforms
let ReactNativeHapticFeedback = null;
try {
  ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;
} catch (error) {
  console.warn('react-native-haptic-feedback not available:', error);
}

/**
 * Cross-platform haptic feedback utility
 * Uses native haptic feedback on iOS devices
 * Uses native haptic feedback on Android devices (if available)
 * Falls back to vibration patterns on Android
 */
export const triggerHaptic = (type = 'selection') => {
  if (Platform.OS === 'ios') {
    // iOS haptic feedback
    if (ReactNativeHapticFeedback) {
      try {
        ReactNativeHapticFeedback.trigger(type, { enableVibrateFallback: true });
      } catch (error) {
        console.warn('Haptic feedback failed on iOS:', error);
        // Fallback to vibration
        Vibration.vibrate(10);
      }
    } else {
      // Fallback to vibration if haptic feedback is not available
      Vibration.vibrate(10);
    }
  } else if (Platform.OS === 'android') {
    // Android haptic feedback (if available) with vibration fallback
    if (ReactNativeHapticFeedback) {
      try {
        ReactNativeHapticFeedback.trigger(type, { enableVibrateFallback: true });
      } catch (error) {
        console.warn('Haptic feedback failed on Android, using vibration:', error);
        // Fallback to vibration patterns
        triggerAndroidVibration(type);
      }
    } else {
      // Use vibration patterns if haptic feedback is not available
      triggerAndroidVibration(type);
    }
  }
};

/**
 * Android vibration patterns for different haptic types
 */
const triggerAndroidVibration = (type) => {
  try {
    switch (type) {
      case 'selection':
      case 'impactLight':
        Vibration.vibrate(10);
        break;
      case 'impactMedium':
        Vibration.vibrate(50);
        break;
      case 'impactHeavy':
        Vibration.vibrate(100);
        break;
      case 'notificationSuccess':
        Vibration.vibrate([0, 50, 50, 50]);
        break;
      case 'notificationWarning':
        Vibration.vibrate([0, 50, 100, 50]);
        break;
      case 'notificationError':
        Vibration.vibrate([0, 50, 100, 50, 100, 50]);
        break;
      default:
        Vibration.vibrate(10);
        break;
    }
  } catch (error) {
    console.warn('Vibration failed on Android:', error);
  }
};

// Convenience functions for common haptic patterns
export const hapticSelection = () => triggerHaptic('selection');
export const hapticImpactLight = () => triggerHaptic('impactLight');
export const hapticImpactMedium = () => triggerHaptic('impactMedium');
export const hapticImpactHeavy = () => triggerHaptic('impactHeavy');
export const hapticSuccess = () => triggerHaptic('notificationSuccess');
export const hapticWarning = () => triggerHaptic('notificationWarning');
export const hapticError = () => triggerHaptic('notificationError');

// Additional utility functions for specific use cases
export const hapticButtonPress = () => triggerHaptic('selection');
export const hapticLongPress = () => triggerHaptic('impactMedium');
export const hapticSwipe = () => triggerHaptic('impactLight');
export const hapticToggle = () => triggerHaptic('selection');
export const hapticScroll = () => triggerHaptic('impactLight');
export const hapticCompletion = () => triggerHaptic('notificationSuccess');
export const hapticAlert = () => triggerHaptic('notificationWarning');
export const hapticFailure = () => triggerHaptic('notificationError');

// Utility to check if haptic feedback is available
export const isHapticAvailable = () => {
  return ReactNativeHapticFeedback !== null;
};

// Utility to check if vibration is available
export const isVibrationAvailable = () => {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}; 