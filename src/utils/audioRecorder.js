import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

// Import native module (iOS only for now)
const { AudioRecorderModule } = NativeModules;

// Debug logging
logger.debug('AudioRecorder', 'Available native modules', { modules: Object.keys(NativeModules) });
logger.debug('AudioRecorder', 'AudioRecorderModule available', { hasModule: !!AudioRecorderModule });

class AudioRecorder {
  constructor() {
    this.isRecording = false;
    this.isPlaying = false;
    this.recordings = [];
    this.currentRecordingUri = null;
    this.recordingStartTime = null;
    this.currentSurahName = null;
  }

  // Request permissions (handled by native module on iOS)
  async requestPermissions() {
    try {
      if (Platform.OS === 'ios') {
        // iOS permissions are handled automatically by the native module
        return true;
      } else {
        // TODO: Implement Android permissions
        return false;
      }
    } catch (error) {
      logger.error('AudioRecorder', 'Error requesting audio permissions', error);
      return false;
    }
  }

  // Start recording using native module
  async startRecording(surahName, ayahNumber) {
    try {
      // Store the surah name for naming recordings
      this.currentSurahName = surahName;
      
      if (Platform.OS === 'ios' && AudioRecorderModule) {
        // Use native iOS module
        const result = await AudioRecorderModule.startRecording(surahName, ayahNumber.toString());
        
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        return { success: true, filePath: result.filePath };
      } else {
        // Fallback to mock for Android or if module not available
        const mockUri = `mock://recording_${Date.now()}.m4a`;
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        return { success: true, uri: mockUri };
      }
    } catch (error) {
      this.isRecording = false;
      throw error;
    }
  }

  // Mock recording implementation (fallback)
  async startRecordingMock(surahName, ayahNumber) {
    try {
      logger.debug('AudioRecorder', 'Mock: Starting recording', { surah: surahName, ayah: ayahNumber });
      
      // Create a mock recording file
      const timestamp = Date.now();
      const fileName = `recording_${surahName}_${ayahNumber}_${timestamp}.txt`;
      const documentsPath = RNFS.DocumentDirectoryPath;
      const recordingsPath = `${documentsPath}/recordings`;
      
      // Ensure recordings directory exists
      const dirExists = await RNFS.exists(recordingsPath);
      if (!dirExists) {
        await RNFS.mkdir(recordingsPath);
      }
      
      const filePath = `${recordingsPath}/${fileName}`;
      await RNFS.writeFile(filePath, `Mock recording for ${surahName} ayah ${ayahNumber}`, 'utf8');
      
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.currentRecordingUri = filePath;
      
      logger.debug('AudioRecorder', 'Mock: Recording started', { filePath });
      return true;
    } catch (error) {
      logger.error('AudioRecorder', 'Mock: Error starting recording', error);
      throw error;
    }
  }

  // Stop recording using native module
  async stopRecording() {
    try {
      if (!this.isRecording) {
        throw new Error('No active recording');
      }

      if (Platform.OS === 'ios' && AudioRecorderModule) {
        // Use native iOS module
        const result = await AudioRecorderModule.stopRecording();
        
        // Save recording metadata with duration and surah name
        await this.saveRecordingMetadata(result.uri, result.duration, null, this.currentSurahName);
        
        this.isRecording = false;
        this.recordingStartTime = null;
        return { uri: result.uri, duration: result.duration };
      } else {
        // Fallback to mock for Android or if module not available
        const mockUri = `mock://recording_${Date.now()}.m4a`;
        const mockDuration = (Date.now() - this.recordingStartTime) / 1000;
        
        // Save recording metadata with duration
        await this.saveRecordingMetadata(mockUri, mockDuration);
        
        this.isRecording = false;
        this.recordingStartTime = null;
        return { uri: mockUri, duration: mockDuration };
      }
    } catch (error) {
      this.isRecording = false;
      this.recordingStartTime = null;
      throw error;
    }
  }

  // Mock stop recording implementation
  async stopRecordingMock() {
    try {
      logger.debug('AudioRecorder', 'Mock: Stopping recording');
      
      if (!this.currentRecordingUri) {
        throw new Error('No active recording');
      }
      
      const duration = this.recordingStartTime ? (Date.now() - this.recordingStartTime) / 1000 : 3;
      
      // Save recording metadata with duration and surah name
      await this.saveRecordingMetadata(this.currentRecordingUri, duration, null, this.currentSurahName);
      
      this.isRecording = false;
      this.recordingStartTime = null;
      
      logger.debug('AudioRecorder', 'Mock: Recording stopped', { file: this.currentRecordingUri });
      return this.currentRecordingUri;
    } catch (error) {
      logger.error('AudioRecorder', 'Mock: Error stopping recording', error);
      throw error;
    }
  }

  // Save recording metadata
  async saveRecordingMetadata(uri, duration = 0, name = null, surahName = null) {
    try {
      let recordingName = name;
      
      if (!name && surahName) {
        // Generate name in format: "SurahName_IQRA2-rec_number"
        const existingRecordings = await this.getExistingRecordings(surahName);
        const nextNumber = existingRecordings.length + 1;
        recordingName = `${surahName}_IQRA2-rec_${nextNumber}`;
      } else if (!name) {
        recordingName = `Recording ${new Date().toLocaleString()}`;
      }

      const metadata = {
        uri,
        timestamp: new Date().toISOString(),
        duration: duration,
        name: recordingName,
      };

      const key = `recording_${uri.split('/').pop()}`;
      await AsyncStorage.setItem(key, JSON.stringify(metadata));
    } catch (error) {
      logger.error('AudioRecorder', 'Error saving recording metadata', error);
    }
  }

