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
  lang,
  isBoldFont,
  ...props
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

    if (isBoldFont) {
      baseStyle.fontFamily = 'KFGQPC Uthman Taha Naskh Bold';
    }

    if (align) {
      baseStyle.textAlign = align;
    }

    // Add RTL support for Arabic
    if (lang === 'ar') {
      baseStyle.writingDirection = 'rtl';
      baseStyle.textAlign = 'right';
      baseStyle.includeFontPadding = false;
    }

    return baseStyle;
  };

  return <RNText style={[getTextStyle(), style]} allowFontScaling={false} {...props}>{children}</RNText>;
};

export default Text; 