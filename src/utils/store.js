import AsyncStorage from '@react-native-async-storage/async-storage';
import quranRaw from '../assets/quran.json';

// Keys for AsyncStorage
const STORAGE_KEYS = {
  TOTAL_HASANAT: 'total_hasanat',
  TODAY_HASANAT: 'today_hasanat',
  LAST_ACTIVITY_DATE: 'last_activity_date',
  STREAK: 'streak',
  MEMORIZED_AYAHS: 'memorized_ayahs',
  LAST_POSITION: 'last_position',
  STREAK_UPDATED_TODAY: 'streak_updated_today',
  BOOKMARKED_AYAHS: 'bookmarked_ayahs',
  CUSTOM_LISTS: 'custom_lists',
  CUSTOM_LIST_AYAHS: 'custom_list_ayahs',
  WEEKLY_ACTIVITY: 'weekly_activity',
  STREAK_BROKEN_SHOWN: 'streak_broken_shown',
  LAST_STREAK_CHECK: 'last_streak_check',
};

// Calculate total ayaat in the Qur'an
const calculateTotalAyaat = () => {
  return quranRaw.length;
};

// Calculate memorized ayaat based on progress
const calculateMemorizedAyaat = (memorizedAyahs) => {
  let memorizedAyaat = 0;
  
  Object.keys(memorizedAyahs).forEach(surahName => {
    const surahData = memorizedAyahs[surahName];
    if (surahData && surahData.memorized > 0) {
      memorizedAyaat += surahData.memorized;
    }
  });
  
  return memorizedAyaat;
};

// Initial state
const initialState = {
  totalHasanat: 0,
  todayHasanat: 0,
  streak: 0,
  memorizedAyahs: {
    'Al-Fatihah': {
      total: 7,
      memorized: 0,
      lastAyahIndex: 0,
      completedAyaat: [],
    },
    'Al-Kahf': {
      total: 110,
      memorized: 0,
      lastAyahIndex: 0,
      completedAyaat: [],
    },
  },
};

// Helper to get today's date string in local timezone
const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to check if two dates are consecutive days
const isConsecutiveDay = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return false;
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

// Load all data from storage
export const loadData = async () => {
  try {
    const [
      totalHasanat,
      todayHasanat,
      lastActivityDate,
      streak,
      memorizedAyahs,
    ] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.TOTAL_HASANAT),
      AsyncStorage.getItem(STORAGE_KEYS.TODAY_HASANAT),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY_DATE),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK),
      AsyncStorage.getItem(STORAGE_KEYS.MEMORIZED_AYAHS),
    ]);

    // Check if we need to reset today's hasanat
    const today = getTodayString();
    if (lastActivityDate !== today) {
      await AsyncStorage.setItem(STORAGE_KEYS.TODAY_HASANAT, '0');
      // Don't update last_activity_date here - only update it when there's actual activity
    }

    let parsedMemorizedAyahs;
    try {
      parsedMemorizedAyahs = memorizedAyahs ? JSON.parse(memorizedAyahs) : initialState.memorizedAyahs;
      console.log('[store.js] Loaded memorized ayahs:', JSON.stringify(parsedMemorizedAyahs, null, 2));
    } catch (parseError) {
      console.warn('[Store] Failed to parse memorized ayahs, using default:', parseError);
      parsedMemorizedAyahs = initialState.memorizedAyahs;
    }
    
    // Validate parsed data
    if (!parsedMemorizedAyahs || typeof parsedMemorizedAyahs !== 'object') {
      parsedMemorizedAyahs = initialState.memorizedAyahs;
    }
    
    // Calculate letter progress
    const totalAyaat = calculateTotalAyaat();
    const memorizedAyaat = calculateMemorizedAyaat(parsedMemorizedAyahs);

    return {
      totalHasanat: parseInt(totalHasanat || '0') || 0,
      todayHasanat: parseInt(todayHasanat || '0') || 0,
      streak: parseInt(streak || '0') || 0,
      memorizedAyahs: parsedMemorizedAyahs,
      totalAyaat,
      memorizedAyaat,
    };
  } catch (error) {
    console.error('[Store] Error loading data:', error);
    return {
      ...initialState,
      totalAyaat: calculateTotalAyaat(),
      memorizedAyaat: 0,
    };
  }
};

