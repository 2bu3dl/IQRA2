import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../utils/languageContext';
import { useAuth } from '../utils/authContext';
import { 
  getAllAchievements, 
  getUserAchievements, 
  getAchievementProgress,
  ACHIEVEMENT_TYPES 
} from '../utils/achievements';
import Text from './Text';
import Card from './Card';
import { COLORS, SIZES } from '../utils/theme';
import { hapticSelection } from '../utils/hapticFeedback';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AchievementsCard = ({ userStats, targetUserId }) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState(ACHIEVEMENT_TYPES.STREAK);

  const isOwnProfile = !targetUserId || targetUserId === user?.id;

  useEffect(() => {
    loadAchievements();
  }, [targetUserId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const allAchievements = getAllAchievements();
      setAchievements(allAchievements);

      if (targetUserId) {
        const earned = await getUserAchievements(targetUserId);
        setUserAchievements(earned);
      }
    } catch (error) {
      console.error('[AchievementsCard] Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasEarnedAchievement = (achievementId) => {
    return userAchievements.some(achievement => achievement.achievement_id === achievementId);
  };

  const getEarnedCount = () => {
    return userAchievements.length;
  };

  const getTotalCount = () => {
    return achievements.length;
  };

  const getAchievementsByType = (type) => {
    return achievements.filter(achievement => achievement.type === type);
  };

  const getEarnedAchievementsByType = (type) => {
    const typeAchievements = getAchievementsByType(type);
    return typeAchievements.filter(achievement => hasEarnedAchievement(achievement.id));
  };

  const renderAchievementItem = (achievement) => {
    const isEarned = hasEarnedAchievement(achievement.id);
    const progress = getAchievementProgress(userStats, achievement);
    
    return (
      <View key={achievement.id} style={[
        styles.achievementItem,
        isEarned && styles.achievementEarned
      ]}>
        <View style={styles.achievementIcon}>
          <Text style={[styles.achievementIconText, !isEarned && styles.achievementIconLocked]}>
            {achievement.icon}
          </Text>
        </View>
        <View style={styles.achievementContent}>
          <Text style={[styles.achievementTitle, !isEarned && styles.achievementLocked]}>
            {achievement.title[language] || achievement.title.en}
          </Text>
          <Text style={[styles.achievementDescription, !isEarned && styles.achievementLocked]}>
            {achievement.description[language] || achievement.description.en}
          </Text>
          {!isEarned && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress.progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {progress.current}/{progress.required}
              </Text>
            </View>
          )}
        </View>
        {isEarned && (
          <View style={styles.earnedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          </View>
        )}
      </View>
    );
  };

  const renderTypeTab = (type, title, icon) => {
    const isActive = selectedType === type;
    const earnedCount = getEarnedAchievementsByType(type).length;
    const totalCount = getAchievementsByType(type).length;
    
    return (
      <TouchableOpacity
        key={type}
        style={[styles.typeTab, isActive && styles.typeTabActive]}
        onPress={() => {
          hapticSelection();
          setSelectedType(type);
        }}
      >
        <Text style={styles.typeTabIcon}>{icon}</Text>
        <Text style={[styles.typeTabTitle, isActive && styles.typeTabTitleActive]}>
          {title}
        </Text>
        <Text style={[styles.typeTabCount, isActive && styles.typeTabCountActive]}>
          {earnedCount}/{totalCount}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </Card>
    );
  }

  const earnedCount = getEarnedCount();
  const totalCount = getTotalCount();
  const selectedAchievements = getAchievementsByType(selectedType);

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text variant="h3" style={styles.title}>
            {language === 'ar' ? 'الإنجازات' : 'Achievements'}
          </Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {
              hapticSelection();
              setShowModal(true);
            }}
          >
            <Text style={styles.viewAllText}>
              {language === 'ar' ? 'عرض الكل' : 'View All'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(earnedCount / totalCount) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {earnedCount} {language === 'ar' ? 'من' : 'of'} {totalCount}
          </Text>
        </View>

        <View style={styles.recentAchievements}>
          {userAchievements.slice(0, 3).map(achievement => {
            const achievementData = achievements.find(a => a.id === achievement.achievement_id);
            if (!achievementData) return null;
            
            return (
              <View key={achievement.achievement_id} style={styles.recentAchievement}>
                <Text style={styles.recentAchievementIcon}>{achievementData.icon}</Text>
                <Text style={styles.recentAchievementTitle} numberOfLines={1}>
                  {achievementData.title[language] || achievementData.title.en}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Achievements Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h2" style={styles.modalTitle}>
                {language === 'ar' ? 'الإنجازات' : 'Achievements'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.typeTabs}>
              {renderTypeTab(ACHIEVEMENT_TYPES.STREAK, language === 'ar' ? 'التتابع' : 'Streak', '🔥')}
              {renderTypeTab(ACHIEVEMENT_TYPES.HASANAT, language === 'ar' ? 'الحسنات' : 'Hasanat', '💰')}
              {renderTypeTab(ACHIEVEMENT_TYPES.AYAT_MEMORIZED, language === 'ar' ? 'الآيات' : 'Verses', '📝')}
              {renderTypeTab(ACHIEVEMENT_TYPES.SURAH_MEMORIZATION, language === 'ar' ? 'السور' : 'Surahs', '📖')}
              {renderTypeTab(ACHIEVEMENT_TYPES.QURAN_COMPLETION, language === 'ar' ? 'القرآن' : 'Quran', '🕌')}
            </View>

            <ScrollView style={styles.achievementsList} showsVerticalScrollIndicator={false}>
              {selectedAchievements.map(renderAchievementItem)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    backgroundColor: 'rgba(245, 230, 200, 0.95)',
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#3E2723',
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(165,115,36,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentAchievements: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recentAchievement: {
    alignItems: 'center',
    flex: 1,
  },
  recentAchievementIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  recentAchievementTitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    maxWidth: 60,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F5E6C8',
    borderRadius: 20,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,115,36,0.3)',
  },
  modalTitle: {
    color: '#3E2723',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  typeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,115,36,0.3)',
  },
  typeTab: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(165,115,36,0.1)',
  },
  typeTabActive: {
    backgroundColor: COLORS.primary,
  },
  typeTabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  typeTabTitle: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  typeTabTitleActive: {
    color: '#FFFFFF',
  },
  typeTabCount: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
  },
  typeTabCountActive: {
    color: '#FFFFFF',
  },
  achievementsList: {
    flex: 1,
    padding: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.2)',
  },
  achievementEarned: {
    backgroundColor: 'rgba(107, 163, 104, 0.1)',
    borderColor: COLORS.primary,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(165,115,36,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementIconText: {
    fontSize: 20,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  achievementLocked: {
    color: '#999',
  },
  earnedBadge: {
    marginLeft: 8,
  },
});

export default AchievementsCard;
