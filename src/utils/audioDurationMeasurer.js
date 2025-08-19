// Tool to help measure audio durations for Al Kahf ayahs
// This will help you get the exact timing for each ayah

import { addAudioDuration } from './simpleWordTiming';

// Function to measure audio duration
export const measureAudioDuration = (ayahNumber) => {
  console.log(`\n=== Measuring Audio Duration for Ayah ${ayahNumber} ===`);
  console.log(`Audio file: 018${ayahNumber.toString().padStart(3, '0')}.mp3`);
  console.log('Steps to measure:');
  console.log('1. Open the audio file in any media player');
  console.log('2. Note the total duration in seconds');
  console.log('3. Use addAudioDuration() function to add it');
  console.log('');
  
  return {
    ayahNumber,
    audioFile: `018${ayahNumber.toString().padStart(3, '0')}.mp3`,
    instructions: 'Measure the total duration and use addAudioDuration()'
  };
};

// Function to add measured duration
export const addMeasuredDuration = (ayahNumber, durationInSeconds) => {
  addAudioDuration(ayahNumber, durationInSeconds);
  console.log(`✅ Added duration for ayah ${ayahNumber}: ${durationInSeconds} seconds`);
  
  // Test the timing
  const { createSimpleWordTiming } = require('./simpleWordTiming');
  const timing = createSimpleWordTiming(ayahNumber);
  
  if (timing) {
    console.log(`📊 Timing created:`);
    console.log(`   Total duration: ${timing.totalDuration}s`);
    console.log(`   Words: ${timing.words.length}`);
    console.log(`   Last word ends at: ${timing.words[timing.words.length - 1].endTime}s`);
  }
};

// Batch measurement helper
export const measureMultipleAyahs = (startAyah, endAyah) => {
  console.log(`\n=== Measuring Ayahs ${startAyah} to ${endAyah} ===`);
  
  for (let ayah = startAyah; ayah <= endAyah; ayah++) {
    measureAudioDuration(ayah);
  }
  
  console.log('\nAfter measuring, use addMeasuredDuration(ayahNumber, duration) for each ayah');
};

// Example usage:
console.log('Audio duration measurer ready');
console.log('Use measureAudioDuration(1) to get instructions for ayah 1');
console.log('Use addMeasuredDuration(1, 15.2) to add the measured duration');
