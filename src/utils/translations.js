import { getAllSurahs } from './quranData';

// Import the generated JSON files
import yusufali from '../assets/translations/en.yusufali.json';
import sahih from '../assets/translations/en.sahih.json';
import maududi from '../assets/translations/en.maududi.json';
import hilali from '../assets/translations/en.hilali.json';

// Translation sources
const TRANSLATION_SOURCES = {
  yusufali: 'Yusuf Ali',
  sahih: 'Sahih International',
  maududi: 'Maududi',
  hilali: 'Hilali & Khan'
};

// Map source to imported JSON
const TRANSLATION_DATA = {
  yusufali,
  sahih,
  maududi,
  hilali,
};

// Cache for loaded translations
let translationCache = {};

// Load a specific translation file
export const loadTranslation = async (source) => {
  if (translationCache[source]) {
    return translationCache[source];
  }
  try {
    const translations = TRANSLATION_DATA[source] || {};
    translationCache[source] = translations;
    return translations;
  } catch (error) {
    console.error(`Error loading translation ${source}:`, error);
    return {};
  }
};

// Get translation for a specific ayah
export const getTranslation = (source, surah, ayah) => {
  const translations = translationCache[source] || TRANSLATION_DATA[source];
  // Debug log
  console.log('getTranslation', { source, surah, ayah, translations: !!translations, surahKeys: translations ? Object.keys(translations) : [] });
  if (
    translations &&
    translations[String(surah)] &&
    translations[String(surah)][String(ayah)]
  ) {
    return translations[String(surah)][String(ayah)];
  }
  return null;
};

// Get all available translation sources
export const getTranslationSources = () => {
  return TRANSLATION_SOURCES;
};

// Load all translations
export const loadAllTranslations = async () => {
  const sources = Object.keys(TRANSLATION_SOURCES);
  sources.forEach(source => loadTranslation(source));
};

// Get translation for current ayah with fallback
export const getCurrentTranslation = (source, currentSurah, currentAyah) => {
  const translation = getTranslation(source, currentSurah, currentAyah);
  if (translation) {
    return translation;
  }
  // Fallback to first available translation
  const sources = Object.keys(TRANSLATION_SOURCES);
  for (const fallbackSource of sources) {
    const fallbackTranslation = getTranslation(fallbackSource, currentSurah, currentAyah);
    if (fallbackTranslation) {
      return fallbackTranslation;
    }
  }
  return 'Translation not available';
}; 