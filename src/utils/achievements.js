import { makeSupabaseRequest } from './supabase';
import logger from './logger';

// Achievement types
export const ACHIEVEMENT_TYPES = {
  SURAH_MEMORIZATION: 'surah_memorization',
  JUZ_MEMORIZATION: 'juz_memorization',
  STREAK: 'streak',
  HASANAT: 'hasanat',
  AYAT_MEMORIZED: 'ayat_memorized',
  QURAN_COMPLETION: 'quran_completion'
};

// Achievement definitions
export const ACHIEVEMENTS = {
  // Surah Al-Fatiha completion
  SURAH_AL_FATIHA: {
    id: 'surah_al_fatiha',
    type: ACHIEVEMENT_TYPES.SURAH_MEMORIZATION,
    title: {
      en: 'Surah Al-Fatiha Master',
      ar: 'إتقان سورة الفاتحة'
    },
    description: {
      en: 'Complete memorization of Surah Al-Fatiha',
      ar: 'إكمال حفظ سورة الفاتحة'
    },
    icon: '📖',
    surahNumber: 1,
    requirement: 7, // 7 verses in Al-Fatiha
    points: 100
  },

  // Streak achievements
  STREAK_3: {
    id: 'streak_3',
    type: ACHIEVEMENT_TYPES.STREAK,
    title: { en: 'Getting Started', ar: 'البداية' },
    description: { en: 'Maintain a 3-day streak', ar: 'الحفاظ على تتابع 3 أيام' },
    icon: '🔥',
    requirement: 3,
    points: 10
  },
  STREAK_10: {
    id: 'streak_10',
    type: ACHIEVEMENT_TYPES.STREAK,
    title: { en: 'Consistent Learner', ar: 'متعلم منتظم' },
    description: { en: 'Maintain a 10-day streak', ar: 'الحفاظ على تتابع 10 أيام' },
    icon: '🔥🔥',
    requirement: 10,
    points: 25
  },
  STREAK_40: {
    id: 'streak_40',
    type: ACHIEVEMENT_TYPES.STREAK,
    title: { en: 'Dedicated Student', ar: 'طالب مخلص' },
    description: { en: 'Maintain a 40-day streak', ar: 'الحفاظ على تتابع 40 يوم' },
    icon: '🔥🔥🔥',
    requirement: 40,
    points: 50
  },
  STREAK_100: {
    id: 'streak_100',
    type: ACHIEVEMENT_TYPES.STREAK,
    title: { en: 'Century Streak', ar: 'تتابع المئة' },
    description: { en: 'Maintain a 100-day streak', ar: 'الحفاظ على تتابع 100 يوم' },
    icon: '🔥🔥🔥🔥',
    requirement: 100,
    points: 100
  },
  STREAK_500: {
    id: 'streak_500',
    type: ACHIEVEMENT_TYPES.STREAK,
    title: { en: 'Unstoppable', ar: 'لا يمكن إيقافه' },
    description: { en: 'Maintain a 500-day streak', ar: 'الحفاظ على تتابع 500 يوم' },
    icon: '🔥🔥🔥🔥🔥',
    requirement: 500,
    points: 250
  },
  STREAK_1000: {
    id: 'streak_1000',
    type: ACHIEVEMENT_TYPES.STREAK,
    title: { en: 'Legendary Streak', ar: 'تتابع أسطوري' },
    description: { en: 'Maintain a 1000-day streak', ar: 'الحفاظ على تتابع 1000 يوم' },
    icon: '🔥🔥🔥🔥🔥🔥',
    requirement: 1000,
    points: 500
  },
  STREAK_5000: {
    id: 'streak_5000',
    type: ACHIEVEMENT_TYPES.STREAK,
    title: { en: 'Immortal Learner', ar: 'متعلم خالد' },
    description: { en: 'Maintain a 5000-day streak', ar: 'الحفاظ على تتابع 5000 يوم' },
    icon: '🔥🔥🔥🔥🔥🔥🔥',
    requirement: 5000,
    points: 1000
  },
  STREAK_10000: {
    id: 'streak_10000',
    type: ACHIEVEMENT_TYPES.STREAK,
    title: { en: 'Eternal Flame', ar: 'لهب أبدي' },
    description: { en: 'Maintain a 10000-day streak', ar: 'الحفاظ على تتابع 10000 يوم' },
    icon: '🔥🔥🔥🔥🔥🔥🔥🔥',
    requirement: 10000,
    points: 2000
  },

  // Hasanat achievements
  HASANAT_1M: {
    id: 'hasanat_1m',
    type: ACHIEVEMENT_TYPES.HASANAT,
    title: { en: 'First Million', ar: 'المليون الأول' },
    description: { en: 'Earn 1 million hasanat', ar: 'كسب مليون حسنات' },
    icon: '💰',
    requirement: 1000000,
    points: 100
  },
  HASANAT_10M: {
    id: 'hasanat_10m',
    type: ACHIEVEMENT_TYPES.HASANAT,
    title: { en: 'Ten Millionaire', ar: 'عشرة ملايين' },
    description: { en: 'Earn 10 million hasanat', ar: 'كسب 10 ملايين حسنات' },
    icon: '💰💰',
    requirement: 10000000,
    points: 250
  },
  HASANAT_100M: {
    id: 'hasanat_100m',
    type: ACHIEVEMENT_TYPES.HASANAT,
    title: { en: 'Century Millionaire', ar: 'مئة مليون' },
    description: { en: 'Earn 100 million hasanat', ar: 'كسب 100 مليون حسنات' },
    icon: '💰💰💰',
    requirement: 100000000,
    points: 500
  },
  HASANAT_1B: {
    id: 'hasanat_1b',
    type: ACHIEVEMENT_TYPES.HASANAT,
    title: { en: 'Billionaire', ar: 'ملياردير' },
    description: { en: 'Earn 1 billion hasanat', ar: 'كسب مليار حسنات' },
    icon: '💰💰💰💰',
    requirement: 1000000000,
    points: 1000
  },
  HASANAT_10B: {
    id: 'hasanat_10b',
    type: ACHIEVEMENT_TYPES.HASANAT,
    title: { en: 'Ten Billionaire', ar: 'عشرة مليارات' },
    description: { en: 'Earn 10 billion hasanat', ar: 'كسب 10 مليارات حسنات' },
    icon: '💰💰💰💰💰',
    requirement: 10000000000,
    points: 2000
  },

  // Ayat memorized achievements
  AYAT_10: {
    id: 'ayat_10',
    type: ACHIEVEMENT_TYPES.AYAT_MEMORIZED,
    title: { en: 'First Steps', ar: 'الخطوات الأولى' },
    description: { en: 'Memorize 10 verses', ar: 'حفظ 10 آيات' },
    icon: '📝',
    requirement: 10,
    points: 25
  },
  AYAT_50: {
    id: 'ayat_50',
    type: ACHIEVEMENT_TYPES.AYAT_MEMORIZED,
    title: { en: 'Growing Collection', ar: 'مجموعة متنامية' },
    description: { en: 'Memorize 50 verses', ar: 'حفظ 50 آية' },
    icon: '📝📝',
    requirement: 50,
    points: 50
  },
  AYAT_100: {
    id: 'ayat_100',
    type: ACHIEVEMENT_TYPES.AYAT_MEMORIZED,
    title: { en: 'Century of Verses', ar: 'مئة آية' },
    description: { en: 'Memorize 100 verses', ar: 'حفظ 100 آية' },
    icon: '📝📝📝',
    requirement: 100,
    points: 100
  },
  AYAT_300: {
    id: 'ayat_300',
    type: ACHIEVEMENT_TYPES.AYAT_MEMORIZED,
    title: { en: 'Triple Century', ar: 'ثلاثمئة آية' },
    description: { en: 'Memorize 300 verses', ar: 'حفظ 300 آية' },
    icon: '📝📝📝📝',
    requirement: 300,
    points: 200
  },
  AYAT_1000: {
    id: 'ayat_1000',
    type: ACHIEVEMENT_TYPES.AYAT_MEMORIZED,
    title: { en: 'Thousand Verses', ar: 'ألف آية' },
    description: { en: 'Memorize 1000 verses', ar: 'حفظ 1000 آية' },
    icon: '📝📝📝📝📝',
    requirement: 1000,
    points: 500
  },
  AYAT_3000: {
    id: 'ayat_3000',
    type: ACHIEVEMENT_TYPES.AYAT_MEMORIZED,
    title: { en: 'Triple Thousand', ar: 'ثلاثة آلاف آية' },
    description: { en: 'Memorize 3000 verses', ar: 'حفظ 3000 آية' },
    icon: '📝📝📝📝📝📝',
    requirement: 3000,
    points: 1000
  },

  // Quran completion
  QURAN_COMPLETE: {
    id: 'quran_complete',
    type: ACHIEVEMENT_TYPES.QURAN_COMPLETION,
    title: { en: 'Khatm Al-Quran', ar: 'ختم القرآن' },
    description: { en: 'Complete memorization of the entire Quran', ar: 'إكمال حفظ القرآن الكريم كاملاً' },
    icon: '🕌',
    requirement: 6236, // Total verses in Quran
    points: 10000
  }
};