// Add hasanat and update streak if needed
export const addHasanat = async (amount) => {
  try {
    const [totalHasanat, todayHasanat, lastActivityDate] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.TOTAL_HASANAT),
      AsyncStorage.getItem(STORAGE_KEYS.TODAY_HASANAT),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY_DATE),
    ]);

    const newTotal = parseInt(totalHasanat || '0') + amount;
    const today = getTodayString();
    let newToday = parseInt(todayHasanat || '0') + amount;

    // Reset today's hasanat if it's a new day
    if (lastActivityDate !== today) {
      newToday = amount; // Start fresh for new day
    }

    // Update streak (this handles the streak logic properly)
    const streakResult = await updateStreak();
    const newStreak = streakResult ? streakResult.streak : 0;
    
    // Also update weekly activity when earning hasanat
    await updateWeeklyActivity();

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOTAL_HASANAT, newTotal.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.TODAY_HASANAT, newToday.toString()),
      // Don't override last_activity_date here as updateStreak already handles it
    ]);

    console.log('[store.js] addHasanat:', { amount, newTotal, newToday, today, newStreak });
    return { totalHasanat: newTotal, todayHasanat: newToday, streak: newStreak };
  } catch (error) {
    console.error('Error adding hasanat:', error);
    return null;
  }
};

// Get current streak without updating
export const getCurrentStreak = async () => {
  try {
    const streak = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
    console.log('[store.js] getCurrentStreak:', streak);
    return parseInt(streak || '0') || 0;
  } catch (error) {
    console.error('Error getting current streak:', error);
    return 0;
  }
};

// Update streak independently of hasanat (for completing any card)
export const updateStreak = async () => {
  try {
    const [lastActivityDate, streak, streakUpdatedToday] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY_DATE),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK_UPDATED_TODAY),
    ]);

    const today = getTodayString();
    let newStreak = parseInt(streak || '0');

    // Don't update streak if already updated today
    if (streakUpdatedToday === today) {
      console.log('[updateStreak] Streak already updated today, current streak:', newStreak);
      return { streak: newStreak };
    }

    if (lastActivityDate !== today) {
      // Check if this is a new day
      if (!lastActivityDate) {
        // First time ever
        newStreak = 1;
      } else if (isConsecutiveDay(lastActivityDate, today)) {
        // Consecutive day - increment streak
        newStreak = newStreak + 1;
      } else {
        // Gap in days - reset streak to 1
        newStreak = 1;
      }

          await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_DATE, today),
      AsyncStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.STREAK_UPDATED_TODAY, today),
    ]);
    
    // Also update weekly activity
    await updateWeeklyActivity();

      console.log('[updateStreak] Streak updated:', {
        lastActivityDate,
        today,
        newStreak,
        isConsecutive: lastActivityDate ? isConsecutiveDay(lastActivityDate, today) : false
      });

      return { streak: newStreak };
    }

    // Same day - just mark as updated
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK_UPDATED_TODAY, today);
    return { streak: newStreak };
  } catch (error) {
    console.error('Error updating streak:', error);
    return null;
  }
};

// Helper to get start of current week (Sunday)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

// Helper to get date string for a specific date
const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Track weekly activity and get current week's activity pattern
export const updateWeeklyActivity = async () => {
  try {
    const today = getTodayString();
    const weeklyActivity = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_ACTIVITY);
    
    let activityData = {};
    if (weeklyActivity) {
      try {
        activityData = JSON.parse(weeklyActivity);
      } catch (e) {
        console.warn('Failed to parse weekly activity data');
        activityData = {};
      }
    }
    
    // Get current week start
    const weekStart = getWeekStart();
    const weekStartString = getDateString(weekStart);
    
    // Initialize current week if not exists
    if (!activityData[weekStartString]) {
      activityData[weekStartString] = {};
    }
    
    // Mark today as active
    activityData[weekStartString][today] = true;
    
    // Clean old weeks (keep only last 4 weeks)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 28);
    Object.keys(activityData).forEach(weekKey => {
      const weekDate = new Date(weekKey);
      if (weekDate < cutoffDate) {
        delete activityData[weekKey];
      }
    });
    
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_ACTIVITY, JSON.stringify(activityData));
    return activityData;
  } catch (error) {
    console.error('Error updating weekly activity:', error);
    return {};
  }
};

