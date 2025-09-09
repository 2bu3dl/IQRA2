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
                      isCurrentDay && styles.dayLabelCurrent
                    ]}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.weeklyText}>
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
  },
  container: {
    width: width * 0.8,
    maxWidth: 300,
    alignItems: 'center',
  },
  containerModal: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  contentModal: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5b7f67',
    marginBottom: 20,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  titleModal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5b7f67',
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
    fontSize: 100,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  streakNumberModal: {
    fontSize: 100,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  streakLabel: {
    fontSize: 18,
    color: '#5b7f67',
    textAlign: 'center',
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5b7f67',
    borderWidth: 1,
    borderColor: '#333333',
  },
  dayCircleActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  dayCircleInactive: {
    backgroundColor: '#CCCCCC',
    borderColor: '#999999',
  },
  weeklyText: {
    fontSize: 16,
    color: '#5b7f67',
    textAlign: 'center',
  },
  dayLabel: {
    fontSize: 11,
    color: '#5b7f67',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  dayLabelCurrent: {
    color: 'rgba(165,115,36,0.8)', // Match search box outline color
    fontWeight: 'bold',
  },
});

export default StreakAnimation; 