// Get all achievements
export const getAllAchievements = () => {
  return Object.values(ACHIEVEMENTS);
};

// Get achievements by type
export const getAchievementsByType = (type) => {
  return getAllAchievements().filter(achievement => achievement.type === type);
};

// Check if user has earned an achievement
export const hasEarnedAchievement = (userAchievements, achievementId) => {
  return userAchievements.some(achievement => achievement.achievement_id === achievementId);
};

// Check streak achievements
export const checkStreakAchievements = (currentStreak, userAchievements) => {
  const streakAchievements = getAchievementsByType(ACHIEVEMENT_TYPES.STREAK);
  const earnedAchievements = [];

  streakAchievements.forEach(achievement => {
    if (currentStreak >= achievement.requirement && !hasEarnedAchievement(userAchievements, achievement.id)) {
      earnedAchievements.push(achievement);
    }
  });

  return earnedAchievements;
};

// Check hasanat achievements
export const checkHasanatAchievements = (totalHasanat, userAchievements) => {
  const hasanatAchievements = getAchievementsByType(ACHIEVEMENT_TYPES.HASANAT);
  const earnedAchievements = [];

  hasanatAchievements.forEach(achievement => {
    if (totalHasanat >= achievement.requirement && !hasEarnedAchievement(userAchievements, achievement.id)) {
      earnedAchievements.push(achievement);
    }
  });

  return earnedAchievements;
};