// Get current week's activity pattern (array of 7 booleans for Sun-Sat)
export const getCurrentWeekActivity = async () => {
  try {
    const weeklyActivity = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_ACTIVITY);
    
    if (!weeklyActivity) {
      return [false, false, false, false, false, false, false];
    }
    
    const activityData = JSON.parse(weeklyActivity);
    const weekStart = getWeekStart();
    const weekStartString = getDateString(weekStart);
    
    const currentWeekData = activityData[weekStartString] || {};
    
    // Create array for each day of the week (Sun-Sat)
    const weekActivity = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dayString = getDateString(dayDate);
      weekActivity.push(!!currentWeekData[dayString]);
    }
    
    return weekActivity;
  } catch (error) {
    console.error('Error getting current week activity:', error);
    return [false, false, false, false, false, false, false];
  }
};

// Get current week streak (number of consecutive weeks with activity)
export const getCurrentWeekStreak = async () => {
  try {
    const weeklyActivity = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_ACTIVITY);
    
    if (!weeklyActivity) {
      return 0;
    }
    
    const activityData = JSON.parse(weeklyActivity);
    
    // Get all weeks in chronological order
    const weekKeys = Object.keys(activityData).sort();
    if (weekKeys.length === 0) {
      return 0;
    }
    
    // Get current week start
    const currentWeekStart = getWeekStart();
    const currentWeekString = getDateString(currentWeekStart);
    
    // Check if current week has any activity
    const currentWeekData = activityData[currentWeekString];
    const hasCurrentWeekActivity = currentWeekData && Object.keys(currentWeekData).length > 0;
    
    if (!hasCurrentWeekActivity) {
      return 0;
    }
    
    // Count consecutive weeks from current week backwards
    let weekStreak = 0;
    let checkDate = new Date(currentWeekStart);
    
    while (true) {
      const checkWeekString = getDateString(checkDate);
      const weekData = activityData[checkWeekString];
      
      // Check if this week has activity
      if (weekData && Object.keys(weekData).length > 0) {
        weekStreak++;
        // Move to previous week
        checkDate.setDate(checkDate.getDate() - 7);
      } else {
        break;
      }
      
      // Safety check - don't go beyond 52 weeks
      if (weekStreak >= 52) break;
    }
    
    return weekStreak;
  } catch (error) {
    console.error('Error getting current week streak:', error);
    return 0;
  }
};

// Update memorized ayahs
export const updateMemorizedAyahs = async (surahName, ayahIndex) => {
  try {
    console.log('[store.js] updateMemorizedAyahs called with:', { surahName, ayahIndex });
    const memorizedAyahsStr = await AsyncStorage.getItem(STORAGE_KEYS.MEMORIZED_AYAHS);
    const memorizedAyahs = memorizedAyahsStr ? JSON.parse(memorizedAyahsStr) : initialState.memorizedAyahs;

    if (!memorizedAyahs[surahName]) {
      memorizedAyahs[surahName] = {
        total: 7, // For Al-Fatihah
        memorized: 0,
        lastAyahIndex: 0,
        completedAyaat: [], // Track individual completed ayaat
      };
    }

    // Initialize completedAyaat array if it doesn't exist (for backward compatibility)
    if (!memorizedAyahs[surahName].completedAyaat) {
      memorizedAyahs[surahName].completedAyaat = [];
    }

    // Convert 0-based ayahIndex to 1-based ayah number
    const ayahNumber = ayahIndex + 1;
    
    // Only mark this specific ayah as completed if it's not already completed
    if (!memorizedAyahs[surahName].completedAyaat.includes(ayahNumber)) {
      memorizedAyahs[surahName].completedAyaat.push(ayahNumber);
      // Update the memorized count to the actual number of completed ayaat
      memorizedAyahs[surahName].memorized = memorizedAyahs[surahName].completedAyaat.length;
      // Update lastAyahIndex to the highest completed ayah (1-based)
      memorizedAyahs[surahName].lastAyahIndex = Math.max(...memorizedAyahs[surahName].completedAyaat);
    }

    console.log('[store.js] Saving memorized ayahs:', JSON.stringify(memorizedAyahs, null, 2));
    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIZED_AYAHS, JSON.stringify(memorizedAyahs));
    return memorizedAyahs;
  } catch (error) {
    console.error('Error updating memorized ayahs:', error);
    return null;
  }
};

