import { Platform, Vibration } from 'react-native';

// Only import haptic feedback for iOS
let ReactNativeHapticFeedback = null;
if (Platform.OS === 'ios') {
  try {
    ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;
  } catch (error) {
    console.warn('react-native-haptic-feedback not available on iOS:', error);
  }
}

/**
 * Cross-platform haptic feedback utility
 * Uses iOS haptic feedback on iOS devices
 * Uses Android vibration patterns on Android devices
 */
export const triggerHaptic = (type = 'selection') => {
  if (Platform.OS === 'ios') {
    // iOS haptic feedback
    if (ReactNativeHapticFeedback) {
      try {
        ReactNativeHapticFeedback.trigger(type, { enableVibrateFallback: true });
      } catch (error) {
        console.warn('Haptic feedback failed on iOS:', error);
      }
    }
  } else if (Platform.OS === 'android') {
    // Android vibration patterns
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