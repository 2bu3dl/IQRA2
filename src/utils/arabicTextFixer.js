/**
 * Arabic Text Normalizer
 * Handles Arabic text rendering issues, particularly with wasla and diacritical marks
 * to ensure proper letter connections and consistent rendering across devices.
 */

// Unicode mappings for Arabic diacritical marks and special characters
const ARABIC_DIACRITICS = {
  // Wasla (ٱ) - should connect properly with following letters
  '\u0671': '\u0627', // Replace wasla with regular alif for better rendering
  
  // Other problematic diacritical marks that might cause separation
  '\u064B': '', // Fathatan - remove if causing issues
  '\u064C': '', // Dammatan - remove if causing issues  
  '\u064D': '', // Kasratan - remove if causing issues
  '\u064E': '', // Fatha - remove if causing issues
  '\u064F': '', // Damma - remove if causing issues
  '\u0650': '', // Kasra - remove if causing issues
  '\u0651': '', // Shadda - remove if causing issues
  '\u0652': '', // Sukun - remove if causing issues
  '\u0653': '', // Maddah above - remove if causing issues
  '\u0654': '', // Hamza above - remove if causing issues
  '\u0655': '', // Hamza below - remove if causing issues
  '\u0656': '', // Subscript alef - remove if causing issues
  '\u0657': '', // Inverted damma - remove if causing issues
  '\u0658': '', // Mark noon ghunna - remove if causing issues
  '\u0659': '', // Zwarakay - remove if causing issues
  '\u065A': '', // Vowel sign small v above - remove if causing issues
  '\u065B': '', // Vowel sign inverted small v above - remove if causing issues
  '\u065C': '', // Vowel sign dot below - remove if causing issues
  '\u065D': '', // Reversed damma - remove if causing issues
  '\u065E': '', // Fatha with two dots - remove if causing issues
  '\u065F': '', // Wavy hamza below - remove if causing issues
  '\u0670': '\u0627', // Superscript alef - replace with regular alef
};

// Special handling for wasla in specific contexts
const WASLA_FIXES = {
  // Common patterns where wasla causes visual spacing issues
  // Note: These are visual fixes, not linguistic changes
  'فَٱ': 'فَٱ', // Keep as is - this is the problematic case in Surah Ash-Sharh
  'وَٱ': 'وَٱ', // Keep as is
  'بِٱ': 'بِٱ', // Keep as is
  'لِٱ': 'لِٱ', // Keep as is
};

// Alternative approach: Use zero-width joiner for better visual connection
const WASLA_JOINER_FIXES = {
  'فَٱ': 'فَٱ\u200D', // Add zero-width joiner after wasla
  'وَٱ': 'وَٱ\u200D', // Add zero-width joiner after wasla
  'بِٱ': 'بِٱ\u200D', // Add zero-width joiner after wasla
  'لِٱ': 'لِٱ\u200D', // Add zero-width joiner after wasla
};

/**
 * Normalizes Arabic text to fix rendering issues
 * @param {string} text - The Arabic text to normalize
 * @param {boolean} preserveDiacritics - Whether to preserve diacritical marks (default: true)
 * @returns {string} - The normalized Arabic text
 */
export const normalizeArabicText = (text, preserveDiacritics = true) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let normalizedText = text;

  // Handle specific wasla cases that cause letter separation
  if (normalizedText.includes('فَٱنصَبْ')) {
    // Special case for Surah Ash-Sharh ayah 7
    normalizedText = normalizedText.replace('فَٱنصَبْ', 'فَٱنصَبْ');
  }

  // Apply wasla fixes for common problematic patterns
  Object.keys(WASLA_FIXES).forEach(pattern => {
    const replacement = WASLA_FIXES[pattern];
    normalizedText = normalizedText.replace(new RegExp(pattern, 'g'), replacement);
  });

  // Handle other diacritical marks if not preserving them
  if (!preserveDiacritics) {
    Object.keys(ARABIC_DIACRITICS).forEach(diacritic => {
      const replacement = ARABIC_DIACRITICS[diacritic];
      normalizedText = normalizedText.replace(new RegExp(diacritic, 'g'), replacement);
    });
  }

  // Clean up any extra spaces that might have been created
  normalizedText = normalizedText.replace(/\s+/g, ' ').trim();

  return normalizedText;
};

/**
 * Fixes wasla rendering issues specifically
 * @param {string} text - The Arabic text containing wasla
 * @param {string} method - Method to use: 'replace' (default), 'joiner', 'preserve', 'font-fix'
 * @returns {string} - The text with wasla rendering fixes
 */
