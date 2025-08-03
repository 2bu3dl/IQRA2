import { NativeModules } from 'react-native';

export const testNativeModule = () => {
  console.log('=== NATIVE MODULE TEST ===');
  console.log('Available modules:', Object.keys(NativeModules));
  
  const { AudioRecorderModule } = NativeModules;
  console.log('AudioRecorderModule:', AudioRecorderModule);
  
  if (AudioRecorderModule) {
    console.log('✅ AudioRecorderModule is available');
    return true;
  } else {
    console.log('❌ AudioRecorderModule is null/undefined');
    return false;
  }
}; 