// Improved timing estimator for Al Kahf
// Uses linguistic analysis to create more accurate timing estimates

import quranRaw from '../assets/quran.json';

// Get Al Kahf ayahs
const alKahfAyaat = quranRaw.filter(item => item.surah === 18);

// Linguistic analysis for better timing estimation
const analyzeWordComplexity = (word) => {
  let complexity = 0;
  
  // Count different types of characters
  const shaddaCount = (word.match(/ّ/g) || []).length;
  const sukunCount = (word.match(/ْ/g) || []).length;
  const fathaCount = (word.match(/َ/g) || []).length;
  const kasraCount = (word.match(/ِ/g) || []).length;
  const dammaCount = (word.match(/ُ/g) || []).length;
  const tanweenCount = (word.match(/ً|ٍ|ٌ/g) || []).length;
  const maddahCount = (word.match(/ٰ/g) || []).length;
  
  // Base duration based on word length
  let baseDuration = 0.8;
  
  // Adjust for word length
  if (word.length <= 2) baseDuration = 0.6;
  else if (word.length <= 4) baseDuration = 0.8;
  else if (word.length <= 6) baseDuration = 1.0;
  else if (word.length <= 8) baseDuration = 1.2;
  else baseDuration = 1.5;
  
  // Adjust for linguistic complexity
  complexity += shaddaCount * 0.4;    // Shadda adds significant time
  complexity += sukunCount * 0.2;     // Sukun adds some time
  complexity += (fathaCount + kasraCount + dammaCount) * 0.1; // Harakat add time
  complexity += tanweenCount * 0.3;   // Tanween adds time
  complexity += maddahCount * 0.5;    // Maddah adds significant time
  
  // Special cases for common words
  if (word === 'اللَّهِ') complexity += 0.3; // Allah is pronounced slowly
  if (word === 'إِنَّ') complexity += 0.2;   // Inna is pronounced carefully
  if (word === 'أَنَّ') complexity += 0.2;   // Anna is pronounced carefully
  
  return baseDuration + complexity;
};

// Create improved timing estimation
export const createImprovedTiming = (ayahNumber) => {
  const ayahData = alKahfAyaat.find(item => item.ayah === ayahNumber);
  if (!ayahData) return null;
  
  const text = ayahData.text;
  const words = text.split(' ').filter(word => word.trim());
  
  let currentTime = 0;
  const wordsWithTiming = words.map((word, index) => {
    const duration = analyzeWordComplexity(word);
    const startTime = currentTime;
    const endTime = currentTime + duration;
    
    currentTime = endTime;
    
    return {
      text: word,
      startTime: startTime,
      endTime: endTime,
      index: index,
      estimatedDuration: duration
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
export const createBatchImprovedTiming = (startAyah = 1, endAyah = 10) => {
  const batchTiming = {};
  
  for (let ayah = startAyah; ayah <= endAyah; ayah++) {
    const timing = createImprovedTiming(ayah);
    if (timing) {
      batchTiming[ayah] = timing;
    }
  }
  
  return batchTiming;
};

// Function to fine-tune timing based on manual adjustments
export const fineTuneTiming = (timingData, adjustments) => {
  // adjustments should be an object like: { wordIndex: { startTime: 1.2, endTime: 2.1 } }
  
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
export const createAllAlKahfTiming = () => {
  const allTiming = {};
  
  alKahfAyaat.forEach(ayahData => {
    const timing = createImprovedTiming(ayahData.ayah);
    if (timing) {
      allTiming[ayahData.ayah] = timing;
    }
  });
  
  return allTiming;
};

console.log('Improved timing estimator ready');
console.log('Sample timing for ayah 1:', createImprovedTiming(1));
