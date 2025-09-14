import React, { useState, useRef, memo, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Animated, Image, ScrollView, TextInput, ImageBackground, TouchableWithoutFeedback, Alert, Pressable, Easing, Platform } from 'react-native';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import { 
  getResponsiveArabicFontSize, 
  getResponsiveWordWidth, 
  getResponsiveFontSize,
  getResponsiveSpacing,
  RESPONSIVE_FONT_SIZES
} from '../utils/responsive';
import Text from '../components/Text';
import Button from '../components/Button';
import CardOrig from '../components/Card';
import ProgressBarOrig from '../components/ProgressBar';
import TranslationModal from '../components/TranslationModal';
import StreakAnimation from '../components/StreakAnimation';
import AnimatedRewardModal from '../components/AnimatedRewardModal';
import BookmarkModal from '../components/BookmarkModal';
import RecordingsModal from '../components/RecordingsModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { addHasanat, updateMemorizedAyahs, updateStreak, getCurrentStreak, loadData, saveCurrentPosition, saveLastPosition, toggleBookmark, isBookmarked, isAyahInAnyList } from '../utils/store';
import { getSurahAyaatWithTransliteration, getAllSurahs, getSurahName } from '../utils/quranData';
import { getCurrentTranslation, getTranslationSources, getTranslation } from '../utils/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../utils/languageContext';
import audioPlayer from '../utils/audioPlayer';
import audioRecorder from '../utils/audioRecorder';
import { testRecordingSetup, testAudioSetup } from '../utils/recordingTest';
import { testNativeModule } from '../utils/testNativeModule';
import telemetryService from '../utils/telemetry';
import { triggerHaptic, hapticSelection, hapticImpactMedium } from '../utils/hapticFeedback';
import Slider from '@react-native-community/slider';
import Svg, { Polygon } from 'react-native-svg';
import HighlightedArabicText from '../components/HighlightedArabicText';
// Removed debugging imports
// Removed unused import since we're using exact source text
import { getAyahMetadata, getSpecialCardMetadata } from '../utils/audioMetadata';

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const Card = memo(CardOrig);
const ProgressBar = memo(ProgressBarOrig);

