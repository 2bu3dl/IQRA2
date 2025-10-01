import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Text from './Text';
import { useLanguage } from '../utils/languageContext';
import { getCurrentWeekActivity } from '../utils/store';

const { width, height } = Dimensions.get('window');

const StreakAnimation = ({ visible, newStreak, onAnimationComplete, isModal = false }) => {
  const { language, t } = useLanguage();
  const [displayNumber, setDisplayNumber] = useState(0);
  const [weekActivity, setWeekActivity] = useState([false, false, false, false, false, false, false]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  
  const safePrev = Math.max(0, newStreak - 1);
  const safeNew = newStreak;

  const loadWeekActivity = async () => {
    try {
      const activity = await getCurrentWeekActivity();
      setWeekActivity(activity);
    } catch (error) {
      console.error('[StreakAnimation] Error loading week activity:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      console.log('StreakAnimation: Starting flip animation from', safePrev, 'to', safeNew);
      
      // Load weekly activity data
      loadWeekActivity();
      
      // Reset state
      setDisplayNumber(safePrev);
      flipAnim.setValue(0);
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
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Start flip animation after a short delay
        setTimeout(() => {
          startFlipAnimation();
        }, 800);
      });
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      flipAnim.setValue(0);
      setDisplayNumber(0);
    }
  }, [visible]);

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
        ]).start(() => {
          if (typeof onAnimationComplete === 'function') {
            onAnimationComplete();
          }
        });
      }, 1500);
    });

    // Change number at midpoint of flip
    setTimeout(() => {
      setDisplayNumber(safeNew);
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

  return (
    <View style={[
      styles.overlay,
      isModal ? styles.overlayModal : styles.overlayDirect
    ]}>
      <Animated.View style={[
        isModal ? styles.containerModal : styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        <View style={isModal ? styles.contentModal : styles.content}>
          <Text style={isModal ? styles.titleModal : styles.title}>{t('daily_streak')}</Text>
          <View style={styles.streakContainer}>
            <Animated.Text style={[
              isModal ? styles.streakNumberModal : styles.streakNumber,
              {
                transform: [{ rotateY: flipInterpolate }]
              }
            ]}>
              {toArabicNumber(displayNumber)}
            </Animated.Text>
            <Text style={styles.streakLabel}>{t('days')}</Text>
          </View>
          
          {/* Weekly indicator with day dots */}
          <Animated.View style={[
            isModal ? styles.weeklyIndicatorContainerModal : styles.weeklyIndicatorContainer,
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
                const currentDayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
                const isCurrentDay = index === currentDayIndex;
                
                return (
                  <View key={index} style={styles.dayContainer}>
                    <View style={[
                      styles.dayCircle,
                      isActive ? styles.dayCircleActive : styles.dayCircleInactive
                    ]} />
                    <Text style={[
                      styles.dayLabel,
                      isCurrentDay && styles.dayLabelCurrent,
                      isCurrentDay && { textDecorationLine: 'underline' }
                    ]}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayModal: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayDirect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: height * 0.15,
    paddingBottom: height * 0.15,
    paddingHorizontal: 20,
  },
  container: {
    width: width * 0.85,
    maxWidth: 320,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  containerModal: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  content: {
    backgroundColor: '#5b7f67',
    borderRadius: 24,
    padding: 32,
    paddingTop: 40,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  contentModal: {
    backgroundColor: '#5b7f67',
    borderRadius: 24,
    padding: 32,
    paddingTop: 40,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F5E6C8',
    marginTop: 0,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
  },
  titleModal: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F5E6C8',
    marginTop: 0,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
  },
  streakContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  streakNumber: {
    fontSize: 120,
    fontWeight: '800',
    color: '#F5E6C8',
    textAlign: 'center',
    marginBottom: 12,
    alignSelf: 'center',
    textShadowColor: 'rgba(245, 230, 200, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  streakNumberModal: {
    fontSize: 120,
    fontWeight: '800',
    color: '#F5E6C8',
    textAlign: 'center',
    marginBottom: 12,
    alignSelf: 'center',
    textShadowColor: 'rgba(245, 230, 200, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  streakLabel: {
    fontSize: 20,
    color: '#F5E6C8',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  weeklyIndicatorContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  weeklyIndicatorContainerModal: {
    marginTop: 20,
    alignItems: 'center',
  },
  weeklyDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  dayContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dayCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8BC09E',
    borderWidth: 2,
    borderColor: '#A8D5B8',
  },
  dayCircleActive: {
    backgroundColor: '#F5E6C8',
    borderColor: '#F5E6C8',
    shadowColor: '#F5E6C8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  dayCircleInactive: {
    backgroundColor: '#5B9173',
    borderColor: '#7AAA8F',
  },
  weeklyText: {
    fontSize: 18,
    color: '#F5E6C8',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dayLabel: {
    fontSize: 12,
    color: '#E8DCC8',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  dayLabelCurrent: {
    color: '#F5E6C8',
    fontWeight: '700',
  },
});

export default StreakAnimation; 