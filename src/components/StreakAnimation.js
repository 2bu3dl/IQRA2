import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Text from './Text';
import { useLanguage } from '../utils/languageContext';

const { width, height } = Dimensions.get('window');

const StreakAnimation = ({ visible, newStreak, onAnimationComplete }) => {
  const { language, t } = useLanguage();
  const [displayNumber, setDisplayNumber] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  
  const safePrev = Math.max(0, newStreak - 1);
  const safeNew = newStreak;

  useEffect(() => {
    if (visible) {
      console.log('StreakAnimation: Starting flip animation from', safePrev, 'to', safeNew);
      
      // Reset state
      setDisplayNumber(safePrev);
      flipAnim.setValue(0);
      
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
    <View style={styles.overlay}>
      <Animated.View style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('daily_streak')}</Text>
          <View style={styles.streakContainer}>
            <Animated.Text style={[
              styles.streakNumber,
              {
                transform: [{ rotateY: flipInterpolate }]
              }
            ]}>
              {toArabicNumber(displayNumber)}
            </Animated.Text>
            <Text style={styles.streakLabel}>{t('days')}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingTop: height * 0.1, // Add top padding to prevent going off screen
    paddingBottom: height * 0.1, // Add bottom padding
  },
  container: {
    width: width * 0.8,
    maxWidth: 300,
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
  title: {
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
  streakLabel: {
    fontSize: 18,
    color: '#5b7f67',
    textAlign: 'center',
  },
});

export default StreakAnimation; 