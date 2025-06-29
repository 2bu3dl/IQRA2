import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';

const Text = ({
  children,
  style,
  variant = 'body1',
  color = 'text',
  fontFamily,
  weight,
  align,
}) => {
  const getTextStyle = () => {
    const baseStyle = {
      ...FONTS[variant],
      color: COLORS[color],
    };

    if (fontFamily) {
      baseStyle.fontFamily = fontFamily;
    }

    if (weight) {
      baseStyle.fontWeight = weight;
    }

    if (align) {
      baseStyle.textAlign = align;
    }

    return baseStyle;
  };

  return <RNText style={[getTextStyle(), style]}>{children}</RNText>;
};

export default Text; 