const MemorizationScreen = ({ route, navigation }) => {
  const { language, t } = useLanguage();

  // Removed debugging initialization
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };
  const { surah, resumeFromIndex, targetAyah } = route.params || {};
  const surahNumber = surah?.id || surah?.surah || 1;
  
  // Create a consistent surah name for all operations
  // Use the original surah names that match the storage keys in SurahListScreen
  const getOriginalSurahName = (surahId) => {
    const originalNames = {
      1: 'Al-Fatihah',
      2: 'Al-Baqarah',
      3: 'Al-Imran',
      4: 'An-Nisa',
      5: 'Al-Ma\'idah',
      6: 'Al-An\'am',
      7: 'Al-A\'raf',
      8: 'Al-Anfal',
      9: 'At-Tawbah',
      10: 'Yunus',
      11: 'Hud',
      12: 'Yusuf',
      13: 'Ar-Ra\'d',
      14: 'Ibrahim',
      15: 'Al-Hijr',
      16: 'An-Nahl',
      17: 'Al-Isra',
      18: 'AlKahf_Sudais',
      19: 'Maryam',
      20: 'Ta-Ha',
      21: 'Al-Anbya',
      22: 'Al-Hajj',
      23: 'Al-Mu\'minun',
      24: 'An-Nur',
      25: 'Al-Furqan',
      26: 'Ash-Shu\'ara',
      27: 'An-Naml',
      28: 'Al-Qasas',
      29: 'Al-Ankabut',
      30: 'Ar-Rum',
      31: 'Luqman',
      32: 'As-Sajdah',
      33: 'Al-Ahzab',
      34: 'Saba',
      35: 'Fatir',
      36: 'Ya-Sin',
      37: 'As-Saffat',
      38: 'Sad',
      39: 'Az-Zumar',
      40: 'Ghafir',
      41: 'Fussilat',
      42: 'Ash-Shura',
      43: 'Az-Zukhruf',
      44: 'Ad-Dukhan',
      45: 'Al-Jathiyah',
      46: 'Al-Ahqaf',
      47: 'Muhammad',
      48: 'Al-Fath',
      49: 'Al-Hujurat',
      50: 'Qaf',
      51: 'Adh-Dhariyat',
      52: 'At-Tur',
      53: 'An-Najm',
      54: 'Al-Qamar',
      55: 'Ar-Rahman',
      56: 'Al-Waqi\'ah',
      57: 'Al-Hadid',
      58: 'Al-Mujadila',
      59: 'Al-Hashr',
      60: 'Al-Mumtahanah',
      61: 'As-Saf',
      62: 'Al-Jumu\'ah',
      63: 'Al-Munafiqun',
      64: 'At-Taghabun',
      65: 'At-Talaq',
      66: 'At-Tahrim',
      67: 'Al-Mulk',
      68: 'Al-Qalam',
      69: 'Al-Haqqah',
      70: 'Al-Ma\'arij',
      71: 'Nuh',
      72: 'Al-Jinn',
      73: 'Al-Muzzammil',
      74: 'Al-Muddathir',
      75: 'Al-Qiyamah',
      76: 'Al-Insan',
      77: 'Al-Mursalat',
      78: 'An-Naba',
      79: 'An-Nazi\'at',
      80: 'Abasa',
      81: 'At-Takwir',
      82: 'Al-Infitar',
      83: 'Al-Mutaffifin',
      84: 'Al-Inshiqaq',
      85: 'Al-Buruj',
      86: 'At-Tariq',
      87: 'Al-A\'la',
      88: 'Al-Ghashiyah',
      89: 'Al-Fajr',
      90: 'Al-Balad',
      91: 'Ash-Shams',
      92: 'Al-Layl',
      93: 'Ad-Duha',
      94: 'Ash-Sharh',
      95: 'At-Tin',
      96: 'Al-Alaq',
      97: 'Al-Qadr',
      98: 'Al-Bayyinah',
      99: 'Az-Zalzalah',
      100: 'Al-Adiyat',
      101: 'Al-Qari\'ah',
      102: 'At-Takathur',
      103: 'Al-Asr',
      104: 'Al-Humazah',
      105: 'Al-Fil',
      106: 'Quraish',
      107: 'Al-Ma\'un',
      108: 'Al-Kawthar',
      109: 'Al-Kafirun',
      110: 'An-Nasr',
      111: 'Al-Masad',
      112: 'Al-Ikhlas',
      113: 'Al-Falaq',
      114: 'An-Nas',
    };
    return originalNames[surahId] || 'Al-Fatihah';
  };
  
  // Try multiple naming conventions to ensure compatibility
  const surahName = getOriginalSurahName(surahNumber);
  
  // Also try to get the name from the surah object if available
  const alternativeSurahName = surah?.name || 'Al-Fatihah';
  
  // Debug logging for surah name consistency
  console.log('[MemorizationScreen] Surah data:', {
    surahId: surah?.id,
    surahNumber: surahNumber,
    surahName: surahName,
    alternativeSurahName: alternativeSurahName,
    originalName: surah?.name,
    mappedName: getOriginalSurahName(surahNumber)
  });




  
  const [ayaat, setAyaat] = useState([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isTextHidden, setIsTextHidden] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [showGoToModal, setShowGoToModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [modalAyahIndex, setModalAyahIndex] = useState(null);
  const sessionHasanat = useRef(0);
  const rewardTimeout = useRef(null);
  const isResuming = useRef(false);
  const flashcardsLoaded = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ayahListRef = useRef(null);
  const fullscreenScrollViewRef = useRef(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [newStreak, setNewStreak] = useState(0);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [isFullSurahCompletion, setIsFullSurahCompletion] = useState(false);
  const [showFullSurahReward, setShowFullSurahReward] = useState(false);
  const [fullSurahHasanat, setFullSurahHasanat] = useState(0);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showFullSurahRecordingsModal, setShowFullSurahRecordingsModal] = useState(false);
  const [memorizationData, setMemorizationData] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState(null);
  const [isRepeating, setIsRepeating] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [ayahFontSize, setAyahFontSize] = useState(getResponsiveArabicFontSize(40));
  const [isBoldFont, setIsBoldFont] = useState(false);
  const [isCurrentAyahBookmarked, setIsCurrentAyahBookmarked] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [currentAudioMetadata, setCurrentAudioMetadata] = useState(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordings, setHasRecordings] = useState(false);
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [currentNoteAyah, setCurrentNoteAyah] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [ayahNotes, setAyahNotes] = useState({});
  const [noteSaved, setNoteSaved] = useState(false);
  const [showSavedNotesModal, setShowSavedNotesModal] = useState(false);

  // Builder Mode state
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [wordsPerBatch, setWordsPerBatch] = useState(2);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [builderWords, setBuilderWords] = useState([]);
  const [isCurrentBatchHidden, setIsCurrentBatchHidden] = useState(false);
  const [visibleChunks, setVisibleChunks] = useState(1);

  const allSurahs = getAllSurahs();
  const currentSurahIndex = allSurahs.findIndex(s => s.surah === surahNumber);
  const prevSurah = currentSurahIndex > 0 ? allSurahs[currentSurahIndex - 1] : null;
  const nextSurah = currentSurahIndex < allSurahs.length - 1 ? allSurahs[currentSurahIndex + 1] : null;

  // Commented out Al-Kahf modal functionality for now
  // const [showAudioOptionsModal, setShowAudioOptionsModal] = useState(false);
  // const [currentAudioOptions, setCurrentAudioOptions] = useState(null);
  // const [kahfModalShown, setKahfModalShown] = useState(false);
  // const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  // Commented out Al-Kahf modal functionality for now
  // const [confirmationAction, setConfirmationAction] = useState(null); // 'download' or 'stream'
  // const [selectedScope, setSelectedScope] = useState(null); // 'full_surah' or 'this_ayah'

  React.useEffect(() => {
    async function fetchAyaat() {
      try {
      const data = await getSurahAyaatWithTransliteration(surahNumber);
        console.log('[MemorizationScreen] Loaded ayaat for surah', surahNumber, ':', data);
        if (surahNumber === 2) {
          const ayah4 = data.find(ayah => ayah.ayah === 4);
          if (ayah4) {
            console.log('[MemorizationScreen] Ayah 4 text:', ayah4.text);
          }
        }
        setAyaat(data);
        setIsTextHidden(false);
        
        // Load notes for this surah
        await loadSurahNotes();
    } catch (error) {
        setAyaat([{
          type: 'ayah',
          text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
          transliteration: 'Bismillāhir-Raḥmānir-Raḥīm'
        }]);
        setIsTextHidden(false);
    }
    }
    fetchAyaat();
  }, [surahNumber]);

  // Set up highlighting callback
  React.useEffect(() => {
    const unsubscribe = audioPlayer.onHighlightingUpdate((currentWord, currentTime) => {
      console.log('[MemorizationScreen] Highlighting update:', currentWord?.text, 'at time:', currentTime);
      // Only update word index if we have a valid word (not -1) and audio is actually playing
      if (currentWord && currentWord.index !== undefined && currentWord.index >= 0) {
        setCurrentWordIndex(currentWord.index);
      }
      setCurrentAudioTime(currentTime);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Check bookmark status when current ayah changes
  React.useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (flashcards && flashcards[currentAyahIndex]?.type === 'ayah') {
        const ayahNumber = flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length;
        const inAnyList = await isAyahInAnyList(surahName, ayahNumber);
        setIsCurrentAyahBookmarked(inAnyList);
      }
    };
    
    checkBookmarkStatus();
    checkRecordings();
    
    // Reset Builder mode when ayah changes
    if (isBuilderMode) {
      setIsBuilderMode(false);
      setCurrentBatchIndex(0);
      setIsCurrentBatchHidden(false);
      setBuilderWords([]);
    }
    
    // Update builder words if in Builder mode
    if (isBuilderMode && flashcards[currentAyahIndex]?.text) {
      const words = flashcards[currentAyahIndex].text.split(' ').filter(word => word.trim());
      setBuilderWords(words);
    }
        }, [currentAyahIndex, ayaat, surahName, flashcards]);

  // Reset highlighting state when ayah changes
  React.useEffect(() => {
    setCurrentWordIndex(-1);
    setCurrentAudioTime(0);
    setCurrentAudioMetadata(null);
  }, [currentAyahIndex]);

  // Initialize previous streak on component mount and after reset
  React.useEffect(() => {
    const initializeStreak = async () => {
      const currentStreak = await getCurrentStreak();
      setPreviousStreak(currentStreak);
    };
    initializeStreak();
  }, [route?.params?.resetFlag]);

  // Load memorization data
  const loadMemorizationData = async () => {
    const data = await loadData();
    setMemorizationData(data);
  };

  React.useEffect(() => {
    loadMemorizationData();
  }, []);

  // Handle showRecordings parameter from navigation
  React.useEffect(() => {
    if (route?.params?.showRecordings) {
      setShowRecordingsModal(true);
    }
      }, [route?.params?.showRecordings]);
    
    // Auto-scroll to current ayah when navigation modal opens
    React.useEffect(() => {
      if (showGoToModal && ayahListRef.current) {
        // Wait for the modal to fully render
        setTimeout(() => {
          const currentAyah = flashcards[currentAyahIndex];
          if (currentAyah && ayahListRef.current) {
            const ayahIndex = getFilteredAyaat().findIndex(ayah => 
              flashcards.indexOf(ayah) === currentAyahIndex
            );
            
            if (ayahIndex !== -1) {
              // Calculate the scroll position to center the current ayah
              const itemHeight = 60; // Approximate height of each ayah item
              const scrollPosition = Math.max(0, (ayahIndex * itemHeight) - 100);
              
              ayahListRef.current.scrollTo({
                y: scrollPosition,
                animated: true
              });
              
              console.log('[MemorizationScreen] Auto-scrolled to current ayah:', {
                currentAyahIndex,
                ayahIndex,
                scrollPosition
              });
            }
          }
        }, 300); // Wait for modal animation to complete
      }
    }, [showGoToModal, currentAyahIndex, flashcards]);

  // Audio functionality
  useEffect(() => {
    // Cleanup audio when component unmounts
    return () => {
      audioPlayer.cleanup();
      audioRecorder.cleanup();
    };
  }, []);

  // Update audio playing status
  useEffect(() => {
    let isMounted = true;
    const updateAudioStatus = async () => {
      try {
        const status = await audioPlayer.getPlaybackStatus();
        if (isMounted) {
          setIsAudioPlaying(status.isPlaying);
          setCurrentPlayingAyah(status.currentAyah);
        }
      } catch (e) {
        // Optionally handle error
      }
    };

    const interval = setInterval(() => {
      updateAudioStatus();
    }, 500); // Reduced frequency for better performance
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Memoize flashcards so they're only rebuilt when surahNumber or ayaat changes
  const flashcards = useMemo(() => {
    if (!ayaat || !Array.isArray(ayaat)) {
      return [];
    }
    
    const cards = [];
    
    // 1. Isti'adhah
    const istiadhahText = 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ';
    cards.push({
      type: 'istiadhah',
      text: istiadhahText,
      transliteration: "A'udhu billahi min ash-shaytan ir-rajim",
      translation: 'I seek protection/refuge in Allah from shay6an, the accursed outcast (eternally expelled and rejected from divine mercy)'
    });
    
    // 2. Bismillah (if not Al-Fatihah and not Surah 9)
    if (surahNumber !== 1 && surahNumber !== 9) {
      const bismillahText = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
      cards.push({
        type: 'bismillah',
        text: bismillahText,
        transliteration: 'Bismillāhir-Raḥmānir-Raḥīm',
        translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'
      });
    }
    
        // 3. All ayat as normal
    for (let i = 0; i < ayaat.length; i++) {
      const ayah = ayaat[i];
      if (ayah.text) {
        cards.push({ ...ayah, text: ayah.text, type: 'ayah' });
      } else {
        cards.push({ ...ayah, type: 'ayah' });
      }
    }
    return cards;
  }, [ayaat, surahNumber]);

  // Handle resume from specific index
  React.useEffect(() => {
    console.log('[MemorizationScreen] Resume effect - resumeFromIndex:', resumeFromIndex, 'flashcards.length:', flashcards.length);
    if (resumeFromIndex !== undefined && flashcards.length > 0) {
      const resumeIndex = Math.min(resumeFromIndex, flashcards.length - 1);
      console.log('[MemorizationScreen] Setting currentAyahIndex to:', resumeIndex);
      
      // Set the position if flashcards are loaded and the index is valid
      if (resumeIndex >= 0 && resumeIndex < flashcards.length) {
        isResuming.current = true;
        setCurrentAyahIndex(resumeIndex);
        setIsTextHidden(false);
        flashcardsLoaded.current = true;
        console.log('[MemorizationScreen] Successfully resumed to index:', resumeIndex);
        // Reset the flag after a short delay
        setTimeout(() => {
          isResuming.current = false;
        }, 100);
      }
    }
  }, [flashcards, resumeFromIndex]);

  // Handle navigation to specific ayah from Lists tab
  React.useEffect(() => {
    if (targetAyah && flashcards.length > 0) {
      // Find the flashcard index for the target ayah
      let ayahCount = 0;
      let targetIndex = 0;
      
      for (let i = 0; i < flashcards.length; i++) {
        if (flashcards[i].type === 'ayah') {
          ayahCount++;
          if (ayahCount === targetAyah) {
            targetIndex = i;
            break;
          }
        }
      }
      
      if (targetIndex > 0) {
        console.log('[MemorizationScreen] Navigating to target ayah:', targetAyah, 'at index:', targetIndex);
        setCurrentAyahIndex(targetIndex);
        setIsTextHidden(false);
        flashcardsLoaded.current = true;
      }
    }
  }, [flashcards, targetAyah]);
      
  // Add this after currentAyahIndex and surah are defined
  React.useEffect(() => {
    if (surahName && currentAyahIndex !== undefined && !isResuming.current && flashcardsLoaded.current) {
      saveCurrentPosition(surahName, currentAyahIndex);
    }
  }, [surahName, currentAyahIndex]);

  useEffect(() => {
    // Removed Surah 2 Ayah 4 debugging
  }, [surahNumber, currentAyahIndex, flashcards]);

  // Cleanup effect for fullscreen states
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setIsFullscreen(false);
      setShowTranslationFullscreen(false);
      setFullscreenSearchText('');
      setIsExpandButtonPressed(false);
    };
  }, []);

  const animateFlashcard = (toValue) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: toValue === 1 ? 1 : 0.95,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRevealToggle = () => {
    animateFlashcard(isTextHidden ? 1 : 0.5);
    setTimeout(() => {
      setIsTextHidden((prev) => !prev);
      animateFlashcard(isTextHidden ? 1 : 0.5);
    }, 200);
  };

  const handleGoToAyah = (index) => {
    setCurrentAyahIndex(index);
    setShowGoToModal(false);
    setSearchText('');
    setIsTextHidden(false);
    
    // Reset Builder mode when navigating to specific ayah
    if (isBuilderMode) {
      setIsBuilderMode(false);
      setCurrentBatchIndex(0);
      setIsCurrentBatchHidden(false);
      setBuilderWords([]);
    }
  };

  const handleSearchSubmit = () => {
    const ayahNumber = parseInt(searchText, 10);
    if (ayahNumber && ayahNumber > 0) {
      // Find the ayah with the specified number
      let targetIndex = -1;
      let ayahCount = 0;
      
      for (let i = 0; i < flashcards.length; i++) {
        if (flashcards[i].type === 'ayah') {
          ayahCount++;
          if (ayahCount === ayahNumber) {
            targetIndex = i;
            break;
          }
        }
      }
      
      if (targetIndex !== -1) {
        handleGoToAyah(targetIndex);
      }
    } else {
      // If no number entered, just close the modal and return to current ayah
      setShowGoToModal(false);
      setSearchText('');
    }
  };

  const getFilteredAyaat = () => {
    if (!searchText) return flashcards;
    
    const searchLower = searchText.toLowerCase();
    return flashcards.filter((ayah, index) => {
      const ayahNumber = flashcards.slice(0, index + 1).filter(a => a.type === 'ayah').length;
      const ayahText = ayah.type === 'istiadhah' ? "Isti'adhah" :
                      ayah.type === 'bismillah' ? 'Bismillah' :
                      `Ayah ${ayahNumber}`;
      
      return ayahText.toLowerCase().includes(searchLower) || 
             ayahNumber.toString().includes(searchText);
    });
  };

  const handleNext = async () => {
    await audioPlayer.stopAudio();
    setIsAudioPlaying(false);
    if (!flashcards || currentAyahIndex >= flashcards.length) return;
    const cardType = flashcards[currentAyahIndex]?.type;
    if (cardType !== 'ayah') {
      setShowReward(false);
      setCurrentAyahIndex(idx => idx + 1);
          setIsTextHidden(false);
      return;
    }
    
    // Reset Builder mode when moving to next ayah
    if (isBuilderMode) {
      setIsBuilderMode(false);
      setCurrentBatchIndex(0);
      setIsCurrentBatchHidden(false);
      setBuilderWords([]);
    }
    
    // Check if this is the last ayah of the surah
    const isLastAyah = currentAyahIndex === flashcards.length - 1;
    
    // Only run heavy logic for ayah cards
    // Note: Streak will be updated when hasanat is added, no need to call separately
    const hasanat = flashcards[currentAyahIndex]?.text.length * 10;
    sessionHasanat.current += hasanat;
    setRewardAmount(hasanat);
    setShowReward(true);
    const realAyahIndex = flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length - 1;
            // Use the same naming convention as SurahListScreen for consistency
            console.log('[MemorizationScreen] Updating memorized ayahs for:', surahName, 'ayah index:', realAyahIndex);
            updateMemorizedAyahs(surahName, realAyahIndex).catch(console.error);
    
    // Track telemetry
    telemetryService.trackHasanatEarned(hasanat, 'ayah_completion');
          telemetryService.trackMemorizationProgress(surahName, realAyahIndex + 1, ((realAyahIndex + 1) / ayaat.filter(a => a.type === 'ayah').length) * 100);
  };

  const handlePrevious = async () => {
    await audioPlayer.stopAudio();
    setIsAudioPlaying(false);
    if (currentAyahIndex > 0) {
      const newIndex = currentAyahIndex - 1;
      setCurrentAyahIndex(newIndex);
      
      // Reset Builder mode when moving to previous ayah
      if (isBuilderMode) {
        setIsBuilderMode(false);
        setCurrentBatchIndex(0);
        setIsCurrentBatchHidden(false);
        setBuilderWords([]);
      }
      
      // Only reveal special cards (bismillah and isti3aadhah)
      // Official ayaat should be hidden when navigating back
      const prevCard = flashcards?.[newIndex];
      if (prevCard?.type === 'bismillah' || prevCard?.type === 'istiadhah') {
        setIsTextHidden(false);
      } else {
        // Hide all other cards including official ayaat
        setIsTextHidden(true);
      }
    }
  };

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      const timeout = rewardTimeout.current;
      if (timeout) clearTimeout(timeout);
    };
  }, []);



  // Helper function to strip HTML tags
  const stripHtmlTags = (text) => {
    return text.replace(/<[^>]*>/g, '');
  };

  // Open translation modal for current ayah
  const openTranslationModal = () => {
    if (flashcards[currentAyahIndex]?.type === 'ayah') {
      setModalAyahIndex(currentAyahIndex);
      setShowTranslationModal(true);
    }
  };

  async function handleFinishSurah() {
    // Add hasanat (this will also update streak automatically)
    addHasanat(sessionHasanat.current);
    sessionHasanat.current = 0;
    navigation.navigate('Home', { refresh: true });
  }

  const handleStreakAnimationComplete = () => {
    setShowStreakAnimation(false);
  };

  // Function to clean surah name by removing existing numbers
  const cleanSurahName = (name) => {
    if (!name) return ''; // Safety check for undefined/null names
    return name.replace(/^\d+\.?\s*/, ''); // Remove number and period at the beginning
  };
  
  // Function to get display name for UI (uses the original surah names)
  const getDisplaySurahName = (surahId) => {
    return getOriginalSurahName(surahId);
  };

  // Static audio map for Al-Fatiha, Al-Kahf, and Al-Mulk
  const audioMap = {
    // Al-Fatiha (Surah 1)
    '001_001': require('../assets/AlFatiha_Mishary/001001.mp3'),
    '001_002': require('../assets/AlFatiha_Mishary/001002.mp3'),
    '001_003': require('../assets/AlFatiha_Mishary/001003.mp3'),
    '001_004': require('../assets/AlFatiha_Mishary/001004.mp3'),
    '001_005': require('../assets/AlFatiha_Mishary/001005.mp3'),
    '001_006': require('../assets/AlFatiha_Mishary/001006.mp3'),
    '001_007': require('../assets/AlFatiha_Mishary/001007.mp3'),
    // Al-Kahf (Surah 18) - Now served from Supabase Storage
    // Al-Mulk (Surah 67)
    '067_001': require('../assets/AlMulk_AlGhamdi/067001.mp3'),
    '067_002': require('../assets/AlMulk_AlGhamdi/067002.mp3'),
    '067_003': require('../assets/AlMulk_AlGhamdi/067003.mp3'),
    '067_004': require('../assets/AlMulk_AlGhamdi/067004.mp3'),
    '067_005': require('../assets/AlMulk_AlGhamdi/067005.mp3'),
    '067_006': require('../assets/AlMulk_AlGhamdi/067006.mp3'),
    '067_007': require('../assets/AlMulk_AlGhamdi/067007.mp3'),
    '067_008': require('../assets/AlMulk_AlGhamdi/067008.mp3'),
    '067_009': require('../assets/AlMulk_AlGhamdi/067009.mp3'),
    '067_010': require('../assets/AlMulk_AlGhamdi/067010.mp3'),
    '067_011': require('../assets/AlMulk_AlGhamdi/067011.mp3'),
    '067_012': require('../assets/AlMulk_AlGhamdi/067012.mp3'),
    '067_013': require('../assets/AlMulk_AlGhamdi/067013.mp3'),
    '067_014': require('../assets/AlMulk_AlGhamdi/067014.mp3'),
    '067_015': require('../assets/AlMulk_AlGhamdi/067015.mp3'),
    '067_016': require('../assets/AlMulk_AlGhamdi/067016.mp3'),
    '067_017': require('../assets/AlMulk_AlGhamdi/067017.mp3'),
    '067_018': require('../assets/AlMulk_AlGhamdi/067018.mp3'),
    '067_019': require('../assets/AlMulk_AlGhamdi/067019.mp3'),
    '067_020': require('../assets/AlMulk_AlGhamdi/067020.mp3'),
    '067_021': require('../assets/AlMulk_AlGhamdi/067021.mp3'),
    '067_022': require('../assets/AlMulk_AlGhamdi/067022.mp3'),
    '067_023': require('../assets/AlMulk_AlGhamdi/067023.mp3'),
    '067_024': require('../assets/AlMulk_AlGhamdi/067024.mp3'),
    '067_025': require('../assets/AlMulk_AlGhamdi/067025.mp3'),
    '067_026': require('../assets/AlMulk_AlGhamdi/067026.mp3'),
    '067_027': require('../assets/AlMulk_AlGhamdi/067027.mp3'),
    '067_028': require('../assets/AlMulk_AlGhamdi/067028.mp3'),
    '067_029': require('../assets/AlMulk_AlGhamdi/067029.mp3'),
    '067_030': require('../assets/AlMulk_AlGhamdi/067030.mp3'),
    // Al-Alaq (Surah 96) - Mostafa Ismaeel
    '096_001': require('../assets/AlAlaq_MostafaIsmaeel/096001.mp3'),
    '096_002': require('../assets/AlAlaq_MostafaIsmaeel/096002.mp3'),
    '096_003': require('../assets/AlAlaq_MostafaIsmaeel/096003.mp3'),
    '096_004': require('../assets/AlAlaq_MostafaIsmaeel/096004.mp3'),
    '096_005': require('../assets/AlAlaq_MostafaIsmaeel/096005.mp3'),
    '096_006': require('../assets/AlAlaq_MostafaIsmaeel/096006.mp3'),
    '096_007': require('../assets/AlAlaq_MostafaIsmaeel/096007.mp3'),
    '096_008': require('../assets/AlAlaq_MostafaIsmaeel/096008.mp3'),
    '096_009': require('../assets/AlAlaq_MostafaIsmaeel/096009.mp3'),
    '096_010': require('../assets/AlAlaq_MostafaIsmaeel/096010.mp3'),
    '096_011': require('../assets/AlAlaq_MostafaIsmaeel/096011.mp3'),
    '096_012': require('../assets/AlAlaq_MostafaIsmaeel/096012.mp3'),
    '096_013': require('../assets/AlAlaq_MostafaIsmaeel/096013.mp3'),
    '096_014': require('../assets/AlAlaq_MostafaIsmaeel/096014.mp3'),
    '096_015': require('../assets/AlAlaq_MostafaIsmaeel/096015.mp3'),
    '096_016': require('../assets/AlAlaq_MostafaIsmaeel/096016.mp3'),
    '096_017': require('../assets/AlAlaq_MostafaIsmaeel/096017.mp3'),
    '096_018': require('../assets/AlAlaq_MostafaIsmaeel/096018.mp3'),
    '096_019': require('../assets/AlAlaq_MostafaIsmaeel/096019.mp3'),
  };

  function getAyahAudioUri(surahNumber, ayahNumber) {
    // For Al-Kahf (Surah 18), return null to trigger cloud download
    if (surahNumber === 18) {
      return null; // This will trigger the cloud download in audioPlayer
    }
    
    // For other surahs, use local assets
    const key = `${surahNumber.toString().padStart(3, '0')}_${ayahNumber.toString().padStart(3, '0')}`;
    const audioRequire = audioMap[key];
    if (!audioRequire) return null;
    return audioRequire; // Return the require() result directly
  }

  // Replace handleAudioPlay with toggle logic
  const handleAudioButtonPress = async () => {
    const status = await audioPlayer.getPlaybackStatus();
    if (status.isPlaying) {
      await audioPlayer.pauseAudio();
      setIsAudioPlaying(false);
      setCurrentWordIndex(-1);
      setCurrentAudioTime(0);
    } else {
      // Check if recording is in progress before playing audio
      if (isRecording) {
        Alert.alert('Cannot Play Audio', 'Please stop the recording before playing audio recitation.');
        return;
      }
      
      // Clear highlighting with a small delay to prevent glitch
      setTimeout(() => {
        setCurrentWordIndex(-1);
        setCurrentAudioTime(0);
      }, 100);
      
      // Play current ayah
      const currentFlashcard = flashcards[currentAyahIndex];
      if (currentFlashcard && currentFlashcard.type === 'ayah') {
        let ayahNumber = 0;
        for (let i = 0; i <= currentAyahIndex; i++) {
          if (flashcards[i].type === 'ayah') ayahNumber++;
        }
        
        console.log('[MemorizationScreen] Attempting to play audio for surah:', surahNumber, 'ayah:', ayahNumber, 'surahName:', surahName);
        
        // Comment out Al-Kahf audio functionality for now
        if (surahNumber === 18) {
          Alert.alert(
            'Audio Coming Soon', 
            `Audio recitation for Surah Al-Kahf is coming soon.`
          );
          return;
        }
        
        const audioSource = getAyahAudioUri(surahNumber, ayahNumber);
        console.log('[MemorizationScreen] Audio source for ayah', ayahNumber, ':', audioSource);
        
        if (audioSource) {
          // Get metadata for highlighting
          let metadata = getAyahMetadata(surahNumber, ayahNumber);
          if (!metadata) {
            // Try to get metadata for special cards
            metadata = getSpecialCardMetadata(currentFlashcard.type);
          }
          setCurrentAudioMetadata(metadata);
          
          console.log('[MemorizationScreen] Attempting to play audio with source:', audioSource);
          const playResult = await audioPlayer.playAudio(audioSource, metadata, surahName, ayahNumber);
          console.log('[MemorizationScreen] Audio play result:', playResult);
          
          if (playResult) {
            setIsAudioPlaying(true);
          } else {
            console.error('[MemorizationScreen] Failed to play audio');
            Alert.alert('Audio Error', 'Failed to play audio recitation. Please try again.');
          }
        } else {
          console.warn('[MemorizationScreen] Audio source not available for ayah:', ayahNumber);
          Alert.alert(
            'Audio Not Available', 
            `Audio recitation is not available for Ayah ${ayahNumber} of ${surahName}. This feature is coming soon.`
          );
        }
      }
    }
  };

  // Start spinning animation
  const startSpin = () => {
    spinAnim.setValue(0);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // Stop spinning animation
  const stopSpin = () => {
    spinAnim.stopAnimation();
    spinAnim.setValue(0);
    setIsRepeating(false);
  };

  const handleAudioButtonLongPress = async () => {
    // Check if recording is in progress before playing audio
    if (isRecording) {
      Alert.alert('Cannot Play Audio', 'Please stop the recording before playing audio recitation.');
      return;
    }
    
    // Two haptic feedbacks: one instant, one after 750ms
    hapticImpactMedium();
    setTimeout(() => {
      hapticImpactMedium();
    }, 750);
    // Repeat: seek to start and play
    const currentFlashcard = flashcards[currentAyahIndex];
    if (currentFlashcard && currentFlashcard.type === 'ayah') {
      let ayahNumber = 0;
      for (let i = 0; i <= currentAyahIndex; i++) {
        if (flashcards[i].type === 'ayah') ayahNumber++;
      }
      const audioSource = getAyahAudioUri(surahNumber, ayahNumber);
      if (audioSource) {
        await audioPlayer.seekToStart();
        await audioPlayer.playAudio(audioSource, null, surahName, ayahNumber);
        setIsAudioPlaying(true);
      } else {
        console.warn('[MemorizationScreen] Audio source not available for ayah:', ayahNumber);
      }
    }
  };

  const handleBookmarkToggle = async () => {
    hapticSelection();
    
    // Immediately update the visual state
    setIsCurrentAyahBookmarked(!isCurrentAyahBookmarked);
    
    setShowBookmarkModal(true);
  };

  const handleBookmarkModalClose = async () => {
    setShowBookmarkModal(false);
    
    // Refresh bookmark status after modal closes
    if (flashcards && flashcards[currentAyahIndex]?.type === 'ayah') {
      const ayahNumber = flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length;
      const inAnyList = await isAyahInAnyList(surahName, ayahNumber);
      setIsCurrentAyahBookmarked(inAnyList);
    }
  };

  const handleBookmarkChange = async () => {
    // Refresh bookmark status after modal changes
    if (flashcards && flashcards[currentAyahIndex]?.type === 'ayah') {
      const ayahNumber = flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length;
      const inAnyList = await isAyahInAnyList(surahName, ayahNumber);
      setIsCurrentAyahBookmarked(inAnyList);
    }
  };

  // Recording functions
  const checkRecordings = async () => {
    console.log('[MemorizationScreen] checkRecordings called');
    if (flashcards && flashcards[currentAyahIndex]?.type === 'ayah') {
      const ayahNumber = flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length;
      console.log('[MemorizationScreen] Checking recordings for ayah:', ayahNumber);
      const recordings = await audioRecorder.loadRecordings(surahName, ayahNumber);
      console.log('[MemorizationScreen] Found recordings:', recordings.length);
      setHasRecordings(recordings.length > 0);
    } else {
      console.log('[MemorizationScreen] Not an ayah card, skipping recordings check');
    }
  };

  const handleRecordingToggle = async () => {
    try {
      hapticSelection();
      console.log('[MemorizationScreen] Recording toggle pressed');
      console.log('[MemorizationScreen] Current state - isRecording:', isRecording, 'hasRecordings:', hasRecordings);
      
      if (isRecording) {
        // Stop recording
        console.log('[MemorizationScreen] Stopping recording...');
        await audioRecorder.stopRecording();
        setIsRecording(false);
        recordingPulseAnim.stopAnimation();
        await checkRecordings();
      } else if (hasRecordings) {
        // If recordings exist, open the modal instead of starting new recording
        console.log('[MemorizationScreen] Opening recordings modal...');
        setShowRecordingsModal(true);
      } else {
        // Check if audio is playing before starting recording
        if (isAudioPlaying) {
          Alert.alert('Cannot Record', 'Please stop the audio recitation before starting a recording.');
          return;
        }
        
        // Start recording only if no recordings exist
        if (flashcards && flashcards[currentAyahIndex]?.type === 'ayah') {
          // Hide text if it's revealed before starting recording
          if (!isTextHidden) {
            setIsTextHidden(true);
          }
          
          const ayahNumber = flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length;
          console.log('[MemorizationScreen] Starting recording for ayah:', ayahNumber);
          await audioRecorder.startRecording(surahName, ayahNumber);
          setIsRecording(true);
          
          // Start pulse animation
          Animated.loop(
            Animated.sequence([
              Animated.timing(recordingPulseAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(recordingPulseAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ).start();
        } else {
          Alert.alert('Cannot Record', 'Recording is only available for Quran ayahs.');
        }
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      setIsRecording(false);
      recordingPulseAnim.stopAnimation();
      Alert.alert('Recording Error', `Failed to ${isRecording ? 'stop' : 'start'} recording. ${error.message}`);
    }
  };



  const handleRecordingsModalClose = () => {
    setShowRecordingsModal(false);
    checkRecordings();
  };

  const handleNoteIconPress = async (ayahIndex, ayahNumber) => {
    setCurrentNoteAyah({ index: ayahIndex, number: ayahNumber });
    
    // Load existing note if any
    try {
      const noteKey = `note_${surahNumber}_${ayahNumber}`;
      const existingNote = await AsyncStorage.getItem(noteKey);
      if (existingNote) {
        setNoteText(existingNote);
        setNoteSaved(true);
      } else {
        setNoteText(''); // Reset note text
        setNoteSaved(false);
      }
    } catch (error) {
      console.error('[MemorizationScreen] Error loading note:', error);
      setNoteText(''); // Reset note text on error
      setNoteSaved(false);
    }
    
    setShowNoteInput(true);
  };

  const handleNoteSave = async () => {
    if (currentNoteAyah && noteText.trim()) {
      try {
        // Save note to AsyncStorage
        const noteKey = `note_${surahNumber}_${currentNoteAyah.number}`;
        await AsyncStorage.setItem(noteKey, noteText.trim());
        
        // Update local state
        setAyahNotes(prev => ({
          ...prev,
          [currentNoteAyah.number]: noteText.trim()
        }));
        
        console.log('[MemorizationScreen] Note saved for ayah:', currentNoteAyah.number);
        setNoteSaved(true);
        
        // Keep the note input open - saved state stays until user changes text
        // No more auto-reset timeout
      } catch (error) {
        console.error('[MemorizationScreen] Error saving note:', error);
        Alert.alert('Error', 'Failed to save note. Please try again.');
      }
    }
  };

  const handleNoteClose = () => {
    setShowNoteInput(false);
    setCurrentNoteAyah(null);
    setNoteText('');
    setNoteSaved(false);
  };

  const handleNoteTextChange = (text) => {
    setNoteText(text);
    if (noteSaved) {
      setNoteSaved(false);
    }
  };

  // Fullscreen toggle function
  const handleFullscreenToggle = () => {
    hapticSelection();
    if (isFullscreen) {
      // When closing fullscreen, clear search and reset states
      setFullscreenSearchText('');
      setIsExpandButtonPressed(false);
      // Use setTimeout to ensure modal closes properly
      setTimeout(() => {
        setIsFullscreen(false);
      }, 50);
    } else {
      setIsFullscreen(true);
    }
  };

  // Navigate to specific ayah from fullscreen
  const handleAyahNavigation = (ayahIndex) => {
    hapticSelection();
    // Reset states first
    setFullscreenSearchText('');
    setIsExpandButtonPressed(false);
    // Close fullscreen with delay
    setTimeout(() => {
      setIsFullscreen(false);
      // Navigate to ayah after modal closes
      setTimeout(() => {
        setCurrentAyahIndex(ayahIndex);
      }, 100);
    }, 50);
  };

  // Toggle translation view
  const handleTranslationViewToggle = () => {
    hapticSelection();
    setShowTranslationView(!showTranslationView);
    setIsExpandButtonPressed(false);
    // Reset scroll position when switching views
    if (fullscreenScrollViewRef.current) {
      fullscreenScrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  };

  // Filter flashcards based on search text
  const getFilteredFlashcards = () => {
    if (!fullscreenSearchText.trim()) return flashcards;
    
    const searchLower = fullscreenSearchText.toLowerCase();
    return flashcards.filter((card, index) => {
      const ayahNumber = flashcards.slice(0, index + 1).filter(a => a.type === 'ayah').length;
      const ayahText = card.type === 'istiadhah' ? "Isti'adhah" :
                      card.type === 'bismillah' ? 'Bismillah' :
                      `Ayah ${ayahNumber}`;
      
      return ayahText.toLowerCase().includes(searchLower) || 
             ayahNumber.toString().includes(fullscreenSearchText) ||
             (card.text && card.text.toLowerCase().includes(searchLower));
    });
  };

  // Scroll to bottom or top of fullscreen list
  const scrollToBottom = () => {
    hapticSelection();
    if (fullscreenScrollViewRef.current) {
      if (isAtBottom) {
        // Scroll to top
        fullscreenScrollViewRef.current.scrollTo({ y: 0, animated: true });
      } else {
        // Scroll to bottom
        fullscreenScrollViewRef.current.scrollToEnd({ animated: true });
      }
    }
  };

  // Handle scroll events to track if at bottom
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottomNow = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    setIsAtBottom(isAtBottomNow);
  };

  // Navigate to previous surah (with looping)
  const goToPreviousSurah = () => {
    hapticSelection();
    const previousSurahNumber = surahNumber === 1 ? 114 : surahNumber - 1;
    navigation.replace('MemorizationScreen', { 
      surahNumber: previousSurahNumber,
      surahName: getSurahName(previousSurahNumber)
    });
  };

  // Navigate to next surah (with looping)
  const goToNextSurah = () => {
    hapticSelection();
    const nextSurahNumber = surahNumber === 114 ? 1 : surahNumber + 1;
    navigation.replace('MemorizationScreen', { 
      surahNumber: nextSurahNumber,
      surahName: getSurahName(nextSurahNumber)
    });
  };

  // Handle full surah recording
  const handleFullSurahRecord = () => {
    hapticSelection();
    console.log('[MemorizationScreen] Full surah recording button pressed');
    // Close fullscreen modal first, then open recordings modal
    setIsFullscreen(false);
    setTimeout(() => {
      setShowFullSurahRecordingsModal(true);
    }, 100);
  };

  // Handle full surah audio playback
  const handleFullSurahAudio = () => {
    hapticSelection();
    // TODO: Implement full surah audio playback
    console.log('Full surah audio playback started');
  };

  // Toggle hide mode
  const handleHideToggle = () => {
    hapticSelection();
    setIsHideMode(!isHideMode);
    if (!isHideMode) {
      // Initialize all ayah covers as hidden
      const initialCovers = {};
      flashcards.forEach((card, index) => {
        if (card.type === 'ayah') {
          initialCovers[index] = true; // true means covered
        }
      });
      setAyahCovers(initialCovers);
    } else {
      // Clear all covers when exiting hide mode
      setAyahCovers({});
    }
  };

  // Handle ayah cover swipe
  const handleAyahCoverSwipe = (ayahIndex) => {
    hapticSelection();
    setAyahCovers(prev => ({
      ...prev,
      [ayahIndex]: !prev[ayahIndex]
    }));
  };

  const loadSurahNotes = async () => {
    try {
      const notes = {};
      const ayaat = getSurahAyaatWithTransliteration(surahNumber);
      const ayahData = await ayaat;
      
      for (const ayah of ayahData) {
        if (ayah.type === 'ayah') {
          const noteKey = `note_${surahNumber}_${ayah.ayah}`;
          const note = await AsyncStorage.getItem(noteKey);
          if (note) {
            notes[ayah.ayah] = note;
          }
        }
      }
      
      setAyahNotes(notes);
      console.log('[MemorizationScreen] Loaded notes for surah:', surahNumber, notes);
    } catch (error) {
      console.error('[MemorizationScreen] Error loading surah notes:', error);
    }
  };

  const testRecordingFunctionality = async () => {
    try {
      console.log('[MemorizationScreen] Testing recording functionality...');
      
      // Test native module
      const nativeTest = testNativeModule();
      console.log('[MemorizationScreen] Native module test:', nativeTest);
      
      // Test file system
      const fsTest = await testRecordingSetup();
      console.log('[MemorizationScreen] File system test:', fsTest);
      
      // Test audio setup
      const audioTest = await testAudioSetup();
      console.log('[MemorizationScreen] Audio test:', audioTest);
      
      if (nativeTest && fsTest && audioTest) {
        Alert.alert('Test Results', 'Recording functionality is working correctly!');
      } else {
        Alert.alert('Test Results', 'Some recording tests failed. Check console for details.');
      }
    } catch (error) {
      console.error('[MemorizationScreen] Test failed:', error);
      Alert.alert('Test Error', error.message);
    }
  };

  // Function to activate Builder mode
  const activateBuilderMode = () => {
    if (flashcards[currentAyahIndex]?.text) {
      const words = flashcards[currentAyahIndex].text.split(' ').filter(word => word.trim());
      setBuilderWords(words);
      setIsBuilderMode(true);
      setCurrentBatchIndex(0);
      setIsCurrentBatchHidden(false);
      setShowBuilderModal(false);
    }
  };



  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Recording pulse animation
  const recordingPulseAnim = useRef(new Animated.Value(1)).current;
  const recordingPulse = recordingPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  // Touch state for recording button
  const [isRecordingButtonPressed, setIsRecordingButtonPressed] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpandButtonPressed, setIsExpandButtonPressed] = useState(false);
  const [fullscreenSearchText, setFullscreenSearchText] = useState('');
  const [showTranslationFullscreen, setShowTranslationFullscreen] = useState(false);
  const [isHideMode, setIsHideMode] = useState(false);
  const [ayahCovers, setAyahCovers] = useState({});
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [showTranslationView, setShowTranslationView] = useState(false);
  const [currentTranslator, setCurrentTranslator] = useState('sahih');

  const fontCandidates = ['UthmanTN_v2-0', 'UthmanTN', 'KFGQPC Uthman Taha Naskh', 'Uthman Taha Naskh'];
  const fontFamily = fontCandidates[currentAyahIndex % fontCandidates.length];

  // Monitor recording status to reset button state when recording ends
  useEffect(() => {
    let recordingCheckInterval;
    
    if (isRecording) {
      recordingCheckInterval = setInterval(async () => {
        try {
          const status = await audioRecorder.getStatus();
          if (!status.isRecording) {
            // Recording has ended naturally
            setIsRecording(false);
            recordingPulseAnim.stopAnimation();
            await checkRecordings(); // Refresh recordings list
            if (recordingCheckInterval) {
              clearInterval(recordingCheckInterval);
            }
          }
        } catch (error) {
          console.error('Error checking recording status:', error);
          // If there's an error, assume recording ended
          setIsRecording(false);
          recordingPulseAnim.stopAnimation();
          if (recordingCheckInterval) {
            clearInterval(recordingCheckInterval);
          }
        }
      }, 500);
    }

    return () => {
      if (recordingCheckInterval) {
        clearInterval(recordingCheckInterval);
      }
    };
  }, [isRecording, recordingPulseAnim]);

  // Cleanup effect to prevent freezing
  React.useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setIsFullscreen(false);
      setShowTranslationView(false);
      setShowTranslationFullscreen(false);
    };
  }, []);

  // Commented out Al-Kahf modal functionality for now
  // // Check if Al-Kahf modal has been shown before
  // React.useEffect(() => {
  //   const checkKahfModalShown = async () => {
  //     try {
  //       const hasBeenShown = await AsyncStorage.getItem('kahf_modal_shown');
  //       setKahfModalShown(hasBeenShown === 'true');
  //     } catch (error) {
  //       console.error('[MemorizationScreen] Error checking kahf modal status:', error);
  //     }
  //   };
  //   
  //   checkKahfModalShown();
  // }, []);

  // Enhanced download handler with scope selection
  const handleDownloadAudio = async (surahNumber, ayahNumber, scope = 'this_ayah') => {
    try {
      const scopeText = scope === 'full_surah' ? 'Full Surah' : `Ayah ${ayahNumber}`;
      console.log(`[MemorizationScreen] Downloading ${scopeText} for surah:`, surahNumber);
      
      // Show loading indicator
      Alert.alert(
        'Download Started', 
        `Downloading ${scopeText} of ${surahName} for offline use. This may take a few moments.`,
        [{ text: 'OK' }]
      );
      
      if (scope === 'full_surah') {
        // Download all ayahs of Al-Kahf (110 ayahs)
        const totalAyahs = 110;
        let downloadedCount = 0;
        
        for (let ayah = 1; ayah <= totalAyahs; ayah++) {
          try {
            // TODO: Implement actual download logic for each ayah
            // For now, simulate download progress
            downloadedCount++;
            console.log(`[MemorizationScreen] Downloaded ayah ${ayah}/${totalAyahs}`);
            
            // Update progress every 10 ayahs
            if (ayah % 10 === 0) {
              const progress = Math.round((ayah / totalAyahs) * 100);
              console.log(`[MemorizationScreen] Download progress: ${progress}%`);
            }
          } catch (error) {
            console.error(`[MemorizationScreen] Error downloading ayah ${ayah}:`, error);
          }
        }
        
        Alert.alert(
          'Download Complete', 
          `All ${totalAyahs} ayahs of ${surahName} have been downloaded and are now available offline.`,
          [{ text: 'OK' }]
        );
      } else {
        // Download single ayah
        // TODO: Implement actual download logic for single ayah
        setTimeout(() => {
          Alert.alert(
            'Download Complete', 
            `Ayah ${ayahNumber} has been downloaded and is now available offline.`,
            [{ text: 'OK' }]
          );
        }, 2000);
      }
      
    } catch (error) {
      console.error('[MemorizationScreen] Download error:', error);
      Alert.alert('Download Error', 'Failed to download audio. Please check your internet connection and try again.');
    }
  };

  // Enhanced stream handler with scope selection
  const handleStreamAudio = async (surahNumber, ayahNumber, scope = 'this_ayah') => {
    try {
      const scopeText = scope === 'full_surah' ? 'Full Surah' : `Ayah ${ayahNumber}`;
      console.log(`[MemorizationScreen] Streaming ${scopeText} for surah:`, surahNumber);
      
      // Show loading indicator
      Alert.alert(
        'Streaming Audio', 
        `Loading ${scopeText} of ${surahName} for streaming. Please ensure you have a stable internet connection.`,
        [{ text: 'OK' }]
      );
      
      if (scope === 'full_surah') {
        // Stream all ayahs of Al-Kahf
        const totalAyahs = 110;
        console.log(`[MemorizationScreen] Starting to stream all ${totalAyahs} ayahs`);
        
        // TODO: Implement actual streaming logic for full surah
        // For now, start with the current ayah
        const streamUrl = `https://baimixtdewflnnyudhwz.supabase.co/storage/v1/object/public/quran-recitations/AlKahf_AsSudais/${ayahNumber.toString().padStart(3, '0')}.mp3`;
        
        let metadata = getAyahMetadata(surahNumber, ayahNumber);
        if (!metadata) {
          metadata = getSpecialCardMetadata('ayah');
        }
        setCurrentAudioMetadata(metadata);
        
        const playResult = await audioPlayer.playAudio(streamUrl, metadata, surahName, ayahNumber);
        
        if (playResult) {
          setIsAudioPlaying(true);
          Alert.alert(
            'Streaming Started', 
            `Full ${surahName} is now streaming. Audio will start playing shortly.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Streaming Error', 
            'Failed to start streaming. Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Stream single ayah
        const streamUrl = `https://baimixtdewflnnyudhwz.supabase.co/storage/v1/object/public/quran-recitations/AlKahf_AsSudais/${ayahNumber.toString().padStart(3, '0')}.mp3`;
        
        console.log('[MemorizationScreen] Streaming URL:', streamUrl);
        console.log('[MemorizationScreen] Testing URL accessibility...');
        
        // Test if the URL is accessible
        try {
          const response = await fetch(streamUrl, { method: 'HEAD' });
          console.log('[MemorizationScreen] URL response status:', response.status);
          console.log('[MemorizationScreen] URL response headers:', response.headers);
        } catch (fetchError) {
          console.error('[MemorizationScreen] URL fetch error:', fetchError);
        }
        
        let metadata = getAyahMetadata(surahNumber, ayahNumber);
        if (!metadata) {
          metadata = getSpecialCardMetadata('ayah');
        }
        setCurrentAudioMetadata(metadata);
        
        const playResult = await audioPlayer.playAudio(streamUrl, metadata, surahName, ayahNumber);
        
        if (playResult) {
          setIsAudioPlaying(true);
          Alert.alert(
            'Streaming Started', 
            `Ayah ${ayahNumber} is now streaming. Audio will start playing shortly.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Streaming Error', 
            'Failed to start streaming. Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }
      }
      
    } catch (error) {
      console.error('[MemorizationScreen] Streaming error:', error);
      Alert.alert('Streaming Error', 'Failed to start streaming. Please check your internet connection and try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground 
        source={require('../assets/IQRA2background.png')} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.headerWithHome}>
        <TouchableOpacity
          style={styles.homeButton}
              onPress={async () => {
                // Explicitly save current position
                try {
        await saveCurrentPosition(surahName, currentAyahIndex);
        await saveLastPosition(surahName, surahNumber, currentAyahIndex);
        console.log('[MemorizationScreen] Explicitly saved on Home:', surahName, currentAyahIndex);
                } catch (error) {
                  console.error('[MemorizationScreen] Error saving current position on Home:', error);
                }
            if (sessionHasanat.current > 0) {
              addHasanat(sessionHasanat.current);
              sessionHasanat.current = 0;
            }
            navigation.navigate('Home', { refresh: true });
          }}
        >
              <Image source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')} style={[styles.homeIcon]} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
              <Text variant="h2" style={{ textAlign: 'center', width: '100%', color: '#5b7f67' }}>
                {language === 'ar' ? t(`surah_${surahNumber}`) : (getDisplaySurahName(surahNumber) || 'Surah')}
              </Text>
          <Text variant="body1" style={{ textAlign: 'center', width: '100%', color: '#F5E6C8' }}>
                {flashcards && flashcards[currentAyahIndex]?.type === 'ayah'
                  ? (language === 'ar' ? 
                      <Text style={{ textAlign: 'center' }}>
                        <Text style={{ color: '#F5E6C8' }}>{t('ayah')} </Text>
                        <Text style={{ color: 'rgba(165,115,36,0.8)' }}>{toArabicNumber(flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length)}</Text>
                      </Text>
                    : 
                      <Text style={{ textAlign: 'center' }}>
                        <Text style={{ color: '#F5E6C8' }}>Ayah </Text>
                        <Text style={{ color: 'rgba(165,115,36,0.8)' }}>{toArabicNumber(flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length)}</Text>
                      </Text>
                    )
                  : flashcards && flashcards[currentAyahIndex]?.type === 'istiadhah'
                ? (language === 'ar' ? t('istiadhah') : "Isti3aadhah")
                : (language === 'ar' ? 'بسم الله' : 'Bismillah')}
          </Text>
          <View style={styles.progressContainer}>
            <ProgressBar 
                  progress={flashcards ? flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length : 0}
                  total={flashcards ? flashcards.filter(a => a.type === 'ayah').length : 0}
              height={6}
              animated={true}
            />
          </View>
        </View>
            <View style={styles.headerButtons}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowGoToModal(true)}
        >
          <View style={{
            borderWidth: 2,
            borderColor: 'rgba(165,115,36,0.8)',
            borderRadius: 12,
            padding: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Image 
              source={require('../assets/app_icons/navigation.png')} 
              style={{ width: 28, height: 28, tintColor: '#F5E6C8' }}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
              {/* Hide translation button for first two cards of every surah except for 1st and 9th surah. For 1st and 9th surah, only hide for first card. */}
              {!(
                (surahNumber !== 1 && surahNumber !== 9 && (currentAyahIndex === 0 || currentAyahIndex === 1)) ||
                ((surahNumber === 1 || surahNumber === 9) && currentAyahIndex === 0)
              ) && (
                <TouchableOpacity
                  style={[styles.headerButton, { marginTop: 8 }]}
                  onPress={openTranslationModal}
                >
                  <View style={{
                    borderWidth: 2,
                    borderColor: '#5b7f67',
                    borderRadius: 12,
                    padding: 6,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Image 
                      source={require('../assets/app_icons/translation.png')} 
                      style={{ width: 28, height: 28, tintColor: '#F5E6C8' }}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
      </View>

          <View style={{ flex: 1, flexDirection: 'column' }}>
            {/*
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Text
                variant="h2"
                style={[
                  language === 'ar'
                    ? { fontFamily: 'KFGQPC HAFS Uthmanic Script Regular', fontSize: 28, color: '#5b7f67', textAlign: 'center', marginBottom: 8 }
                    : [FONTS.h2.getFont(language), { color: '#5b7f67', textAlign: 'center', marginBottom: 8 }],
                ]}
              >
                {language === 'ar' ? t(`surah_${surahNumber}`) : getDisplaySurahName(surahNumber)}
              </Text>
            </View>
            */}
        <Animated.View style={[styles.flashcard, { 
          opacity: isAudioPlaying ? 1 : fadeAnim, 
          transform: [{ scale: isAudioPlaying ? 1 : scaleAnim }] 
        }]}>
                <Card variant="elevated" style={[
                  styles.card, 
                  { flex: 1 },
                  (flashcards[currentAyahIndex]?.type === 'istiadhah' || 
                   (flashcards[currentAyahIndex]?.type === 'bismillah' && surahNumber !== 1)) && styles.specialCard
                ]}>
                  {/* Fullscreen expand button */}
                  <TouchableOpacity
                    style={[
                      styles.expandButton,
                      {
                        opacity: isExpandButtonPressed ? 1 : 0.6,
                        transform: [{ scale: isExpandButtonPressed ? 1.1 : 1 }]
                      }
                    ]}
                    onPressIn={() => setIsExpandButtonPressed(true)}
                    onPressOut={() => setIsExpandButtonPressed(false)}
                    onPress={handleFullscreenToggle}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={require('../assets/app_icons/expand.png')} 
                      style={styles.expandButtonIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity> 
                  <ScrollView style={styles.ayahScroll} contentContainerStyle={styles.ayahScrollContent} showsVerticalScrollIndicator={true} bounces={false}>
            {isTextHidden ? (
              <Text
                variant="h2"
                style={[styles.arabicText, { 
                  fontFamily: 'KFGQPC HAFS Uthmanic Script Regular', 
                  fontSize: ayahFontSize, 
                  textAlign: 'center', 
                  alignSelf: 'center', 
                  writingDirection: 'rtl',
                  textAlignVertical: 'center',
                  includeFontPadding: false
                }]}
                align="center"
                allowFontScaling={false}
                lang="ar"
              >
                {flashcards[currentAyahIndex]?.text ? '⬡'.repeat(Math.min(44, Math.ceil(flashcards[currentAyahIndex]?.text.length / 2))) : ''}
              </Text>
            ) : (
              isBuilderMode && builderWords.length > 0 ? (
                // Custom Builder Mode Text Display with Colored Dots - Completely fixed positioning
                <View style={[styles.arabicText, { 
                  textAlign: 'center', 
                  alignSelf: 'center', 
                  writingDirection: 'rtl',
                  textAlignVertical: 'center',
                  includeFontPadding: false,
                  position: 'relative',
                  width: '100%',
                }]}>
                  {(() => {
                    if (isCurrentBatchHidden) {
                      return (
                        <Text style={[styles.arabicText, { 
                          fontSize: ayahFontSize,
                          fontFamily: 'KFGQPC HAFS Uthmanic Script Regular',
                          lineHeight: ayahFontSize * 1.5,
                          color: '#FF8C00',
                          textAlign: 'center',
                          includeFontPadding: false
                        }]}>
                          {'⬡'.repeat(Math.min(44, Math.ceil(flashcards[currentAyahIndex]?.text.length / 2)))}
                        </Text>
                      );
                    }
                    
                    const endIndex = Math.min(visibleChunks * wordsPerBatch, builderWords.length);
                    const totalChunks = Math.ceil(builderWords.length / wordsPerBatch);
                    const orangeShades = [
                      'rgba(165,115,36,1)', // Full theme orange
                      'rgba(165,115,36,0.9)', // Slightly transparent
                      'rgba(165,115,36,0.8)', // Theme orange (current)
                      'rgba(165,115,36,0.7)', // More transparent
                      'rgba(165,115,36,0.6)', // Most transparent
                    ];
                    
                    return (
                      <View style={{
                        flexDirection: 'row-reverse',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 10,
                        width: '100%',
                      }}>
                        {builderWords.map((word, index) => {
                          const isVisible = index < endIndex;
                          const chunkIndex = Math.floor(index / wordsPerBatch);
                          const shadeIndex = Math.min(chunkIndex, orangeShades.length - 1);
                          
                          // Calculate number of hexagons based on word length and batch
                          let hexagonCount = 1;
                          if (!isVisible) {
                            // Base count based on word length (1 hexagon per ~3 characters)
                            hexagonCount = Math.max(1, Math.ceil(word.length / 3));
                            // Add batch-based variation but cap it to fit the word width
                            const maxHexagonsForWord = Math.max(1, Math.floor(word.length / 2));
                            hexagonCount = Math.min(hexagonCount + Math.floor(chunkIndex / 2), maxHexagonsForWord);
                          }
                          
                          return (
                            <Text
                              key={`word-${index}`}
                              style={[styles.arabicText, { 
                                fontSize: ayahFontSize,
                                fontFamily: 'KFGQPC HAFS Uthmanic Script Regular',
                                lineHeight: ayahFontSize * 1.5,
                                color: isVisible ? '#5b7f67' : orangeShades[shadeIndex],
                                marginHorizontal: 2,
                                marginVertical: 4,
                                textAlign: 'center',
                                includeFontPadding: false,
                                width: getResponsiveWordWidth(word.length, ayahFontSize), // Responsive width for all elements
                                minWidth: getResponsiveWordWidth(word.length, ayahFontSize),
                                maxWidth: getResponsiveWordWidth(word.length, ayahFontSize),
                              }]}
                              allowFontScaling={false}
                              lang="ar"
                            >
                              {isVisible ? word : '⬡'.repeat(hexagonCount)}
                            </Text>
                          );
                        })}
                      </View>
                    );
                  })()}
                </View>
              ) : (
                <HighlightedArabicText
                  text={flashcards[currentAyahIndex]?.text || ''}
                  metadata={currentAudioMetadata}
                  isPlaying={isAudioPlaying}
                  currentTime={currentAudioTime}
                  fontSize={ayahFontSize}
                  isBoldFont={isBoldFont}
                  textColor={flashcards[currentAyahIndex]?.type === 'istiadhah' ? '#A57324' :
                           (flashcards[currentAyahIndex]?.type === 'bismillah' && surahNumber !== 1) ? '#5b7f67' :
                           '#1a1a1a'}
                  style={[styles.arabicText, { 
                    textAlign: 'center', 
                    alignSelf: 'center', 
                    writingDirection: 'rtl',
                    textAlignVertical: 'center',
                    includeFontPadding: false
                  }]}
                />
              )
            )}
            
            {/* Show transliteration with fixed distance from Arabic text */}
            {!isTextHidden && language === 'en' && (
              <Text
                variant="body2"
                style={styles.transliterationText}
                align="center"
              >
                {stripHtmlTags(flashcards[currentAyahIndex]?.transliteration || '')}
              </Text>
            )}
            
            {/* Show bismillah translation for bismillah card only in English mode */}
            {flashcards[currentAyahIndex]?.type === 'bismillah' && language === 'en' && (
              <Text
                variant="body2"
                style={[styles.transliterationText, { color: '#5b7f67', fontWeight: 'bold', marginTop: 8 }]}
                align="center"
              >
                {flashcards[currentAyahIndex]?.translation}
              </Text>
            )}
            
            {/* Show istiadhah translation for istiadhah card only in English mode */}
            {flashcards[currentAyahIndex]?.type === 'istiadhah' && language === 'en' && (
              <Text
                variant="body2"
                style={[styles.transliterationText, { color: '#5b7f67', fontWeight: 'bold', marginTop: 8 }]}
                align="center"
              >
                {flashcards[currentAyahIndex]?.translation}
              </Text>
            )}
            
            {/* Builder Mode Progress Indicator */}
            {isBuilderMode && builderWords.length > 0 && (
              <View style={{ marginTop: 16, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  {Array.from({ length: Math.ceil(builderWords.length / wordsPerBatch) }, (_, i) => {
                    const totalChunks = Math.ceil(builderWords.length / wordsPerBatch);
                    const chunkIndex = totalChunks - 1 - i; // Flip the order for RTL
                    return (
                      <View
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: chunkIndex < visibleChunks ? '#5b7f67' : '#CCCCCC',
                          marginHorizontal: 4,
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            )}
                  </ScrollView>
          </Card>
        </Animated.View>
            </View>
            {/* Button row below flashcard */}
            {flashcards && flashcards[currentAyahIndex] && ((flashcards[currentAyahIndex]?.type === 'ayah') || 
              (flashcards[currentAyahIndex]?.type === 'bismillah' && surahNumber === 1)) && 
              flashcards[currentAyahIndex]?.type !== 'istiadhah' && (
                      <View style={styles.buttonRow}>
              {/* Left side buttons */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Settings Button */}
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => setShowSettingsModal(true)}
                >
                  <View style={{
                    borderWidth: 2,
                    borderColor: '#5b7f67',
                    borderRadius: 12,
                    padding: 6,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    width: 48,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Image 
                      source={require('../assets/app_icons/slider.png')} 
                      style={{ width: 28, height: 28, tintColor: '#F5E6C8' }}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
                
                {/* Builder Mode Toggle Button */}
                <TouchableOpacity
                  style={[styles.placeholderButton, { marginLeft: 15 }]}
                  onPress={() => {
                    hapticSelection();
                    if (isBuilderMode) {
                      // Deactivate Builder Mode
                      setIsBuilderMode(false);
                      setCurrentBatchIndex(0);
                      setIsCurrentBatchHidden(false);
                      setBuilderWords([]);
                      setIsTextHidden(false);
                    } else {
                      // Show Builder Mode modal
                      setShowBuilderModal(true);
                    }
                  }}
                >
                  <View style={{
                    borderWidth: 2,
                    borderColor: isBuilderMode ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                    borderRadius: 12,
                    padding: 6,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    width: 48,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isBuilderMode ? 'rgba(91, 127, 103, 0.3)' : 'transparent',
                  }}>
                    <Text style={{
                      color: isBuilderMode ? '#5b7f67' : '#F5E6C8',
                      fontWeight: 'bold',
                      fontSize: 10,
                      textAlign: 'center',
                    }}>
                      {isBuilderMode ? 'ON' : 'BUILDER'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Center Buttons - Hide/Reveal or Cover/Build based on mode */}
              {isBuilderMode ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20 }}>
                  {/* Build/Unbuild Button (Left) */}
                  <TouchableOpacity
                    style={[styles.revealButtonNew, {
                      backgroundColor: visibleChunks > 1 ? 'rgba(165,115,36,0.8)' : '#5b7f67', // Orange for Unbuild, Green for Build
                      padding: SIZES.medium,
                      width: 60,
                      minHeight: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: visibleChunks > 1 ? '#5b7f67' : 'rgba(165,115,36,0.8)', // Green outline for Unbuild
                      borderRightWidth: 0,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    }]}
                    onPress={() => {
                      hapticSelection();
                      if (visibleChunks < Math.ceil(builderWords.length / wordsPerBatch)) {
                        // Build: Add next chunk
                        setVisibleChunks(visibleChunks + 1);
                        setIsCurrentBatchHidden(false);
                      } else {
                        // Unbuild: Go back to first chunk
                        setVisibleChunks(1);
                        setIsCurrentBatchHidden(false);
                      }
                    }}
                    disabled={builderWords.length === 0}
                  >
                    <Text variant="body1" color="primary" style={[styles.revealButtonText, { 
                      fontSize: 20,
                      color: visibleChunks > 1 ? '#5b7f67' : '#F5E6C8', // Green text for Unbuild, White for Build
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }]}>
                      {visibleChunks < Math.ceil(builderWords.length / wordsPerBatch) ? '+' : '−'}
                    </Text>
                  </TouchableOpacity>

                  {/* Cover/Uncover Button (Right) */}
                  <TouchableOpacity
                    style={[styles.revealButtonNew, {
                      backgroundColor: isCurrentBatchHidden ? 'rgba(165,115,36,0.8)' : '#5b7f67', // Orange when hidden, Green when uncovered
                      padding: SIZES.medium,
                      width: 60,
                      minHeight: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isCurrentBatchHidden ? '#5b7f67' : 'rgba(165,115,36,0.8)', // Green outline when hidden, Orange outline when uncovered
                      borderLeftWidth: 0,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }]}
                    onPress={() => {
                      hapticSelection();
                      setIsCurrentBatchHidden(!isCurrentBatchHidden);
                    }}
                  >
                    <Text variant="body1" color="primary" style={[styles.revealButtonText, { 
                      fontSize: 16,
                      color: isCurrentBatchHidden ? '#5b7f67' : '#F5E6C8', // Green text when hidden, White text when uncovered
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }]}>
                      ⬡
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.revealButtonNew, {
                    backgroundColor: isTextHidden ? '#F5E6C8' : 'rgba(245, 230, 200, 0.7)',
                    padding: SIZES.medium,
                    width: 120,
                    minHeight: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isTextHidden ? 'rgba(165,115,36,0.8)' : '#5b7f67',
                    marginHorizontal: 20,
                  }]}
                  onPress={() => {
                    hapticSelection();
                    handleRevealToggle();
                  }}
                >
                  <Text variant="body1" color="primary" style={[styles.revealButtonText, { 
                    fontSize: isTextHidden ? 16 : 18,
                    color: isTextHidden ? COLORS.primary : '#333333',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }]}>
                    {isTextHidden ? t('reveal') : t('hide')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Right side buttons */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Voice Recording Button */}
                <Animated.View style={{
                  transform: [{ scale: isRecording ? recordingPulse : 1 }],
                }}>
                  <TouchableOpacity
                    style={styles.voiceRecordingButton}
                    onPress={handleRecordingToggle}
                    onPressIn={() => setIsRecordingButtonPressed(true)}
                    onPressOut={() => setIsRecordingButtonPressed(false)}
                    disabled={showReward}
                  >
                    <View style={{
                      borderWidth: 2,
                      borderColor: 'rgba(165,115,36,0.8)',
                      borderRadius: 12,
                      padding: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                      width: 48,
                      height: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: hasRecordings ? 'rgba(165,115,36,0.8)' : 'transparent',
                    }}>
                      {isRecording ? (
                        isRecordingButtonPressed ? (
                          <Svg width={28} height={28} style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Polygon
                              points="14,2 26,8 26,20 14,26 2,20 2,8"
                              fill="#5b7f67"
                              stroke="#5b7f67"
                              strokeWidth="1"
                            />
                          </Svg>
                        ) : (
                          <Image 
                            source={require('../assets/app_icons/mic-on.png')} 
                            style={{ width: 28, height: 28, tintColor: '#FF4444' }}
                            resizeMode="contain"
                          />
                        )
                      ) : (
                        <Image 
                          source={require('../assets/app_icons/mic-off.png')} 
                          style={{ width: 28, height: 28, tintColor: hasRecordings ? '#F5E6C8' : 'rgba(165,115,36,0.8)' }}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
                
                {/* Audio Button */}
                <TouchableOpacity
                  style={[styles.audioButton, { marginLeft: 15 }]}
                  onPress={handleAudioButtonPress}
                  onPressIn={() => hapticSelection()}
                  onLongPress={async () => {
                    hapticImpactMedium();
                    await handleAudioButtonLongPress();
                  }}
                  delayLongPress={500}
                >
                  {/* Spinning ring */}
                  {isRepeating && (
                    <Animated.View
                      style={{
                        position: 'absolute',
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        borderWidth: 3,
                        borderColor: '#FFD700',
                        borderStyle: 'solid',
                        opacity: 1,
                        transform: [{ rotate: spin }],
                        zIndex: 1,
                      }}
                    />
                  )}
                  <View style={{
                    borderWidth: 2,
                    borderColor: isAudioPlaying ? '#5b7f67' : '#5b7f67',
                    borderRadius: 12,
                    padding: 6,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    width: 48,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isAudioPlaying ? '#5b7f67' : 'transparent',
                  }}>
                    <Image
                      source={require('../assets/app_icons/audio.png')}
                      style={{
                        width: 28,
                        height: 28,
                        tintColor: isAudioPlaying ? '#FFFFFF' : '#F5E6C8',
                      }}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              </View>
          </View>
        )}
        
        {/* Navigation buttons overlaid */}
        <View style={styles.navigationOverlay}>
          <Button
            title={currentAyahIndex === 0 ? t('back') : t('previous')}
            onPress={async () => {
              hapticSelection();
              if (currentAyahIndex === 0) {
                navigation.navigate('SurahList', { currentSurahId: surahNumber, refreshRecordings: true });
              } else {
                handlePrevious();
              }
            }}
            disabled={showReward}
            style={[styles.navButton, { backgroundColor: '#5b7f67' }]}
          />
          
          {/* Bookmark Button - Between Previous and Next - Only show on ayaat */}
          {flashcards && flashcards[currentAyahIndex] && flashcards[currentAyahIndex]?.type === 'ayah' && (
            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={handleBookmarkToggle}
              disabled={showReward}
            >
                              <Svg width={32} height={32} viewBox="0 0 24 24">
                  <Polygon
                    points="12,2 20,6 20,18 12,22 4,18 4,6"
                    fill={isCurrentAyahBookmarked ? '#5b7f67' : 'none'}
                    stroke={isCurrentAyahBookmarked ? '#5b7f67' : 'rgba(165,115,36,0.8)'}
                    strokeWidth="1.5"
                  />
                </Svg>
            </TouchableOpacity>
          )}
          
          <Button
            title={currentAyahIndex === 0 ? t('start') : (flashcards && currentAyahIndex === flashcards.length - 1 ? t('finish') : t('next'))}
            onPress={async () => {
              hapticSelection();
              handleNext();
            }}
            disabled={showReward}
            style={[styles.navButton, { backgroundColor: '#5b7f67' }]}
          />
        </View>

      {/* Go To Modal */}
      <Modal
        visible={showGoToModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoToModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGoToModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text variant="h2" style={{ marginBottom: 16, color: 'rgba(64, 64, 64, 0.9)', fontWeight: 'bold' }}>{t('navigation')}</Text>
            
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, {
                  textAlign: language === 'ar' ? 'right' : 'left',
                  writingDirection: language === 'ar' ? 'rtl' : 'ltr',
                }]}
                placeholder={t('search_ayah')}
                placeholderTextColor="#888"
                value={searchText}
                onChangeText={setSearchText}
                keyboardType="numeric"
                onSubmitEditing={handleSearchSubmit}
              />
              <TouchableOpacity style={[styles.searchButton, { backgroundColor: 'transparent' }]} onPress={handleSearchSubmit}>
                <Image 
                  source={require('../assets/app_icons/search.png')} 
                  style={{ width: 20, height: 20, tintColor: '#5b7f67' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            

            
                <View style={{ marginBottom: 8 }}>
                  <TouchableOpacity style={[styles.surahNavButton, { backgroundColor: '#5b7f67' }]} onPress={() => ayahListRef.current?.scrollTo({ y: 0, animated: true })}>
                    <Image 
                      source={require('../assets/app_icons/down-up.png')} 
                      style={{ width: 24, height: 24, tintColor: 'rgba(64, 64, 64, 0.9)', transform: [{ rotate: '180deg' }] }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
                
                <ScrollView ref={ayahListRef} style={styles.ayahList} showsVerticalScrollIndicator={false}>
                  {/* Previous Surah Button */}
                  {prevSurah && (
                    <TouchableOpacity
                      style={styles.surahNavButton}
                      onPress={async () => {
                        setShowGoToModal(false);
                        
                        // Load data to get memorization progress for the target surah
                        const data = await loadData();
                        const targetSurahName = getOriginalSurahName(prevSurah.surah);
                        const targetSurahData = data.memorizedAyahs[targetSurahName];
                        
                        let resumeFromIndex = 0;
                        console.log('[Navigation Modal - Prev] Target surah data:', targetSurahData);
                        if (targetSurahData?.currentFlashcardIndex !== undefined && targetSurahData?.currentFlashcardIndex >= 0) {
                          // Use the saved flashcard index directly
                          resumeFromIndex = targetSurahData.currentFlashcardIndex;
                          console.log('[Navigation Modal - Prev] Using saved flashcard index:', resumeFromIndex);
                        } else {
                          console.log('[Navigation Modal - Prev] No saved position, starting from beginning');
                        }
                        
                        // Save current position before navigating
                        try {
                          await saveCurrentPosition(surahName, currentAyahIndex);
                        } catch (error) {
                          console.error('[MemorizationScreen] Error saving position before navigation:', error);
                        }
                        
                        navigation.replace('Memorization', { 
                          surah: prevSurah,
                          resumeFromIndex
                        });
                      }}
                    >
                      <Text variant="body1" style={[styles.surahNavButtonText, { color: '#F5E6C8' }, language === 'ar' && { textAlign: 'center' }] }>
                        {language === 'ar' ? `${t(`surah_${prevSurah.surah}`)} .${toArabicNumber(prevSurah.surah)}` : `← ${prevSurah.surah}. ${getDisplaySurahName(prevSurah.surah)}`}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {/* Ayah List */}
                  {getFilteredAyaat().map((ayah, mapIndex) => {
                    const originalIndex = flashcards.indexOf(ayah);
                    const ayahNumber = flashcards.slice(0, originalIndex + 1).filter(a => a.type === 'ayah').length;
                return (
                  <TouchableOpacity
                    key={originalIndex}
                    style={[
                      styles.ayahItem,
                      currentAyahIndex === originalIndex && styles.selectedAyahItem
                    ]}
                    onPress={() => handleGoToAyah(originalIndex)}
                  >
                        <View style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', width: '100%', position: 'relative' }}>
                          {/* Note icon on the left - only for actual ayahs */}
                          {ayah.type === 'ayah' && (
                            <TouchableOpacity
                              onPress={() => handleNoteIconPress(originalIndex, ayahNumber)}
                              style={{ 
                                position: 'absolute',
                                left: language === 'ar' ? 'auto' : 8,
                                right: language === 'ar' ? 8 : 'auto',
                                zIndex: 1,
                                padding: 4
                              }}
                            >
                              <Image 
                                source={require('../assets/app_icons/note.png')} 
                                style={{ 
                                  width: 20, 
                                  height: 20, 
                                  tintColor: 'rgba(165,115,36,0.6)'
                                }}
                                resizeMode="contain"
                              />
                              {/* Note indicator dot */}
                              {ayahNotes[ayahNumber] && (
                                <View style={{
                                  position: 'absolute',
                                  top: -2,
                                  right: -2,
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: '#5b7f67',
                                  borderWidth: 1,
                                  borderColor: '#F5E6C8'
                                }} />
                              )}
                            </TouchableOpacity>
                          )}
                          
                          {/* Centered ayah label - takes full width for proper centering */}
                          <View style={{ flex: 1, alignItems: 'center', width: '100%' }}>
                            <Text variant="body1" style={[
                              styles.ayahItemText,
                              currentAyahIndex === originalIndex && { 
                                color: '#666666',
                                fontWeight: 'bold',
                                fontSize: 18
                              },
                              { textAlign: 'center' }
                            ]}>
                              {ayah.type === 'istiadhah' ? (language === 'ar' ? t('istiadhah') : "Isti'adhah") :
                               ayah.type === 'bismillah' ? t('bismillah') :
                               `${t('ayah')} ${toArabicNumber(ayahNumber)}`}
                            </Text>
                            
                            {/* Current ayah indicator - underline under the label */}
                            {currentAyahIndex === originalIndex && (
                              <View style={{
                                width: '20%',
                                height: 2,
                                backgroundColor: '#5b7f67',
                                marginTop: 4,
                                borderRadius: 1,
                                alignSelf: 'center',
                              }} />
                            )}
                          </View>
                          
                          {/* Completion dot on the right - absolute positioned */}
                          {ayah.type === 'ayah' && memorizationData?.memorizedAyahs[surahName]?.completedAyaat?.includes(ayahNumber) && (
                            <View style={[styles.ayahDot, { 
                              position: 'absolute',
                              right: language === 'ar' ? 'auto' : 8,
                              left: language === 'ar' ? 8 : 'auto',
                              zIndex: 1
                            }]} />
                          )}
                        </View>
                  </TouchableOpacity>
                );
              })}
                  {/* Next Surah Button */}
                  {nextSurah && (
                    <TouchableOpacity
                      style={styles.surahNavButton}
                      onPress={async () => {
                        setShowGoToModal(false);
                        
                        // Load data to get memorization progress for the target surah
                        const data = await loadData();
                        const targetSurahName = getOriginalSurahName(nextSurah.surah);
                        const targetSurahData = data.memorizedAyahs[targetSurahName];
                        
                        let resumeFromIndex = 0;
                        console.log('[Navigation Modal - Next] Target surah data:', targetSurahData);
                        if (targetSurahData?.currentFlashcardIndex !== undefined && targetSurahData?.currentFlashcardIndex >= 0) {
                          // Use the saved flashcard index directly
                          resumeFromIndex = targetSurahData.currentFlashcardIndex;
                          console.log('[Navigation Modal - Next] Using saved flashcard index:', resumeFromIndex);
                        } else {
                          console.log('[Navigation Modal - Next] No saved position, starting from beginning');
                        }
                        
                        // Save current position before navigating
                        try {
                          await saveCurrentPosition(surahName, currentAyahIndex);
                        } catch (error) {
                          console.error('[MemorizationScreen] Error saving position before navigation:', error);
                        }
                        
                        navigation.replace('Memorization', { 
                          surah: nextSurah,
                          resumeFromIndex
                        });
                      }}
                    >
                      <Text variant="body1" style={[styles.surahNavButtonText, { color: '#F5E6C8' }, language === 'ar' && { textAlign: 'center' }] }>
                        {language === 'ar' ? `${t(`surah_${nextSurah.surah}`)} .${toArabicNumber(nextSurah.surah)}` : `${nextSurah.surah}. ${getDisplaySurahName(nextSurah.surah)} →`}
                      </Text>
                    </TouchableOpacity>
                  )}
            </ScrollView>
            
            <TouchableOpacity style={[styles.surahNavButton, { backgroundColor: '#5b7f67', marginTop: 8 }]} onPress={() => ayahListRef.current?.scrollToEnd({ animated: true })}>
              <Image 
                source={require('../assets/app_icons/down-up.png')} 
                style={{ width: 24, height: 24, tintColor: 'rgba(64, 64, 64, 0.9)' }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            {/* Note Input Section */}
            {showNoteInput && currentNoteAyah && (
              <View style={styles.noteInputContainer}>
                <Text style={styles.noteInputLabel}>
                  {language === 'ar' ? `[${surahNumber}: ${currentNoteAyah.number}] ملاحظة` : `[${surahNumber}: ${currentNoteAyah.number}] Note`}
                </Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder={language === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                  placeholderTextColor="#999"
                  value={noteText}
                  onChangeText={handleNoteTextChange}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.noteButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.noteButton, styles.noteCancelButton]}
                    onPress={handleNoteClose}
                  >
                    <Text style={styles.noteButtonText}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.noteButton, styles.noteSaveButton]}
                    onPress={handleNoteSave}
                  >
                    <Text style={[
                      styles.noteButtonText,
                      noteSaved && { color: '#F5E6C8' }
                    ]}>
                      {noteSaved ? (language === 'ar' ? 'تم الحفظ' : 'Saved') : (language === 'ar' ? 'حفظ' : 'Save')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.noteButton, styles.noteShareButton]}
                    onPress={() => {
                      // Show share options
                      Alert.alert(
                        language === 'ar' ? 'خيارات المشاركة' : 'Share Options',
                        language === 'ar' ? 'اختر كيف تريد مشاركة هذه الملاحظة' : 'Choose how you want to share this note',
                        [
                          {
                            text: language === 'ar' ? 'إلغاء' : 'Cancel',
                            style: 'cancel',
                          },
                          {
                            text: language === 'ar' ? 'نشر على لوحة الملاحظات' : 'Post on Notes Board',
                            onPress: async () => {
                              try {
                                // Save note to Notes Board
                                const noteKey = `note_${surahNumber}_${currentNoteAyah.number}`;
                                const noteContent = noteText.trim();
                                
                                if (noteContent) {
                                  // Save to Notes Board storage
                                  const notesBoardKey = 'notes_board';
                                  const existingNotes = await AsyncStorage.getItem(notesBoardKey);
                                  const notesArray = existingNotes ? JSON.parse(existingNotes) : [];
                                  
                                  const newNote = {
                                    id: Date.now().toString(),
                                    surahNumber: surahNumber,
                                    ayahNumber: currentNoteAyah.number,
                                    content: noteContent,
                                    timestamp: new Date().toISOString(),
                                    author: 'User', // This can be enhanced later with user authentication
                                    surahName: getDisplaySurahName(surahNumber)
                                  };
                                  
                                  notesArray.push(newNote);
                                  await AsyncStorage.setItem(notesBoardKey, JSON.stringify(notesArray));
                                  
                                  Alert.alert(
                                    language === 'ar' ? 'تم النشر' : 'Posted!',
                                    language === 'ar' ? 'تم نشر ملاحظتك على لوحة الملاحظات' : 'Your note has been posted to the Notes Board!'
                                  );
                                } else {
                                  Alert.alert(
                                    language === 'ar' ? 'خطأ' : 'Error',
                                    language === 'ar' ? 'لا يمكن نشر ملاحظة فارغة' : 'Cannot post an empty note'
                                  );
                                }
                              } catch (error) {
                                console.error('[MemorizationScreen] Error posting to Notes Board:', error);
                                Alert.alert(
                                  language === 'ar' ? 'خطأ' : 'Error',
                                  language === 'ar' ? 'فشل في نشر الملاحظة' : 'Failed to post note'
                                );
                              }
                            },
                          },
                          {
                            text: language === 'ar' ? 'مشاركة مع الأصدقاء' : 'Share with Friends',
                            onPress: () => {
                              // Share with friends functionality
                              console.log('Sharing with friends for ayah:', currentNoteAyah.number);
                              // This can be implemented with native sharing
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.noteButtonText}>
                      {language === 'ar' ? 'مشاركة' : 'Share'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Two Button Row */}
            <View style={{ flexDirection: 'row', width: '90%', marginTop: 16, gap: 12 }}>
              {/* Surah List Button */}
              <TouchableOpacity 
                style={{
                  backgroundColor: 'rgba(165,115,36,0.8)',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  setShowGoToModal(false);
                  navigation.navigate('SurahList');
                }}
              >
                <Text style={{ color: '#F5E6C8', fontWeight: 'bold' }}>
                  {language === 'ar' ? 'قائمة السور' : 'Surah List'}
                </Text>
              </TouchableOpacity>

              {/* Current Ayah Button */}
              <TouchableOpacity 
                style={{
                  backgroundColor: '#5b7f67',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
                onPress={() => {
                  if (ayahListRef.current) {
                    const currentAyah = flashcards[currentAyahIndex];
                    if (currentAyah) {
                      const ayahIndex = getFilteredAyaat().findIndex(ayah => 
                        flashcards.indexOf(ayah) === currentAyahIndex
                      );
                      
                      if (ayahIndex !== -1) {
                        const itemHeight = 60;
                        const scrollPosition = Math.max(0, (ayahIndex * itemHeight) - 100);
                        
                        ayahListRef.current.scrollTo({
                          y: scrollPosition,
                          animated: true
                        });
                      }
                    }
                  }
                }}
              >
                <Text style={{ color: '#F5E6C8', fontWeight: 'bold', marginRight: 8 }}>
                  {language === 'ar' ? 'الآية الحالية' : 'Current Ayah'}
                </Text>
                <Image 
                  source={require('../assets/app_icons/navigation.png')} 
                  style={{ width: 16, height: 16, tintColor: '#F5E6C8' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            
            <Button
              title={t('close')}
              onPress={() => {
                setShowGoToModal(false);
                setSearchText('');
              }}
              style={{ backgroundColor: 'rgba(96, 96, 96, 0.9)', marginTop: 16, width: '90%' }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Animated Reward Modal */}
      <AnimatedRewardModal
        visible={showReward}
        rewardAmount={rewardAmount}
        onClose={() => setShowReward(false)}
        onRecordFullSurah={async () => {
          setShowReward(false);
          setShowFullSurahRecordingsModal(true);
        }}
        onSurahList={() => {
          setShowReward(false);
          navigation.navigate('SurahList', { refresh: true, currentSurahId: surahNumber, refreshRecordings: true });
        }}
        onNext={async () => {
          setShowReward(false);
          
          // Calculate the real reward for the ayah
          const reward = rewardAmount || 1;
          // Get previous streak from storage before adding hasanat
          const prevStreakFromStorage = await getCurrentStreak();
          // Add the real hasanat and update streak
          await addHasanat(reward);
          // Wait a bit to ensure AsyncStorage is updated
          await new Promise(res => setTimeout(res, 150));
          // Get new streak from storage
          const currentStreak = await getCurrentStreak();
          if (currentStreak > prevStreakFromStorage) {
            setNewStreak(currentStreak);
            setShowStreakAnimation(true);
            setPreviousStreak(prevStreakFromStorage);
          }
          
          if (currentAyahIndex < flashcards.length - 1) {
            setCurrentAyahIndex(currentAyahIndex + 1);
            setIsTextHidden(false);
            // Reload memorization data to update dots
            await loadMemorizationData();
          } else {
            // This is the last ayah, show full surah reward
            setIsFullSurahCompletion(true);
            // Calculate total hasanat from all ayahs in the surah (not session hasanat)
            const totalAyahHasanat = flashcards
              .filter(card => card.type === 'ayah')
              .reduce((total, card) => total + (card.text.length * 10), 0);
            setFullSurahHasanat(totalAyahHasanat);
            setShowFullSurahReward(true);
          }
        }}
        isLastAyah={currentAyahIndex === flashcards.length - 1}
        isFullSurah={false}
        language={language}
        toArabicNumber={toArabicNumber}
      />

      {/* Full Surah Reward Modal */}
      <AnimatedRewardModal
        visible={showFullSurahReward}
        rewardAmount={fullSurahHasanat}
        onClose={() => setShowFullSurahReward(false)}
        onRecordFullSurah={async () => {
          setShowFullSurahReward(false);
          setShowFullSurahRecordingsModal(true);
        }}
        onSurahList={() => {
          setShowFullSurahReward(false);
          navigation.navigate('SurahList', { refresh: true, currentSurahId: surahNumber, refreshRecordings: true });
        }}
        onNext={async () => {
          setShowFullSurahReward(false);
          
          // Don't add hasanat to home screen counter for full surah completion
          // The hasanat was already added for each individual ayah during the process
          sessionHasanat.current = 0;
          
          // Navigate to next surah's isti3aadhah
          const allSurahs = getAllSurahs();
          const currentSurahIndex = allSurahs.findIndex(s => s.surah === surahNumber);
          
          // If we're at the last surah, go to the first surah (Al-Fatihah)
          if (currentSurahIndex === allSurahs.length - 1) {
            const firstSurah = allSurahs[0]; // Al-Fatihah
            navigation.navigate('Memorization', { surah: firstSurah, resumeFromIndex: 0 });
          } else {
            // Go to the next surah
            const nextSurah = allSurahs[currentSurahIndex + 1];
            navigation.navigate('Memorization', { surah: nextSurah, resumeFromIndex: 0 });
          }
        }}
        isLastAyah={false}
        isFullSurah={true}
        language={language}
        toArabicNumber={toArabicNumber}
      />

      {/* Full Surah Recordings Modal */}
      <RecordingsModal
        visible={showFullSurahRecordingsModal}
        onClose={() => setShowFullSurahRecordingsModal(false)}
        surahName={surahName}
        ayahNumber="full-surah"
        onRecordingChange={() => {
          // Refresh recordings when they change
          checkRecordings();
        }}
      />

      {/* Streak Animation Modal */}
      <Modal
        visible={showStreakAnimation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStreakAnimation(false)}
      >
        <TouchableOpacity 
          style={[styles.modalOverlay, { justifyContent: 'center' }]}
          activeOpacity={1}
          onPress={() => setShowStreakAnimation(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { 
              justifyContent: 'center',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              width: '90%',
              maxWidth: 400,
              height: 'auto',
              minHeight: 300
            }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <StreakAnimation
              visible={showStreakAnimation}
              newStreak={newStreak}
              onAnimationComplete={handleStreakAnimationComplete}
              isModal={true}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Close X button at top right */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: '#FF4444',
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={{ 
                color: 'white', 
                fontSize: 20, 
                fontWeight: 'bold',
                lineHeight: 20,
              }}>
                ×
              </Text>
            </TouchableOpacity>

            <Text variant="h2" style={{ marginBottom: 16, marginTop: 8, color: '#A57324' }}>Font Settings</Text>
            
            {/* Font Size Slider */}
            <Text style={{ marginBottom: 6, fontWeight: 'bold', color: '#5b7f67', fontSize: 16 }}>Qur2an Font Size</Text>
            <Slider
              style={{ width: 220, height: 40, marginBottom: 16 }}
              minimumValue={24}
              maximumValue={52}
              step={1}
              value={ayahFontSize}
              onValueChange={setAyahFontSize}
              minimumTrackTintColor="#5b7f67"
              maximumTrackTintColor="#CCCCCC"
              thumbTintColor="#A57324"
            />
            
            {/* Font Style Toggle */}
            <Text style={{ marginBottom: 6, fontWeight: 'bold', color: '#5b7f67', fontSize: 16 }}>Qur2an Font Style</Text>
            <TouchableOpacity
              style={{
                backgroundColor: isBoldFont ? '#5b7f67' : '#CCCCCC',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={() => setIsBoldFont(!isBoldFont)}
            >
              <Text style={{ 
                color: isBoldFont ? '#F5E6C8' : '#5b7f67', 
                fontWeight: 'bold', 
                fontSize: 16,
                textAlign: 'center'
              }}>
                {isBoldFont ? 'BOLD' : 'Regular'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

          {/* Translation Modal */}
          <TranslationModal
            visible={showTranslationModal}
            onClose={() => setShowTranslationModal(false)}
            currentSurah={surahNumber}
            currentAyah={
              modalAyahIndex !== null && flashcards[modalAyahIndex]?.type === 'ayah'
                ? flashcards.slice(0, modalAyahIndex + 1).filter(a => a.type === 'ayah').length
                : null
            }
            isFirstAyah={modalAyahIndex === flashcards.findIndex(a => a.type === 'ayah')}
            isLastAyah={modalAyahIndex === flashcards.map((a, i) => a.type === 'ayah' ? i : null).filter(i => i !== null).slice(-1)[0]}
            onAyahChange={dir => {
              // Find all ayah indices
              const ayahIndices = flashcards.map((a, i) => a.type === 'ayah' ? i : null).filter(i => i !== null);
              const currentIdx = ayahIndices.indexOf(modalAyahIndex);
              if (dir === 'prev' && currentIdx > 0) {
                const newIndex = ayahIndices[currentIdx - 1];
                setModalAyahIndex(newIndex);
                setCurrentAyahIndex(newIndex);
                setIsTextHidden(false);
              }
              if (dir === 'next' && currentIdx < ayahIndices.length - 1) {
                const newIndex = ayahIndices[currentIdx + 1];
                setModalAyahIndex(newIndex);
                setCurrentAyahIndex(newIndex);
                setIsTextHidden(false);
              }
            }}
          />

          {/* Reciter Selection Modal */}
          {/* Removed as per edit hint */}

          {/* Bookmark Modal */}
          <BookmarkModal
            visible={showBookmarkModal}
            onClose={handleBookmarkModalClose}
            surahName={surahName}
            surahNumber={surahNumber}
            ayahNumber={flashcards && flashcards[currentAyahIndex]?.type === 'ayah' ? flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length : null}
            onBookmarkChange={handleBookmarkChange}
          />

          {/* Recordings Modal */}
          <RecordingsModal
            visible={showRecordingsModal}
            onClose={handleRecordingsModalClose}
            surahName={surahName}
            ayahNumber={flashcards && flashcards[currentAyahIndex]?.type === 'ayah' ? flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length : null}
            onRecordingChange={checkRecordings}
          />

          {/* Builder Mode Modal */}
          <Modal
            visible={showBuilderModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowBuilderModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowBuilderModal(false)}
            >
              <TouchableOpacity 
                style={styles.modalContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                {/* Close X button at top right */}
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    backgroundColor: '#FF4444',
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={() => setShowBuilderModal(false)}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontSize: 20, 
                    fontWeight: 'bold',
                    lineHeight: 20,
                  }}>
                    ×
                  </Text>
                </TouchableOpacity>

                <Text variant="h2" style={{ marginBottom: 16, marginTop: 8, color: '#A57324' }}>Builder Mode Settings</Text>
                
                {/* Words Per Batch Selection */}
                <Text style={{ marginBottom: 6, fontWeight: 'bold', color: '#5b7f67', fontSize: 16 }}>Words Per Batch</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={{
                        backgroundColor: wordsPerBatch === num ? '#5b7f67' : '#CCCCCC',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        marginHorizontal: 4,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                      onPress={() => setWordsPerBatch(num)}
                    >
                      <Text style={{ 
                        color: wordsPerBatch === num ? '#F5E6C8' : '#5b7f67', 
                        fontWeight: 'bold', 
                        fontSize: 16,
                        textAlign: 'center'
                      }}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Activate Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#5b7f67',
                    paddingHorizontal: 30,
                    paddingVertical: 12,
                    borderRadius: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={activateBuilderMode}
                >
                  <Text style={{ 
                    color: '#F5E6C8', 
                    fontWeight: 'bold', 
                    fontSize: 16,
                    textAlign: 'center'
                  }}>
                    Activate Builder Mode
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* Commented out Al-Kahf modal functionality for now */}
          {/* Enhanced Audio Options Modal for Al-Kahf */}
          {/* <Modal
            visible={showAudioOptionsModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAudioOptionsModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowAudioOptionsModal(false)}
            >
              <TouchableOpacity 
                style={styles.modalContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={{ 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  color: '#A57324', 
                  textAlign: 'center',
                  marginBottom: 20,
                  marginTop: 8
                }}>
                  Audio Options
                </Text>
                
                <Text style={{ 
                  fontSize: 16, 
                  color: '#5b7f67', 
                  textAlign: 'center',
                  marginBottom: 30,
                  lineHeight: 22
                }}>
                  Choose how you'd like to listen to Ayaat
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal> */}

          {/* Commented out Confirmation Modal for Scope Selection */}
          {/* <Modal
            visible={showConfirmationModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowConfirmationModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowConfirmationModal(false)}
            >
              <TouchableOpacity 
                style={styles.modalContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={{ 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  color: '#A57324', 
                  textAlign: 'center',
                  marginBottom: 20,
                  marginTop: 8
                }}>
                  Audio Options
                </Text>
                
                <Text style={{ 
                  fontSize: 16, 
                  color: '#5b7f67', 
                  textAlign: 'center',
                  marginBottom: 30,
                  lineHeight: 22
                }}>
                  Choose your audio option
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal> */}

                {/* All modal content commented out */}

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenModalOverlay}>
          <View style={styles.fullscreenModalContent}>
            {/* Header with translation and close buttons */}
            <View style={styles.fullscreenHeader}>
              {/* Translation button - only show in English mode */}
              {language !== 'ar' && (
                <TouchableOpacity
                  style={styles.fullscreenTranslationButton}
                  onPress={handleTranslationViewToggle}
                >
                  <Image 
                    source={require('../assets/app_icons/translation.png')} 
                    style={[
                      styles.fullscreenTranslationIcon,
                      showTranslationView && styles.fullscreenToggledIcon
                    ]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              
              <Text style={styles.fullscreenTitle}>
                {language === 'ar' ? t(`surah_${surahNumber}`) : getDisplaySurahName(surahNumber)}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.fullscreenCloseButton,
                  {
                    opacity: isExpandButtonPressed ? 1 : 0.6,
                    transform: [{ scale: isExpandButtonPressed ? 1.1 : 1 }]
                  }
                ]}
                onPressIn={() => setIsExpandButtonPressed(true)}
                onPressOut={() => setIsExpandButtonPressed(false)}
                onPress={() => setIsFullscreen(false)}
                activeOpacity={0.8}
              >
                <Image 
                  source={require('../assets/app_icons/expand.png')} 
                  style={[
                    styles.fullscreenExpandButtonIcon,
                    isFullscreen && styles.fullscreenToggledIcon
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            
            {/* Search bar and scroll to bottom button */}
            <View style={styles.fullscreenSearchRow}>
              <View style={styles.fullscreenSearchContainer}>
                <Image 
                  source={require('../assets/app_icons/search.png')} 
                  style={styles.searchIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.fullscreenSearchInput}
                  placeholder="Search ayat..."
                  placeholderTextColor="#999"
                  value={fullscreenSearchText}
                  onChangeText={setFullscreenSearchText}
                />
              </View>
              <TouchableOpacity
                style={styles.scrollToBottomButton}
                onPress={scrollToBottom}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/app_icons/down-up.png')} 
                  style={[
                    styles.scrollToBottomIcon,
                    isAtBottom && styles.scrollToBottomIconFlipped
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            
            {/* Translation view or ayah list */}
            {showTranslationView ? (
              <View style={styles.translationViewContainer}>
                {/* Translator selector */}
                <View style={styles.translatorSelector}>
                  {Object.entries(getTranslationSources()).map(([key, name]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.translatorButton,
                        currentTranslator === key && styles.translatorButtonActive
                      ]}
                      onPress={() => setCurrentTranslator(key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.translatorButtonText,
                        currentTranslator === key && styles.translatorButtonTextActive
                      ]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Translation list */}
                <ScrollView 
                  style={styles.fullscreenScrollView}
                  contentContainerStyle={styles.fullscreenScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {flashcards.map((card, index) => {
                    const translation = card.type === 'ayah' 
                      ? getTranslation(currentTranslator, surahNumber, card.ayah)
                      : card.translation;
                    
                    return (
                      <View 
                        key={index} 
                        style={[
                          styles.fullscreenAyahCard,
                          index === currentAyahIndex && styles.currentAyahCard
                        ]}
                      >
                        <Text style={[
                          styles.fullscreenAyahText,
                          { color: card.type === 'istiadhah' ? '#A57324' :
                                   (card.type === 'bismillah' && surahNumber !== 1) ? '#5b7f67' :
                                   '#333' }
                        ]}>
                          {card.text}
                        </Text>
                        {translation && (
                          <Text style={styles.fullscreenTranslationText}>
                            {translation}
                          </Text>
                        )}
                        {card.type === 'ayah' && (
                          <Text style={styles.fullscreenAyahNumber}>
                            {toArabicNumber(flashcards.slice(0, index + 1).filter(a => a.type === 'ayah').length)}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <ScrollView 
                ref={fullscreenScrollViewRef}
                style={styles.fullscreenScrollView}
                contentContainerStyle={styles.fullscreenScrollContent}
                showsVerticalScrollIndicator={true}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
              {getFilteredFlashcards().map((card, filteredIndex) => {
                // Find the original index in the flashcards array
                const originalIndex = flashcards.findIndex(originalCard => 
                  originalCard === card
                );
                
                return (
                  <View 
                    key={originalIndex} 
                    style={[
                      styles.fullscreenAyahCard,
                      originalIndex === currentAyahIndex && styles.currentAyahCard
                    ]}
                  >
                    <TouchableOpacity 
                      style={styles.fullscreenAyahContent}
                      onPress={() => handleAyahNavigation(originalIndex)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.fullscreenAyahText,
                        { color: card.type === 'istiadhah' ? '#A57324' :
                                 (card.type === 'bismillah' && surahNumber !== 1) ? '#5b7f67' :
                                 '#333' }
                      ]}>
                        {card.text}
                      </Text>
                      {card.type === 'ayah' && (
                        <Text style={styles.fullscreenAyahNumber}>
                          {toArabicNumber(flashcards.slice(0, originalIndex + 1).filter(a => a.type === 'ayah').length)}
                        </Text>
                      )}
                    </TouchableOpacity>
                    
                    {/* Swipeable cover for hide mode */}
                    {isHideMode && card.type === 'ayah' && ayahCovers[originalIndex] && (
                      <TouchableOpacity
                        style={[
                          styles.fullscreenAyahCover,
                          { backgroundColor: originalIndex === currentAyahIndex ? '#A57324' : '#5b7f67' }
                        ]}
                        onPress={() => handleAyahCoverSwipe(originalIndex)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.fullscreenAyahCoverText}>
                          {toArabicNumber(flashcards.slice(0, originalIndex + 1).filter(a => a.type === 'ayah').length)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            )}
            
            {/* Divider */}
            <View style={styles.fullscreenActionButtonsDivider} />
            
            {/* Surah Navigation and Action Buttons */}
            <View style={styles.fullscreenActionButtonsContainer}>
              <TouchableOpacity
                style={[styles.fullscreenActionButton, styles.fullscreenNavButton]}
                onPress={goToPreviousSurah}
                activeOpacity={0.7}
              >
                <Text style={styles.fullscreenActionButtonText}>←</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.fullscreenActionButton}
                onPress={handleHideToggle}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/app_icons/display-frame.png')} 
                  style={styles.fullscreenActionButtonIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.fullscreenActionButton, styles.fullscreenMicOffButton]}
                onPress={handleFullSurahRecord}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/app_icons/mic-off.png')} 
                  style={[
                    styles.fullscreenActionButtonIcon,
                    styles.fullscreenMicOffIcon
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.fullscreenActionButton}
                onPress={handleFullSurahAudio}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/app_icons/audio.png')} 
                  style={styles.fullscreenActionButtonIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.fullscreenActionButton, styles.fullscreenNavButton]}
                onPress={goToNextSurah}
                activeOpacity={0.7}
              >
                <Text style={styles.fullscreenActionButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerWithHome: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.large,
  },
  homeButton: {
    marginRight: SIZES.medium,
  },
  homeIcon: {
    width: 64,
    height: 64,
    borderRadius: 80,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
  },
  progressContainer: {
    marginTop: SIZES.small,
    width: '80%',
  },
  content: {
    flex: 1,
    padding: SIZES.medium,
    justifyContent: 'center',
    paddingBottom: SIZES.extraLarge * 3,
  },
  flashcard: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: SIZES.extraLarge * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E6C8',
    borderColor: COLORS.accent,
    borderWidth: 1,
    width: '100%',
    maxHeight: '85%',
  },
  arabicText: {
    lineHeight: 75,
    color: '#1a1a1a',
    fontSize: 46,
  },
  revealButton: {
    marginVertical: SIZES.medium,
    backgroundColor: COLORS.primary,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.large,
  },
  navButton: {
    flex: 1,
    marginHorizontal: SIZES.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rewardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardModalContent: {
    backgroundColor: '#F5E6C8',
    borderRadius: SIZES.base,
    padding: SIZES.large,
    alignItems: 'center',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  transliterationText: {
    fontStyle: 'italic',
    color: '#999999',
    fontSize: 20,
    marginTop: 20,
    lineHeight: 32,
    backgroundColor: 'transparent',
  },
  goToButton: {
    marginLeft: SIZES.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: SIZES.small,
    paddingTop: SIZES.medium,
    alignItems: 'center',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    paddingBottom: 16,
  },
  ayahList: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 4,
    maxHeight: 250,
    borderWidth: 4,
    borderColor: '#999999',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  ayahItem: {
    padding: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,115,36,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAyahItem: {
    backgroundColor: '#F5E6C8',
    borderRadius: 20,
  },
  ayahItemText: {
    fontFamily: 'System',
    fontSize: 16,
    color: 'rgba(51, 105, 78, 0.8)',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.8)',
    borderRadius: 25,
    padding: SIZES.small,
    marginBottom: 16,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    padding: SIZES.small / 3,
    fontSize: 16,
    height: 28,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.base,
    padding: SIZES.small / 3,
    marginLeft: SIZES.small,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioSection: {
    marginVertical: SIZES.medium,
    padding: SIZES.medium,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.base,
    borderColor: COLORS.accent,
    borderWidth: 1,
  },
  audioLabel: {
    marginBottom: SIZES.small,
    textAlign: 'center',
  },
  audioRecorder: {
    justifyContent: 'center',
  },
  modalAudioRecorder: {
    justifyContent: 'center',
    marginBottom: SIZES.large,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.medium,
    paddingHorizontal: SIZES.large,
    position: 'relative',
  },
  settingsButton: {
    // Left side
  },
  audioButton: {
    // Right side
  },
  reciterButton: {
    marginLeft: SIZES.medium,
  },
  recordButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealButtonNew: {
    backgroundColor: '#F5E6C8',
    borderRadius: 20,
    padding: SIZES.small,
    borderWidth: 3,
    borderColor: 'rgba(51, 105, 78, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    // Right side
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahScroll: {
    flex: 1,
    width: '100%',
  },
  ayahScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingVertical: 60,
    minHeight: 400,
  },
  surahNavButton: {
    backgroundColor: 'rgba(51, 105, 78, 1)',
    padding: SIZES.medium,
    borderRadius: 24,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  surahNavButtonText: {
    color: 'rgba(255, 165, 0, 0.8)',
    fontWeight: 'bold',
    fontSize: 22,
  },
  ayahDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5b7f67',
  },
  noteInputContainer: {
    backgroundColor: '#F5E6C8',
    borderWidth: 2,
    borderColor: '#5b7f67',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    width: '95%',
    alignSelf: 'center',
  },
  noteInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5b7f67',
    marginBottom: 8,
    textAlign: 'center',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#5b7f67',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
    color: '#333',
    marginBottom: 12,
  },
  noteButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  noteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  noteCancelButton: {
    backgroundColor: '#CCCCCC',
  },
  noteSaveButton: {
    backgroundColor: '#5b7f67',
  },
  noteShareButton: {
    backgroundColor: 'rgba(165,115,36,0.8)',
  },
  noteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: SIZES.medium,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  rewardButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, width: '100%' },
  rewardButton: { flex: 1 },
  navigationOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.large,
    paddingHorizontal: SIZES.large,
  },
  bookmarkButton: {
    padding: 0,
    marginHorizontal: 10,
  },
  voiceRecordingButton: {
    // No padding
  },
  placeholderButton: {
    // No margins
  },
  audioSettingsIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#F5E6C8',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#5b7f67',
  },
  // Expand button styles
  expandButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expandButtonIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
  fullscreenExpandButtonIcon: {
    width: 24,
    height: 24,
    tintColor: 'rgba(255, 255, 255, 0.8)',
  },
  // Fullscreen modal styles
  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenModalContent: {
    width: '95%',
    height: '90%',
    backgroundColor: '#F5E6C8',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#A57324',
  },
  fullscreenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5b7f67',
    flex: 1,
    textAlign: 'center',
  },
  fullscreenCloseButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fullscreenTranslationButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fullscreenTranslationIcon: {
    width: 24,
    height: 24,
    tintColor: '#A57324',
  },
  fullscreenScrollView: {
    flex: 1,
  },
  fullscreenScrollContent: {
    paddingBottom: 20,
  },
  fullscreenAyahCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#A57324',
  },
  fullscreenAyahText: {
    fontSize: 28,
    fontFamily: 'KFGQPC HAFS Uthmanic Script Regular',
    color: '#333',
    textAlign: 'right',
    lineHeight: 42,
    marginBottom: 10,
  },
  fullscreenAyahNumber: {
    fontSize: 16,
    color: '#A57324',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  // Search styles
  fullscreenSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  fullscreenSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollToBottomButton: {
    width: 50,
    height: 50,
    backgroundColor: '#A57324',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollToBottomIcon: {
    width: 24,
    height: 24,
    tintColor: '#F5E6C8',
  },
  scrollToBottomIconFlipped: {
    transform: [{ rotate: '180deg' }],
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#A57324',
  },
  fullscreenSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
  },
  // Current ayah highlighting
  currentAyahCard: {
    backgroundColor: '#E8F5E8',
    borderLeftColor: '#5b7f67',
    borderLeftWidth: 6,
  },
  // Translation text styles
  fullscreenTranslationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'left',
    lineHeight: 24,
    marginTop: 5,
    fontStyle: 'italic',
  },
  // Action buttons styles
  fullscreenActionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 8,
  },
  fullscreenActionButtonsDivider: {
    height: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    marginHorizontal: 0,
    marginTop: 20,
  },
  fullscreenActionButton: {
    width: 50,
    height: 50,
    backgroundColor: '#5b7f67',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullscreenActionButtonText: {
    color: '#F5E6C8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fullscreenActionButtonIcon: {
    width: 24,
    height: 24,
    tintColor: '#F5E6C8',
  },
  // Ayah cover styles
  fullscreenAyahContent: {
    flex: 1,
  },
  fullscreenAyahCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fullscreenAyahCoverText: {
    color: '#F5E6C8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Special card styles for isti3aadhah and bismillah
  specialCard: {
    backgroundColor: '#F0E8D8', // Mix between grey (#E8E8E8) and parchment (#F5E6C8)
    borderRadius: 20,
    borderColor: '#C0C0C0',
    borderWidth: 2,
    shadowColor: '#C0C0C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Navigation button styles
  fullscreenNavButton: {
    backgroundColor: '#A57324',
  },
  // Recording button styles
  fullscreenRecordingButton: {
    backgroundColor: '#5b7f67',
  },
  fullscreenRecordingIcon: {
    tintColor: '#F5E6C8',
  },
  fullscreenMicOffIcon: {
    tintColor: '#5b7f67',
  },
  fullscreenMicOffButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5b7f67',
  },
  // Toggled icon styles
  fullscreenToggledIcon: {
    tintColor: '#A57324',
  },
  // Translation view styles
  translationViewContainer: {
    flex: 1,
  },
  translatorSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 5,
    gap: 8,
  },
  translatorButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  translatorButtonActive: {
    backgroundColor: '#A57324',
  },
  translatorButtonText: {
    color: '#F5E6C8',
    fontSize: 10,
    fontWeight: '500',
  },
  translatorButtonTextActive: {
    color: '#F5E6C8',
    fontWeight: 'bold',
  },
});

export default MemorizationScreen; 