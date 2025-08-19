// Test to show the difference between fallback and audio-based timing

import { createSimpleWordTiming } from './simpleWordTiming';

// Test ayah 1 (has audio duration)
const testAyah1 = () => {
  console.log('=== Testing Ayah 1 (with audio duration) ===');
  const timing = createSimpleWordTiming(1);
  if (timing) {
    console.log(`Total duration: ${timing.totalDuration}s`);
    console.log(`Words: ${timing.words.length}`);
    console.log(`Last word ends at: ${timing.words[timing.words.length - 1].endTime}s`);
    console.log('✅ Should highlight to the end');
  }
};

// Test ayah 4 (no audio duration - uses fallback)
const testAyah4 = () => {
  console.log('\n=== Testing Ayah 4 (no audio duration - fallback) ===');
  const timing = createSimpleWordTiming(4);
  if (timing) {
    console.log(`Total duration: ${timing.totalDuration}s`);
    console.log(`Words: ${timing.words.length}`);
    console.log(`Last word ends at: ${timing.words[timing.words.length - 1].endTime}s`);
    console.log('❌ Will stop highlighting prematurely');
    console.log('💡 Need to add audio duration for ayah 4');
  }
};

// Test ayah 10 (no audio duration - uses fallback)
const testAyah10 = () => {
  console.log('\n=== Testing Ayah 10 (no audio duration - fallback) ===');
  const timing = createSimpleWordTiming(10);
  if (timing) {
    console.log(`Total duration: ${timing.totalDuration}s`);
    console.log(`Words: ${timing.words.length}`);
    console.log(`Last word ends at: ${timing.words[timing.words.length - 1].endTime}s`);
    console.log('❌ Will stop highlighting prematurely');
    console.log('💡 Need to add audio duration for ayah 10');
  }
};

// Run tests
console.log('Testing timing differences...');
testAyah1();
testAyah4();
testAyah10();

console.log('\n=== SOLUTION ===');
console.log('To fix premature highlighting:');
console.log('1. Measure audio duration for each ayah');
console.log('2. Use addMeasuredDuration(ayahNumber, duration)');
console.log('3. Example: addMeasuredDuration(4, 12.5)');
