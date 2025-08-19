// Debug tool to identify timing issues

import { createSimpleWordTiming } from './simpleWordTiming';

const debugAyah1 = () => {
  console.log('=== Debugging Ayah 1 Timing Issue ===');
  
  const timing = createSimpleWordTiming(1);
  
  if (timing) {
    console.log(`Current audio duration: ${timing.totalDuration}s`);
    console.log(`Number of words: ${timing.words.length}`);
    console.log(`Time per word: ${(timing.totalDuration / timing.words.length).toFixed(2)}s`);
    console.log('');
    
    console.log('Word timing breakdown:');
    timing.words.forEach((word, index) => {
      const duration = word.endTime - word.startTime;
      console.log(`${index + 1}. "${word.text}": ${word.startTime.toFixed(2)}s - ${word.endTime.toFixed(2)}s (${duration.toFixed(2)}s)`);
    });
    
    console.log('');
    console.log('=== ANALYSIS ===');
    console.log('If highlighting is too slow, the audio duration might be wrong.');
    console.log('Current duration: 15.2s - this might be too long!');
    console.log('');
    console.log('=== SOLUTION ===');
    console.log('1. Measure the actual audio file duration');
    console.log('2. Use addAudioDuration(1, actualDuration)');
    console.log('3. Example: if audio is 8 seconds, use addAudioDuration(1, 8)');
  }
};

// Test different durations
const testDifferentDurations = () => {
  console.log('\n=== Testing Different Durations ===');
  
  const durations = [8, 10, 12, 15.2];
  
  durations.forEach(duration => {
    console.log(`\n--- Testing ${duration}s duration ---`);
    
    // Temporarily set the duration
    const { addAudioDuration } = require('./simpleWordTiming');
    addAudioDuration(1, duration);
    
    const timing = createSimpleWordTiming(1);
    if (timing) {
      const timePerWord = timing.totalDuration / timing.words.length;
      console.log(`Time per word: ${timePerWord.toFixed(2)}s`);
      console.log(`Last word ends at: ${timing.words[timing.words.length - 1].endTime.toFixed(2)}s`);
    }
  });
};

debugAyah1();
testDifferentDurations();
