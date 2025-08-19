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
    'KFGQPC Uthman Taha Naskh Bold'
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
    'KFGQPC Uthman Taha Naskh Bold': 'KFGQPC Uthman Taha Naskh Bold'
  };
  
  return fontMap[fontName] || fontName;
};

// Get recommended font for Arabic text
export const getRecommendedArabicFont = () => {
  // KFGQPC fonts are working, so prioritize them
  if (checkFontFamily('KFGQPC Uthman Taha Naskh')) {
    return 'KFGQPC Uthman Taha Naskh';
  }
  if (checkFontFamily('KFGQPC Uthman Taha Naskh Bold')) {
    return 'KFGQPC Uthman Taha Naskh Bold';
  }
  
  // Fallback to other fonts
  if (Platform.OS === 'ios') {
    if (checkFontFamily('UthmanTN_v2-0')) {
      return 'UthmanTN_v2-0';
    }
    if (checkFontFamily('UthmanTNB_v2-0')) {
      return 'UthmanTNB_v2-0';
    }
    return 'KFGQPC Uthman Taha Naskh';
  } else {
    // Android
    if (checkFontFamily('UthmanTN_v2-0')) {
      return 'UthmanTN_v2-0';
    }
    if (checkFontFamily('UthmanTNB_v2-0')) {
      return 'UthmanTNB_v2-0';
    }
    return 'KSAHeavy';
  }
};

// Debug font availability
export const debugFontAvailability = () => {
  console.log('=== FONT AVAILABILITY DEBUG ===');
  console.log('Platform:', Platform.OS);
  
  const fontsToTest = [
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
