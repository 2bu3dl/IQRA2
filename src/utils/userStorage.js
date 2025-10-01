import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * User-scoped storage utility
 * Manages storage keys that are tied to user accounts
 * When logged out, these keys return empty/default values
 */

// Get current user ID
const getUserId = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.log('[UserStorage] Error getting user ID:', error);
    return null;
  }
};

// Generate user-scoped key
const getUserScopedKey = async (baseKey) => {
  const userId = await getUserId();
  if (!userId) {
    return `anonymous_${baseKey}`;
  }
  return `user_${userId}_${baseKey}`;
};

// Save data with user scope
export const saveUserData = async (baseKey, value) => {
  try {
    const scopedKey = await getUserScopedKey(baseKey);
    await AsyncStorage.setItem(scopedKey, typeof value === 'string' ? value : JSON.stringify(value));
    return { success: true };
  } catch (error) {
    console.error('[UserStorage] Error saving data:', error);
    return { success: false, error: error.message };
  }
};

// Load data with user scope
export const loadUserData = async (baseKey, defaultValue = null) => {
  try {
    const userId = await getUserId();
    
    // If logged out, return default value (0 for saved content)
    if (!userId) {
      console.log('[UserStorage] User not logged in, returning default value for:', baseKey);
      return defaultValue;
    }
    
    const scopedKey = await getUserScopedKey(baseKey);
    const value = await AsyncStorage.getItem(scopedKey);
    
    if (value === null) return defaultValue;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('[UserStorage] Error loading data:', error);
    return defaultValue;
  }
};

// Remove data with user scope
export const removeUserData = async (baseKey) => {
  try {
    const scopedKey = await getUserScopedKey(baseKey);
    await AsyncStorage.removeItem(scopedKey);
    return { success: true };
  } catch (error) {
    console.error('[UserStorage] Error removing data:', error);
    return { success: false, error: error.message };
  }
};

// Get all keys for a specific prefix (for migration or cleanup)
export const getAllUserKeys = async (keyPrefix) => {
  try {
    const userId = await getUserId();
    if (!userId) return [];
    
    const allKeys = await AsyncStorage.getAllKeys();
    const userPrefix = `user_${userId}_${keyPrefix}`;
    return allKeys.filter(key => key.startsWith(userPrefix));
  } catch (error) {
    console.error('[UserStorage] Error getting user keys:', error);
    return [];
  }
};

// Clear all user data when logging out
export const clearUserData = async () => {
  try {
    const userId = await getUserId();
    if (!userId) return { success: true };
    
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter(key => key.startsWith(`user_${userId}_`));
    
    if (userKeys.length > 0) {
      await AsyncStorage.multiRemove(userKeys);
      console.log('[UserStorage] Cleared', userKeys.length, 'user-specific keys');
    }
    
    return { success: true };
  } catch (error) {
    console.error('[UserStorage] Error clearing user data:', error);
    return { success: false, error: error.message };
  }
};

// Check if user is logged in
export const isUserLoggedIn = async () => {
  const userId = await getUserId();
  return userId !== null;
};

// Get user-scoped note key
export const getNoteKey = async (surahNumber, ayahNumber) => {
  return await getUserScopedKey(`note_${surahNumber}_${ayahNumber}`);
};

// Get user-scoped recording path prefix
export const getRecordingPrefix = async () => {
  const userId = await getUserId();
  if (!userId) {
    return 'anonymous';
  }
  return `user_${userId}`;
};

// Custom lists - user scoped
export const saveCustomLists = async (lists) => {
  return await saveUserData('custom_lists', lists);
};

export const loadCustomLists = async () => {
  return await loadUserData('custom_lists', []);
};

// List ayahs - user scoped  
export const saveListAyahs = async (listId, ayahs) => {
  return await saveUserData(`list_ayahs_${listId}`, ayahs);
};

export const loadListAyahs = async (listId) => {
  return await loadUserData(`list_ayahs_${listId}`, []);
};
