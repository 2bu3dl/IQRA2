import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const Card = ({ children, style, variant = 'default', padding = 'medium', onPress }) => {
  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: COLORS.background,
      borderRadius: SIZES.base,
    };

    const variantStyles = {
      default: {},
      elevated: {
        ...SHADOWS.medium,
      },
      outline: {
        borderWidth: 1,
        borderColor: COLORS.border,
      },
    };

    const paddingStyles = {
      small: {
        padding: SIZES.small,
      },
      medium: {
        padding: SIZES.medium,
      },
      large: {
        padding: SIZES.large,
      },
    };

    // Check if style prop has backgroundColor, if so, don't apply default background
    const hasCustomBackground = style && style.backgroundColor;
    
    return {
      ...baseStyle,
      ...(hasCustomBackground ? {} : { backgroundColor: COLORS.background }),
      ...variantStyles[variant],
      ...paddingStyles[padding],
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        onPressIn={() => { ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true }); }}
        activeOpacity={0.8} style={style}>
        <View style={getCardStyle()}>{children}</View>
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

export default Card; 