import { Share as RNShare, Platform, Alert, Linking } from 'react-native';
import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';

class SharingService {
  /**
   * Share a single recording file
   * @param {string} fileUri - The URI of the recording file
   * @param {string} fileName - The name of the file
   * @param {string} surahName - The surah name for context
   * @param {number} ayahNumber - The ayah number for context
   */
  async shareSingleRecording(fileUri, fileName, surahName, ayahNumber) {
    try {
      // Validate file before sharing
      let fileInfo = null;
      try {
        const validation = await this.validateFile(fileUri);
        if (!validation.valid) {
          console.warn(`File validation failed: ${validation.error}, but continuing`);
        } else {
          fileInfo = validation.fileInfo;
        }
      } catch (validationError) {
        console.warn('File validation error, but continuing:', validationError);
      }
      
      // Convert file URI to proper format for sharing
      let shareUrl = fileUri;
      if (Platform.OS === 'ios') {
        // For iOS, we need to add file:// prefix for sharing
        if (!fileUri.startsWith('file://')) {
          shareUrl = `file://${fileUri}`;
        }
      } else if (Platform.OS === 'android') {
        // For Android, ensure we have the file:// prefix
        if (!fileUri.startsWith('file://')) {
          shareUrl = `file://${fileUri}`;
        }
      }
      
      // Create share options with proper MIME type
      const shareOptions = {
        title: `IQRA2 Recording - ${surahName} Ayah ${ayahNumber}`,
        message: `My Quran recitation recording for ${surahName} Ayah ${ayahNumber}`,
        url: shareUrl,
        type: 'audio/m4a', // Specify the correct MIME type for audio files
        filename: fileName.endsWith('.m4a') ? fileName : `${fileName}.m4a`, // Ensure proper file extension
      };

      // Open share dialog
      console.log('Sharing with options:', shareOptions);
      console.log('File URI:', fileUri);
      console.log('Share URL:', shareUrl);
      console.log('Platform:', Platform.OS);
      console.log('File exists:', await RNFS.exists(fileUri));
      
      const result = await RNShare.share(shareOptions);
      
      if (result.action === RNShare.sharedAction) {
        return { success: true };
      } else {
        return { success: false, error: 'User cancelled sharing' };
      }
    } catch (error) {
      console.error('Error sharing recording:', error);
      Alert.alert('Sharing Error', `Failed to share recording: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Share multiple recording files
   * @param {Array} fileUris - Array of file URIs to share
   * @param {Array} fileNames - Array of file names
   * @param {string} surahName - The surah name for context
   * @param {number} ayahNumber - The ayah number for context
   */
  async shareMultipleRecordings(fileUris, fileNames, surahName, ayahNumber) {
    try {
      // Check if all files exist
      for (const uri of fileUris) {
        const fileExists = await RNFS.exists(uri);
        if (!fileExists) {
          throw new Error(`Recording file not found: ${uri}`);
        }
      }

      // For multiple files, we'll share them one by one or create a zip
      // For now, let's share them individually
      const results = [];
      
      for (let i = 0; i < fileUris.length; i++) {
        const result = await this.shareSingleRecording(
          fileUris[i], 
          fileNames[i], 
          surahName, 
          ayahNumber
        );
        results.push(result);
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error sharing multiple recordings:', error);
      Alert.alert('Sharing Error', 'Failed to share recordings. Please try again.');
      return { success: false, error: error.message };
    }
  }

  /**
   * Share via specific app (Messages, WhatsApp, etc.)
   * @param {string} fileUri - The URI of the recording file
   * @param {string} fileName - The name of the file
   * @param {string} surahName - The surah name for context
   * @param {number} ayahNumber - The ayah number for context
   * @param {string} appType - The type of app to share to ('messages', 'whatsapp', 'mail', 'airdrop')
   */
  async shareToSpecificApp(fileUri, fileName, surahName, ayahNumber, appType) {
    try {
      // Check if file exists
      const fileExists = await RNFS.exists(fileUri);
      if (!fileUri.startsWith('file://') && !fileExists) {
        throw new Error('Recording file not found');
      }

      // Convert file URI to proper format for sharing
      let shareUrl = fileUri;
      if (Platform.OS === 'ios') {
        // For iOS, we need to add file:// prefix for sharing
        if (!fileUri.startsWith('file://')) {
          shareUrl = `file://${fileUri}`;
        }
      } else if (Platform.OS === 'android') {
        // For Android, ensure we have the file:// prefix
        if (!fileUri.startsWith('file://')) {
          shareUrl = `file://${fileUri}`;
        }
      }

      const shareOptions = {
        title: `IQRA2 Recording - ${surahName} Ayah ${ayahNumber}`,
        message: `My Quran recitation recording for ${surahName} Ayah ${ayahNumber}`,
        url: shareUrl,
        type: 'audio/m4a', // Specify the correct MIME type for audio files
        filename: fileName.endsWith('.m4a') ? fileName : `${fileName}.m4a`, // Ensure proper file extension
      };

      // For specific apps, we'll use the general share and let the user choose
      // The native share sheet will show available apps
      const result = await RNShare.share(shareOptions);
      
      if (result.action === RNShare.sharedAction) {
        return { success: true };
      } else {
        return { success: false, error: 'User cancelled sharing' };
      }
    } catch (error) {
      console.error(`Error sharing to ${appType}:`, error);
      Alert.alert('Sharing Error', `Failed to share via ${appType}. Please try again.`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available sharing options for the current platform
   */
  getAvailableSharingOptions() {
    return [
      { id: 'general', title: 'Share', icon: 'share' },
    ];
  }

  /**
   * Validate file before sharing
   * @param {string} fileUri - The URI of the file to validate
   */
  async validateFile(fileUri) {
    try {
      // Check if file exists
      const fileExists = await RNFS.exists(fileUri);
      if (!fileExists) {
        throw new Error('File does not exist');
      }

      // Get file info
      const fileInfo = await RNFS.stat(fileUri);
      
      // Check file size (should be greater than 0)
      if (fileInfo.size === 0) {
        throw new Error('File is empty');
      }

      // Check if it's an audio file (basic check)
      const fileName = fileUri.split('/').pop().toLowerCase();
      const audioExtensions = ['.m4a', '.mp3', '.wav', '.aac', '.m4v'];
      const hasAudioExtension = audioExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasAudioExtension) {
        console.warn('File may not be an audio file:', fileName);
      }

      return { valid: true, fileInfo };
    } catch (error) {
      console.error('File validation failed:', error);
      return { valid: false, error: error.message };
    }
  }


}

export default new SharingService(); 