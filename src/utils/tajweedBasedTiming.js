// Tajweed-based timing system for Al Kahf
// Analyzes letter count and tajweed rules to create accurate timing

import quranRaw from '../assets/quran.json';

// Get Al Kahf ayahs
const alKahfAyaat = quranRaw.filter(item => item.surah === 18);

// Tajweed analysis function
const analyzeTajweed = (word) => {
  let baseDuration = 0;
  let tajweedMultiplier = 1.0;
  
  // Count actual letters (excluding diacritics)
  const letters = word.replace(/[ًٌٍَُِّْٰ]/g, ''); // Remove harakat, shadda, tanween, maddah
  const letterCount = letters.length;
  
  // Base duration: approximately 0.3 seconds per letter
  baseDuration = letterCount * 0.3;
  
  // Analyze tajweed features
  const shaddaCount = (word.match(/ّ/g) || []).length;
  const maddahCount = (word.match(/ٰ/g) || []).length;
  const tanweenCount = (word.match(/ً|ٍ|ٌ/g) || []).length;
  const sukunCount = (word.match(/ْ/g) || []).length;
  
  // Tajweed adjustments
  if (shaddaCount > 0) {
    tajweedMultiplier += shaddaCount * 0.2; // Shadda doubles the letter duration
  }
  
  if (maddahCount > 0) {
    tajweedMultiplier += maddahCount * 0.4; // Maddah extends the vowel
  }
  
  if (tanweenCount > 0) {
    tajweedMultiplier += tanweenCount * 0.15; // Tanween adds some time
  }
  
  if (sukunCount > 0) {
    tajweedMultiplier += sukunCount * 0.1; // Sukun adds slight pause
  }
  
  // Special word adjustments based on Al-Fatihah patterns
  if (word === 'اللَّهِ' || word === 'لِلَّهِ') {
    tajweedMultiplier = 1.0; // Allah is pronounced carefully but not extended
  }
  
  if (word.includes('الرَّحْمٰنِ') || word.includes('الرَّحِیْمِ')) {
    tajweedMultiplier = 1.3; // These words are extended in recitation
  }
  
  // Apply tajweed multiplier
  const finalDuration = baseDuration * tajweedMultiplier;
  
  return {
    letterCount,
    baseDuration,
    tajweedMultiplier,
    finalDuration,
    features: {
      shadda: shaddaCount,
      maddah: maddahCount,
      tanween: tanweenCount,
      sukun: sukunCount
    }
  };
};

// Create timing based on tajweed analysis
export const createTajweedBasedTiming = (ayahNumber) => {
  const ayahData = alKahfAyaat.find(item => item.ayah === ayahNumber);
  if (!ayahData) return null;
  
  const text = ayahData.text;
  const words = text.split(' ').filter(word => word.trim());
  
  let currentTime = 0;
  const wordsWithTiming = words.map((word, index) => {
    const tajweedAnalysis = analyzeTajweed(word);
    const startTime = currentTime;
    const endTime = currentTime + tajweedAnalysis.finalDuration;
    
    currentTime = endTime;
    
    return {
      text: word,
      startTime: startTime,
      endTime: endTime,
      index: index,
      letterCount: tajweedAnalysis.letterCount,
      tajweedFeatures: tajweedAnalysis.features
    };
  });
  
  return {
    ayah: ayahNumber,
    text: text,
    words: wordsWithTiming,
    totalDuration: currentTime
  };
};

// Create timing for multiple ayahs
export const createBatchTajweedTiming = (startAyah = 1, endAyah = 10) => {
  const batchTiming = {};
  
  for (let ayah = startAyah; ayah <= endAyah; ayah++) {
    const timing = createTajweedBasedTiming(ayah);
    if (timing) {
      batchTiming[ayah] = timing;
    }
  }
  
  return batchTiming;
};

// Function to fine-tune timing based on manual adjustments
export const fineTuneTajweedTiming = (timingData, adjustments) => {
  const adjustedTiming = { ...timingData };
  
  Object.keys(adjustments).forEach(wordIndex => {
    const index = parseInt(wordIndex);
    if (adjustedTiming.words[index]) {
      adjustedTiming.words[index] = {
        ...adjustedTiming.words[index],
        ...adjustments[wordIndex]
      };
    }
  });
  
  // Recalculate total duration
  if (adjustedTiming.words.length > 0) {
    adjustedTiming.totalDuration = adjustedTiming.words[adjustedTiming.words.length - 1].endTime;
  }
  
  return adjustedTiming;
};

// Export function to create all Al Kahf timing data
export const createAllAlKahfTajweedTiming = () => {
  const allTiming = {};
  
  alKahfAyaat.forEach(ayahData => {
    const timing = createTajweedBasedTiming(ayahData.ayah);
    if (timing) {
      allTiming[ayahData.ayah] = timing;
    }
  });
  
  return allTiming;
};

// Test function to compare with Al-Fatihah patterns
export const testTajweedTiming = () => {
  console.log('Testing tajweed timing for Al Kahf ayah 1:');
  const timing = createTajweedBasedTiming(1);
  
  if (timing) {
    timing.words.forEach(word => {
      console.log(`${word.text}: ${word.letterCount} letters, ${(word.endTime - word.startTime).toFixed(2)}s duration`);
    });
  }
  
  return timing;
};

console.log('Tajweed-based timing system ready');
console.log('Sample analysis:', testTajweedTiming());
