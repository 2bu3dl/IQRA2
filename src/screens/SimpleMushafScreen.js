import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, SafeAreaView, Dimensions, Animated, Image, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import RecordingsModal from '../components/RecordingsModal';
import audioPlayer from '../utils/audioPlayer';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Import page images
import getPageImage from '../assets/mushaf_pages/index';

export default function SimpleMushafScreen({ navigation, route }) {
  const initialPage = route?.params?.pageNumber || 1;
  const [page, setPage] = useState(Math.min(604, Math.max(1, initialPage)));
  const [isHideMode, setIsHideMode] = useState(false);
  const [blockPosition, setBlockPosition] = useState({ x: 0, y: 0 }); // Will be centered by animated values
  const [blockSize, setBlockSize] = useState({ width: screenWidth * 0.8, height: screenHeight * 0.4 }); // Rectangle size
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const [currentScaleX, setCurrentScaleX] = useState(1.0);
  const [currentScaleY, setCurrentScaleY] = useState(1.0);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedStartAyah, setSelectedStartAyah] = useState(1);
  const [selectedEndAyah, setSelectedEndAyah] = useState(7);
  const [showFullSurahRecordingsModal, setShowFullSurahRecordingsModal] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState(null);
  const [isFullSurahPlaying, setIsFullSurahPlaying] = useState(false);
  const [currentPlayingAyahIndex, setCurrentPlayingAyahIndex] = useState(0);
  
  // Zoom state
  const [scale, setScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [lastScale, setLastScale] = useState(1);
  
  // Animated values for smooth movement - start centered
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current; // Start at base position
  const blockWidth = useRef(new Animated.Value(1.0)).current; // Start at full rectangle size
  const blockHeight = useRef(new Animated.Value(1.0)).current; // Start at full rectangle size

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
      // Reset zoom when changing pages
      setScale(1);
      setBaseScale(1);
      setLastScale(1);
    }
  };

  const handleNextPage = () => {
    if (page < 604) {
      setPage(page + 1);
      // Reset zoom when changing pages
      setScale(1);
      setBaseScale(1);
      setLastScale(1);
    }
  };

  const handleHideToggle = () => {
    // Hide button works on all pages including page 1 (Al-Fatiha)
    setIsHideMode(!isHideMode);
  };

  const handleAudioToggle = () => {
    // Always show audio selection modal
    setShowAudioModal(true);
  };

  const handleRecordingToggle = () => {
    // Show full surah recordings modal instead of direct recording
    setShowFullSurahRecordingsModal(true);
  };

  const handleAudioPlay = async () => {
    setShowAudioModal(false);
    setIsAudioMode(true);

    // Page 1 is Al-Fatiha according to Madinah Mushaf standard

    try {
      // Stop any current audio and clear callbacks
      await audioPlayer.stopAudio();
      audioPlayer.setOnEndedCallback(null);
      
      // Reset states
      setIsFullSurahPlaying(false);
      setIsAudioPlaying(false);
      setCurrentPlayingAyah(null);
      setCurrentPlayingAyahIndex(0);

      // For Fatiha (Surah 1), play all ayahs sequentially
      if (selectedSurah === 1) {
        console.log('Starting full Fatiha playback');
        await playFullSurah(1, selectedStartAyah, selectedEndAyah);
      } else {
        // For other surahs, play the selected range
        console.log(`Starting Surah ${selectedSurah} playback from ayah ${selectedStartAyah} to ${selectedEndAyah}`);
        await playFullSurah(selectedSurah, selectedStartAyah, selectedEndAyah);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      Alert.alert('Audio Error', 'Failed to start audio playback.');
    }
  };

  // Play ayah at specific index (like fullscreen mode)
  const playAyahAtIndex = async (surahNumber, startAyah, endAyah, index) => {
    try {
      const ayahNumber = startAyah + index;
      if (ayahNumber > endAyah) {
        // All ayahs completed
        setIsFullSurahPlaying(false);
        setIsAudioPlaying(false);
        setCurrentPlayingAyah(null);
        setCurrentPlayingAyahIndex(0);
        return;
      }

      const audioSource = `https://everyayah.com/data/Alafasy_128kbps/${surahNumber.toString().padStart(3, '0')}${ayahNumber.toString().padStart(3, '0')}.mp3`;
      const metadata = {
        surah: surahNumber,
        ayah: ayahNumber,
        reciter: 'Alafasy'
      };

      console.log(`Playing ayah ${ayahNumber} of Surah ${surahNumber} at index ${index}`);
      setCurrentPlayingAyah(ayahNumber);
      setCurrentPlayingAyahIndex(index);

      const playResult = await audioPlayer.playAudio(audioSource, metadata, `Surah ${surahNumber}`, ayahNumber);
      
      if (playResult) {
        setIsAudioPlaying(true);
        
        // Set up auto-advance to next ayah when current one ends
        audioPlayer.setOnEndedCallback(() => {
          console.log('Audio ended for ayah', ayahNumber, 'at index', index);
          if (index < (endAyah - startAyah)) {
            console.log('Auto-advancing to next ayah');
            playAyahAtIndex(surahNumber, startAyah, endAyah, index + 1);
          } else {
            console.log('Reached end of surah');
            setIsFullSurahPlaying(false);
            setIsAudioPlaying(false);
            setCurrentPlayingAyah(null);
            setCurrentPlayingAyahIndex(0);
          }
        });
      }
    } catch (error) {
      console.error('Error playing ayah at index:', error);
      setIsFullSurahPlaying(false);
      setIsAudioPlaying(false);
      setCurrentPlayingAyah(null);
      setCurrentPlayingAyahIndex(0);
    }
  };

  // Play full surah with sequential ayah playback
  const playFullSurah = async (surahNumber, startAyah, endAyah) => {
    try {
      setIsAudioPlaying(true);
      setIsFullSurahPlaying(true);
      setCurrentPlayingAyahIndex(0);
      
      // Start playing from the first ayah
      await playAyahAtIndex(surahNumber, startAyah, endAyah, 0);
    } catch (error) {
      console.error('Error in full surah playback:', error);
      setIsAudioPlaying(false);
      setIsFullSurahPlaying(false);
      setCurrentPlayingAyah(null);
      setCurrentPlayingAyahIndex(0);
    }
  };

  const handleSearch = () => {
    setShowSearchModal(true);
  };

  const handleSearchQuery = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    // Search for pages, surahs, and ayahs
    const results = [];
    const queryLower = query.toLowerCase().trim();

    // Search by page number
    if (!isNaN(queryLower)) {
      const pageNum = parseInt(queryLower);
      if (pageNum >= 1 && pageNum <= 604) {
        results.push({
          type: 'page',
          title: `Page ${pageNum}`,
          subtitle: `Go to page ${pageNum}`,
          pageNumber: pageNum
        });
      }
    }

    // Search by surah name (common English names + chat/transliterated versions)
    const surahNames = {
      'fatiha': 1, 'al-fatiha': 1, 'opening': 1, 'fati7ah': 1, 'fati7a': 1,
      'baqarah': 2, 'al-baqarah': 2, 'cow': 2, 'baqara': 2, 'baqara7': 2,
      'imran': 3, 'al-imran': 3, 'family of imran': 3, 'imraan': 3, 'imraan7': 3,
      'nisa': 4, 'an-nisa': 4, 'women': 4, 'nisa7': 4, 'nisa7a': 4,
      'maidah': 5, 'al-maidah': 5, 'table': 5, 'maida': 5, 'maida7': 5,
      'anam': 6, 'al-anam': 6, 'cattle': 6, 'anaam': 6, 'anaam7': 6,
      'araf': 7, 'al-araf': 7, 'heights': 7, 'araaf': 7, 'araaf7': 7,
      'anfal': 8, 'al-anfal': 8, 'spoils': 8, 'anfaal': 8, 'anfaal7': 8,
      'taubah': 9, 'at-taubah': 9, 'repentance': 9, 'tawba': 9, 'tawba7': 9,
      'yunus': 10, 'younus': 10, 'jonah': 10, 'younus7': 10,
      'hud': 11, 'hud7': 11,
      'yusuf': 12, 'joseph': 12, 'yusuf7': 12, 'yusuf7a': 12,
      'rad': 13, 'ar-rad': 13, 'thunder': 13, 'raad': 13, 'raad7': 13,
      'ibrahim': 14, 'abraham': 14, 'ibraheem': 14, 'ibraheem7': 14,
      'hijr': 15, 'al-hijr': 15, 'rock': 15, 'hijr7': 15,
      'nahl': 16, 'an-nahl': 16, 'bee': 16, 'nahl7': 16,
      'isra': 17, 'al-isra': 17, 'night journey': 17, 'isra7': 17,
      'kahf': 18, 'al-kahf': 18, 'cave': 18, 'kahf7': 18,
      'maryam': 19, 'mary': 19, 'maryam7': 19, 'maryam7a': 19,
      'ta ha': 20, 'taha': 20, 'ta7a': 20, 'ta7ha': 20,
      'anbiya': 21, 'al-anbiya': 21, 'prophets': 21, 'anbiya7': 21, 'anbiya7a': 21,
      'hajj': 22, 'al-hajj': 22, 'pilgrimage': 22, 'haj': 22, 'haj7': 22,
      'muminun': 23, 'al-muminun': 23, 'believers': 23, 'muminoon': 23, 'muminoon7': 23,
      'nur': 24, 'an-nur': 24, 'light': 24, 'noor': 24, 'noor7': 24,
      'furqan': 25, 'al-furqan': 25, 'criterion': 25, 'furqaan': 25, 'furqaan7': 25,
      'shuara': 26, 'ash-shuara': 26, 'poets': 26, 'shu7ara': 26, 'shu7ara7': 26,
      'naml': 27, 'an-naml': 27, 'ant': 27, 'naml7': 27,
      'qasas': 28, 'al-qasas': 28, 'stories': 28, 'qasas7': 28, 'qasas7a': 28,
      'ankabut': 29, 'al-ankabut': 29, 'spider': 29, 'ankaboot': 29, 'ankaboot7': 29,
      'rum': 30, 'ar-rum': 30, 'romans': 30, 'room': 30, 'room7': 30,
      'luqman': 31, 'lokman': 31, 'luqmaan': 31, 'luqmaan7': 31,
      'sajdah': 32, 'as-sajdah': 32, 'prostration': 32, 'sajda': 32, 'sajda7': 32,
      'ahzab': 33, 'al-ahzab': 33, 'clans': 33, 'ahzaab': 33, 'ahzaab7': 33,
      'saba': 34, 'as-saba': 34, 'sheba': 34, 'saba7': 34, 'saba7a': 34,
      'fatir': 35, 'al-fatir': 35, 'creator': 35, 'fatiir': 35, 'fatiir7': 35,
      'yasin': 36, 'ya-sin': 36, 'yaaseen': 36, 'yaaseen7': 36,
      'saffat': 37, 'as-saffat': 37, 'ranged': 37, 'saffaat': 37, 'saffaat7': 37,
      'sad': 38, 'saad': 38, 'saad7': 38,
      'zumar': 39, 'az-zumar': 39, 'troops': 39, 'zumar7': 39,
      'ghafir': 40, 'al-ghafir': 40, 'forgiver': 40, 'ghaafir': 40, 'ghaafir7': 40,
      'fussilat': 41, 'al-fussilat': 41, 'explained': 41, 'fussilat7': 41, 'fussilat7a': 41,
      'shura': 42, 'ash-shura': 42, 'consultation': 42, 'shoora': 42, 'shoora7': 42,
      'zukhruf': 43, 'az-zukhruf': 43, 'ornaments': 43, 'zukhruf7': 43, 'zukhruf7a': 43,
      'dukhan': 44, 'ad-dukhan': 44, 'smoke': 44, 'dukhaan': 44, 'dukhaan7': 44,
      'jathiyah': 45, 'al-jathiyah': 45, 'kneeling': 45, 'jathiya': 45, 'jathiya7': 45,
      'ahqaf': 46, 'al-ahqaf': 46, 'dunes': 46, 'ahqaf7': 46,
      'muhammad': 47, 'muhammad7': 47, 'muhammad7a': 47,
      'fath': 48, 'al-fath': 48, 'victory': 48, 'fath7': 48,
      'hujurat': 49, 'al-hujurat': 49, 'chambers': 49, 'hujuraat': 49, 'hujuraat7': 49,
      'qaf': 50, 'qaaf': 50, 'qaaf7': 50,
      'dhariyat': 51, 'ad-dhariyat': 51, 'scatterers': 51, 'dhariyaat': 51, 'dhariyaat7': 51,
      'tur': 52, 'at-tur': 52, 'mountain': 52, 'toor': 52, 'toor7': 52,
      'najm': 53, 'an-najm': 53, 'star': 53, 'najm7': 53,
      'qamar': 54, 'al-qamar': 54, 'moon': 54, 'qamar7': 54,
      'rahman': 55, 'ar-rahman': 55, 'beneficent': 55, 'rahmaan': 55, 'rahmaan7': 55,
      'waqiah': 56, 'al-waqiah': 56, 'event': 56, 'waqi7a': 56, 'waqi7a7': 56,
      'hadid': 57, 'al-hadid': 57, 'iron': 57, 'hadeed': 57, 'hadeed7': 57,
      'mujadilah': 58, 'al-mujadilah': 58, 'pleading': 58, 'mujadila': 58, 'mujadila7': 58,
      'hashr': 59, 'al-hashr': 59, 'exile': 59, 'hashr7': 59,
      'mumtahanah': 60, 'al-mumtahanah': 60, 'examined': 60, 'mumtahana': 60, 'mumtahana7': 60,
      'saff': 61, 'as-saff': 61, 'ranks': 61, 'saff7': 61,
      'jumuah': 62, 'al-jumuah': 62, 'friday': 62, 'jumu7a': 62, 'jumu7a7': 62,
      'munafiqun': 63, 'al-munafiqun': 63, 'hypocrites': 63, 'munafiqoon': 63, 'munafiqoon7': 63,
      'taghabun': 64, 'at-taghabun': 64, 'mutual loss': 64, 'taghaboon': 64, 'taghaboon7': 64,
      'talaq': 65, 'at-talaq': 65, 'divorce': 65, 'talaq7': 65,
      'tahrim': 66, 'at-tahrim': 66, 'forbidding': 66, 'tahreem': 66, 'tahreem7': 66,
      'mulk': 67, 'al-mulk': 67, 'sovereignty': 67, 'mulk7': 67,
      'qalam': 68, 'al-qalam': 68, 'pen': 68, 'qalam7': 68,
      'haqqah': 69, 'al-haqqah': 69, 'reality': 69, 'haqqa': 69, 'haqqa7': 69,
      'maarij': 70, 'al-maarij': 70, 'ascending': 70, 'maarij7': 70,
      'nuh': 71, 'noah': 71, 'nuh7': 71,
      'jinn': 72, 'al-jinn': 72, 'jinn7': 72,
      'muzzammil': 73, 'al-muzzammil': 73, 'enwrapped': 73, 'muzzammil7': 73, 'muzzammil7a': 73,
      'muddaththir': 74, 'al-muddaththir': 74, 'cloaked': 74, 'muddaththir7': 74, 'muddaththir7a': 74,
      'qiyamah': 75, 'al-qiyamah': 75, 'resurrection': 75, 'qiyama': 75, 'qiyama7': 75,
      'insan': 76, 'al-insan': 76, 'man': 76, 'insaan': 76, 'insaan7': 76,
      'mursalat': 77, 'al-mursalat': 77, 'emissaries': 77, 'mursalaat': 77, 'mursalaat7': 77,
      'naba': 78, 'an-naba': 78, 'tidings': 78, 'naba7': 78,
      'naziat': 79, 'an-naziat': 79, 'snatchers': 79, 'nazi7aat': 79, 'nazi7aat7': 79,
      'abasa': 80, 'he frowned': 80, 'abasa7': 80,
      'takwir': 81, 'at-takwir': 81, 'folding': 81, 'takweer': 81, 'takweer7': 81,
      'infitar': 82, 'al-infitar': 82, 'cleaving': 82, 'infitaar': 82, 'infitaar7': 82,
      'mutaffifin': 83, 'al-mutaffifin': 83, 'defrauding': 83, 'mutaffifeen': 83, 'mutaffifeen7': 83,
      'inshiqaq': 84, 'al-inshiqaq': 84, 'sundering': 84, 'inshiqaaq': 84, 'inshiqaaq7': 84,
      'buruj': 85, 'al-buruj': 85, 'constellations': 85, 'burooj': 85, 'burooj7': 85,
      'tariq': 86, 'at-tariq': 86, 'nightcomer': 86, 'tareeq': 86, 'tareeq7': 86,
      'ala': 87, 'al-ala': 87, 'most high': 87, 'a7la': 87, 'a7la7': 87,
      'ghashiyah': 88, 'al-ghashiyah': 88, 'overwhelming': 88, 'ghaashiya': 88, 'ghaashiya7': 88,
      'fajr': 89, 'al-fajr': 89, 'dawn': 89, 'fajr7': 89,
      'balad': 90, 'al-balad': 90, 'land': 90, 'balad7': 90,
      'shams': 91, 'ash-shams': 91, 'sun': 91, 'shams7': 91,
      'layl': 92, 'al-layl': 92, 'night': 92, 'layl7': 92,
      'duha': 93, 'ad-duha': 93, 'forenoon': 93, 'duha7': 93,
      'sharh': 94, 'ash-sharh': 94, 'expansion': 94, 'sharh7': 94,
      'tin': 95, 'at-tin': 95, 'fig': 95, 'teen': 95, 'teen7': 95,
      'alaq': 96, 'al-alaq': 96, 'clot': 96, 'alaq7': 96,
      'qadr': 97, 'al-qadr': 97, 'power': 97, 'qadr7': 97,
      'bayyinah': 98, 'al-bayyinah': 98, 'evidence': 98, 'bayyina': 98, 'bayyina7': 98,
      'zalzalah': 99, 'az-zalzalah': 99, 'earthquake': 99, 'zalzala': 99, 'zalzala7': 99,
      'adiyat': 100, 'al-adiyat': 100, 'coursers': 100, 'adiyaat': 100, 'adiyaat7': 100,
      'qariah': 101, 'al-qariah': 101, 'calamity': 101, 'qaari7a': 101, 'qaari7a7': 101,
      'takathur': 102, 'at-takathur': 102, 'rivalry': 102, 'takathoor': 102, 'takathoor7': 102,
      'asr': 103, 'al-asr': 103, 'time': 103, 'asr7': 103,
      'humazah': 104, 'al-humazah': 104, 'slanderer': 104, 'humaza': 104, 'humaza7': 104,
      'fil': 105, 'al-fil': 105, 'elephant': 105, 'feel': 105, 'feel7': 105,
      'quraysh': 106, 'al-quraysh': 106, 'quraish': 106, 'quraish7': 106,
      'maun': 107, 'al-maun': 107, 'assistance': 107, 'ma7oon': 107, 'ma7oon7': 107,
      'kawthar': 108, 'al-kawthar': 108, 'abundance': 108, 'kawthar7': 108,
      'kafirun': 109, 'al-kafirun': 109, 'disbelievers': 109, 'kaafiroon': 109, 'kaafiroon7': 109,
      'nasr': 110, 'an-nasr': 110, 'help': 110, 'nasr7': 110,
      'masad': 111, 'al-masad': 111, 'palm fiber': 111, 'masad7': 111,
      'ikhlas': 112, 'al-ikhlas': 112, 'sincerity': 112, 'ikhlaas': 112, 'ikhlaas7': 112,
      'falaq': 113, 'al-falaq': 113, 'daybreak': 113, 'falaq7': 113,
      'nas': 114, 'an-nas': 114, 'mankind': 114, 'naas': 114, 'naas7': 114
    };

    // Madinah Mushaf page mapping for surahs
    const surahFirstPages = {
      1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
      10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
      18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
      26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
      34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
      42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
      50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
      58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
      66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574,
      74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586,
      82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593,
      90: 594, 91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598,
      98: 598, 99: 599, 100: 600, 101: 600, 102: 601, 103: 601, 104: 601,
      105: 602, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603, 111: 603,
      112: 603, 113: 603, 114: 604
    };
    
    // Surah number to name mapping
    const surahNumberToName = {
      1: 'Al-Fatiha', 2: 'Al-Baqarah', 3: 'Ali Imran', 4: 'An-Nisa', 5: 'Al-Maidah',
      6: 'Al-Anam', 7: 'Al-Araf', 8: 'Al-Anfal', 9: 'At-Taubah', 10: 'Yunus',
      11: 'Hud', 12: 'Yusuf', 13: 'Ar-Rad', 14: 'Ibrahim', 15: 'Al-Hijr',
      16: 'An-Nahl', 17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
      21: 'Al-Anbiya', 22: 'Al-Hajj', 23: 'Al-Muminun', 24: 'An-Nur', 25: 'Al-Furqan',
      26: 'Ash-Shuara', 27: 'An-Naml', 28: 'Al-Qasas', 29: 'Al-Ankabut', 30: 'Ar-Rum',
      31: 'Luqman', 32: 'As-Sajdah', 33: 'Al-Ahzab', 34: 'Saba', 35: 'Fatir',
      36: 'Ya-Sin', 37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir',
      41: 'Fussilat', 42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan', 45: 'Al-Jathiyah',
      46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath', 49: 'Al-Hujurat', 50: 'Qaf',
      51: 'Adh-Dhariyat', 52: 'At-Tur', 53: 'An-Najm', 54: 'Al-Qamar', 55: 'Ar-Rahman',
      56: 'Al-Waqiah', 57: 'Al-Hadid', 58: 'Al-Mujadila', 59: 'Al-Hashr', 60: 'Al-Mumtahanah',
      61: 'As-Saff', 62: 'Al-Jumuah', 63: 'Al-Munafiqun', 64: 'At-Taghabun', 65: 'At-Talaq',
      66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam', 69: 'Al-Haqqah', 70: 'Al-Maarij',
      71: 'Nuh', 72: 'Al-Jinn', 73: 'Al-Muzzammil', 74: 'Al-Muddaththir', 75: 'Al-Qiyamah',
      76: 'Al-Insan', 77: 'Al-Mursalat', 78: 'An-Naba', 79: 'An-Naziat', 80: 'Abasa',
      81: 'At-Takwir', 82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq', 85: 'Al-Buruj',
      86: 'At-Tariq', 87: 'Al-Ala', 88: 'Al-Ghashiyah', 89: 'Al-Fajr', 90: 'Al-Balad',
      91: 'Ash-Shams', 92: 'Al-Layl', 93: 'Ad-Duha', 94: 'Ash-Sharh', 95: 'At-Tin',
      96: 'Al-Alaq', 97: 'Al-Qadr', 98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: 'Al-Adiyat',
      101: 'Al-Qariah', 102: 'At-Takathur', 103: 'Al-Asr', 104: 'Al-Humazah', 105: 'Al-Fil',
      106: 'Quraysh', 107: 'Al-Maun', 108: 'Al-Kawthar', 109: 'Al-Kafirun', 110: 'An-Nasr',
      111: 'Al-Masad', 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas'
    };

    // Track which surahs we've already added to avoid duplicates
    const addedSurahs = new Set();
    
    for (const [name, surahNum] of Object.entries(surahNames)) {
      if ((name.includes(queryLower) || queryLower.includes(name) || 
          (queryLower.length >= 3 && name.startsWith(queryLower)) ||
          (queryLower.length >= 3 && name.includes(queryLower.substring(0, 3)))) &&
          !addedSurahs.has(surahNum)) {
        addedSurahs.add(surahNum);
        const surahName = surahNumberToName[surahNum] || `Surah ${surahNum}`;
        results.push({
          type: 'surah',
          title: `Surah ${surahNum} - ${surahName}`,
          subtitle: `Go to page ${surahFirstPages[surahNum] || 1}`,
          surahNumber: surahNum
        });
      }
    }

    // Search by ayah reference (e.g., "2:255", "surah 2 ayah 255")
    const ayahMatch = queryLower.match(/(\d+):(\d+)|surah\s+(\d+)\s+ayah\s+(\d+)/);
    if (ayahMatch) {
      const surahNum = parseInt(ayahMatch[1] || ayahMatch[3]);
      const ayahNum = parseInt(ayahMatch[2] || ayahMatch[4]);
      if (surahNum >= 1 && surahNum <= 114 && ayahNum >= 1) {
        results.push({
          type: 'ayah',
          title: `${surahNum}:${ayahNum}`,
          subtitle: `Go to Surah ${surahNum}, Ayah ${ayahNum}`,
          surahNumber: surahNum,
          ayahNumber: ayahNum
        });
      }
    }

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  };

  const handleSearchResult = (result) => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    
    if (result.type === 'page') {
      console.log(`Search result: page ${result.pageNumber}`);
      setPage(result.pageNumber);
      // Reset zoom when navigating via search
      setScale(1);
      setBaseScale(1);
      setLastScale(1);
    } else if (result.type === 'surah') {
      // Navigate to first page of surah (Madinah Mushaf standard)
      const surahFirstPages = {
        1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
        10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
        18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
        26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
        34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
        42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
        50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
        58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
        66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570,         72: 572, 73: 574,
        74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586,
        82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593,
        90: 594, 91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598,
        98: 598, 99: 599, 100: 600, 101: 600, 102: 601, 103: 601, 104: 601,
        105: 602, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603, 111: 603,
        112: 603, 113: 603, 114: 604
      };
      const pageNum = surahFirstPages[result.surahNumber] || 1;
      console.log(`Search result: surah ${result.surahNumber} -> page ${pageNum}`);
      setPage(pageNum);
      // Reset zoom when navigating via search
      setScale(1);
      setBaseScale(1);
      setLastScale(1);
    } else if (result.type === 'ayah') {
      // Navigate to approximate page for ayah (Madinah Mushaf standard)
      const surahFirstPages = {
        1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
        10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
        18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
        26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
        34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
        42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
        50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
        58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
        66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570,         72: 572, 73: 574,
        74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586,
        82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593,
        90: 594, 91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598,
        98: 598, 99: 599, 100: 600, 101: 600, 102: 601, 103: 601, 104: 601,
        105: 602, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603, 111: 603,
        112: 603, 113: 603, 114: 604
      };
      const pageNum = surahFirstPages[result.surahNumber] || 1;
      setPage(pageNum);
      // Reset zoom when navigating via search
      setScale(1);
      setBaseScale(1);
      setLastScale(1);
    }
  };

  const handleHome = () => {
    navigation.navigate('Memorization');
  };

  // Handle pinch zoom
  const handlePinch = (event) => {
    console.log('🔥 PINCH DETECTED! Scale:', event.nativeEvent.scale, 'baseScale:', baseScale);
    const newScale = baseScale * event.nativeEvent.scale;
    console.log('🔥 Setting scale to:', newScale);
    setScale(newScale);
  };

  const handlePinchEnd = (event) => {
    console.log('Pinch gesture ended:', event.nativeEvent.scale);
    const newScale = baseScale * event.nativeEvent.scale;
    setBaseScale(newScale);
    setLastScale(newScale);
    
    // Limit zoom range - minimum is 1.0 (default), maximum is 3.0
    const clampedScale = Math.max(1.0, Math.min(3.0, newScale));
    setScale(clampedScale);
    setBaseScale(clampedScale);
    setLastScale(clampedScale);
  };

  // Cleanup audio when component unmounts
  React.useEffect(() => {
    return () => {
      audioPlayer.stopAudio();
      audioPlayer.setOnEndedCallback(null);
    };
  }, []);

  const handleBlockDrag = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    // Use current position plus translation
    const newX = currentTranslateX + translationX;
    const newY = currentTranslateY + translationY;
    translateX.setValue(newX);
    translateY.setValue(newY);
  };

  const handleBlockDragEnd = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    // Update the current position state
    const newX = currentTranslateX + translationX;
    const newY = currentTranslateY + translationY;
    setCurrentTranslateX(newX);
    setCurrentTranslateY(newY);
    
    // Smooth animation to final position
    Animated.spring(translateX, {
      toValue: newX,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    Animated.spring(translateY, {
      toValue: newY,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleResizeDrag = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    // Use current scale plus translation
    const scaleX = Math.max(0.1, Math.min(3.0, currentScaleX + translationX / 300));
    const scaleY = Math.max(0.1, Math.min(3.0, currentScaleY + translationY / 300));
    blockWidth.setValue(scaleX);
    blockHeight.setValue(scaleY);
  };

  const handleResizeDragEnd = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    // Update the current scale state
    const scaleX = Math.max(0.1, Math.min(3.0, currentScaleX + translationX / 300));
    const scaleY = Math.max(0.1, Math.min(3.0, currentScaleY + translationY / 300));
    setCurrentScaleX(scaleX);
    setCurrentScaleY(scaleY);
    
    // Smooth animation to final scale
    Animated.spring(blockWidth, {
      toValue: scaleX,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    Animated.spring(blockHeight, {
      toValue: scaleY,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
            <TouchableOpacity onPress={handleHome} style={styles.homeButton}>
              <Image source={require('../assets/IQRA2iconArabicoctagon.png')} style={styles.homeIcon} />
            </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePreviousPage}
          disabled={page <= 1}
        >
          <Text style={[styles.navButtonText, page <= 1 && styles.disabledButton]}>
            ‹
          </Text>
        </TouchableOpacity>
        
        <View style={styles.pageInfo}>
          <Text style={styles.pageNumber}>Page {page}</Text>
          <Text style={styles.pageTotal}>of 604</Text>
        </View>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextPage}
          disabled={page >= 604}
        >
          <Text style={[styles.navButtonText, page >= 604 && styles.disabledButton]}>
            ›
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Image source={require('../assets/app_icons/search.png')} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      {/* Page image - edge to edge */}
      <PinchGestureHandler
        onGestureEvent={handlePinch}
        onHandlerStateChange={({ nativeEvent }) => {
          console.log('Pinch state change:', nativeEvent.state);
          if (nativeEvent.state === State.END) {
            handlePinchEnd({ nativeEvent });
          }
        }}
        minPointers={2}
        maxPointers={2}
      >
        <View style={styles.imageContainer}>
          <ImageBackground
            source={getPageImage(page)}
            style={[styles.pageImage, { transform: [{ scale }] }]}
            resizeMode="contain"
          >
        {/* Sliding block */}
        {isHideMode && (
            <>
              <Animated.View
                style={[
                  styles.slidingBlock,
                  {
                    left: screenWidth * 0.1, // Center horizontally (10% margin on each side)
                    top: screenHeight * 0.2, // Start from 20% down the screen
                    width: screenWidth * 0.8, // 80% of screen width
                    height: screenHeight * 0.4, // 40% of screen height
                    transformOrigin: 'center',
                    transform: [
                      { translateX: translateX },
                      { translateY: translateY },
                      { scaleX: blockWidth },
                      { scaleY: blockHeight }
                    ]
                  }
                ]}
              >
                {/* Main block area - draggable */}
                <PanGestureHandler
                  onGestureEvent={handleBlockDrag}
                  onHandlerStateChange={({ nativeEvent }) => {
                    if (nativeEvent.state === State.END) {
                      handleBlockDragEnd({ nativeEvent });
                    }
                  }}
                  shouldCancelWhenOutside={false}
                >
                  <Animated.View style={styles.blockContent}>
                    {/* Empty content - no text or drag handle */}
                  </Animated.View>
                </PanGestureHandler>
                
                {/* Resize handle - positioned in corner */}
                <PanGestureHandler
                  onGestureEvent={handleResizeDrag}
                  onHandlerStateChange={({ nativeEvent }) => {
                    if (nativeEvent.state === State.END) {
                      handleResizeDragEnd({ nativeEvent });
                    }
                  }}
                  shouldCancelWhenOutside={false}
                >
                  <View 
                    style={[
                      styles.resizeHandle,
                      {
                        position: 'absolute',
                        right: 8,
                        bottom: 8,
                        width: 60,
                        height: 60,
                      }
                    ]}
                  >
                    <Image
                      source={require('../assets/app_icons/display-frame.png')}
                      style={styles.resizeHandleIcon}
                      resizeMode="contain"
                    />
                  </View>
                </PanGestureHandler>
              </Animated.View>
            </>
          )}
          </ImageBackground>
        </View>
      </PinchGestureHandler>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {isFullSurahPlaying ? (
          // Full surah playing mode - show navigation controls
          <>
            <TouchableOpacity
              style={[
                styles.controlButton,
                currentPlayingAyahIndex === 0 ? styles.controlButtonDisabled : styles.controlButtonActive
              ]}
              onPress={() => {
                // Previous ayah functionality
                if (currentPlayingAyahIndex > 0) {
                  playAyahAtIndex(selectedSurah, selectedStartAyah, selectedEndAyah, currentPlayingAyahIndex - 1);
                }
              }}
              disabled={currentPlayingAyahIndex === 0}
            >
              <Image 
                source={require('../assets/app_icons/continue.png')} 
                style={[
                  styles.controlIcon,
                  { transform: [{ scaleX: -1 }] }, // Flip horizontally for previous
                  currentPlayingAyahIndex === 0 ? { tintColor: '#8b7355' } : { tintColor: '#f4f1e8' }
                ]} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonActive]}
              onPress={() => {
                // Stop full surah playback
                audioPlayer.stopAudio();
                setIsFullSurahPlaying(false);
                setIsAudioPlaying(false);
                setCurrentPlayingAyah(null);
                setCurrentPlayingAyahIndex(0);
              }}
            >
              <View style={styles.stopIcon}>
                <View style={styles.stopIconSquare} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.controlButton,
                currentPlayingAyahIndex >= (selectedEndAyah - selectedStartAyah) ? styles.controlButtonDisabled : styles.controlButtonActive
              ]}
              onPress={() => {
                // Next ayah functionality
                if (currentPlayingAyahIndex < (selectedEndAyah - selectedStartAyah)) {
                  playAyahAtIndex(selectedSurah, selectedStartAyah, selectedEndAyah, currentPlayingAyahIndex + 1);
                }
              }}
              disabled={currentPlayingAyahIndex >= (selectedEndAyah - selectedStartAyah)}
            >
              <Image 
                source={require('../assets/app_icons/continue.png')} 
                style={[
                  styles.controlIcon,
                  currentPlayingAyahIndex >= (selectedEndAyah - selectedStartAyah) ? { tintColor: '#8b7355' } : { tintColor: '#f4f1e8' }
                ]} 
              />
            </TouchableOpacity>
          </>
        ) : (
          // Normal mode - show regular controls
          <>
            <TouchableOpacity
              style={[styles.controlButton, isRecording && styles.controlButtonActive]}
              onPress={handleRecordingToggle}
            >
              <Image 
                source={isRecording ? require('../assets/app_icons/mic-on.png') : require('../assets/app_icons/mic-off.png')} 
                style={styles.controlIcon} 
              />
            </TouchableOpacity>
            
                <TouchableOpacity
                  style={[
                    styles.controlButton, 
                    isHideMode && styles.controlButtonActive
                  ]}
                  onPress={handleHideToggle}
                >
                  <Text style={[
                    styles.controlButtonText, 
                    isHideMode && styles.controlButtonTextActive
                  ]}>Hide</Text>
                </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, isAudioPlaying && styles.controlButtonActive]}
              onPress={handleAudioToggle}
            >
              <Image 
                source={require('../assets/app_icons/audio.png')} 
                style={[
                  styles.controlIcon,
                  isAudioPlaying ? { tintColor: '#f4f1e8' } : { tintColor: '#666666' } // Parchment when playing, dark gray when not
                ]} 
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchModal}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Search Mushaf</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSearchModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by page number or surah name"
                value={searchQuery}
                onChangeText={handleSearchQuery}
                autoFocus={true}
                placeholderTextColor="#8b7355"
              />
            </View>
            
            <ScrollView style={styles.searchResults}>
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleSearchResult(result)}
                >
                  <Text style={styles.searchResultTitle}>{result.title}</Text>
                  <Text style={styles.searchResultSubtitle}>{result.subtitle}</Text>
                </TouchableOpacity>
              ))}
              
              {searchQuery.trim() !== '' && searchResults.length === 0 && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No results found</Text>
                  <Text style={styles.noResultsSubtext}>Try searching for:</Text>
                  <Text style={styles.noResultsSubtext}>• Page number (1-604)</Text>
                  <Text style={styles.noResultsSubtext}>• Surah name (fatiha, baqarah, etc.)</Text>
                  <Text style={styles.noResultsSubtext}>• Ayah reference (2:255)</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Audio Selection Modal */}
      <Modal
        visible={showAudioModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAudioModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.audioModal}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Select Audio Range</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAudioModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.audioSelectionContainer}>
              <View style={styles.audioSelectionRow}>
                <Text style={styles.audioLabel}>Surah:</Text>
                <View style={styles.audioInputContainer}>
                  <TextInput
                    style={styles.audioInput}
                    value={selectedSurah.toString()}
                    onChangeText={(text) => setSelectedSurah(Math.max(1, Math.min(114, parseInt(text) || 1)))}
                    keyboardType="numeric"
                    placeholder="1-114"
                  />
                </View>
              </View>
              
              <View style={styles.audioSelectionRow}>
                <Text style={styles.audioLabel}>Start Ayah:</Text>
                <View style={styles.audioInputContainer}>
                  <TextInput
                    style={styles.audioInput}
                    value={selectedStartAyah.toString()}
                    onChangeText={(text) => setSelectedStartAyah(Math.max(1, parseInt(text) || 1))}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>
              </View>
              
              <View style={styles.audioSelectionRow}>
                <Text style={styles.audioLabel}>End Ayah:</Text>
                <View style={styles.audioInputContainer}>
                  <TextInput
                    style={styles.audioInput}
                    value={selectedEndAyah.toString()}
                    onChangeText={(text) => setSelectedEndAyah(Math.max(selectedStartAyah, parseInt(text) || selectedStartAyah))}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={handleAudioPlay}
              >
                <Text style={styles.playButtonText}>Play Audio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Surah Recordings Modal */}
      <RecordingsModal
        visible={showFullSurahRecordingsModal}
        onClose={() => setShowFullSurahRecordingsModal(false)}
        surahName="Mushaf"
        ayahNumber="full-surah"
        onRecordingChange={() => {
          // Refresh recordings when they change
          console.log('Recordings changed in Mushaf view');
        }}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f1e8', // Parchment background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f4f1e8', // Parchment background
    borderBottomWidth: 1,
    borderBottomColor: '#d4c4a8',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fae29f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 25,
    elevation: 20,
  },
  homeIcon: {
    width: 40, // Larger home icon
    height: 40, // Larger home icon
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5b7f67',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#f4f1e8', // Parchment text
    fontWeight: 'bold',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
  controlIcon: {
    width: 20,
    height: 20,
  },
  disabledButton: {
    opacity: 0.3,
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5b7f67',
  },
  pageTotal: {
    fontSize: 14,
    color: '#8b7355', // Parchment text
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#f4f1e8', // Parchment background
  },
  pageImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  slidingBlock: {
    position: 'absolute',
    backgroundColor: '#5b7f67',
    borderRadius: 16,
    borderWidth: 0, // No outline
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transformOrigin: 'center',
  },
  blockContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resizeHandle: {
    backgroundColor: 'transparent', // No background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Ensure it stays on top
  },
  resizeHandleIcon: {
    width: 48,
    height: 48,
    tintColor: '#999999', // Lighter gray color
  },
  stopIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIconSquare: {
    width: 12,
    height: 12,
    backgroundColor: '#f4f1e8', // Parchment color
    borderRadius: 2,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f4f1e8', // Parchment background
    borderTopWidth: 1,
    borderTopColor: '#d4c4a8',
  },
  controlButton: {
    backgroundColor: '#f4f1e8', // Parchment background
    borderWidth: 2,
    borderColor: '#5b7f67',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  controlButtonActive: {
    backgroundColor: '#5b7f67', // Green when active
  },
  controlButtonText: {
    color: '#5b7f67', // Green text
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controlButtonTextActive: {
    color: '#f4f1e8', // Parchment text when active
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#f4f1e8',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#5b7f67',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d4c4a8',
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5b7f67',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#5b7f67',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#f4f1e8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchInputContainer: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d4c4a8',
    color: '#5b7f67',
  },
  searchResults: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#d4c4a8',
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5b7f67',
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#8b7355',
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5b7f67',
    marginBottom: 10,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#8b7355',
    textAlign: 'center',
    marginBottom: 4,
  },
  audioModal: {
    width: '90%',
    maxHeight: '60%',
    backgroundColor: '#f4f1e8',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#5b7f67',
  },
  audioSelectionContainer: {
    padding: 20,
  },
  audioSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  audioLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5b7f67',
    width: 100,
  },
  audioInputContainer: {
    flex: 1,
    marginLeft: 10,
  },
  audioInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d4c4a8',
    color: '#5b7f67',
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: '#5b7f67',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#f4f1e8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlButtonDisabled: {
    backgroundColor: '#d4c4a8', // Greyed out background
    opacity: 0.5, // Reduced opacity
  },
  controlButtonTextDisabled: {
    color: '#8b7355', // Greyed out text
  },
});