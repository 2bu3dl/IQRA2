// Simple word timing system for Al Kahf
// Spaces words evenly across the actual audio duration

import quranRaw from '../assets/quran.json';

// Removed debugging code

// Get Al Kahf ayahs
const alKahfAyaat = quranRaw.filter(item => item.surah === 18);

// Removed debugging analysis

// Audio durations for Al Kahf ayahs (in seconds) — measured via afinfo
const alKahfAudioDurations = {
  1: 7.967375,
  2: 15.072625,
  3: 2.6645,
  4: 4.832667,
  5: 13.348583,
  6: 8.777125,
  7: 8.568167,
  8: 5.877542,
  9: 8.019583,
  10: 11.075917,
  11: 5.511833,
  12: 8.045708,
  13: 11.52,
  14: 15.203292,
  15: 16.796708,
  16: 16.875125,
  17: 24.711833,
  18: 21.969,
  19: 37.590208,
  20: 14.106125,
  21: 27.088958,
  22: 33.906958,
  23: 5.773042,
  24: 13.035125,
  25: 6.4,
  26: 17.97225,
  27: 11.650625,
  28: 22.961625,
  29: 35.160792,
  30: 9.900375,
  31: 28.760833,
  32: 13.348583,
  33: 9.795917,
  34: 10.631833,
  35: 9.769833,
  36: 11.598333,
  37: 12.695542,
  38: 7.549375,
  39: 13.270208,
  40: 13.400833,
  41: 7.601625,
  42: 18.181208,
  43: 8.359208,
  44: 11.728958,
  45: 20.192625,
  46: 11.964083,
  47: 9.351833,
  48: 13.217958,
  49: 25.077583,
  50: 23.928167,
  51: 14.315083,
  52: 12.6955,
  53: 9.978792,
  54: 11.102042,
  55: 18.076708,
  56: 17.711042,
  57: 23.797542,
  58: 17.528167,
  59: 10.083292,
  60: 9.090583,
  61: 8.333083,
  62: 11.206542,
  63: 15.281625,
  64: 7.549375,
  65: 9.926542,
  66: 8.045708,
  67: 4.702042,
  68: 4.911042,
  69: 8.463667,
  70: 8.150208,
  71: 12.773875,
  72: 5.903667,
  73: 7.157542,
  74: 13.505292,
  75: 7.157583,
  76: 10.292208,
  77: 20.088125,
  78: 10.657958,
  79: 15.2555,
  80: 9.717542,
  81: 8.228583,
  82: 33.33225,
  83: 6.635083,
  84: 7.94125,
  85: 2.324875,
  86: 18.599208,
  87: 11.023667,
  88: 12.721625,
  89: 2.638375,
  90: 10.710208,
  91: 4.911042,
  92: 2.586125,
  93: 9.299583,
  94: 14.497958,
  95: 11.964083,
  96: 16.849,
  97: 6.530583,
  98: 18.390208,
  99: 11.284917,
  100: 6.530625,
  101: 10.448958,
  102: 15.333917,
  103: 4.545292,
  104: 11.598375,
  105: 18.207333,
  106: 9.717583,
  107: 10.631833,
  108: 5.720792,
  109: 17.00575,
  110: 31.033458,
};

// Audio durations for Al-Alaq ayahs (in seconds) — measured via afinfo
const alAlaqAudioDurations = {
  1: 14.8375,
  2: 6.426167,
  3: 5.6425,
  4: 6.661167,
  5: 7.889,
  6: 8.751,
  7: 5.511833,
  8: 7.183667,
  9: 6.112667,
  10: 6.138833,
  11: 7.235833,
  12: 5.067833,
  13: 7.627667,
  14: 7.497167,
  15: 11.885667,
  16: 6.818,
  17: 3.866167,
  18: 4.127333,
  19: 9.195167,
};

// Get audio duration for an ayah
const getAlKahfAudioDuration = (ayahNumber) => {
  return alKahfAudioDurations[ayahNumber] || null;
};

// Get audio duration for Al-Alaq ayah
const getAlAlaqAudioDuration = (ayahNumber) => {
  return alAlaqAudioDurations[ayahNumber] || null;
};