// Save current position for resume
export const saveCurrentPosition = async (surahName, flashcardIndex) => {
  try {
    const memorizedAyahsStr = await AsyncStorage.getItem(STORAGE_KEYS.MEMORIZED_AYAHS);
    const memorizedAyahs = memorizedAyahsStr ? JSON.parse(memorizedAyahsStr) : initialState.memorizedAyahs;

    if (!memorizedAyahs[surahName]) {
      memorizedAyahs[surahName] = {
        total: 7, // For Al-Fatihah
        memorized: 0,
        lastAyahIndex: 0,
        completedAyaat: [],
        currentFlashcardIndex: 0,
      };
    }

    // Save the current flashcard index
    memorizedAyahs[surahName].currentFlashcardIndex = flashcardIndex;

    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIZED_AYAHS, JSON.stringify(memorizedAyahs));
    console.log('[store.js] Saved position:', surahName, flashcardIndex, JSON.stringify(memorizedAyahs[surahName]));
    return memorizedAyahs;
  } catch (error) {
    console.error('Error saving current position:', error);
    return null;
  }
};

// Reset all progress
export const resetProgress = async () => {
  try {
    // Set last activity date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOTAL_HASANAT, '0'),
      AsyncStorage.setItem(STORAGE_KEYS.TODAY_HASANAT, '0'),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_DATE, yesterdayString),
      AsyncStorage.setItem(STORAGE_KEYS.STREAK, '0'),
      AsyncStorage.setItem(STORAGE_KEYS.MEMORIZED_AYAHS, JSON.stringify(initialState.memorizedAyahs)),
      AsyncStorage.removeItem(STORAGE_KEYS.STREAK_UPDATED_TODAY),
    ]);
    return true;
  } catch (error) {
    console.error('Error resetting progress:', error);
    return false;
  }
};

// Save the last accessed position (for continue button)
export const saveLastPosition = async (surahName, surahNumber, flashcardIndex) => {
  try {
    const lastPosition = {
      surahName,
      surahNumber,
      flashcardIndex,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_POSITION, JSON.stringify(lastPosition));
    console.log('[store.js] Saved last position:', lastPosition);
    return lastPosition;
  } catch (error) {
    console.error('Error saving last position:', error);
    return null;
  }
};

// Load the last accessed position (for continue button)
export const loadLastPosition = async () => {
  try {
    const lastPositionStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_POSITION);
    if (lastPositionStr) {
      const lastPosition = JSON.parse(lastPositionStr);
      console.log('[store.js] Loaded last position:', lastPosition);
      return lastPosition;
    }
    return null;
  } catch (error) {
    console.error('Error loading last position:', error);
    return null;
  }
};

// Bookmark functions
export const toggleBookmark = async (surahName, surahNumber, ayahNumber) => {
  try {
    const bookmarkedAyahs = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKED_AYAHS);
    let bookmarks = bookmarkedAyahs ? JSON.parse(bookmarkedAyahs) : {};
    
    const bookmarkKey = `${surahName}_${ayahNumber}`;
    const isBookmarked = bookmarks[bookmarkKey];
    
    if (isBookmarked) {
      // Remove bookmark
      delete bookmarks[bookmarkKey];
    } else {
      // Add bookmark
      bookmarks[bookmarkKey] = {
        surahName,
        surahNumber,
        ayahNumber,
        timestamp: Date.now()
      };
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKED_AYAHS, JSON.stringify(bookmarks));
    return !isBookmarked; // Return new bookmark state
  } catch (error) {
    console.error('[Store] Error toggling bookmark:', error);
    return false;
  }
};

