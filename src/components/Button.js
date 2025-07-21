import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import Text from './Text';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const Button = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium',
  disabled = false,
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: SIZES.base,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const variantStyles = {
      primary: {
        backgroundColor: COLORS.primary,
      },
      secondary: {
        backgroundColor: COLORS.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
      },
    };

    const sizeStyles = {
      small: {
        paddingVertical: SIZES.small,
        paddingHorizontal: SIZES.medium,
      },
      medium: {
        paddingVertical: SIZES.medium,
        paddingHorizontal: SIZES.large,
      },
      large: {
        paddingVertical: SIZES.large,
        paddingHorizontal: SIZES.extraLarge,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...sizeStyles[size],
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyle = () => {
    const variantStyles = {
      primary: {
        color: COLORS.white,
      },
      secondary: {
        color: COLORS.white,
      },
      outline: {
        color: COLORS.primary,
      },
    };

    return {
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      onPressIn={() => {
        ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
      }}
      disabled={disabled}>
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button; 