// Create simple word timing based on letter count for Al-Kahf
export const createSimpleWordTiming = (ayahNumber) => {
  const ayahData = alKahfAyaat.find(item => item.ayah === ayahNumber);
  if (!ayahData) {
    return null;
  }
  
  const text = ayahData.text;
  const words = text.split(' ').filter(word => word.trim());
  
  // Get target audio duration
  const targetDuration = getAlKahfAudioDuration(ayahNumber);
  
  if (!targetDuration) {
    console.warn(`No audio duration found for ayah ${ayahNumber}. Please add it using addAudioDuration(${ayahNumber}, duration)`);
    return null;
  }
  
  // Calculate letter count for each word
  const wordsWithLetterCount = words.map(word => {
    const letters = word.replace(/[ًٌٍَُِّْٰ]/g, ''); // Remove diacritics
    return {
      text: word,
      letterCount: letters.length
    };
  });
  
  // Create fast, even timing that matches audio duration exactly
  const wordDuration = targetDuration / words.length;
  let currentTime = 0;
  
  const wordsWithTiming = wordsWithLetterCount.map((word, index) => {
    const startTime = currentTime;
    const endTime = currentTime + wordDuration;
    currentTime = endTime;
    
    return {
      text: word.text,
      startTime: startTime,
      endTime: endTime,
      index: index,
      letterCount: word.letterCount
    };
  });
  
  // Ensure the last word ends exactly at target duration
  if (wordsWithTiming.length > 0) {
    const lastWord = wordsWithTiming[wordsWithTiming.length - 1];
    lastWord.endTime = targetDuration;
    
    // Also ensure all words are properly spaced
    for (let i = 0; i < wordsWithTiming.length - 1; i++) {
      const currentWord = wordsWithTiming[i];
      const nextWord = wordsWithTiming[i + 1];
      currentWord.endTime = nextWord.startTime;
    }
  }
  
  return {
    ayah: ayahNumber,
    text: text,
    words: wordsWithTiming,
    totalDuration: targetDuration
  };
};

// Create simple word timing for Al-Alaq
export const createAlAlaqWordTiming = (ayahNumber) => {
  const quranData = require('../assets/quran.json');
  const ayahData = quranData.find(item => item.surah === 96 && item.ayah === ayahNumber);
  if (!ayahData) return null;
  
  const text = ayahData.text;
  const words = text.split(' ').filter(word => word.trim());
  
  // Get target audio duration
  const targetDuration = getAlAlaqAudioDuration(ayahNumber);
  
  if (!targetDuration) {
    console.warn(`No audio duration found for Al-Alaq ayah ${ayahNumber}`);
    return null;
  }
  
  // Special handling for first ayah - first word gets 8 seconds
  if (ayahNumber === 1) {
    const firstWordDuration = 9.0;
    const remainingDuration = targetDuration - firstWordDuration;
    const remainingWords = words.length - 1;
    const remainingWordDuration = remainingWords > 0 ? remainingDuration / remainingWords : 0;
    
    let currentTime = 0;
    
    const wordsWithTiming = words.map((word, index) => {
      let startTime, endTime;
      
      if (index === 0) {
        // First word gets 7 seconds
        startTime = 0;
        endTime = firstWordDuration;
      } else {
        // Remaining words share the remaining time evenly
        startTime = firstWordDuration + ((index - 1) * remainingWordDuration);
        endTime = firstWordDuration + (index * remainingWordDuration);
      }
      
      currentTime = endTime;
      
      return {
        text: word,
        startTime: startTime,
        endTime: endTime,
        index: index
      };
    });
    
    // Ensure the last word ends exactly at target duration
    if (wordsWithTiming.length > 0) {
      const lastWord = wordsWithTiming[wordsWithTiming.length - 1];
      lastWord.endTime = targetDuration;
      
      // Also ensure all words are properly spaced
      for (let i = 0; i < wordsWithTiming.length - 1; i++) {
        const currentWord = wordsWithTiming[i];
        const nextWord = wordsWithTiming[i + 1];
        currentWord.endTime = nextWord.startTime;
      }
    }
    
    return {
      ayah: ayahNumber,
      text: text,
      words: wordsWithTiming,
      totalDuration: targetDuration
    };
  }
  
  // Regular timing for other ayahs
  const wordDuration = targetDuration / words.length;
  let currentTime = 0;
  
  const wordsWithTiming = words.map((word, index) => {
    const startTime = currentTime;
    const endTime = currentTime + wordDuration;
    currentTime = endTime;
    
    return {
      text: word,
      startTime: startTime,
      endTime: endTime,
      index: index
    };
  });
  
  // Ensure the last word ends exactly at target duration
  if (wordsWithTiming.length > 0) {
    const lastWord = wordsWithTiming[wordsWithTiming.length - 1];
    lastWord.endTime = targetDuration;
    
    // Also ensure all words are properly spaced
    for (let i = 0; i < wordsWithTiming.length - 1; i++) {
      const currentWord = wordsWithTiming[i];
      const nextWord = wordsWithTiming[i + 1];
      currentWord.endTime = nextWord.startTime;
    }
  }
  
  return {
    ayah: ayahNumber,
    text: text,
    words: wordsWithTiming,
    totalDuration: targetDuration
  };
};

// Function to add audio duration for an ayah
export const addAudioDuration = (ayahNumber, duration) => {
  alKahfAudioDurations[ayahNumber] = duration;
};

// Export function to create all Al Kahf timing data
export const createAllAlKahfSimpleTiming = () => {
  const allTiming = {};
  
  alKahfAyaat.forEach(ayahData => {
    const timing = createSimpleWordTiming(ayahData.ayah);
    if (timing) {
      allTiming[ayahData.ayah] = timing;
    }
  });
  
  return allTiming;
};