export const isBookmarked = async (surahName, ayahNumber) => {
  try {
    const bookmarkedAyahs = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKED_AYAHS);
    const bookmarks = bookmarkedAyahs ? JSON.parse(bookmarkedAyahs) : {};
    const bookmarkKey = `${surahName}_${ayahNumber}`;
    return !!bookmarks[bookmarkKey];
  } catch (error) {
    console.error('[Store] Error checking bookmark status:', error);
    return false;
  }
};

export const getBookmarkedSurahs = async () => {
  try {
    const bookmarkedAyahs = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKED_AYAHS);
    const bookmarks = bookmarkedAyahs ? JSON.parse(bookmarkedAyahs) : {};
    
    // Group bookmarks by surah
    const surahBookmarks = {};
    Object.values(bookmarks).forEach(bookmark => {
      const { surahName, surahNumber } = bookmark;
      if (!surahBookmarks[surahName]) {
        surahBookmarks[surahName] = {
          surahName,
          surahNumber,
          bookmarkedAyaat: []
        };
      }
      surahBookmarks[surahName].bookmarkedAyaat.push(bookmark.ayahNumber);
    });
    
    return Object.values(surahBookmarks);
  } catch (error) {
    console.error('[Store] Error getting bookmarked surahs:', error);
    return [];
  }
};

// Custom Lists Functions
export const getCustomLists = async () => {
  try {
    const customListsStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_LISTS);
    const customLists = customListsStr ? JSON.parse(customListsStr) : ['Favorites'];
    return customLists;
  } catch (error) {
    console.error('[Store] Error getting custom lists:', error);
    return ['Favorites'];
  }
};

export const addCustomList = async (listName) => {
  try {
    const customLists = await getCustomLists();
    if (!customLists.includes(listName)) {
      customLists.push(listName);
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_LISTS, JSON.stringify(customLists));
    }
    return customLists;
  } catch (error) {
    console.error('[Store] Error adding custom list:', error);
    return [];
  }
};

export const removeCustomList = async (listName) => {
  try {
    const customLists = await getCustomLists();
    const filteredLists = customLists.filter(list => list !== listName);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_LISTS, JSON.stringify(filteredLists));
    
    // Remove all ayahs from this list
    const listAyahsStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_LIST_AYAHS);
    const listAyahs = listAyahsStr ? JSON.parse(listAyahsStr) : {};
    delete listAyahs[listName];
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_LIST_AYAHS, JSON.stringify(listAyahs));
    
    return filteredLists;
  } catch (error) {
    console.error('[Store] Error removing custom list:', error);
    return [];
  }
};

export const addAyahToList = async (listName, surahName, surahNumber, ayahNumber) => {
  try {
    const listAyahsStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_LIST_AYAHS);
    const listAyahs = listAyahsStr ? JSON.parse(listAyahsStr) : {};
    
    if (!listAyahs[listName]) {
      listAyahs[listName] = [];
    }
    
    const ayahKey = `${surahName}_${ayahNumber}`;
    const existingIndex = listAyahs[listName].findIndex(ayah => 
      ayah.surahName === surahName && ayah.ayahNumber === ayahNumber
    );
    
    if (existingIndex === -1) {
      listAyahs[listName].push({
        surahName,
        surahNumber,
        ayahNumber,
        timestamp: Date.now()
      });
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_LIST_AYAHS, JSON.stringify(listAyahs));
    return true;
  } catch (error) {
    console.error('[Store] Error adding ayah to list:', error);
    return false;
  }
};

export const removeAyahFromList = async (listName, surahName, ayahNumber) => {
  try {
    const listAyahsStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_LIST_AYAHS);
    const listAyahs = listAyahsStr ? JSON.parse(listAyahsStr) : {};
    
    if (listAyahs[listName]) {
      listAyahs[listName] = listAyahs[listName].filter(ayah => 
        !(ayah.surahName === surahName && ayah.ayahNumber === ayahNumber)
      );
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_LIST_AYAHS, JSON.stringify(listAyahs));
    }
    
    return true;
  } catch (error) {
    console.error('[Store] Error removing ayah from list:', error);
    return false;
  }
};

