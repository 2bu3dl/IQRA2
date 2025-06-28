import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

const ProgressBar = ({ progress, total, height = 8, animated = true }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const progressPercentage = total > 0 ? (progress / total) * 100 : 0;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progressPercentage,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progressPercentage);
    }
  }, [progress, total, animated, progressAnim, progressPercentage]);

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.background, { height }]} />
      <Animated.View
        style={[
          styles.progress,
          {
            height,
            width: animated ? progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }) : `${progressPercentage}%`,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    borderRadius: SIZES.base,
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    width: '100%',
    backgroundColor: COLORS.border,
    borderRadius: SIZES.base,
  },
  progress: {
    backgroundColor: COLORS.success,
    borderRadius: SIZES.base,
  },
});

export default ProgressBar; 