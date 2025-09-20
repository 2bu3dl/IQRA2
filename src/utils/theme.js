import { getResponsiveFontSize } from './responsive';
import { getRecommendedArabicFont, getRobustArabicFont } from './fontChecker';

export const COLORS = {
  primary: '#388E3C', // Forest green
  secondary: '#8D6E63', // Earthy brown
  background: '#000000', // Black background
  accent: '#C0A060', // Muted gold/yellow
  text: '#FFFFFF', // White text for contrast
  textSecondary: '#CCCCCC', // Light gray for secondary text
  border: '#333333', // Dark gray border
  white: '#FFFFFF',
  black: '#000000',
  error: '#FF5252',
  success: '#388E3C',
  warning: '#FFC107',
};

export const SIZES = {
  // Global sizes
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,

  // Font sizes
  h1: 30,
  h2: 24,
  h3: 20,
  h4: 18,
  body1: 16,
  body2: 14,
  body3: 12,

  // App dimensions
  width: '100%',
  height: '100%',
};

const KSA_FONT_CANDIDATES = [
  'KSAHeavy',
  'KSA Heavy',
  'KSA-Heavy',
  'KSA_Heavy',
  'KSA Heavy Regular',
  'KSAHeavy-Regular',
  'KSA Heavy-Regular',
  'KSAHeavyReg',
  'KSA HeavyReg',
  'KSAHeavy Regular',
  'KSA Heavy Regular',
];

const getFontFamily = (language, weight = 'regular') => {
  if (language === 'ar') {
    // Use robust font loading to prevent font reversion issues
    return getRobustArabicFont();
  }
  if (weight === 'bold') {
    return 'Montserrat-Bold';
  }
  return 'Montserrat-Regular';
};

export const FONTS = {
  h1: { fontSize: getResponsiveFontSize(SIZES.h1), lineHeight: getResponsiveFontSize(36), getFont: (language) => ({ fontFamily: getFontFamily(language, 'bold') }) },
  h2: { fontSize: getResponsiveFontSize(SIZES.h2), lineHeight: getResponsiveFontSize(30), getFont: (language) => ({ fontFamily: getFontFamily(language, 'bold') }) },
  h3: { fontSize: getResponsiveFontSize(SIZES.h3), lineHeight: getResponsiveFontSize(24), getFont: (language) => ({ fontFamily: getFontFamily(language, 'bold') }) },
  h4: { fontSize: getResponsiveFontSize(SIZES.h4), lineHeight: getResponsiveFontSize(22), getFont: (language) => ({ fontFamily: getFontFamily(language, 'bold') }) },
  body1: { fontSize: getResponsiveFontSize(SIZES.body1), lineHeight: getResponsiveFontSize(24), getFont: (language) => ({ fontFamily: getFontFamily(language) }) },
  body2: { fontSize: getResponsiveFontSize(SIZES.body2), lineHeight: getResponsiveFontSize(20), getFont: (language) => ({ fontFamily: getFontFamily(language) }) },
  body3: { fontSize: getResponsiveFontSize(SIZES.body3), lineHeight: getResponsiveFontSize(16), getFont: (language) => ({ fontFamily: getFontFamily(language) }) },
  arabic: { 
    fontFamily: getRecommendedArabicFont(), 
    fontSize: getResponsiveFontSize(28), 
    lineHeight: getResponsiveFontSize(40),
    writingDirection: 'rtl',
    textAlign: 'center',
    includeFontPadding: false,
    // Enable OpenType features for proper Arabic ligatures and diacritics
    fontVariant: ['liga', 'dlig', 'calt'], // Enable ligatures and contextual alternates
    textAlignVertical: 'center',
  },
  arabicBold: { 
    fontFamily: 'KFGQPC HAFS Uthmanic Script Regular', 
    fontSize: getResponsiveFontSize(28), 
    lineHeight: getResponsiveFontSize(40),
    writingDirection: 'rtl',
    textAlign: 'center',
    includeFontPadding: false,
    // Enable OpenType features for proper Arabic ligatures and diacritics
    fontVariant: ['liga', 'dlig', 'calt'], // Enable ligatures and contextual alternates
    textAlignVertical: 'center',
  },
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.20,
    shadowRadius: 4.65,
    elevation: 4,
  },
  dark: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.30,
    shadowRadius: 9.11,
    elevation: 14,
  },
};

export const theme = {
  colors: COLORS,
  sizes: SIZES,
  fonts: FONTS,
  shadows: SHADOWS,
}; 