import { supabase, saveUserProgress, loadUserProgress, createUserProfile } from './supabase';
import { loadData as loadLocalData, saveCurrentPosition as saveLocalPosition } from './store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save user progress to Supabase
export const saveProgressToCloud = async (progressData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const result = await saveUserProgress(user.id, progressData);
    return result;
  } catch (error) {
    console.error('[CloudStore] Error saving to cloud:', error);
    return { success: false, error: error.message };
  }
};

// Load user progress from Supabase
export const loadProgressFromCloud = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const result = await loadUserProgress(user.id);
    return result;
  } catch (error) {
    console.error('[CloudStore] Error loading from cloud:', error);
    return { success: false, error: error.message };
  }
};

// Sync local data with cloud (merge strategy)
export const syncProgressData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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
      // Merge hasanat (take the higher value)
      if (cloudData.totalHasanat !== undefined) {
        mergedData.totalHasanat = Math.max(localData.totalHasanat || 0, cloudData.totalHasanat);
      }
      if (cloudData.todayHasanat !== undefined) {
        mergedData.todayHasanat = Math.max(localData.todayHasanat || 0, cloudData.todayHasanat);
      }
      if (cloudData.streak !== undefined) {
        mergedData.streak = Math.max(localData.streak || 0, cloudData.streak);
      }

      // Merge memorized ayahs (combine both, cloud takes precedence for conflicts)
      if (cloudData.memorizedAyahs) {
        mergedData.memorizedAyahs = { ...localData.memorizedAyahs, ...cloudData.memorizedAyahs };
        
        // For each surah, merge the memorized count and completed ayaat
        Object.keys(mergedData.memorizedAyahs).forEach(surahName => {
          const localSurah = localData.memorizedAyahs[surahName];
          const cloudSurah = cloudData.memorizedAyahs[surahName];
          
          if (localSurah && cloudSurah) {
            // Take the higher memorized count
            mergedData.memorizedAyahs[surahName].memorized = Math.max(
              localSurah.memorized || 0, 
              cloudSurah.memorized || 0
            );
            
            // Merge completed ayaat arrays and remove duplicates
            const localCompleted = localSurah.completedAyaat || [];
            const cloudCompleted = cloudSurah.completedAyaat || [];
            const allCompleted = [...new Set([...localCompleted, ...cloudCompleted])];
            mergedData.memorizedAyahs[surahName].completedAyaat = allCompleted.sort((a, b) => a - b);
            
            // Update last ayah index to the highest completed
            if (allCompleted.length > 0) {
              mergedData.memorizedAyahs[surahName].lastAyahIndex = Math.max(...allCompleted);
            }
          }
        });
      }

      // Merge other data types
      if (cloudData.bookmarkedAyahs) {
        mergedData.bookmarkedAyahs = { ...localData.bookmarkedAyahs, ...cloudData.bookmarkedAyahs };
      }
      if (cloudData.customLists) {
        mergedData.customLists = { ...localData.customLists, ...cloudData.customLists };
      }
      if (cloudData.weeklyActivity) {
        mergedData.weeklyActivity = { ...localData.weeklyActivity, ...cloudData.weeklyActivity };
      }
    }

    // Save merged data to cloud
    const saveResult = await saveUserProgress(user.id, mergedData);
    return saveResult;
  } catch (error) {
    console.error('[CloudStore] Error syncing data:', error);
    return { success: false, error: error.message };
  }
};

// Offline queue management
const OFFLINE_QUEUE_KEY = 'offline_sync_queue';

// Add operation to offline queue
const addToOfflineQueue = async (operation) => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const operations = queue ? JSON.parse(queue) : [];
    operations.push({
      ...operation,
      timestamp: Date.now(),
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(operations));
    // Silent success - reduce console spam
  } catch (error) {
    console.error('[CloudStore] Error adding to offline queue:', error);
  }
};

// Process offline queue when back online
const processOfflineQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queue) return;
    
    const operations = JSON.parse(queue);
    if (operations.length === 0) return;
    
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'save_progress':
            await saveUserProgress(operation.userId, operation.data);
            break;
          case 'update_profile':
            // Handle profile updates
            break;
          default:
            // Silent warning - reduce console spam
        }
              } catch (error) {
          console.error('[CloudStore] Error processing offline operation:', error);
          // Don't break the loop, continue with other operations
        }
      }
      
      // Clear the queue after processing
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      // Silent success - reduce console spam
    } catch (error) {
      console.error('[CloudStore] Error processing offline queue:', error);
    }
};

