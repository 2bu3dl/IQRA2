import { checkAllAchievements } from './achievements';
import logger from './logger';

// Check achievements when user makes progress
export const checkProgressAchievements = async (userId, userStats) => {
  try {
    logger.log('AchievementService', 'Checking achievements for progress', { userId });
    
    const earnedAchievements = await checkAllAchievements(userId, userStats);
    
    if (earnedAchievements.length > 0) {
      logger.log('AchievementService', 'New achievements earned', { 
        userId, 
        count: earnedAchievements.length,
        achievements: earnedAchievements.map(a => a.id)
      });
      
      // You could add notification logic here
      return { success: true, achievements: earnedAchievements };
    }
    
    return { success: true, achievements: [] };
  } catch (error) {
    logger.error('AchievementService', 'Error checking progress achievements', error);
    return { success: false, error: error.message };
  }
};

// Check achievements after memorization progress
export const checkMemorizationAchievements = async (userId, memorizedAyaat) => {
  try {
    const userStats = { memorizedAyaat };
    return await checkProgressAchievements(userId, userStats);
  } catch (error) {
    logger.error('AchievementService', 'Error checking memorization achievements', error);
    return { success: false, error: error.message };
  }
};

// Check achievements after earning hasanat
export const checkHasanatAchievements = async (userId, totalHasanat) => {
  try {
    const userStats = { totalHasanat };
    return await checkProgressAchievements(userId, userStats);
  } catch (error) {
    logger.error('AchievementService', 'Error checking hasanat achievements', error);
    return { success: false, error: error.message };
  }
};

// Check achievements after streak update
export const checkStreakAchievements = async (userId, streak) => {
  try {
    const userStats = { streak };
    return await checkProgressAchievements(userId, userStats);
  } catch (error) {
    logger.error('AchievementService', 'Error checking streak achievements', error);
    return { success: false, error: error.message };
  }
};
