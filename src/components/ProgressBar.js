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
            backgroundColor: completed ? '#DAA520' : '#33694e',
          },
          completed && {
            shadowColor: '#DAA520',
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
    backgroundColor: 'rgba(180, 180, 180, 0.4)', // Lighter gray background
    borderRadius: SIZES.base,
  },
  progress: {
    backgroundColor: '#33694e',
    borderRadius: SIZES.base,
    // Enhanced inner shadow effect for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
    // Add subtle border for better definition with inset effect
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    // Create inset effect with darker top/left borders
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.4)',
    borderLeftColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
});

export default ProgressBar; 