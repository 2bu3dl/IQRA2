/**
 * Test utility for Arabic text normalization
 * Specifically tests the wasla fix for Surah Ash-Sharh ayah 7
 */

import { 
  normalizeArabicText, 
  fixWaslaRendering, 
  advancedArabicNormalizer,
  testArabicNormalization 
} from './arabicTextFixer';

// Test cases for Arabic text normalization
export const testCases = {
  // The specific problematic case from Surah Ash-Sharh ayah 7
  surah94Ayah7: {
    original: 'فَإِذَا فَرَغْتَ فَٱنصَبْ',
    description: 'Surah Ash-Sharh ayah 7 - wasla separation issue'
  },
  
  // Other test cases with wasla
  waslaTests: [
    {
      original: 'فَٱنصَبْ',
      description: 'Word with wasla that should connect properly'
    },
    {
      original: 'وَٱلصَّلَاةِ',
      description: 'Word starting with wasla'
    },
    {
      original: 'بِٱسْمِ',
      description: 'Word with wasla after preposition'
    }
  ],
  
  // General Arabic text tests
  generalTests: [
    {
      original: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
      description: 'Bismillah with wasla'
    },
    {
      original: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ',
      description: 'Al-Fatihah ayah 2 with wasla'
    }
  ]
};

/**
 * Run all Arabic text normalization tests
 */
export const runAllTests = () => {
  console.log('=== ARABIC TEXT NORMALIZATION TESTS ===');
  
  // Test Surah Ash-Sharh ayah 7 specifically
  console.log('\n--- Surah Ash-Sharh Ayah 7 Test ---');
  const surah94Test = testArabicNormalization(testCases.surah94Ayah7.original);
  console.log('Original:', surah94Test.original);
  console.log('Normalized:', surah94Test.normalized);
  console.log('Wasla Fixed:', surah94Test.waslaFixed);
  console.log('Advanced:', surah94Test.advanced);
  console.log('Has Wasla:', surah94Test.hasWasla);
  
  // Test wasla cases
  console.log('\n--- Wasla Tests ---');
  testCases.waslaTests.forEach((test, index) => {
    console.log(`\nTest ${index + 1}: ${test.description}`);
    const result = testArabicNormalization(test.original);
    console.log('Original:', result.original);
    console.log('Wasla Fixed:', result.waslaFixed);
    console.log('Advanced:', result.advanced);
  });
  
  // Test general cases
  console.log('\n--- General Tests ---');
  testCases.generalTests.forEach((test, index) => {
    console.log(`\nTest ${index + 1}: ${test.description}`);
    const result = testArabicNormalization(test.original);
    console.log('Original:', result.original);
    console.log('Advanced:', result.advanced);
  });
  
  console.log('\n=== END TESTS ===');
};

/**
 * Test the specific fix for Surah Ash-Sharh ayah 7
 */
export const testSurah94Ayah7Fix = () => {
  const originalText = testCases.surah94Ayah7.original;
  
  console.log('=== SURAH ASH-SHARH AYAH 7 FIX TEST ===');
  console.log('Original text:', originalText);
  
  // Test different normalization approaches
  const basicNormalized = normalizeArabicText(originalText);
  const waslaFixed = fixWaslaRendering(originalText);
  const advancedNormalized = advancedArabicNormalizer(originalText);
  
  console.log('Basic normalized:', basicNormalized);
  console.log('Wasla fixed:', waslaFixed);
  console.log('Advanced normalized:', advancedNormalized);
  
  // Check if wasla is present
  const hasWasla = originalText.includes('\u0671');
  console.log('Contains wasla (ٱ):', hasWasla);
  
  // Check if fix was applied
  const waslaReplaced = waslaFixed.includes('\u0627') && !waslaFixed.includes('\u0671');
  console.log('Wasla replaced with alif:', waslaReplaced);
  
  console.log('=== END SURAH 94 AYAH 7 TEST ===');
  
  return {
    original: originalText,
    basicNormalized,
    waslaFixed,
    advancedNormalized,
    hasWasla,
    waslaReplaced
  };
};

/**
 * Performance test for Arabic normalization
 */
export const performanceTest = (iterations = 1000) => {
  const testText = testCases.surah94Ayah7.original;
  
  console.log(`=== PERFORMANCE TEST (${iterations} iterations) ===`);
  
  // Test basic normalization
  const startBasic = Date.now();
  for (let i = 0; i < iterations; i++) {
    normalizeArabicText(testText);
  }
  const endBasic = Date.now();
  const basicTime = endBasic - startBasic;
  
  // Test wasla fix
  const startWasla = Date.now();
  for (let i = 0; i < iterations; i++) {
    fixWaslaRendering(testText);
  }
  const endWasla = Date.now();
  const waslaTime = endWasla - startWasla;
  
  // Test advanced normalization
  const startAdvanced = Date.now();
  for (let i = 0; i < iterations; i++) {
    advancedArabicNormalizer(testText);
  }
  const endAdvanced = Date.now();
  const advancedTime = endAdvanced - startAdvanced;
  
  console.log(`Basic normalization: ${basicTime}ms (${(basicTime/iterations).toFixed(3)}ms per call)`);
  console.log(`Wasla fix: ${waslaTime}ms (${(waslaTime/iterations).toFixed(3)}ms per call)`);
  console.log(`Advanced normalization: ${advancedTime}ms (${(advancedTime/iterations).toFixed(3)}ms per call)`);
  
  console.log('=== END PERFORMANCE TEST ===');
  
  return {
    basicTime,
    waslaTime,
    advancedTime,
    iterations
  };
};

export default {
  testCases,
  runAllTests,
  testSurah94Ayah7Fix,
  performanceTest
};