  // Helper function to get existing recordings for a surah
  async getExistingRecordings(surahName) {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const recordingKeys = allKeys.filter(key => key.startsWith('recording_'));
      
      const recordings = [];
      for (const key of recordingKeys) {
        const metadataStr = await AsyncStorage.getItem(key);
        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);
          if (metadata.name && metadata.name.startsWith(`${surahName}_IQRA2-rec_`)) {
            recordings.push(metadata);
          }
        }
      }
      
      return recordings;
    } catch (error) {
      logger.error('AudioRecorder', 'Error getting existing recordings', error);
      return [];
    }
  }

  // Load recordings using native module
  async loadRecordings(surahName, ayahNumber) {
    try {
      logger.debug('AudioRecorder', 'Loading recordings', { surah: surahName, ayah: ayahNumber });
      if (Platform.OS === 'ios') {
        // Use native iOS module
        const recordings = await AudioRecorderModule.listRecordings(surahName, ayahNumber.toString());
        logger.debug('AudioRecorder', 'Native module returned', { count: recordings.length });
        
        // Load metadata for each recording
        const recordingsWithMetadata = await Promise.all(
          recordings.map(async (recording, index) => {
            const key = `recording_${recording.filename}`;
            const metadataStr = await AsyncStorage.getItem(key);
            const metadata = metadataStr ? JSON.parse(metadataStr) : {};
            
            return {
              uri: recording.uri,
              filename: recording.filename,
              timestamp: recording.timestamp,
              duration: metadata.duration || recording.duration || 0,
              name: metadata.name || `Recording ${index + 1}`,
            };
          })
        );
        
        logger.debug('AudioRecorder', 'Final recordings with metadata', { count: recordingsWithMetadata.length });
        return recordingsWithMetadata;
      } else {
        // TODO: Implement Android recording listing
        logger.debug('AudioRecorder', 'Android recording listing not implemented yet');
        return [];
      }
    } catch (error) {
      logger.error('AudioRecorder', 'Error loading recordings', error);
      return [];
    }
  }

  // Play recording using native module
  async playRecording(uri) {
    try {
      if (this.isPlaying) {
        await this.stopPlayback();
      }

      if (Platform.OS === 'ios') {
        // Use native iOS module
        await AudioRecorderModule.playRecording(uri);
        this.isPlaying = true;
        console.log('Started playing with native iOS module:', uri);
        return true;
      } else {
        // TODO: Implement Android playback using MediaPlayer
        console.log('[AudioRecorder] Android playback not implemented yet');
        throw new Error('Android playback not implemented yet');
      }
    } catch (error) {
      console.error('Error playing recording:', error);
      throw error;
    }
  }

  // Stop playback using native module
  async stopPlayback() {
    try {
      if (Platform.OS === 'ios') {
        // Use native iOS module
        await AudioRecorderModule.stopPlayback();
        this.isPlaying = false;
        console.log('Stopped playback with native iOS module');
      } else {
        // TODO: Implement Android stop playback
        console.log('[AudioRecorder] Android stop playback not implemented yet');
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  }

  // Update recording duration in metadata
  async updateRecordingDuration(uri, duration) {
    try {
      const filename = uri.split('/').pop();
      const key = `recording_${filename}`;
      const metadataStr = await AsyncStorage.getItem(key);
      
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        metadata.duration = duration;
        await AsyncStorage.setItem(key, JSON.stringify(metadata));
      }
    } catch (error) {
      console.error('Error updating recording duration:', error);
    }
  }

  // Delete recording using native module
  async deleteRecording(uri) {
    try {
      if (Platform.OS === 'ios') {
        // Use native iOS module
        await AudioRecorderModule.deleteRecording(uri);
        
        // Delete metadata
        const filename = uri.split('/').pop();
        const key = `recording_${filename}`;
        await AsyncStorage.removeItem(key);
        
        console.log('Recording deleted with native iOS module:', uri);
        return true;
      } else {
        // TODO: Implement Android delete recording
        console.log('[AudioRecorder] Android delete recording not implemented yet');
        throw new Error('Android delete recording not implemented yet');
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  // Rename recording using native module
  async renameRecording(oldUri, newName) {
    try {
      if (Platform.OS === 'ios') {
        // Use native iOS module
        const newUri = await AudioRecorderModule.renameRecording(oldUri, newName);
        
        // Update metadata
        const oldFilename = oldUri.split('/').pop();
        const newFilename = newUri.split('/').pop();
        const oldKey = `recording_${oldFilename}`;
        const newKey = `recording_${newFilename}`;
        
        const metadataStr = await AsyncStorage.getItem(oldKey);
        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);
          metadata.uri = newUri;
          await AsyncStorage.setItem(newKey, JSON.stringify(metadata));
          await AsyncStorage.removeItem(oldKey);
        }
        
        return newUri;
      } else {
        // TODO: Implement Android rename recording
        console.log('[AudioRecorder] Android rename recording not implemented yet');
        throw new Error('Android rename recording not implemented yet');
      }
    } catch (error) {
      console.error('Error renaming recording:', error);
      throw error;
    }
  }

  // Get recording status using native module
  async getStatus() {
    try {
      if (Platform.OS === 'ios') {
        // Use native iOS module
        const status = await AudioRecorderModule.getStatus();
        this.isRecording = status.isRecording;
        this.isPlaying = status.isPlaying;
        return status;
      } else {
        // TODO: Implement Android status
        console.log('[AudioRecorder] Android status not implemented yet');
        return { isRecording: false, isPlaying: false };
      }
    } catch (error) {
      console.error('Error getting status:', error);
      return { isRecording: false, isPlaying: false };
    }
  }

  // Cleanup
  async cleanup() {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
      if (this.isPlaying) {
        await this.stopPlayback();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export default new AudioRecorder(); 