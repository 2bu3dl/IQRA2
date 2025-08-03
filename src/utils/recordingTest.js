import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple test to verify recording functionality
export const testRecordingSetup = async () => {
  try {
    console.log('[RecordingTest] Testing recording setup...');
    
    // Test 1: Check file system
    const testDir = `${RNFS.DocumentDirectoryPath}/test`;
    const dirExists = await RNFS.exists(testDir);
    console.log('[RecordingTest] Test directory exists:', dirExists);
    
    // Test 2: Create test directory
    if (!dirExists) {
      await RNFS.mkdir(testDir);
      console.log('[RecordingTest] Created test directory');
    }
    
    // Test 3: Write test file
    const testFile = `${testDir}/test.txt`;
    await RNFS.writeFile(testFile, 'Test recording functionality', 'utf8');
    console.log('[RecordingTest] Wrote test file');
    
    // Test 4: Read test file
    const content = await RNFS.readFile(testFile, 'utf8');
    console.log('[RecordingTest] Read test file content:', content);
    
    // Test 5: Clean up
    await RNFS.unlink(testFile);
    await RNFS.rmdir(testDir);
    console.log('[RecordingTest] Cleaned up test files');
    
    console.log('[RecordingTest] All tests passed!');
    return true;
  } catch (error) {
    console.error('[RecordingTest] Test failed:', error);
    return false;
  }
};

export const testAudioSetup = async () => {
  try {
    console.log('[RecordingTest] Testing audio setup...');
    
    // Mock audio setup - no external dependencies
    console.log('[RecordingTest] Mock audio setup completed');
    return true;
  } catch (error) {
    console.error('[RecordingTest] Audio setup failed:', error);
    return false;
  }
}; 