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

export const FONTS = {
  h1: { fontFamily: 'System', fontSize: SIZES.h1, lineHeight: 36 },
  h2: { fontFamily: 'System', fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontFamily: 'System', fontSize: SIZES.h3, lineHeight: 24 },
  h4: { fontFamily: 'System', fontSize: SIZES.h4, lineHeight: 22 },
  body1: { fontFamily: 'System', fontSize: SIZES.body1, lineHeight: 24 },
  body2: { fontFamily: 'System', fontSize: SIZES.body2, lineHeight: 20 },
  body3: { fontFamily: 'System', fontSize: SIZES.body3, lineHeight: 16 },
  arabic: { fontFamily: 'QuranFont', fontSize: 28, lineHeight: 40 }, // Placeholder for custom Arabic font
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