import { Platform } from 'react-native';
import logger from './logger';

// Safe wrapper for audio recorder that won't crash on device
class SafeAudioRecorder {
  constructor() {
    this.isRecording = false;
    this.isPlaying = false;
    this.recordings = [];
    this.currentRecordingUri = null;
    this.recordingStartTime = null;
    this.currentSurahName = null;
    this.isAvailable = false;
    
    // Check if native module is available
    this.checkAvailability();
  }

  checkAvailability() {
    try {
      if (Platform.OS === 'ios') {
        // Try to import the native module safely
        const { NativeModules } = require('react-native');
        this.isAvailable = !!NativeModules.AudioRecorderModule;
      }
    } catch (error) {
      logger.warn('SafeAudioRecorder', 'Native module not available', error);
      this.isAvailable = false;
    }
  }

  async requestPermissions() {
    try {
      if (!this.isAvailable) {
        logger.warn('SafeAudioRecorder', 'Audio recording not available on this device');
        return false;
      }
      return true;
    } catch (error) {
      logger.error('SafeAudioRecorder', 'Error requesting permissions', error);
      return false;
    }
  }

  async startRecording(surahName, ayahNumber) {
    try {
      if (!this.isAvailable) {
        logger.warn('SafeAudioRecorder', 'Audio recording not available');
        return { success: false, message: 'Audio recording not available on this device' };
      }

      this.currentSurahName = surahName;
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      logger.info('SafeAudioRecorder', 'Recording started', { surahName, ayahNumber });
      return { success: true, message: 'Recording started' };
    } catch (error) {
      logger.error('SafeAudioRecorder', 'Error starting recording', error);
      this.isRecording = false;
      return { success: false, message: 'Failed to start recording' };
    }
  }

  async stopRecording() {
    try {
      if (!this.isRecording) {
        return { success: false, message: 'No recording in progress' };
      }

      this.isRecording = false;
      const duration = Date.now() - this.recordingStartTime;
      
      logger.info('SafeAudioRecorder', 'Recording stopped', { duration });
      return { success: true, message: 'Recording stopped', duration };
    } catch (error) {
      logger.error('SafeAudioRecorder', 'Error stopping recording', error);
      return { success: false, message: 'Failed to stop recording' };
    }
  }

  async playRecording(recordingUri) {
    try {
      if (!this.isAvailable) {
        logger.warn('SafeAudioRecorder', 'Audio playback not available');
        return { success: false, message: 'Audio playback not available' };
      }

      this.isPlaying = true;
      logger.info('SafeAudioRecorder', 'Playing recording', { recordingUri });
      
      // Simulate playback for now
      setTimeout(() => {
        this.isPlaying = false;
      }, 1000);
      
      return { success: true, message: 'Playing recording' };
    } catch (error) {
      logger.error('SafeAudioRecorder', 'Error playing recording', error);
      this.isPlaying = false;
      return { success: false, message: 'Failed to play recording' };
    }
  }

  async stopPlayback() {
    try {
      this.isPlaying = false;
      logger.info('SafeAudioRecorder', 'Playback stopped');
      return { success: true, message: 'Playback stopped' };
    } catch (error) {
      logger.error('SafeAudioRecorder', 'Error stopping playback', error);
      return { success: false, message: 'Failed to stop playback' };
    }
  }

  getRecordings() {
    return this.recordings;
  }

  isRecordingInProgress() {
    return this.isRecording;
  }

  isPlaybackInProgress() {
    return this.isPlaying;
  }
}

// Export singleton instance
const safeAudioRecorder = new SafeAudioRecorder();
export default safeAudioRecorder;