// Check ayat memorized achievements
export const checkAyatAchievements = (totalAyat, userAchievements) => {
  const ayatAchievements = getAchievementsByType(ACHIEVEMENT_TYPES.AYAT_MEMORIZED);
  const earnedAchievements = [];

  ayatAchievements.forEach(achievement => {
    if (totalAyat >= achievement.requirement && !hasEarnedAchievement(userAchievements, achievement.id)) {
      earnedAchievements.push(achievement);
    }
  });

  return earnedAchievements;
};

// Check surah completion achievements
export const checkSurahAchievements = (memorizedSurahs, userAchievements) => {
  const surahAchievements = getAchievementsByType(ACHIEVEMENT_TYPES.SURAH_MEMORIZATION);
  const earnedAchievements = [];

  surahAchievements.forEach(achievement => {
    if (achievement.surahNumber && memorizedSurahs.includes(achievement.surahNumber) && 
        !hasEarnedAchievement(userAchievements, achievement.id)) {
      earnedAchievements.push(achievement);
    }
  });

  return earnedAchievements;
};

// Check Quran completion achievement
export const checkQuranCompletion = (totalAyat, userAchievements) => {
  const quranAchievement = ACHIEVEMENTS.QURAN_COMPLETE;
  
  if (totalAyat >= quranAchievement.requirement && !hasEarnedAchievement(userAchievements, quranAchievement.id)) {
    return [quranAchievement];
  }
  
  return [];
};

// Award achievement to user
export const awardAchievement = async (userId, achievement) => {
  try {
    logger.log('Achievements', 'Awarding achievement', { userId, achievementId: achievement.id });
    
    const result = await makeSupabaseRequest('user_achievements', {
      method: 'POST',
      body: {
        user_id: userId,
        achievement_id: achievement.id,
        earned_at: new Date().toISOString(),
        points: achievement.points
      }
    });

    if (result.success) {
      logger.log('Achievements', 'Achievement awarded successfully', { userId, achievementId: achievement.id });
      return { success: true, achievement };
    } else {
      logger.error('Achievements', 'Failed to award achievement', { error: result.error });
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('Achievements', 'Error awarding achievement', error);
    return { success: false, error: error.message };
  }
};

// Get user's earned achievements
export const getUserAchievements = async (userId) => {
  try {
    const result = await makeSupabaseRequest(`user_achievements?select=*&user_id=eq.${userId}&order=earned_at.desc`);
    
    if (result.success) {
      return result.data || [];
    } else {
      logger.error('Achievements', 'Failed to get user achievements', { error: result.error });
      return [];
    }
  } catch (error) {
    logger.error('Achievements', 'Error getting user achievements', error);
    return [];
  }
};

// Check all achievements for a user
export const checkAllAchievements = async (userId, userStats) => {
  try {
    const userAchievements = await getUserAchievements(userId);
    const earnedAchievements = [];

    // Check streak achievements
    const streakAchievements = checkStreakAchievements(userStats.streak || 0, userAchievements);
    earnedAchievements.push(...streakAchievements);

    // Check hasanat achievements
    const hasanatAchievements = checkHasanatAchievements(userStats.totalHasanat || 0, userAchievements);
    earnedAchievements.push(...hasanatAchievements);

    // Check ayat achievements
    const ayatAchievements = checkAyatAchievements(userStats.memorizedAyaat || 0, userAchievements);
    earnedAchievements.push(...ayatAchievements);

    // Check Quran completion
    const quranAchievements = checkQuranCompletion(userStats.memorizedAyaat || 0, userAchievements);
    earnedAchievements.push(...quranAchievements);

    // Award all earned achievements
    for (const achievement of earnedAchievements) {
      await awardAchievement(userId, achievement);
    }

    return earnedAchievements;
  } catch (error) {
    logger.error('Achievements', 'Error checking all achievements', error);
    return [];
  }
};

// Get achievement progress for a user
export const getAchievementProgress = (userStats, achievement) => {
  let current = 0;
  let required = achievement.requirement;

  switch (achievement.type) {
    case ACHIEVEMENT_TYPES.STREAK:
      current = userStats.streak || 0;
      break;
    case ACHIEVEMENT_TYPES.HASANAT:
      current = userStats.totalHasanat || 0;
      break;
    case ACHIEVEMENT_TYPES.AYAT_MEMORIZED:
      current = userStats.memorizedAyaat || 0;
      break;
    case ACHIEVEMENT_TYPES.QURAN_COMPLETION:
      current = userStats.memorizedAyaat || 0;
      break;
    default:
      current = 0;
  }

  const progress = Math.min((current / required) * 100, 100);
  return { current, required, progress };
};
