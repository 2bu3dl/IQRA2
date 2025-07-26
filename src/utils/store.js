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
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_DATE, today);
    }

    let parsedMemorizedAyahs;
    try {
      parsedMemorizedAyahs = memorizedAyahs ? JSON.parse(memorizedAyahs) : initialState.memorizedAyahs;
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

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOTAL_HASANAT, newTotal.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.TODAY_HASANAT, newToday.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_DATE, today),
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

// Update memorized ayahs
export const updateMemorizedAyahs = async (surahName, ayahIndex) => {
  try {
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