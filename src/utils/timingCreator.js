// Tool to help create precise timing data for Al Kahf
// This will help you manually mark the start/end times for each word

import quranRaw from '../assets/quran.json';

// Get Al Kahf ayahs
const alKahfAyaat = quranRaw.filter(item => item.surah === 18);

// Function to create a template for manual timing
export const createTimingTemplate = (ayahNumber) => {
  const ayahData = alKahfAyaat.find(item => item.ayah === ayahNumber);
  if (!ayahData) return null;
  
  const text = ayahData.text;
  const words = text.split(' ').filter(word => word.trim());
  
  const template = {
    ayah: ayahNumber,
    text: text,
    words: words.map((word, index) => ({
      text: word,
      startTime: 0, // You'll need to fill this manually
      endTime: 0,   // You'll need to fill this manually
      index: index
    })),
    totalDuration: 0 // Total duration of the ayah
  };
  
  return template;
};

// Function to validate timing data
export const validateTiming = (timingData) => {
  const errors = [];
  
  if (!timingData.words || timingData.words.length === 0) {
    errors.push('No words found');
    return errors;
  }
  
  let lastEndTime = 0;
  timingData.words.forEach((word, index) => {
    if (word.startTime < lastEndTime) {
      errors.push(`Word ${index + 1} (${word.text}) starts before previous word ends`);
    }
    if (word.endTime <= word.startTime) {
      errors.push(`Word ${index + 1} (${word.text}) end time must be after start time`);
    }
    lastEndTime = word.endTime;
  });
  
  timingData.totalDuration = lastEndTime;
  
  return errors;
};

// Function to export timing data in the correct format
export const exportTimingData = (timingData) => {
  const validated = validateTiming(timingData);
  if (validated.length > 0) {
    console.error('Timing validation errors:', validated);
    return null;
  }
  
  return {
    ayah: timingData.ayah,
    text: timingData.text,
    words: timingData.words,
    totalDuration: timingData.totalDuration
  };
};

// Helper to get all Al Kahf ayahs for reference
export const getAllAlKahfAyaat = () => {
  return alKahfAyaat.map(item => ({
    ayah: item.ayah,
    text: item.text,
    wordCount: item.text.split(' ').filter(word => word.trim()).length
  }));
};

console.log('Al Kahf has', alKahfAyaat.length, 'ayahs');
console.log('First few ayahs:', getAllAlKahfAyaat().slice(0, 5));
