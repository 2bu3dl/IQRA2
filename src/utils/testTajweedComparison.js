// Test file to compare tajweed-based timing with Al-Fatihah patterns

import { createTajweedBasedTiming } from './tajweedBasedTiming';

// Al-Fatihah ayah 1 pattern for comparison
const alFatihahPattern = {
  "بِسْمِ": { letters: 4, duration: 1.2 },
  "ٱللَّهِ": { letters: 5, duration: 1.2 },
  "الرَّحْمٰنِ": { letters: 8, duration: 1.6 },
  "الرَّحِیْمِ": { letters: 8, duration: 1.6 }
};

// Test Al Kahf ayah 1
const testAlKahfAyah1 = () => {
  console.log('=== Testing Al Kahf Ayah 1 Tajweed Timing ===');
  
  const timing = createTajweedBasedTiming(1);
  
  if (timing) {
    console.log('Al Kahf Ayah 1 Text:', timing.text);
    console.log('Total Duration:', timing.totalDuration.toFixed(2), 'seconds');
    console.log('\nWord Analysis:');
    
    timing.words.forEach(word => {
      const duration = word.endTime - word.startTime;
      const letterCount = word.letterCount;
      const features = word.tajweedFeatures;
      
      console.log(`"${word.text}":`);
      console.log(`  Letters: ${letterCount}`);
      console.log(`  Duration: ${duration.toFixed(2)}s`);
      console.log(`  Features: Shadda(${features.shadda}), Maddah(${features.maddah}), Tanween(${features.tanween}), Sukun(${features.sukun})`);
      
      // Compare with Al-Fatihah pattern if similar
      if (alFatihahPattern[word.text]) {
        const fatihahPattern = alFatihahPattern[word.text];
        console.log(`  Al-Fatihah: ${fatihahPattern.letters} letters, ${fatihahPattern.duration}s`);
        console.log(`  Difference: ${Math.abs(duration - fatihahPattern.duration).toFixed(2)}s`);
      }
      console.log('');
    });
  }
  
  return timing;
};

// Test multiple ayahs
const testMultipleAyahs = () => {
  console.log('=== Testing Multiple Al Kahf Ayahs ===');
  
  for (let ayah = 1; ayah <= 5; ayah++) {
    const timing = createTajweedBasedTiming(ayah);
    if (timing) {
      console.log(`Ayah ${ayah}: ${timing.totalDuration.toFixed(2)}s total, ${timing.words.length} words`);
    }
  }
};

// Run tests
console.log('Starting tajweed timing tests...');
testAlKahfAyah1();
testMultipleAyahs();
