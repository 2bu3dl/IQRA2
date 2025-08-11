import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Text from './Text';
import { useLanguage } from '../utils/languageContext';
import { COLORS } from '../utils/theme';
import { getCurrentWeekActivity } from '../utils/store';

const { width, height } = Dimensions.get('window');

const StreakBrokenAnimation = ({ visible, previousStreak, missedDays = [], onAnimationComplete }) => {
  const { language, t } = useLanguage();
  const [displayNumber, setDisplayNumber] = useState(previousStreak);
  const [weekActivity, setWeekActivity] = useState([false, false, false, false, false, false, false]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      console.log('StreakBrokenAnimation: Starting animation from', previousStreak, 'to 0');
      
      // Load weekly activity data
      loadWeekActivity();
      
      // Reset state
      setDisplayNumber(previousStreak);
      flipAnim.setValue(0);
      shakeAnim.setValue(0);
      dotsAnim.setValue(0);
      
      // Start fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Start shake animation
        setTimeout(() => {
          startShakeAndFlipAnimation();
        }, 800);
      });
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      flipAnim.setValue(0);
      shakeAnim.setValue(0);
      dotsAnim.setValue(0);
      setDisplayNumber(0);
    }
  }, [visible]);

  const loadWeekActivity = async () => {
    try {
      const activity = await getCurrentWeekActivity();
      setWeekActivity(activity);
    } catch (error) {
      console.error('[StreakBrokenAnimation] Error loading week activity:', error);
    }
  };

  const startShakeAndFlipAnimation = () => {
    // Shake animation for dramatic effect
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start flip animation after shake
      startFlipAnimation();
    });
  };

  const startFlipAnimation = () => {
    // Flip animation sequence
    Animated.sequence([
      // First half of flip (number disappears)
      Animated.timing(flipAnim, {
        toValue: 0.5,
        duration: 600,
        useNativeDriver: true,
      }),
      // Second half of flip (new number appears)
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate in the weekly dots after the number flip
      setTimeout(() => {
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 200);
      
      // Wait then fade out
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (typeof onAnimationComplete === 'function') {
            onAnimationComplete();
          }
        });
      }, 2200);
    });

    // Change number at midpoint of flip
    setTimeout(() => {
      setDisplayNumber(0);
    }, 600);
  };

  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };

  if (!visible) return null;

  // Calculate flip transform
  const flipInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  // Calculate shake transform
  const shakeInterpolate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { rotate: shakeInterpolate }
          ]
        }
      ]}>
        <View style={styles.content}>
          <Text style={styles.title}>{language === 'ar' ? 'انقطع التسلسل' : 'Streak Broken'}</Text>
          <View style={styles.streakContainer}>
            <Animated.Text style={[
              styles.streakNumber,
              displayNumber === 0 && styles.streakNumberZero,
              {
                transform: [{ rotateY: flipInterpolate }]
              }
            ]}>
              {toArabicNumber(displayNumber)}
            </Animated.Text>
            <Text style={styles.streakLabel}>{language === 'ar' ? 'أيام' : 'days'}</Text>
          </View>
          
          {/* Weekly indicator with missed days in red */}
          <Animated.View style={[
            styles.weeklyIndicatorContainer,
            {
              opacity: dotsAnim,
              transform: [{
                translateY: dotsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }
          ]}>
            <View style={styles.weeklyDotsContainer}>
              {weekActivity.map((isActive, index) => {
                const isMissed = missedDays.includes(index);
                const dayState = isMissed ? 'missed' : (isActive ? 'active' : 'inactive');
                
                return (
                  <View key={index} style={styles.dayContainer}>
                    <View style={[
                      styles.dayCircle,
                      dayState === 'missed' && styles.dayCircleMissed,
                      dayState === 'active' && styles.dayCircleActive,
                      dayState === 'inactive' && styles.dayCircleInactive
                    ]} />
                  </View>
                );
              })}
            </View>
            <Text style={styles.missedDaysText}>
              {language === 'ar' ? 'هذا الأسبوع' : 'This Week'}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: width * 0.85,
    maxWidth: 350,
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 20,
    minHeight: 250,
    borderWidth: 2,
    borderColor: 'rgba(255,0,0,0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 20,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  streakContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  streakNumber: {
    fontSize: 120,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  streakNumberZero: {
    color: '#FF4444',
  },
  streakLabel: {
    fontSize: 20,
    color: '#FF4444',
    textAlign: 'center',
  },
  weeklyIndicatorContainer: {
    alignItems: 'center',
    marginTop: 25,
  },
  weeklyDotsContainer: {
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
    borderWidth: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dayCircleInactive: {
    backgroundColor: '#FFD700', // Orange color for inactive days
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  dayCircleActive: {
    backgroundColor: '#6BA368', // Green color for active days
    borderColor: '#6BA368',
    shadowColor: '#6BA368',
    shadowOpacity: 0.3,
  },
  dayCircleMissed: {
    backgroundColor: '#FF4444', // Red color for missed days
    borderColor: '#FF4444',
    shadowColor: '#FF4444',
    shadowOpacity: 0.5,
    // Add pulsing effect for missed days
    borderWidth: 3,
  },
  missedDaysText: {
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    opacity: 0.9,
  },
});

export default StreakBrokenAnimation;
