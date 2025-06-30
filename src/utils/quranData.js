import quranRaw from '../assets/quran.json';
import quranTransliterationRaw from '../assets/quran.transliteration.json';

// Surah names mapping (all 114 surahs)
const SURAH_NAMES = {
  1: 'Al-Fati7ah',
  2: 'Al-Baqara',
  3: 'Aali 3imran',
  4: 'An-Nisa2',
  5: 'Al-Ma2ida',
  6: 'Al-An3am',
  7: 'Al-A3raf',
  8: 'Al-Anfal',
  9: 'At-Tawbah',
  10: 'Yunus',
  11: 'Huud',
  12: 'Yusuf',
  13: 'Ar-Ra\'d',
  14: 'Ibraheem',
  15: 'Al-Hijr',
  16: 'An-Na7l',
  17: 'Al-Isra2',
  18: 'Al-Kahf',
  19: 'Maryam',
  20: '6aha',
  21: 'Al-Anbya',
  22: 'Al-Hajj',
  23: 'Al-Mu2minoon',
  24: 'An-Noor',
  25: 'Al-Furqan',
  26: 'Ash-Shu3ara2',
  27: 'An-Naml',
  28: 'Al-Qasas',
  29: 'Al-3ankaboot',
  30: 'Ar-Room',
  31: 'Luqmaan',
  32: 'As-Sajdah',
  33: 'Al-A7zab',
  34: 'Saba',
  35: 'Fa6ir',
  36: 'Yaseen',
  37: 'As-6affat',
  38: '9aad',
  39: 'Az-Zumar',
  40: 'Ghafir',
  41: 'Fu99ilat',
  42: 'Ash-Shura',
  43: 'Az-Zu5ruf',
  44: 'Ad-Dukhan',
  45: 'Al-Jathiyah',
  46: 'Al-Ahqaf',
  47: 'Mu7ammad',
  48: 'Al-Fath',
  49: 'Al-Hujurat',
  50: 'Qaf',
  51: 'Adh-Dhariyat',
  52: 'At-Tur',
  53: 'An-Najm',
  54: 'Al-Qamar',
  55: 'Ar-Rahman',
  56: 'Al-Waqi\'ah',
  57: 'Al-7adeed',
  58: 'Al-Mujadila',
  59: 'Al-7ashr',
  60: 'Al-Mumta7ina',
  61: 'As-9aff',
  62: 'Al-Jum3a',
  63: 'Al-Munafiqoon',
  64: 'At-Taghabun',
  65: 'At-Talaq',
  66: 'At-Ta7reem',
  67: 'Al-Mulk',
  68: 'Al-Qalam',
  69: 'Al-Haqqah',
  70: 'Al-Ma\'arij',
  71: 'Noo7',
  72: 'Al-Jinn',
  73: 'Al-Muzzammil',
  74: 'Al-Muddathir',
  75: 'Al-Qiyamah',
  76: 'Al-Insan',
  77: 'Al-Mursiloon',
  78: 'An-Naba',
  79: 'An-Nazi\'at',
  80: 'Abasa',
  81: 'At-Takwir',
  82: 'Al-Infitar',
  83: 'Al-Mu6affifoon',
  84: 'Al-Inshiqaq',
  85: 'Al-Burooj',
  86: 'At-Tariq',
  87: 'Al-A3la',
  88: 'Al-Ghashiyah',
  89: 'Al-Fajr',
  90: 'Al-Balad',
  91: 'Ash-Shams',
  92: 'Al-Layl',
  93: 'Ad-Du7a',
  94: 'Ash-Shar7',
  95: 'At-Teen',
  96: 'Al-3alaq',
  97: 'Al-Qadr',
  98: 'Al-Bayyinah',
  99: 'Az-Zalzalah',
  100: 'Al-3adiyat',
  101: 'Al-Qari3a',
  102: 'At-Takathur',
  103: 'Al-Asr',
  104: 'Al-Humazah',
  105: 'Al-Feel',
  106: 'Quraysh',
  107: 'Al-Ma3oon',
  108: 'Al-Kawthar',
  109: 'Al-Kafiroon',
  110: 'An-Nasr',
  111: 'Al-Masad',
  112: 'Al-I5las',
  113: 'Al-Falaq',
  114: 'An-Naas',
};

// Build surahMap and translitMap from the JSON arrays
const surahMap = {};
quranRaw.forEach(({ surah, ayah, text }) => {
  const surahNum = parseInt(surah, 10); // Ensure it's a number
  if (!surahMap[surahNum]) surahMap[surahNum] = [];
  surahMap[surahNum].push({ ayah, text });
});

const translitMap = {};
quranTransliterationRaw.forEach(({ surah, ayah, transliteration }) => {
  const surahNum = parseInt(surah, 10); // Ensure it's a number
  if (!translitMap[surahNum]) translitMap[surahNum] = [];
  translitMap[surahNum].push({ ayah, transliteration });
});

export function getSurahAyaat(surahNumber) {
  const surahNum = parseInt(surahNumber, 10); // Ensure it's a number
  return surahMap[surahNum] || [];
}

export function getSurahAyaatWithTransliteration(surahNumber) {
  const surahNum = parseInt(surahNumber, 10); // Ensure it's a number
  const ayaat = surahMap[surahNum] || [];
  const translitAyaat = translitMap[surahNum] || [];
  
  // Merge by ayah number
  const result = ayaat.map((ayahObj, idx) => ({
    ...ayahObj,
    transliteration: translitAyaat[idx]?.transliteration || '',
  }));
  
  return result;
}

export function getAllSurahs() {
  // Returns an array of { surah: surahNumber, name: '<number> <name>', ayaat: [...] }
  return Object.keys(surahMap).map(surah => ({
    surah: Number(surah),
    name: `${surah} ${SURAH_NAMES[surah] || ''}`.trim(),
    ayaat: surahMap[surah]
  }));
} 