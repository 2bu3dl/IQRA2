// Test ayah 1 timing to ensure it works correctly

import { createSimpleWordTiming } from './simpleWordTiming';

const testAyah1 = () => {
  console.log('=== Testing Ayah 1 Timing ===');
  
  const timing = createSimpleWordTiming(1);
  
  if (timing) {
    console.log(`Ayah: ${timing.ayah}`);
    console.log(`Text: ${timing.text}`);
    console.log(`Total Duration: ${timing.totalDuration}s`);
    console.log(`Words: ${timing.words.length}`);
    console.log('');
    
    console.log('Word Timing:');
    timing.words.forEach((word, index) => {
      const duration = word.endTime - word.startTime;
      console.log(`${index + 1}. "${word.text}" (${word.letterCount} letters): ${word.startTime.toFixed(2)}s - ${word.endTime.toFixed(2)}s (${duration.toFixed(2)}s)`);
    });
    
    console.log('');
    console.log('✅ Last word ends at:', timing.words[timing.words.length - 1].endTime.toFixed(2), 'seconds');
    console.log('✅ Total duration matches:', timing.totalDuration.toFixed(2), 'seconds');
    
    // Check if timing is correct
    const lastWordEnd = timing.words[timing.words.length - 1].endTime;
    const totalDuration = timing.totalDuration;
    
    if (Math.abs(lastWordEnd - totalDuration) < 0.01) {
      console.log('✅ Timing is correct - highlighting will reach the end!');
    } else {
      console.log('❌ Timing issue detected');
    }
    
  } else {
    console.log('❌ Failed to create timing for ayah 1');
  }
};

// Run the test
testAyah1();
