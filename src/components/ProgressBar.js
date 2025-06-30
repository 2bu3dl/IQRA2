import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

const ProgressBar = ({ progress, total, height = 6, completed = false }) => {
  // Memoize the progress percentage to prevent unnecessary recalculations
  const progressPercentage = useMemo(() => {
    return total > 0 ? (progress / total) * 100 : 0;
  }, [progress, total]);

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.background, { height }]} />
      <View
        style={[
          styles.progress,
          {
            height,
            width: `${progressPercentage}%`,
            backgroundColor: completed ? '#fae29f' : '#33694e',
          },
          completed && {
            shadowColor: '#fae29f',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 6,
            elevation: 6,
          }
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
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderRadius: SIZES.base,
  },
  progress: {
    backgroundColor: '#33694e',
    borderRadius: SIZES.base,
  },
});

export default ProgressBar; 