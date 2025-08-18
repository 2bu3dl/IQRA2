import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Screen size breakpoints
export const SCREEN_SIZES = {
  SMALL: SCREEN_HEIGHT < 700,
  MEDIUM: SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 850,
  LARGE: SCREEN_HEIGHT >= 850,
  EXTRA_LARGE: SCREEN_HEIGHT >= 1000,
};

// Responsive font sizing
export const getResponsiveFontSize = (baseSize, scaleFactor = 1) => {
  const scale = SCREEN_WIDTH / 375; // Base width is 375 (iPhone X)
  const newSize = baseSize * scale * scaleFactor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive spacing
export const getResponsiveSpacing = (baseSpacing, multiplier = 1) => {
  const scale = Math.min(SCREEN_WIDTH / 375, SCREEN_HEIGHT / 812);
  return Math.round(baseSpacing * scale * multiplier);
};

// Responsive dimensions
export const getResponsiveDimension = (baseDimension, scaleFactor = 1) => {
  const scale = Math.min(SCREEN_WIDTH / 375, SCREEN_HEIGHT / 812);
  return Math.round(baseDimension * scale * scaleFactor);
};

// Screen size specific multipliers
export const getScreenMultiplier = () => {
  if (SCREEN_SIZES.SMALL) return 0.8;
  if (SCREEN_SIZES.MEDIUM) return 1.0;
  if (SCREEN_SIZES.LARGE) return 1.2;
  if (SCREEN_SIZES.EXTRA_LARGE) return 1.4;
  return 1.0;
};

// Responsive font sizes for different text types
export const RESPONSIVE_FONT_SIZES = {
  h1: getResponsiveFontSize(30),
  h2: getResponsiveFontSize(24),
  h3: getResponsiveFontSize(20),
  h4: getResponsiveFontSize(18),
  body1: getResponsiveFontSize(16),
  body2: getResponsiveFontSize(14),
  body3: getResponsiveFontSize(12),
  caption: getResponsiveFontSize(10),
  large: getResponsiveFontSize(28),
  extraLarge: getResponsiveFontSize(32),
  small: getResponsiveFontSize(12),
  medium: getResponsiveFontSize(16),
};

// Responsive spacing values
export const RESPONSIVE_SPACING = {
  xs: getResponsiveSpacing(4),
  sm: getResponsiveSpacing(8),
  md: getResponsiveSpacing(16),
  lg: getResponsiveSpacing(24),
  xl: getResponsiveSpacing(32),
  xxl: getResponsiveSpacing(48),
};

// Responsive icon sizes
export const RESPONSIVE_ICON_SIZES = {
  small: getResponsiveDimension(16),
  medium: getResponsiveDimension(24),
  large: getResponsiveDimension(32),
  extraLarge: getResponsiveDimension(48),
  button: getResponsiveDimension(45, getScreenMultiplier()),
};

// Responsive button sizes
export const RESPONSIVE_BUTTON_SIZES = {
  small: {
    height: getResponsiveDimension(32),
    paddingHorizontal: getResponsiveSpacing(12),
  },
  medium: {
    height: getResponsiveDimension(44),
    paddingHorizontal: getResponsiveSpacing(16),
  },
  large: {
    height: getResponsiveDimension(56),
    paddingHorizontal: getResponsiveSpacing(24),
  },
};

// Responsive modal dimensions
export const RESPONSIVE_MODAL_DIMENSIONS = {
  width: Math.min(SCREEN_WIDTH * 0.9, 400),
  maxHeight: SCREEN_HEIGHT * 0.8,
  padding: getResponsiveSpacing(16),
};

// Responsive card dimensions
export const RESPONSIVE_CARD_DIMENSIONS = {
  borderRadius: getResponsiveDimension(12),
  padding: getResponsiveSpacing(16),
  marginBottom: getResponsiveSpacing(12),
};

// Arabic text responsive sizing
export const getResponsiveArabicFontSize = (baseSize = 40) => {
  const scale = Math.min(SCREEN_WIDTH / 375, SCREEN_HEIGHT / 812);
  const adjustedSize = baseSize * scale;
  
  // Ensure minimum and maximum readable sizes
  return Math.max(24, Math.min(60, adjustedSize));
};

// Responsive word width calculation for Arabic text
export const getResponsiveWordWidth = (wordLength, fontSize) => {
  const baseWidth = wordLength * (fontSize * 0.6);
  const scale = Math.min(SCREEN_WIDTH / 375, SCREEN_HEIGHT / 812);
  return Math.round(baseWidth * scale);
};

// Responsive container dimensions
export const getResponsiveContainerDimensions = (baseWidth, baseHeight) => {
  const scale = Math.min(SCREEN_WIDTH / 375, SCREEN_HEIGHT / 812);
  return {
    width: Math.round(baseWidth * scale),
    height: Math.round(baseHeight * scale),
  };
};

// Responsive positioning
export const getResponsivePosition = (baseTop, baseLeft, baseRight, baseBottom) => {
  const scale = Math.min(SCREEN_WIDTH / 375, SCREEN_HEIGHT / 812);
  return {
    top: baseTop ? Math.round(baseTop * scale) : undefined,
    left: baseLeft ? Math.round(baseLeft * scale) : undefined,
    right: baseRight ? Math.round(baseRight * scale) : undefined,
    bottom: baseBottom ? Math.round(baseBottom * scale) : undefined,
  };
};

export default {
  SCREEN_SIZES,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getResponsiveDimension,
  getScreenMultiplier,
  RESPONSIVE_FONT_SIZES,
  RESPONSIVE_SPACING,
  RESPONSIVE_ICON_SIZES,
  RESPONSIVE_BUTTON_SIZES,
  RESPONSIVE_MODAL_DIMENSIONS,
  RESPONSIVE_CARD_DIMENSIONS,
  getResponsiveArabicFontSize,
  getResponsiveWordWidth,
  getResponsiveContainerDimensions,
  getResponsivePosition,
};
