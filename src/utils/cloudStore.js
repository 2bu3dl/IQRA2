import { supabase, saveUserProgress, loadUserProgress, createUserProfile } from './supabase';
import { loadData as loadLocalData, saveCurrentPosition as saveLocalPosition } from './store';
import logger from './logger';

// Save user progress to Supabase
export const saveProgressToCloud = async (progressData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.log('CloudStore', 'No user logged in, skipping cloud save');
      return { success: false, error: 'Not authenticated' };
    }

    const result = await saveUserProgress(user.id, progressData);
    if (result.success) {
      logger.log('CloudStore', 'Progress saved to cloud successfully');
    }
    return result;
  } catch (error) {
    logger.error('CloudStore', 'Error saving to cloud', error);
    return { success: false, error: error.message };
  }
};

// Load user progress from Supabase
export const loadProgressFromCloud = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.log('CloudStore', 'No user logged in, cannot load from cloud');
      return { success: false, error: 'Not authenticated' };
    }

    const result = await loadUserProgress(user.id);
    if (result.success && result.data) {
      logger.log('CloudStore', 'Progress loaded from cloud successfully');
    }
    return result;
  } catch (error) {
    logger.error('CloudStore', 'Error loading from cloud', error);
    return { success: false, error: error.message };
  }
};

// Sync local data with cloud (merge strategy)
export const syncProgressData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.log('CloudStore', 'No user logged in, skipping sync');
      return { success: false, error: 'Not authenticated' };
    }

    // Load local data
    const localData = await loadLocalData();
    
    // Load cloud data
    const cloudResult = await loadUserProgress(user.id);
    const cloudData = cloudResult.success ? cloudResult.data : null;

    // Merge data (cloud takes precedence for conflicts)
    let mergedData = { ...localData };
    if (cloudData) {
      // Merge hasanat
      if (cloudData.totalHasanat !== undefined) {
        mergedData.totalHasanat = Math.max(localData.totalHasanat || 0, cloudData.totalHasanat);
      }
      if (cloudData.todayHasanat !== undefined) {
        mergedData.todayHasanat = Math.max(localData.todayHasanat || 0, cloudData.todayHasanat);
      }
      if (cloudData.streak !== undefined) {
        mergedData.streak = Math.max(localData.streak || 0, cloudData.streak);
      }

      // Merge memorized ayahs (cloud takes precedence)
      if (cloudData.memorizedAyahs) {
        mergedData.memorizedAyahs = { ...localData.memorizedAyahs, ...cloudData.memorizedAyahs };
      }
    }

    // Save merged data to cloud
    const saveResult = await saveUserProgress(user.id, mergedData);
    if (saveResult.success) {
      logger.log('CloudStore', 'Sync completed successfully');
    }
    return saveResult;
  } catch (error) {
    logger.error('CloudStore', 'Error syncing data', error);
    return { success: false, error: error.message };
  }
};

// Auto-sync function (call this when user completes actions)
export const autoSync = async (progressData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Save to cloud in background (don't block UI)
      saveUserProgress(user.id, progressData).catch(error => {
        logger.error('CloudStore', 'Background sync failed', error);
      });
    }
  } catch (error) {
    logger.error('CloudStore', 'Auto-sync error', error);
  }
};

// Initialize user's cloud data on first login
export const initializeUserCloudData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.log('CloudStore', 'No user logged in, cannot initialize user data');
      return { success: false, error: 'Not authenticated' };
    }

    // Create user profile if it doesn't exist
    await createUserProfile(user.id, user.email);

    // Load local data and save to cloud
    const localData = await loadLocalData();
    const result = await saveUserProgress(user.id, localData);
    
    if (result.success) {
      logger.log('CloudStore', 'User data initialized successfully');
    }
    return result;
  } catch (error) {
    logger.error('CloudStore', 'Error initializing user data', error);
    return { success: false, error: error.message };
  }
}; 