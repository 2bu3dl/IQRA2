import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { loadData as loadLocalData, saveCurrentPosition as saveLocalPosition } from './store';

// Save user progress to Firestore
export const saveProgressToCloud = async (progressData) => {
  try {
    const user = auth().currentUser;
    if (!user) {
      console.log('[CloudStore] No user logged in, skipping cloud save');
      return { success: false, error: 'Not authenticated' };
    }

    const dataToSave = {
      totalHasanat: progressData.totalHasanat || 0,
      todayHasanat: progressData.todayHasanat || 0,
      streak: progressData.streak || 0,
      memorizedAyahs: progressData.memorizedAyahs || {},
      lastPosition: progressData.lastPosition || null,
      lastUpdated: firestore.FieldValue.serverTimestamp(),
      deviceInfo: {
        platform: 'mobile',
        lastSyncDate: new Date().toISOString(),
      }
    };

    await firestore()
      .collection('users')
      .doc(user.uid)
      .set(dataToSave, { merge: true });

    console.log('[CloudStore] Progress saved to cloud successfully');
    return { success: true };
  } catch (error) {
    console.error('[CloudStore] Error saving to cloud:', error);
    return { success: false, error: error.message };
  }
};

// Load user progress from Firestore
export const loadProgressFromCloud = async () => {
  try {
    const user = auth().currentUser;
    if (!user) {
      console.log('[CloudStore] No user logged in, cannot load from cloud');
      return { success: false, error: 'Not authenticated' };
    }

    const doc = await firestore()
      .collection('users')
      .doc(user.uid)
      .get();

    if (doc.exists) {
      const cloudData = doc.data();
      console.log('[CloudStore] Progress loaded from cloud successfully');
      return { success: true, data: cloudData };
    } else {
      console.log('[CloudStore] No cloud data found for user');
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('[CloudStore] Error loading from cloud:', error);
    return { success: false, error: error.message };
  }
};

// Sync local data with cloud (merge strategy)
export const syncProgressData = async () => {
  try {
    const user = auth().currentUser;
    if (!user) {
      console.log('[CloudStore] No user logged in, skipping sync');
      return { success: false, error: 'Not authenticated' };
    }

    // Load local data
    const localData = await loadLocalData();
    
    // Load cloud data
    const cloudResult = await loadProgressFromCloud();
    
    if (!cloudResult.success) {
      // If cloud load failed, just save local data to cloud
      console.log('[CloudStore] Cloud load failed, saving local data to cloud');
      return await saveProgressToCloud(localData);
    }

    const cloudData = cloudResult.data;
    
    if (!cloudData) {
      // No cloud data exists, save local data as initial cloud data
      console.log('[CloudStore] No cloud data, uploading local data');
      return await saveProgressToCloud(localData);
    }

    // Merge strategy: take the higher values for progress metrics
    const mergedData = {
      totalHasanat: Math.max(localData.totalHasanat || 0, cloudData.totalHasanat || 0),
      todayHasanat: Math.max(localData.todayHasanat || 0, cloudData.todayHasanat || 0),
      streak: Math.max(localData.streak || 0, cloudData.streak || 0),
      memorizedAyahs: mergeMemorizedAyahs(localData.memorizedAyahs, cloudData.memorizedAyahs),
      lastPosition: cloudData.lastPosition || localData.lastPosition,
    };

    // Save merged data to cloud
    const saveResult = await saveProgressToCloud(mergedData);
    
    if (saveResult.success) {
      console.log('[CloudStore] Data synced successfully');
      return { success: true, data: mergedData };
    } else {
      return saveResult;
    }
  } catch (error) {
    console.error('[CloudStore] Error during sync:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to merge memorized ayahs data
const mergeMemorizedAyahs = (localAyahs = {}, cloudAyahs = {}) => {
  const merged = { ...localAyahs };
  
  // For each surah in cloud data
  Object.keys(cloudAyahs).forEach(surahName => {
    if (!merged[surahName]) {
      // If surah doesn't exist locally, use cloud data
      merged[surahName] = cloudAyahs[surahName];
    } else {
      // If surah exists in both, merge with higher progress
      const local = merged[surahName];
      const cloud = cloudAyahs[surahName];
      
      merged[surahName] = {
        total: Math.max(local.total || 0, cloud.total || 0),
        memorized: Math.max(local.memorized || 0, cloud.memorized || 0),
        lastAyahIndex: Math.max(local.lastAyahIndex || 0, cloud.lastAyahIndex || 0),
        completedAyaat: mergeArrays(local.completedAyaat || [], cloud.completedAyaat || []),
        currentFlashcardIndex: Math.max(local.currentFlashcardIndex || 0, cloud.currentFlashcardIndex || 0),
      };
    }
  });
  
  return merged;
};

// Helper function to merge arrays and remove duplicates
const mergeArrays = (arr1, arr2) => {
  return [...new Set([...arr1, ...arr2])];
};

// Auto-sync function (call this when user completes actions)
export const autoSync = async (progressData) => {
  const user = auth().currentUser;
  if (user) {
    // Save to cloud in background (don't block UI)
    saveProgressToCloud(progressData).catch(error => {
      console.error('[CloudStore] Background sync failed:', error);
    });
  }
};

// Initialize user's cloud data on first login
export const initializeUserCloudData = async () => {
  try {
    const user = auth().currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    // Check if user data already exists
    const existingData = await loadProgressFromCloud();
    
    if (existingData.success && existingData.data) {
      console.log('[CloudStore] User data already exists in cloud');
      return { success: true, data: existingData.data };
    }

    // Initialize with local data
    const localData = await loadLocalData();
    const result = await saveProgressToCloud(localData);
    
    if (result.success) {
      console.log('[CloudStore] User cloud data initialized');
    }
    
    return result;
  } catch (error) {
    console.error('[CloudStore] Error initializing user data:', error);
    return { success: false, error: error.message };
  }
}; 