export const fixWaslaRendering = (text, method = 'replace') => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let fixedText = text;

  switch (method) {
    case 'replace':
      // Replace wasla (ٱ) with regular alif (ا) for better rendering
      // This preserves the original text meaning while fixing font rendering issues
      // Regular alif properly connects to previous letters in most fonts
      fixedText = fixedText.replace(/\u0671/g, '\u0627');
      break;
      
    case 'joiner':
      // Add zero-width joiner after wasla to improve visual spacing
      // This preserves the wasla but tries to improve visual connection
      Object.keys(WASLA_JOINER_FIXES).forEach(pattern => {
        const replacement = WASLA_JOINER_FIXES[pattern];
        fixedText = fixedText.replace(new RegExp(pattern, 'g'), replacement);
      });
      break;
      
    case 'advanced-joiner':
      // More aggressive joiner approach with multiple techniques
      // First, add zero-width joiner after wasla
      fixedText = fixedText.replace(/\u0671/g, '\u0671\u200D');
      // Then try to fix specific patterns
      Object.keys(WASLA_JOINER_FIXES).forEach(pattern => {
        const replacement = WASLA_JOINER_FIXES[pattern];
        fixedText = fixedText.replace(new RegExp(pattern, 'g'), replacement);
      });
      break;
      
    case 'font-fix':
      // Try to fix the font rendering issue by using a different approach
      // This method attempts to preserve the wasla while fixing connection issues
      // by using combining characters or alternative Unicode representations
      fixedText = fixedText.replace(/\u0671/g, '\u0627\u0653'); // Alif + Maddah above
      break;
      
    case 'connection-fix':
      // Try to force wasla connection by using zero-width non-joiner before wasla
      // and zero-width joiner after it
      fixedText = fixedText.replace(/\u0671/g, '\u200C\u0671\u200D');
      break;
      
    case 'ligature-fix':
      // Try to create a ligature effect by using specific Unicode sequences
      // that might force better connection
      fixedText = fixedText.replace(/\u0671/g, '\u0627\u0653\u200D'); // Alif + Maddah + ZWJ
      break;
      
    case 'smart-connection':
      // Smart approach: analyze context and apply different fixes
      // For wasla at word beginning, try to force connection to previous word
      fixedText = fixedText.replace(/(\S)\s+(\u0671)/g, '$1\u200D$2\u200D');
      // For wasla within words, use standard joiner
      fixedText = fixedText.replace(/(\u0671)(?=\S)/g, '$1\u200D');
      break;
      
    case 'preserve':
      // Keep wasla as is - no changes
      // This is for testing or when the font handles wasla correctly
      break;
      
    default:
      // Default to replace method
      fixedText = fixedText.replace(/\u0671/g, '\u0627');
  }

  return fixedText;
};

/**
 * Advanced Arabic text normalizer that handles complex rendering issues
 * @param {string} text - The Arabic text to normalize
 * @param {Object} options - Normalization options
 * @returns {string} - The normalized text
 */
export const advancedArabicNormalizer = (text, options = {}) => {
  const {
    fixWasla = true,
    preserveDiacritics = true,
    fixLetterSpacing = true,
    normalizeWhitespace = true
  } = options;

  if (!text || typeof text !== 'string') {
    return text;
  }

  let normalizedText = text;

  // Fix wasla issues
  if (fixWasla) {
    normalizedText = fixWaslaRendering(normalizedText);
  }

  // Apply general normalization
  normalizedText = normalizeArabicText(normalizedText, preserveDiacritics);

  // Fix letter spacing issues
  if (fixLetterSpacing) {
    // Remove any zero-width characters that might cause spacing issues
    normalizedText = normalizedText.replace(/[\u200B-\u200D\uFEFF]/g, '');
  }

  // Normalize whitespace
  if (normalizeWhitespace) {
    normalizedText = normalizedText.replace(/\s+/g, ' ').trim();
  }

  return normalizedText;
};

/**
 * Test function to verify Arabic text normalization
 * @param {string} testText - Text to test
 * @returns {Object} - Test results
 */
export const testArabicNormalization = (testText) => {
  const original = testText;
  const normalized = normalizeArabicText(testText);
  const waslaFixed = fixWaslaRendering(testText);
  const advanced = advancedArabicNormalizer(testText);

  return {
    original,
    normalized,
    waslaFixed,
    advanced,
    hasWasla: testText.includes('\u0671'),
    hasDiacritics: /[\u064B-\u065F\u0670]/.test(testText)
  };
};

// Export default function for backward compatibility
export default normalizeArabicText;
