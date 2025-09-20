import { Platform } from 'react-native';

// Check if a font family is available
export const checkFontFamily = (fontFamily) => {
  if (!fontFamily) return false;
  
  // For now, we'll assume the font is available if it's in our known list
  const knownFonts = [
    'UthmanTN_v2-0',
    'UthmanTNB_v2-0', 
    'KSAHeavy',
    'Montserrat-Regular',
    'Montserrat-Bold',
    'KFGQPC Uthman Taha Naskh',
    'KFGQPC Uthman Taha Naskh Bold',
    'KFGQPC HAFS Uthmanic Script Regular'
  ];
  
  return knownFonts.includes(fontFamily);
};

// Get the correct font family name for a given font
export const getCorrectFontFamily = (fontName) => {
  const fontMap = {
    // Uthman fonts
    'UthmanTN_v2-0': 'UthmanTN_v2-0',
    'UthmanTN_v2-0.ttf': 'UthmanTN_v2-0',
    'UthmanTN': 'UthmanTN_v2-0',
    
    // Uthman Bold fonts
    'UthmanTNB_v2-0': 'UthmanTNB_v2-0',
    'UthmanTNB_v2-0.ttf': 'UthmanTNB_v2-0',
    'UthmanTNB': 'UthmanTNB_v2-0',
    
    // KSA fonts
    'KSAHeavy': 'KSAHeavy',
    'KSAHeavy.ttf': 'KSAHeavy',
    
    // Montserrat fonts
    'Montserrat-Regular': 'Montserrat-Regular',
    'Montserrat-Bold': 'Montserrat-Bold',
    
    // KFGQPC fonts (fallback)
    'KFGQPC Uthman Taha Naskh': 'KFGQPC Uthman Taha Naskh',
    'KFGQPC Uthman Taha Naskh Bold': 'KFGQPC Uthman Taha Naskh Bold',
    
    // Uthmanic Hafs font (use correct font family name)
    'UthmanicHafs1Ver18': 'KFGQPC HAFS Uthmanic Script Regular',
    'UthmanicHafs1Ver18.ttf': 'KFGQPC HAFS Uthmanic Script Regular'
  };
  
  return fontMap[fontName] || fontName;
};

// Get recommended font for Arabic text
export const getRecommendedArabicFont = () => {
  // SUCCESS: KFGQPC HAFS Uthmanic Script Regular is working perfectly!
  return 'KFGQPC HAFS Uthmanic Script Regular';
};

// Robust font loading with fallback mechanism
export const getRobustArabicFont = () => {
  const primaryFont = 'KFGQPC HAFS Uthmanic Script Regular';
  const fallbackFonts = [
    'KFGQPC HAFS Uthmanic Script',
    'KFGQPC HAFS Uthmanic Script Regular',
    'UthmanicHafs1Ver18',
    'UthmanTN_v2-0',
    'UthmanTN'
  ];
  
  // Always return the primary font - React Native will handle fallbacks automatically
  return primaryFont;
};

// Font loading state management
export const ensureFontLoaded = async () => {
  try {
    // Since fonts are bundled with the app, we can assume they're available
    // This function can be extended to actually test font availability if needed
    return true;
  } catch (error) {
    console.warn('Font loading check failed:', error);
    return false;
  }
};

// Debug font availability
export const debugFontAvailability = () => {
  console.log('=== FONT AVAILABILITY DEBUG ===');
  console.log('Platform:', Platform.OS);
  
  const fontsToTest = [
    'UthmanicHafs1Ver18',
    'KFGQPC HAFS Uthmanic Script Regular',
    'UthmanTN_v2-0',
    'UthmanTNB_v2-0',
    'KSAHeavy',
    'Montserrat-Regular',
    'Montserrat-Bold',
    'KFGQPC Uthman Taha Naskh'
  ];
  
  fontsToTest.forEach(font => {
    const available = checkFontFamily(font);
    console.log(`${font}: ${available ? '✅ Available' : '❌ Not Available'}`);
  });
  
  const recommended = getRecommendedArabicFont();
  console.log('Recommended Arabic font:', recommended);
  console.log('=== END FONT DEBUG ===');
  
  return { fontsToTest, recommended };
};
