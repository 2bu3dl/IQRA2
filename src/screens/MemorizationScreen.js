import React, { useState, useRef, useCallback, memo, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Animated, Image, ScrollView, TextInput, ImageBackground, TouchableWithoutFeedback } from 'react-native';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import CardOrig from '../components/Card';
import ProgressBarOrig from '../components/ProgressBar';
import TranslationModal from '../components/TranslationModal';
import StreakAnimation from '../components/StreakAnimation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { addHasanat, updateMemorizedAyahs, updateStreak, getCurrentStreak, loadData, saveCurrentPosition } from '../utils/store';
import { getSurahAyaatWithTransliteration, getAllSurahs } from '../utils/quranData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../utils/languageContext';
// import Svg, { Circle } from 'react-native-svg'; // Uncomment if using react-native-svg

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const Card = memo(CardOrig);
const ProgressBar = memo(ProgressBarOrig);

const MemorizationScreen = ({ route, navigation }) => {
  const { language, t } = useLanguage();
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };
  const { surah } = route.params;
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

  const allSurahs = getAllSurahs();
  const currentSurahIndex = allSurahs.findIndex(s => s.surah === surahNumber);
  const prevSurah = currentSurahIndex > 0 ? allSurahs[currentSurahIndex - 1] : null;
  const nextSurah = currentSurahIndex < allSurahs.length - 1 ? allSurahs[currentSurahIndex + 1] : null;

  React.useEffect(() => {
    async function fetchAyaat() {
      try {
        const data = await getSurahAyaatWithTransliteration(surahNumber);
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
    console.log('[MemorizationScreen] Resume effect - route.params:', route.params, 'flashcards.length:', flashcards.length);
    if (route.params?.resumeFromIndex !== undefined && flashcards.length > 0) {
      const resumeIndex = Math.min(route.params.resumeFromIndex, flashcards.length - 1);
      console.log('[MemorizationScreen] Setting currentAyahIndex to:', resumeIndex);
      
      // Only set the position if the flashcards are properly loaded and the index is valid
      if (flashcards.length > 10 && resumeIndex < flashcards.length) {
        isResuming.current = true;
        setCurrentAyahIndex(resumeIndex);
        setIsTextHidden(false);
        flashcardsLoaded.current = true;
        // Reset the flag after a short delay
        setTimeout(() => {
          isResuming.current = false;
        }, 100);
      }
    }
  }, [flashcards, route.params?.resumeFromIndex]);

  // Add this after currentAyahIndex and surah are defined
  React.useEffect(() => {
    if (surah?.name && currentAyahIndex !== undefined && !isResuming.current && flashcardsLoaded.current) {
      saveCurrentPosition(surah.name, currentAyahIndex);
    }
  }, [surah?.name, currentAyahIndex]);

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
  };

  const handlePrevious = () => {
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

  // Reward modal animation
  const rewardScale = useRef(new Animated.Value(0.8)).current;
  React.useEffect(() => {
    if (showReward) {
      Animated.spring(rewardScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      rewardScale.setValue(0.8);
    }
  }, [showReward, rewardScale]);

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
    navigation.navigate('Home');
  }

  const handleStreakAnimationComplete = () => {
    setShowStreakAnimation(false);
  };

  // Function to clean surah name by removing existing numbers
  const cleanSurahName = (name) => {
    return name.replace(/^\d+\.?\s*/, ''); // Remove number and period at the beginning
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
                // Update streak when leaving the screen
                try {
                  await updateStreak();
                } catch (error) {
                  console.error('[MemorizationScreen] Error updating streak on home press:', error);
                }
                // Explicitly save current position
                try {
                  await saveCurrentPosition(surah.name, currentAyahIndex);
                  console.log('[MemorizationScreen] Explicitly saved on Home:', surah.name, currentAyahIndex);
                } catch (error) {
                  console.error('[MemorizationScreen] Error saving current position on Home:', error);
                }
            if (sessionHasanat.current > 0) {
              addHasanat(sessionHasanat.current);
              sessionHasanat.current = 0;
            }
            navigation.navigate('Home');
          }}
        >
              <Image source={language === 'ar' ? require('../assets/IQRA2iconArabic.png') : require('../assets/IQRA2icon.png')} style={styles.homeIcon} resizeMode="contain" />
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
            <View style={{ flex: 1, justifyContent: 'center' }}>
        <Animated.View style={[styles.flashcard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }] }>
                <Card variant="elevated" style={[styles.card, { flex: 1 }]}> 
                  <ScrollView style={styles.ayahScroll} contentContainerStyle={styles.ayahScrollContent} showsVerticalScrollIndicator={true}>
            <Text
              variant="h2"
              style={[FONTS.arabic, styles.arabicText, { textAlign: 'center', alignSelf: 'center' }]}
              align="center">
                      {flashcards[currentAyahIndex]?.type === 'istiadhah'
                        ? flashcards[currentAyahIndex]?.text || ''
                        : (isTextHidden ? '⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡' : flashcards[currentAyahIndex]?.text || '')
              }
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
            
            {/* Audio Button */}
                <TouchableOpacity
              style={styles.audioButton}
              onPress={() => {
                // Audio recitations coming soon!
              }}
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
                  source={require('../assets/app_icons/audio.png')} 
                  style={{ width: 28, height: 28, tintColor: '#F5E6C8' }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
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
              onPress={handleRevealToggle}
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
            onPress={handleNext}
            disabled={showReward}
            style={[styles.navButton, { backgroundColor: '#5b7f67' }]}
          />
        </View>
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
                  writingDirection: language === 'ar' ? 'rtl' : 'ltr'
                }]}
                placeholder={t('search_ayah')}
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

      {/* Reward Modal */}
      <Modal
        visible={showReward}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReward(false)}
      >
            <View style={[styles.rewardModalOverlay, { justifyContent: 'flex-end', alignItems: 'center' }]}>
              <Animated.View style={[styles.rewardModalContent, { transform: [{ scale: rewardScale }], marginBottom: 20 }] }>
                <Text variant="h2" style={{ color: '#33694e' }}>{t('masha2allah')}</Text>
                <Text variant="body1" style={{ color: '#3E2723' }}>
                  {language === 'ar' ? (
                    <>
                      لقد كسبت{' '}
                      <Text style={{ 
                        color: 'rgba(165,115,36,0.8)', 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(165,115,36,0.8)',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 4,
                      }}>
                        {toArabicNumber(rewardAmount)}
            </Text>
                      {' '}حسنة لهذه الآية!
                    </>
                  ) : (
                    <>
                      You've earned{' '}
                      <Text style={{ 
                        color: 'rgba(165,115,36,0.8)', 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(165,115,36,0.8)',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 4,
                      }}>
                        {toArabicNumber(rewardAmount)}
            </Text>
                      {' '}7asanaat for this Ayah!
                    </>
                  )}
                </Text>
            <Text variant="body2" style={{ marginTop: 8, fontStyle: 'italic', color: '#555' }}>
              {t('insha2allah')}
            </Text>
                <View style={styles.rewardButtonRow}>
            <Button
                    title={t('revise')}
                    onPress={() => setShowReward(false)}
                    style={[styles.rewardButton, { backgroundColor: '#5b7f67', marginRight: 8 }]}
                  />
            <Button
                              title={currentAyahIndex === flashcards.length - 1 ? t('next_surah') : t('next_ayah')}
                    onPress={async () => {
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
                  navigation.navigate('SurahList');
                }
              }}
                    style={[styles.rewardButton, { backgroundColor: '#5b7f67' }]}
            />
                </View>
          </Animated.View>
        </View>
      </Modal>

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
                <Text variant="h2" style={{ marginBottom: 16 }}>Settings</Text>
            
              <Button
                  title="Close"
                onPress={() => setShowSettingsModal(false)}
                style={{ backgroundColor: '#5b7f67' }}
              />
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
    backgroundColor: 'rgba(64, 64, 64, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 32,
    padding: SIZES.large,
    alignItems: 'center',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 4,
    width: '95%',
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
});

export default MemorizationScreen; 