// Simple network connectivity check (fallback without NetInfo)
export const isOnline = async () => {
  try {
    // Try to make a simple request to check connectivity
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout for better reliability
    });
    
    if (response.ok) {
      console.log('[CloudStore] Network check: Online');
      return true;
    } else {
      console.log('[CloudStore] Network check: Response not OK, status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('[CloudStore] Network check failed:', error.message);
    
    // Try alternative check with a different endpoint
    try {
      const altResponse = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      
      if (altResponse.ok) {
        console.log('[CloudStore] Alternative network check: Online');
        return true;
      }
    } catch (altError) {
      console.log('[CloudStore] Alternative network check also failed:', altError.message);
    }
    
    return false; // Assume offline if all checks fail
  }
};

// Auto-sync function with offline support
export const autoSync = async (progressData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const online = await isOnline();
    
    if (online) {
      // Save to cloud immediately if online
      try {
        await saveUserProgress(user.id, progressData);
      } catch (error) {
        console.error('[CloudStore] Cloud sync failed:', error.message);
      }
    } else {
      // Add to offline queue if offline
      await addToOfflineQueue({
        type: 'save_progress',
        userId: user.id,
        data: progressData
      });
      // Silent success - reduce console spam
    }
  } catch (error) {
    console.error('[CloudStore] Auto-sync error:', error);
  }
};

// Initialize user's cloud data on first login
export const initializeUserCloudData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Create user profile if it doesn't exist
    await createUserProfile(user.id, user.email);

    // Load local data and save to cloud
    const localData = await loadLocalData();
    const result = await saveUserProgress(user.id, localData);
    
    return result;
  } catch (error) {
    console.error('[CloudStore] Error initializing user data:', error);
    return { success: false, error: error.message };
  }
};

// Simple network monitoring (fallback without NetInfo)
export const startNetworkMonitoring = () => {
  // Silent start - reduce console spam
  // In simple mode, we'll check connectivity on-demand rather than monitoring continuously
};

// Get offline queue status
export const getOfflineQueueStatus = async () => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queue) return { pendingOperations: 0, lastSync: null };
    
    const operations = JSON.parse(queue);
    return {
      pendingOperations: operations.length,
      lastSync: operations.length > 0 ? new Date(operations[0].timestamp) : null
    };
  } catch (error) {
    console.error('[CloudStore] Error getting offline queue status:', error);
    return { pendingOperations: 0, lastSync: null };
  }
};

// Manual sync trigger (for user-initiated sync)
export const manualSync = async () => {
  try {
    const online = await isOnline();
    if (!online) {
      return { success: false, error: 'No internet connection' };
    }
    
    const queueStatus = await getOfflineQueueStatus();
    if (queueStatus.pendingOperations > 0) {
      await processOfflineQueue();
      return { success: true, message: `Synced ${queueStatus.pendingOperations} pending operations` };
    } else {
      // Force a sync even if no pending operations
      await syncProgressData();
      return { success: true, message: 'Manual sync completed' };
    }
  } catch (error) {
    console.error('[CloudStore] Manual sync error:', error);
    return { success: false, error: error.message };
  }
};

// Replace cloud data with local data (for when user chooses to use anonymous progress)
export const replaceCloudData = async (progressData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Save the provided progress data to cloud, replacing existing data
    const result = await saveUserProgress(user.id, progressData);
    
    return result;
  } catch (error) {
    console.error('[CloudStore] Error replacing cloud data:', error);
    return { success: false, error: error.message };
  }
};

// Backup current cloud data before replacing (safety measure)
export const backupCloudData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Load current cloud data
    const cloudResult = await loadUserProgress(user.id);
    if (cloudResult.success && cloudResult.data) {
      // Save backup with timestamp
      const backupKey = `backup_${user.id}_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(cloudResult.data));
      return { success: true, backupKey };
    }
    
    return { success: false, error: 'No cloud data to backup' };
  } catch (error) {
    console.error('[CloudStore] Error backing up cloud data:', error);
    return { success: false, error: error.message };
  }
}; 