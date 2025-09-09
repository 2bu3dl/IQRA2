import { supabase } from './supabase';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

// Audio file configuration
const AUDIO_CONFIG = {
  // Keep these local (essential files)
  localAudio: [
    'AlFatiha_Mishary', // 7 files, ~2MB
  ],
  
  // Download from cloud (larger files)
  cloudAudio: [
    'AlKahf_Sudais', // 110 files, ~33MB
  ],
  
  // Storage bucket name
  bucketName: 'quran-recitations',
  
  // Local storage directory
  localDir: `${RNFS.DocumentDirectoryPath}/audio`,
};

// Check if audio file exists locally
export const isAudioLocal = async (surahName, ayahNumber) => {
  try {
    const fileName = `${surahName}/${ayahNumber.toString().padStart(6, '0')}.mp3`;
    const localPath = `${AUDIO_CONFIG.localDir}/${fileName}`;
    
    const exists = await RNFS.exists(localPath);
    return exists;
  } catch (error) {
    console.error('[AudioDownloader] Error checking local file:', error);
    return false;
  }
};

// Get audio file path (local or cloud)
export const getAudioPath = async (surahName, ayahNumber) => {
  try {
    const fileName = `${ayahNumber.toString().padStart(6, '0')}.mp3`;
    
    // Check if it's a local audio file
    if (AUDIO_CONFIG.localAudio.includes(surahName)) {
      // Return local asset path
      return `../assets/${surahName}/${fileName}`;
    }
    
    // Check if it's already downloaded locally
    const localPath = `${AUDIO_CONFIG.localDir}/${surahName}/${fileName}`;
    const exists = await RNFS.exists(localPath);
    
    if (exists) {
      return localPath;
    }
    
    // Return cloud URL
    const cloudPath = `${supabase.storage.from(AUDIO_CONFIG.bucketName).getPublicUrl(`${surahName}/${fileName}`).data.publicUrl}`;
    return cloudPath;
    
  } catch (error) {
    console.error('[AudioDownloader] Error getting audio path:', error);
    return null;
  }
};

// Download audio file from cloud
export const downloadAudio = async (surahName, ayahNumber, onProgress) => {
  try {
    const fileName = `${ayahNumber.toString().padStart(6, '0')}.mp3`;
    const cloudPath = `${surahName}/${fileName}`;
    const localPath = `${AUDIO_CONFIG.localDir}/${surahName}/${fileName}`;
    
    // Create directory if it doesn't exist
    const dirPath = `${AUDIO_CONFIG.localDir}/${surahName}`;
    const dirExists = await RNFS.exists(dirPath);
    if (!dirExists) {
      await RNFS.mkdir(dirPath);
    }
    
    // Get download URL
    const { data, error } = await supabase.storage
      .from(AUDIO_CONFIG.bucketName)
      .getPublicUrl(cloudPath);
    
    if (error) {
      throw error;
    }
    
    // Download file
    const downloadResult = await RNFS.downloadFile({
      fromUrl: data.publicUrl,
      toFile: localPath,
      progress: (res) => {
        if (onProgress) {
          const progress = res.bytesWritten / res.contentLength;
          onProgress(progress);
        }
      },
    }).promise;
    
    if (downloadResult.statusCode === 200) {
      console.log(`[AudioDownloader] Downloaded: ${fileName}`);
      return localPath;
    } else {
      throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
    }
    
  } catch (error) {
    console.error('[AudioDownloader] Download error:', error);
    throw error;
  }
};

// Pre-download surah (for offline use)
export const downloadSurah = async (surahName, onProgress) => {
  try {
    console.log(`[AudioDownloader] Starting download of ${surahName}...`);
    
    // Get list of files in the surah
    const { data, error } = await supabase.storage
      .from(AUDIO_CONFIG.bucketName)
      .list(surahName);
    
    if (error) {
      throw error;
    }
    
    const files = data.filter(item => item.name.endsWith('.mp3'));
    let completed = 0;
    
    for (const file of files) {
      try {
        const ayahNumber = parseInt(file.name.replace('.mp3', ''));
        await downloadAudio(surahName, ayahNumber, (progress) => {
          if (onProgress) {
            const overallProgress = (completed + progress) / files.length;
            onProgress(overallProgress);
          }
        });
        completed++;
      } catch (error) {
        console.error(`[AudioDownloader] Failed to download ${file.name}:`, error);
      }
    }
    
    console.log(`[AudioDownloader] Completed download of ${surahName}`);
    return true;
    
  } catch (error) {
    console.error('[AudioDownloader] Surah download error:', error);
    throw error;
  }
};

// Get local storage usage
export const getLocalStorageUsage = async () => {
  try {
    const exists = await RNFS.exists(AUDIO_CONFIG.localDir);
    if (!exists) {
      return { size: 0, files: 0 };
    }
    
    const stats = await RNFS.stat(AUDIO_CONFIG.localDir);
    const files = await RNFS.readDir(AUDIO_CONFIG.localDir);
    
    return {
      size: stats.size,
      files: files.length,
    };
  } catch (error) {
    console.error('[AudioDownloader] Error getting storage usage:', error);
    return { size: 0, files: 0 };
  }
};

// Clear local audio cache
export const clearAudioCache = async () => {
  try {
    const exists = await RNFS.exists(AUDIO_CONFIG.localDir);
    if (exists) {
      await RNFS.unlink(AUDIO_CONFIG.localDir);
      console.log('[AudioDownloader] Audio cache cleared');
    }
  } catch (error) {
    console.error('[AudioDownloader] Error clearing cache:', error);
  }
};

// Check if surah is fully downloaded
export const isSurahDownloaded = async (surahName) => {
  try {
    const localDir = `${AUDIO_CONFIG.localDir}/${surahName}`;
    const exists = await RNFS.exists(localDir);
    
    if (!exists) {
      return false;
    }
    
    const files = await RNFS.readDir(localDir);
    const mp3Files = files.filter(file => file.name.endsWith('.mp3'));
    
    // Check if we have all expected files
    // This is a simple check - you might want to make it more sophisticated
    return mp3Files.length > 0;
    
  } catch (error) {
    console.error('[AudioDownloader] Error checking surah download:', error);
    return false;
  }
};
