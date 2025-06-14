import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const STORAGE_KEYS = {
  TOTAL_HASANAT: 'total_hasanat',
  TODAY_HASANAT: 'today_hasanat',
  LAST_ACTIVITY_DATE: 'last_activity_date',
  STREAK: 'streak',
  MEMORIZED_AYAHS: 'memorized_ayahs',
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
      lastAyahIndex: -1,
    },
  },
};

// Helper to get today's date string
const getTodayString = () => new Date().toISOString().split('T')[0];

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

    return {
      totalHasanat: parseInt(totalHasanat || '0'),
      todayHasanat: parseInt(todayHasanat || '0'),
      streak: parseInt(streak || '0'),
      memorizedAyahs: memorizedAyahs ? JSON.parse(memorizedAyahs) : initialState.memorizedAyahs,
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return initialState;
  }
};

// Update streak logic in addHasanat
export const addHasanat = async (amount) => {
  try {
    const [totalHasanat, todayHasanat, lastActivityDate, streak] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.TOTAL_HASANAT),
      AsyncStorage.getItem(STORAGE_KEYS.TODAY_HASANAT),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY_DATE),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK),
    ]);

    const newTotal = parseInt(totalHasanat || '0') + amount;
    const newToday = parseInt(todayHasanat || '0') + amount;
    const today = getTodayString();
    let newStreak = parseInt(streak || '0');

    if (lastActivityDate !== today) {
      // If last activity was yesterday, increment streak
      const lastDate = new Date(lastActivityDate || '');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        newStreak = newStreak + 1;
      } else {
        // If last activity was not yesterday, reset streak
        newStreak = 1;
      }
    }

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOTAL_HASANAT, newTotal.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.TODAY_HASANAT, newToday.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_DATE, today),
      AsyncStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString()),
    ]);

    return { totalHasanat: newTotal, todayHasanat: newToday, streak: newStreak };
  } catch (error) {
    console.error('Error adding hasanat:', error);
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
        lastAyahIndex: -1,
      };
    }

    if (ayahIndex > memorizedAyahs[surahName].lastAyahIndex) {
      memorizedAyahs[surahName].memorized = ayahIndex + 1;
      memorizedAyahs[surahName].lastAyahIndex = ayahIndex;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIZED_AYAHS, JSON.stringify(memorizedAyahs));
    return memorizedAyahs;
  } catch (error) {
    console.error('Error updating memorized ayahs:', error);
    return null;
  }
}; 