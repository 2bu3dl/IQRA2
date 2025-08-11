import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { getCurrentWeekActivity, getCurrentWeekStreak } from '../utils/store';
import { useLanguage } from '../utils/languageContext';
import { COLORS } from '../utils/theme';
import Text from './Text';

const WeeklyStreakIndicator = ({ refresh = false }) => {
  const [weekActivity, setWeekActivity] = useState([false, false, false, false, false, false, false]);
  const [weekStreak, setWeekStreak] = useState(0);
  const { language, t } = useLanguage();

  useEffect(() => {
    loadWeekData();
  }, [refresh]);

  const loadWeekData = async () => {
    try {
      const [activity, streak] = await Promise.all([
        getCurrentWeekActivity(),
        getCurrentWeekStreak()
      ]);
      setWeekActivity(activity);
      setWeekStreak(streak);
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  };

  // Day labels for English and Arabic
  const dayLabelsEn = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
  const dayLabelsAr = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; // الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس، الجمعة، السبت
  
  const dayLabels = language === 'ar' ? dayLabelsAr : dayLabelsEn;

  // Helper to convert numbers to Arabic-Indic if needed
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };

  // Get week streak text
  const getWeekStreakText = () => {
    if (weekStreak === 0) {
      return language === 'ar' ? 'لا يوجد أسبوع' : 'No week';
    }
    
    const weekNumber = toArabicNumber(weekStreak);
    if (language === 'ar') {
      return weekStreak === 1 ? `أسبوع ${weekNumber}` : `أسبوع ${weekNumber}`;
    }
    
    return `Week ${weekNumber}`;
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        {weekActivity.map((isActive, index) => (
          <View key={index} style={styles.dayContainer}>
            <View style={[
              styles.dayCircle,
              isActive && styles.dayCircleActive
            ]} />
          </View>
        ))}
      </View>
      <Text style={styles.weekStreakText}>
        {getWeekStreakText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dayContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dayCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent, // Orange color for the background (inactive state)
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dayCircleActive: {
    backgroundColor: COLORS.primary, // App theme green color for active days
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  weekStreakText: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    opacity: 0.8,
  },
});

export default WeeklyStreakIndicator;
