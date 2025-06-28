import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';

class AudioRecorderService {
  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.isInitialized = false;
    
    // Initialize the service
    this.initialize();
  }

  async initialize() {
    try {
      // Test if the audio recorder is working by checking if it's properly instantiated
      if (this.audioRecorderPlayer) {
        this.isInitialized = true;
        console.log('[AudioRecorderService] Initialized successfully');
      } else {
        throw new Error('AudioRecorderPlayer not properly instantiated');
      }
    } catch (error) {
      console.error('[AudioRecorderService] Initialization failed:', error);
      this.isInitialized = false;
    }
  }

  // Storage keys for audio recordings
  STORAGE_KEYS = {
    AYAH_RECORDINGS: 'ayah_recordings',
    SURAH_RECORDINGS: 'surah_recordings',
  };

  // Request microphone permissions
  async requestMicrophonePermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record your Quran recitation.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('[AudioRecorderService] Android permission error:', err);
        return false;
      }
    } else {
      // iOS: Check if running in simulator
      // TEMPORARILY DISABLED FOR TESTING - Re-enable for production
      // const isSimulator = await DeviceInfo.isEmulator();
      // if (isSimulator) {
      //   Alert.alert(
      //     'Simulator Limitation',
      //     'Audio recording is not supported in the iOS simulator. Please test on a real device.'
      //   );
      //   return false;
      // }
      
      // iOS permissions are handled through Info.plist
      // We'll check if we can actually record by trying to start a test recording
      try {
        const testPath = `${RNFS.CachesDirectoryPath}/test_permission.m4a`;
        await this.audioRecorderPlayer.startRecorder(testPath);
        await this.audioRecorderPlayer.stopRecorder();
        await RNFS.unlink(testPath).catch(() => {}); // Clean up test file
        return true;
      } catch (error) {
        console.warn('[AudioRecorderService] iOS permission check failed:', error);
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in Settings > Privacy & Security > Microphone',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
  }

  // Start recording
  async startRecording(fileName, isAyah = false, surahName = '', ayahNumber = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized || !this.audioRecorderPlayer) {
        throw new Error('AudioRecorderPlayer not properly initialized');
      }

      // 1. Request microphone permission
      console.log('[AudioRecorderService] Requesting microphone permission...');
      const hasPermission = await this.requestMicrophonePermission();
      console.log('[AudioRecorderService] Microphone permission result:', hasPermission);
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      // 2. Determine file path
      let path = fileName;
      if (isAyah && surahName && ayahNumber !== null) {
        path = this.getTempAyahRecordingPath(surahName, ayahNumber);
      }
      // Fallback for debugging
      if (!path) {
        path = `${RNFS.CachesDirectoryPath}/test_recording.m4a`;
      }
      console.log('[AudioRecorderService] Recording path:', path);

      // 3. Ensure directory exists
      const dir = path.substring(0, path.lastIndexOf('/'));
      const dirExists = await RNFS.exists(dir);
      if (!dirExists) {
        await RNFS.mkdir(dir);
        console.log('[AudioRecorderService] Created directory:', dir);
      }

      // 4. Start recorder
      const result = await this.audioRecorderPlayer.startRecorder(path);
      this.audioRecorderPlayer.addRecordBackListener((e) => {
        // ... existing code ...
      });
      console.log('[AudioRecorderService] Recorder started:', result);
      return result;
    } catch (error) {
      console.error('[AudioRecorderService] Error starting recording:', error);
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  // Stop recording
  async stopRecording() {
    try {
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener((e) => {});
      return result;
    } catch (error) {
      console.error('[AudioRecorderService] Error stopping recording:', error);
      throw new Error(`Failed to stop recording: ${error.message}`);
    }
  }

  // Play recording
  async playRecording(filePath) {
    try {
      const result = await this.audioRecorderPlayer.startPlayer(filePath);
      
      // Add playback completion listener
      this.audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition === e.duration) {
          // Playback completed
          this.audioRecorderPlayer.removePlayBackListener((e) => {});
        }
      });
      
      return result;
    } catch (error) {
      console.error('[AudioRecorderService] Error playing recording:', error);
      throw new Error(`Failed to play recording: ${error.message}`);
    }
  }

  // Stop playing
  async stopPlaying() {
    try {
      const result = await this.audioRecorderPlayer.stopPlayer();
      this.audioRecorderPlayer.removePlayBackListener((e) => {});
      return result;
    } catch (error) {
      console.error('[AudioRecorderService] Error stopping playback:', error);
      throw new Error(`Failed to stop playback: ${error.message}`);
    }
  }

  // Save ayah recording metadata
  async saveAyahRecording(surahName, ayahNumber, filePath) {
    try {
      const key = `${this.STORAGE_KEYS.AYAH_RECORDINGS}_${surahName}_${ayahNumber}`;
      const recordingData = {
        filePath,
        timestamp: new Date().toISOString(),
        surahName,
        ayahNumber,
      };
      await AsyncStorage.setItem(key, JSON.stringify(recordingData));
    } catch (error) {
      console.error('Error saving ayah recording:', error);
      throw error;
    }
  }

  // Get ayah recording metadata
  async getAyahRecording(surahName, ayahNumber) {
    try {
      const key = `${this.STORAGE_KEYS.AYAH_RECORDINGS}_${surahName}_${ayahNumber}`;
      const recordingData = await AsyncStorage.getItem(key);
      return recordingData ? JSON.parse(recordingData) : null;
    } catch (error) {
      console.error('Error getting ayah recording:', error);
      return null;
    }
  }

  // Save surah recording metadata
  async saveSurahRecording(surahName, filePath) {
    try {
      const key = `${this.STORAGE_KEYS.SURAH_RECORDINGS}_${surahName}`;
      const recordingData = {
        filePath,
        timestamp: new Date().toISOString(),
        surahName,
      };
      await AsyncStorage.setItem(key, JSON.stringify(recordingData));
    } catch (error) {
      console.error('Error saving surah recording:', error);
      throw error;
    }
  }

  // Get surah recording metadata
  async getSurahRecording(surahName) {
    try {
      const key = `${this.STORAGE_KEYS.SURAH_RECORDINGS}_${surahName}`;
      const recordingData = await AsyncStorage.getItem(key);
      return recordingData ? JSON.parse(recordingData) : null;
    } catch (error) {
      console.error('Error getting surah recording:', error);
      return null;
    }
  }

  // Get all recordings for a surah
  async getSurahRecordings(surahName) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const ayahKeys = keys.filter(key => 
        key.startsWith(`${this.STORAGE_KEYS.AYAH_RECORDINGS}_${surahName}_`)
      );
      const surahKey = `${this.STORAGE_KEYS.SURAH_RECORDINGS}_${surahName}`;
      
      const recordings = {};
      
      // Get ayah recordings
      for (const key of ayahKeys) {
        const ayahNumber = key.split('_').pop();
        const recordingData = await AsyncStorage.getItem(key);
        if (recordingData) {
          recordings[`ayah_${ayahNumber}`] = JSON.parse(recordingData);
        }
      }
      
      // Get surah recording
      const surahRecording = await AsyncStorage.getItem(surahKey);
      if (surahRecording) {
        recordings.surah = JSON.parse(surahRecording);
      }
      
      return recordings;
    } catch (error) {
      console.error('Error getting surah recordings:', error);
      return {};
    }
  }

  // Generate file name for recording
  generateFileName(surahName, ayahNumber = null, type = 'ayah') {
    const timestamp = new Date().getTime();
    const cleanSurahName = surahName.replace(/[^a-zA-Z0-9]/g, '_');
    
    if (type === 'surah') {
      return `${cleanSurahName}_surah_${timestamp}.m4a`;
    } else {
      return `${cleanSurahName}_ayah_${ayahNumber}_${timestamp}.m4a`;
    }
  }

  // Get temp ayah recording path
  getTempAyahRecordingPath(surahName, ayahNumber) {
    const cleanSurahName = surahName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${RNFS.CachesDirectoryPath}/${cleanSurahName}_ayah_${ayahNumber}_temp.m4a`;
  }

  // Move temp ayah recording to permanent location
  async moveTempAyahRecordingToPermanent(surahName, ayahNumber) {
    const tempPath = this.getTempAyahRecordingPath(surahName, ayahNumber);
    const permanentPath = `${RNFS.DocumentDirectoryPath}/${surahName.replace(/[^a-zA-Z0-9]/g, '_')}_ayah_${ayahNumber}_${Date.now()}.m4a`;
    await RNFS.moveFile(tempPath, permanentPath);
    return permanentPath;
  }

  // Delete temp ayah recording
  async deleteTempAyahRecording(surahName, ayahNumber) {
    const tempPath = this.getTempAyahRecordingPath(surahName, ayahNumber);
    if (await RNFS.exists(tempPath)) {
      await RNFS.unlink(tempPath);
    }
  }
}

export default new AudioRecorderService();