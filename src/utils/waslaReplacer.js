/**
 * Wasla Character Replacement Utility
 * 
 * Since all available fonts are missing the wasla character (U+0671),
 * we need to replace it with regular alif (U+0627) in the source data.
 * 
 * This is the definitive solution based on font analysis.
 */

// Characters that are missing from all our fonts
const MISSING_CHARACTERS = {
  '\u0671': '\u0627', // Alef with Wasla Above → Alef
  '\u06E1': '',       // Small High Dotless Head Of Khah → Remove
};

// Additional diacritics that might cause issues
const PROBLEMATIC_DIACRITICS = {
  '\u064E': '', // Fatha → Remove (causes spacing issues)
  '\u064B': '', // Fathatan → Remove
  '\u064C': '', // Dammatan → Remove
  '\u064D': '', // Kasratan → Remove
  '\u064F': '', // Damma → Remove
  '\u0650': '', // Kasra → Remove
  '\u0651': '', // Shadda → Remove
  '\u0652': '', // Sukun → Remove
};

/**
 * Replace missing characters with available alternatives
 * @param {string} text - Arabic text to process
 * @param {boolean} removeDiacritics - Whether to remove diacritics (default: true)
 * @returns {string} - Processed text with missing characters replaced
 */
export function replaceMissingCharacters(text, removeDiacritics = true) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let processedText = text;
  
  // Replace missing characters
  Object.entries(MISSING_CHARACTERS).forEach(([missing, replacement]) => {
    processedText = processedText.replace(new RegExp(missing, 'g'), replacement);
  });
  
  // Optionally remove diacritics that cause spacing issues
  if (removeDiacritics) {
    Object.entries(PROBLEMATIC_DIACRITICS).forEach(([diacritic, replacement]) => {
      processedText = processedText.replace(new RegExp(diacritic, 'g'), replacement);
    });
  }
  
  return processedText;
}

/**
 * Check if text contains missing characters
 * @param {string} text - Text to check
 * @returns {boolean} - True if text contains missing characters
 */
export function hasMissingCharacters(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  const missingChars = Object.keys(MISSING_CHARACTERS);
  return missingChars.some(char => text.includes(char));
}

/**
 * Get list of missing characters in text
 * @param {string} text - Text to analyze
 * @returns {string[]} - Array of missing characters found
 */
export function getMissingCharacters(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const missingChars = Object.keys(MISSING_CHARACTERS);
  return missingChars.filter(char => text.includes(char));
}

/**
 * Process Quran text for display
 * This is the main function to use for all Quran text rendering
 * @param {string} text - Quran text to process
 * @param {Object} options - Processing options
 * @returns {string} - Processed text ready for display
 */
export function processQuranText(text, options = {}) {
  const {
    removeDiacritics = true,
    preserveOriginal = false
  } = options;
  
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  // If preserving original, only replace wasla, keep other diacritics
  if (preserveOriginal) {
    return text.replace(/\u0671/g, '\u0627'); // Only replace wasla
  }
  
  // Full processing for clean display
  return replaceMissingCharacters(text, removeDiacritics);
}

// Export default function for backward compatibility
export default processQuranText;