export const isAyahInList = async (listName, surahName, ayahNumber) => {
  try {
    const listAyahsStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_LIST_AYAHS);
    const listAyahs = listAyahsStr ? JSON.parse(listAyahsStr) : {};
    
    if (!listAyahs[listName]) return false;
    
    return listAyahs[listName].some(ayah => 
      ayah.surahName === surahName && ayah.ayahNumber === ayahNumber
    );
  } catch (error) {
    console.error('[Store] Error checking if ayah is in list:', error);
    return false;
  }
};

export const getListSurahs = async (listName) => {
  try {
    const listAyahsStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_LIST_AYAHS);
    const listAyahs = listAyahsStr ? JSON.parse(listAyahsStr) : {};
    
    if (!listAyahs[listName]) return [];
    
    // Group ayahs by surah
    const surahGroups = {};
    listAyahs[listName].forEach(ayah => {
      const { surahName, surahNumber } = ayah;
      if (!surahGroups[surahName]) {
        surahGroups[surahName] = {
          surahName,
          surahNumber,
          bookmarkedAyaat: []
        };
      }
      surahGroups[surahName].bookmarkedAyaat.push(ayah.ayahNumber);
    });
    
    return Object.values(surahGroups);
  } catch (error) {
    console.error('[Store] Error getting list surahs:', error);
    return [];
  }
}; 

export const isAyahInAnyList = async (surahName, ayahNumber) => {
  try {
    const listAyahsStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_LIST_AYAHS);
    const listAyahs = listAyahsStr ? JSON.parse(listAyahsStr) : {};
    
    // Check if ayah exists in any list
    for (const listName in listAyahs) {
      if (listAyahs[listName].some(ayah => 
        ayah.surahName === surahName && ayah.ayahNumber === ayahNumber
      )) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[Store] Error checking if ayah is in any list:', error);
    return false;
  }
};

// Check if streak was broken since last app launch
export const checkStreakBroken = async () => {
  try {
    const [
      lastStreakCheck,
      lastActivityDate,
      currentStreak,
      streakBrokenShown
    ] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.LAST_STREAK_CHECK),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY_DATE),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK_BROKEN_SHOWN)
    ]);

    const today = getTodayString();
    const todayDate = new Date(today);
    
    // If this is the first time checking, just set the check date
    if (!lastStreakCheck) {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_STREAK_CHECK, today);
      return null;
    }

    const lastCheckDate = new Date(lastStreakCheck);
    const lastActivity = lastActivityDate ? new Date(lastActivityDate) : null;
    const streak = parseInt(currentStreak) || 0;
    
    // Calculate days between last check and today
    const daysDiff = Math.floor((todayDate - lastCheckDate) / (1000 * 60 * 60 * 24));
    
    // If we already showed the broken streak today, don't show again
    if (streakBrokenShown === today) {
      return null;
    }
    
    // Check if streak was broken (missed consecutive days)
    if (daysDiff > 1 && lastActivity && streak > 0) {
      // Find missed days in current week
      const missedDays = [];
      const currentWeekStart = getWeekStart();
      
      // Check each day in current week to see if it was missed
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(currentWeekStart);
        checkDate.setDate(currentWeekStart.getDate() + i);
        const checkDateString = getDateString(checkDate);
        
        // If this day is before today and after last activity, it's a missed day
        if (checkDate < todayDate && checkDate > lastActivity) {
          missedDays.push(i);
        }
      }
      
      // Calculate previous streak (before it was broken)
      const previousStreak = streak;
      
      // Mark that we've shown the broken streak popup for today
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_BROKEN_SHOWN, today);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_STREAK_CHECK, today);
      
      return {
        streakBroken: true,
        previousStreak,
        missedDays,
        daysMissed: daysDiff - 1
      };
    }
    
    // Update last check date
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_STREAK_CHECK, today);
    return null;
    
  } catch (error) {
    console.error('Error checking streak broken:', error);
    return null;
  }
};

// Reset streak broken shown flag (call when user becomes active again)
export const resetStreakBrokenShown = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.STREAK_BROKEN_SHOWN);
  } catch (error) {
    console.error('Error resetting streak broken shown:', error);
  }
}; 