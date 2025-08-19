import { normalizeArabicText } from './arabicTextFixer';

// Fix audio metadata to match Quran data exactly
export const fixAllAudioMetadata = () => {
  console.log('=== FIXING ALL AUDIO METADATA ===');
  
  // Import the metadata
  const { alFatihahMetadata } = require('./audioMetadata');
  
  // Create fixed metadata
  const fixedAlFatihahMetadata = {
    ...alFatihahMetadata,
    ayaat: {}
  };
  
  // Fix each ayah
  Object.keys(alFatihahMetadata.ayaat).forEach(ayahKey => {
    const ayah = alFatihahMetadata.ayaat[ayahKey];
    const fixedText = normalizeArabicText(ayah.text);
    
    console.log(`Fixing Ayah ${ayah.ayah}:`);
    console.log(`  Original: "${ayah.text}"`);
    console.log(`  Fixed:    "${fixedText}"`);
    
    fixedAlFatihahMetadata.ayaat[ayahKey] = {
      ...ayah,
      text: fixedText,
      words: ayah.words.map(word => ({
        ...word,
        text: normalizeArabicText(word.text)
      }))
    };
  });
  
  console.log('=== END FIXING AUDIO METADATA ===');
  return fixedAlFatihahMetadata;
};

// Export the fixed metadata
export const getFixedAlFatihahMetadata = () => {
  const { alFatihahMetadata } = require('./audioMetadata');
  
  const fixedMetadata = {
    ...alFatihahMetadata,
    ayaat: {}
  };
  
  // Fix each ayah
  Object.keys(alFatihahMetadata.ayaat).forEach(ayahKey => {
    const ayah = alFatihahMetadata.ayaat[ayahKey];
    const fixedText = normalizeArabicText(ayah.text);
    
    fixedMetadata.ayaat[ayahKey] = {
      ...ayah,
      text: fixedText,
      words: ayah.words.map(word => ({
        ...word,
        text: normalizeArabicText(word.text)
      }))
    };
  });
  
  return fixedMetadata;
};
