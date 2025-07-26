import React, { useState, useRef, useCallback, memo, useMemo, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Animated, Image, ScrollView, TextInput, ImageBackground, TouchableWithoutFeedback, Alert, Pressable, Easing, Platform } from 'react-native';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import CardOrig from '../components/Card';
import ProgressBarOrig from '../components/ProgressBar';
import TranslationModal from '../components/TranslationModal';
import StreakAnimation from '../components/StreakAnimation';
import AnimatedRewardModal from '../components/AnimatedRewardModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { addHasanat, updateMemorizedAyahs, updateStreak, getCurrentStreak, loadData, saveCurrentPosition, saveLastPosition } from '../utils/store';
import { getSurahAyaatWithTransliteration, getAllSurahs } from '../utils/quranData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../utils/languageContext';
import audioPlayer from '../utils/audioPlayer';
import telemetryService from '../utils/telemetry';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Slider from '@react-native-community/slider';
// import Svg, { Circle } from 'react-native-svg'; // Uncomment if using react-native-svg

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const Card = memo(CardOrig);
const ProgressBar = memo(ProgressBarOrig);

const MemorizationScreen = ({ route, navigation }) => {
  console.log('[DEBUG] MemorizationScreen mounted');
  const { language, t } = useLanguage();
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };
  const { surah, resumeFromIndex } = route.params;
  const surahNumber = surah.id || surah.surah || 1;




  
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [newStreak, setNewStreak] = useState(0);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [memorizationData, setMemorizationData] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState(null);
  const [isRepeating, setIsRepeating] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [ayahFontSize, setAyahFontSize] = useState(40);
  const [isBoldFont, setIsBoldFont] = useState(false);

  const allSurahs = getAllSurahs();
  const currentSurahIndex = allSurahs.findIndex(s => s.surah === surahNumber);
  const prevSurah = currentSurahIndex > 0 ? allSurahs[currentSurahIndex - 1] : null;
  const nextSurah = currentSurahIndex < allSurahs.length - 1 ? allSurahs[currentSurahIndex + 1] : null;

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
    } catch (error) {
        setAyaat([{
          type: 'ayah',
          text: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ',
          transliteration: 'Bismillāhir-Raḥmānir-Raḥīm'
        }]);
        setIsTextHidden(false);
    }
    }
    fetchAyaat();
  }, [surahNumber]);

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

  // Audio functionality
  useEffect(() => {
    // Cleanup audio when component unmounts
    return () => {
      audioPlayer.cleanup();
    };
  }, []);

  // Update audio playing status
  useEffect(() => {
    let isMounted = true;
    const updateAudioStatus = async () => {
      try {
        const status = await audioPlayer.getStatus();
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
    if (!ayaat || !Array.isArray(ayaat)) return [];
    const cards = [];
      // 1. Isti'adhah
    cards.push({
        type: 'istiadhah',
        text: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
      transliteration: "A'udhu billahi min ash-shaytan ir-rajim",
      translation: 'I seek protection/refuge in Allah from shay6an, the accursed outcast (eternally expelled and rejected from divine mercy)'
      });
      // 2. Bismillah (if not Al-Fatihah and not Surah 9)
      if (surahNumber !== 1 && surahNumber !== 9) {
      cards.push({
          type: 'bismillah',
          text: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ',
        transliteration: 'Bismillāhir-Raḥmānir-Raḥīm',
        translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'
        });
      }
      // 3. All ayat as normal
    for (let i = 0; i < ayaat.length; i++) {
      cards.push({ ...ayaat[i], type: 'ayah' });
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
      
  // Add this after currentAyahIndex and surah are defined
  React.useEffect(() => {
    if (surah?.name && currentAyahIndex !== undefined && !isResuming.current && flashcardsLoaded.current) {
      saveCurrentPosition(surah.name, currentAyahIndex);
    }
  }, [surah?.name, currentAyahIndex]);

  useEffect(() => {
    if (
      surahNumber === 2 &&
      flashcards[currentAyahIndex]?.type === 'ayah' &&
      flashcards[currentAyahIndex]?.ayah === 4
    ) {
      console.log('[DEBUG] Surah 2, Ayah 4 text:', flashcards[currentAyahIndex]?.text);
    }
  }, [surahNumber, currentAyahIndex, flashcards]);

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
    // Only run heavy logic for ayah cards
    const shouldUpdateStreak = true;
    if (shouldUpdateStreak) updateStreak().catch(console.error);
    const hasanat = flashcards[currentAyahIndex]?.text.length * 10;
    sessionHasanat.current += hasanat;
    setRewardAmount(hasanat);
    setShowReward(true);
    const realAyahIndex = flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length - 1;
    updateMemorizedAyahs(surah.name, realAyahIndex).catch(console.error);
    
    // Track telemetry
    telemetryService.trackHasanatEarned(hasanat, 'ayah_completion');
    telemetryService.trackMemorizationProgress(surah.name, realAyahIndex + 1, ((realAyahIndex + 1) / ayaat.filter(a => a.type === 'ayah').length) * 100);
  };

  const handlePrevious = async () => {
    await audioPlayer.stopAudio();
    setIsAudioPlaying(false);
    if (currentAyahIndex > 0 && ayaat && ayaat.length > 0) {
      setCurrentAyahIndex(currentAyahIndex - 1);
      // Reveal text by default for ayah and bismillah cards
      const prevCard = ayaat[currentAyahIndex - 1];
      if (prevCard?.type === 'ayah' || prevCard?.type === 'bismillah') {
        setIsTextHidden(false);
      } else {
        setIsTextHidden(true);
      }
    }
  };

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (rewardTimeout.current) clearTimeout(rewardTimeout.current);
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
    try {
      await updateStreak();
    } catch (error) {
      console.error('[MemorizationScreen] Error updating streak on reward finish:', error);
    }
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

  // Static audio map for Al-Fatiha and Al-Mulk
  const audioMap = {
    // Al-Fatiha (Surah 1)
    '001_001': require('../assets/AlFatiha_Mishary/001001.mp3'),
    '001_002': require('../assets/AlFatiha_Mishary/001002.mp3'),
    '001_003': require('../assets/AlFatiha_Mishary/001003.mp3'),
    '001_004': require('../assets/AlFatiha_Mishary/001004.mp3'),
    '001_005': require('../assets/AlFatiha_Mishary/001005.mp3'),
    '001_006': require('../assets/AlFatiha_Mishary/001006.mp3'),
    '001_007': require('../assets/AlFatiha_Mishary/001007.mp3'),
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
  };

  function getAyahAudioUri(surahNumber, ayahNumber) {
    const key = `${surahNumber.toString().padStart(3, '0')}_${ayahNumber.toString().padStart(3, '0')}`;
    const audioRequire = audioMap[key];
    if (!audioRequire) return null;
    return audioRequire; // Return the require() result directly
  }

  // Replace handleAudioPlay with toggle logic
  const handleAudioButtonPress = async () => {
    const status = await audioPlayer.getStatus();
    if (status.isPlaying) {
      await audioPlayer.pauseAudio();
      setIsAudioPlaying(false);
    } else {
      // Play current ayah
      const currentFlashcard = flashcards[currentAyahIndex];
      if (currentFlashcard && currentFlashcard.type === 'ayah') {
        let ayahNumber = 0;
        for (let i = 0; i <= currentAyahIndex; i++) {
          if (flashcards[i].type === 'ayah') ayahNumber++;
        }
        const audioSource = getAyahAudioUri(surahNumber, ayahNumber);
        if (audioSource) {
          await audioPlayer.playAudio(audioSource);
          setIsAudioPlaying(true);
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
    // Two haptic feedbacks: one instant, one after 750ms
    ReactNativeHapticFeedback.trigger('impactMedium', { enableVibrateFallback: true });
    setTimeout(() => {
      ReactNativeHapticFeedback.trigger('impactMedium', { enableVibrateFallback: true });
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
        await audioPlayer.playAudio(audioSource);
        setIsAudioPlaying(true);
      }
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const fontCandidates = ['UthmanTN_v2-0', 'UthmanTN', 'KFGQPC Uthman Taha Naskh', 'Uthman Taha Naskh'];
  const fontFamily = fontCandidates[currentAyahIndex % fontCandidates.length];

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
                // Update streak when leaving the screen
                try {
                  await updateStreak();
                } catch (error) {
                  console.error('[MemorizationScreen] Error updating streak on home press:', error);
                }
                // Explicitly save current position
                try {
                  console.log('[DEBUG] About to save position - surah.name:', surah.name, 'currentAyahIndex:', currentAyahIndex);
                  await saveCurrentPosition(surah.name, currentAyahIndex);
                  await saveLastPosition(surah.name, surahNumber, currentAyahIndex);
                  console.log('[MemorizationScreen] Explicitly saved on Home:', surah.name, currentAyahIndex);
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
                {language === 'ar' ? t(`surah_${surahNumber}`) : (cleanSurahName(surah?.name) || 'Surah')}
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
                    ? { fontFamily: 'UthmanTNB_v2-0', fontSize: 28, color: '#5b7f67', textAlign: 'center', marginBottom: 8 }
                    : [FONTS.h2.getFont(language), { color: '#5b7f67', textAlign: 'center', marginBottom: 8 }],
                ]}
              >
                {language === 'ar' ? t(`surah_${surahNumber}`) : cleanSurahName(surah.name)}
              </Text>
            </View>
            */}
        <Animated.View style={[styles.flashcard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }] }>
                <Card variant="elevated" style={[styles.card, { flex: 1 }]}> 
                  <ScrollView style={styles.ayahScroll} contentContainerStyle={styles.ayahScrollContent} showsVerticalScrollIndicator={true}>
            <Text
              variant="h2"
              style={[styles.arabicText, { 
                fontFamily: isBoldFont ? 'KFGQPC Uthman Taha Naskh Bold' : 'KFGQPC Uthman Taha Naskh', 
                fontSize: ayahFontSize, 
                textAlign: 'center', 
                alignSelf: 'center', 
                writingDirection: 'rtl',
                textAlignVertical: 'center',
                includeFontPadding: false,
                textAlign: 'center'
              }]}
              align="center"
              allowFontScaling={false}
              lang="ar"
            >
              {isTextHidden
                ? (flashcards[currentAyahIndex]?.text ? '⬡'.repeat(Math.min(44, Math.ceil(flashcards[currentAyahIndex]?.text.length / 2))) : '')
                : flashcards[currentAyahIndex]?.text}
            </Text>
            {/* Show transliteration only when text is not hidden and not in Arabic mode */}
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
                        style={[styles.transliterationText, { color: COLORS.primary, fontWeight: 'bold', marginTop: 8 }]}
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
                  </ScrollView>
          </Card>
        </Animated.View>
            </View>
            {/* Button row below flashcard */}
            {flashcards && flashcards[currentAyahIndex] && ((flashcards[currentAyahIndex]?.type === 'ayah') || 
              (flashcards[currentAyahIndex]?.type === 'bismillah' && surahNumber === 1)) && (
          <View style={styles.buttonRow}>
            {/* Settings Button */}
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettingsModal(true)}
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
                  source={require('../assets/app_icons/slider.png')} 
                  style={{ width: 28, height: 28, tintColor: '#F5E6C8' }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            {/* Audio Button with Reciter Preference */}
            <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
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
                <Pressable
                  style={styles.audioButton}
                  onPress={handleAudioButtonPress}
                  onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
                  onLongPress={async () => {
                    ReactNativeHapticFeedback.trigger('impactMedium', { enableVibrateFallback: true });
                    await handleAudioButtonLongPress();
                  }}
                  delayLongPress={500}
                >
                  <View style={{
                    borderWidth: 2,
                    borderColor: isAudioPlaying ? '#FFD700' : '#5b7f67',
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
                    backgroundColor: 'transparent',
                  }}>
                    <Image
                      source={require('../assets/app_icons/audio.png')}
                      style={{
                        width: 28,
                        height: 28,
                        tintColor: isAudioPlaying ? '#FFD700' : '#F5E6C8',
                      }}
                      resizeMode="contain"
                    />
                  </View>
                </Pressable>
              </View>
            {/* Centered: Reveal/Hide Button */}
            <TouchableOpacity
              style={[styles.revealButtonNew, {
                backgroundColor: isTextHidden ? '#F5E6C8' : 'rgba(245, 230, 200, 0.7)',
                padding: SIZES.medium,
                width: 160,
                minHeight: 40,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                left: '50%',
                transform: [{ translateX: -60 }],
              }]}
              onPress={() => {
                ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
                handleRevealToggle();
              }}
            >
              <Text variant="body1" color="primary" style={[styles.revealButtonText, { 
                fontSize: isTextHidden ? 18 : 22,
                color: isTextHidden ? COLORS.primary : '#333333',
                fontWeight: isTextHidden ? 'bold' : 'bold',
                textAlign: 'center',
              }]}>
                {isTextHidden ? t('reveal') : t('hide')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Navigation buttons overlaid */}
        <View style={styles.navigationOverlay}>
          <Button
            title={currentAyahIndex === 0 ? t('back') : t('previous')}
            onPress={async () => {
              ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
              if (currentAyahIndex === 0) {
                // Update streak when going back to surah list
                try {
                  await updateStreak();
                } catch (error) {
                  console.error('[MemorizationScreen] Error updating streak on back press:', error);
                }
                navigation.navigate('SurahList');
              } else {
                handlePrevious();
              }
            }}
            disabled={showReward}
            style={[styles.navButton, { backgroundColor: '#5b7f67' }]}
          />
          <Button
                            title={currentAyahIndex === 0 ? t('start') : (flashcards && currentAyahIndex === flashcards.length - 1 ? t('finish') : t('next'))}
            onPress={async () => {
              ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h2" style={{ marginBottom: 16, color: 'rgba(64, 64, 64, 0.9)' }}>{t('navigation')}</Text>
            
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
              <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
                <Image 
                  source={require('../assets/app_icons/search.png')} 
                  style={{ width: 20, height: 20, tintColor: COLORS.white }}
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
                        const targetSurahData = data.memorizedAyahs[prevSurah.name];
                        
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
                          await saveCurrentPosition(surah.name, currentAyahIndex);
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
                        {language === 'ar' ? `${t(`surah_${prevSurah.surah}`)} .${toArabicNumber(prevSurah.surah)}` : `← ${prevSurah.surah}. ${cleanSurahName(prevSurah.name)}`}
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
                        <View style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <View style={{ flex: 1, alignItems: 'center' }}>
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
                          </View>
                          {ayah.type === 'ayah' && memorizationData?.memorizedAyahs[surah.name]?.completedAyaat?.includes(ayahNumber) && (
                            <View style={styles.ayahDot} />
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
                        const targetSurahData = data.memorizedAyahs[nextSurah.name];
                        
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
                          await saveCurrentPosition(surah.name, currentAyahIndex);
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
                        {language === 'ar' ? `${t(`surah_${nextSurah.surah}`)} .${toArabicNumber(nextSurah.surah)}` : `${nextSurah.surah}. ${cleanSurahName(nextSurah.name)} →`}
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
            
            <Button
              title={t('close')}
              onPress={() => {
                setShowGoToModal(false);
                setSearchText('');
              }}
              style={{ backgroundColor: 'rgba(96, 96, 96, 0.9)', marginTop: 16, width: '90%' }}
            />
          </View>
        </View>
      </Modal>

      {/* Animated Reward Modal */}
      <AnimatedRewardModal
        visible={showReward}
        rewardAmount={rewardAmount}
        onClose={() => setShowReward(false)}
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
            // Add all session hasanat at the end of the surah
            try {
              await addHasanat(sessionHasanat.current);
            } catch (error) {
              console.error('[MemorizationScreen] Error updating streak on reward finish:', error);
            }
            sessionHasanat.current = 0;
            navigation.navigate('SurahList', { refresh: true });
          }
        }}
        isLastAyah={currentAyahIndex === flashcards.length - 1}
        language={language}
        toArabicNumber={toArabicNumber}
      />

      {/* Streak Animation Modal */}
      <Modal
        visible={showStreakAnimation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStreakAnimation(false)}
      >
        <StreakAnimation
          visible={showStreakAnimation}
          newStreak={newStreak}
          onAnimationComplete={handleStreakAnimationComplete}
              />
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
          </View>
        </View>
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
    marginTop: 12,
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
    padding: SIZES.small,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.base,
    padding: SIZES.small,
    marginLeft: SIZES.small,
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
    justifyContent: 'space-between',
    marginBottom: SIZES.medium,
    paddingHorizontal: SIZES.medium,
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
    paddingVertical: 20,
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
    marginTop: SIZES.large,
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
});

export default MemorizationScreen; 