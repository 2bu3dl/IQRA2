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
import { addHasanat, updateMemorizedAyahs, updateStreak, getCurrentStreak } from '../utils/store';
import { getSurahAyaatWithTransliteration, getAllSurahs } from '../utils/quranData';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import Svg, { Circle } from 'react-native-svg'; // Uncomment if using react-native-svg

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const Card = memo(CardOrig);
const ProgressBar = memo(ProgressBarOrig);

const MemorizationScreen = ({ route, navigation }) => {
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
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ayahListRef = useRef(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [newStreak, setNewStreak] = useState(0);
  const [previousStreak, setPreviousStreak] = useState(0);

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
                
            if (sessionHasanat.current > 0) {
              addHasanat(sessionHasanat.current);
              sessionHasanat.current = 0;
            }
            navigation.navigate('Home');
          }}
        >
              <Image source={require('../assets/IQRA2icon.png')} style={styles.homeIcon} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
              <Text variant="h2" color="primary" style={{ textAlign: 'center', width: '100%' }}>{surah?.name || 'Surah'}</Text>
          <Text variant="body1" style={{ textAlign: 'center', width: '100%' }}>
                {flashcards && flashcards[currentAyahIndex]?.type === 'ayah'
                  ? `Ayah ${flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length}`
                  : flashcards && flashcards[currentAyahIndex]?.type === 'istiadhah'
                ? "Isti3aadhah"
                : 'Bismillah'}
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
          <Ionicons name="navigate" size={24} color={COLORS.primary} />
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
                  <Ionicons name="language" size={24} color={COLORS.primary} />
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
              style={[FONTS.arabic, styles.arabicText]}
              align="center">
                      {flashcards[currentAyahIndex]?.type === 'istiadhah'
                        ? flashcards[currentAyahIndex]?.text || ''
                        : (isTextHidden ? '••••••••••••••••••••••••••••••••••••••••' : flashcards[currentAyahIndex]?.text || '')
              }
            </Text>
            {/* Show transliteration always */}
            <Text
              variant="body2"
              style={styles.transliterationText}
              align="center"
            >
              {stripHtmlTags(flashcards[currentAyahIndex]?.transliteration || '')}
            </Text>
                    {/* Show bismillah translation for bismillah card only */}
                    {flashcards[currentAyahIndex]?.type === 'bismillah' && (
                      <Text
                        variant="body2"
                        style={[styles.transliterationText, { color: COLORS.primary, fontWeight: 'bold', marginTop: 8 }]}
                        align="center"
                      >
                        {flashcards[currentAyahIndex]?.translation}
                      </Text>
                    )}
                    {/* Show istiadhah translation for istiadhah card only */}
                    {flashcards[currentAyahIndex]?.type === 'istiadhah' && (
                      <Text
                        variant="body2"
                        style={[styles.transliterationText, { color: COLORS.primary, fontWeight: 'bold', marginTop: 8 }]}
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
              <Ionicons name="settings" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            {/* Right: Reveal/Hide Button */}
            <TouchableOpacity
              style={styles.revealButtonNew}
              onPress={handleRevealToggle}
            >
              <Text variant="body1" color="primary" style={styles.revealButtonText}>
                {isTextHidden ? 'Reveal' : 'Hide'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Navigation buttons overlaid */}
        <View style={styles.navigationOverlay}>
          <Button
            title={currentAyahIndex === 0 ? 'Back' : 'Previous'}
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
            style={styles.navButton}
          />
          <Button
            title={currentAyahIndex === 0 ? 'Start' : (flashcards && currentAyahIndex === flashcards.length - 1 ? 'Finish' : 'Next')}
            onPress={handleNext}
            disabled={showReward}
            style={styles.navButton}
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
            <Text variant="h2" style={{ marginBottom: 16, color: 'rgba(64, 64, 64, 0.9)' }}>Navigate to Ayah..</Text>
            
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter ayah number..."
                value={searchText}
                onChangeText={setSearchText}
                keyboardType="numeric"
                onSubmitEditing={handleSearchSubmit}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
                <Ionicons name="search" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            
                <View style={{ marginBottom: 8 }}>
                  <TouchableOpacity style={[styles.surahNavButton, { backgroundColor: COLORS.primary }]} onPress={() => ayahListRef.current?.scrollTo({ y: 0, animated: true })}>
                    <Ionicons name="chevron-up" size={24} color="rgba(64, 64, 64, 0.9)" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView ref={ayahListRef} style={styles.ayahList} showsVerticalScrollIndicator={false}>
                  {/* Previous Surah Button */}
                  {prevSurah && (
                    <TouchableOpacity
                      style={styles.surahNavButton}
                      onPress={() => {
                        setShowGoToModal(false);
                        navigation.replace('Memorization', { surah: prevSurah });
                      }}
                    >
                      <Text variant="body1" style={styles.surahNavButtonText}>
                        ← {prevSurah.surah}. {cleanSurahName(prevSurah.name)}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text variant="body1" style={[
                      styles.ayahItemText,
                      currentAyahIndex === originalIndex && { 
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        fontSize: 18
                      }
                    ]}>
                      {ayah.type === 'istiadhah' ? "Isti'adhah" :
                       ayah.type === 'bismillah' ? 'Bismillah' :
                             `Ayah ${ayahNumber}`}
                    </Text>
                        </View>
                  </TouchableOpacity>
                );
              })}
                  {/* Next Surah Button */}
                  {nextSurah && (
                    <TouchableOpacity
                      style={styles.surahNavButton}
                      onPress={() => {
                        setShowGoToModal(false);
                        navigation.replace('Memorization', { surah: nextSurah });
                      }}
                    >
                      <Text variant="body1" style={styles.surahNavButtonText}>
                        {nextSurah.surah}. {cleanSurahName(nextSurah.name)} →
                      </Text>
                    </TouchableOpacity>
                  )}
            </ScrollView>
            
            <TouchableOpacity style={[styles.surahNavButton, { backgroundColor: COLORS.primary, marginTop: 8 }]} onPress={() => ayahListRef.current?.scrollToEnd({ animated: true })}>
              <Ionicons name="chevron-down" size={24} color="rgba(64, 64, 64, 0.9)" />
            </TouchableOpacity>
            
            <Button
              title="Cancel"
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
              <Animated.View style={[styles.rewardModalContent, { transform: [{ scale: rewardScale }], marginBottom: 32 }] }>
                <Text variant="h2" style={{ color: '#3E2723' }}>Masha2Allah</Text>
                <Text variant="body1" style={{ color: '#3E2723' }}>
              You've earned <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{rewardAmount}</Text> 7asanaat for this Ayah!
            </Text>
            <Text variant="body2" style={{ marginTop: 8, fontStyle: 'italic', color: COLORS.textSecondary }}>
              insha2Allah
            </Text>
                <View style={styles.rewardButtonRow}>
                  <Button
                    title="Revise"
                    onPress={() => setShowReward(false)}
                    style={[styles.rewardButton, { backgroundColor: COLORS.primary, marginRight: 8 }]}
                  />
            <Button
              title={currentAyahIndex === ayaat.length - 1 ? 'Next Surah' : 'Next Ayah'}
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
                
                if (currentAyahIndex < ayaat.length - 1) {
                  setCurrentAyahIndex(currentAyahIndex + 1);
                  setIsTextHidden(false);
                } else {
                        // Add all session hasanat at the end of the surah
                        try {
                          await addHasanat(sessionHasanat.current);
                        } catch (error) {
                          console.error('[MemorizationScreen] Error updating streak on reward finish:', error);
                        }
                  sessionHasanat.current = 0;
                  navigation.navigate('Home');
                }
              }}
                    style={[styles.rewardButton, { backgroundColor: COLORS.primary }]}
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
                style={{ backgroundColor: COLORS.primary }}
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
    borderRadius: 16,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
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
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  transliterationText: {
    fontStyle: 'italic',
    color: '#CCCCCC',
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
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginHorizontal: 4,
    width: '95%',
  },
  ayahList: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 4,
    maxHeight: 250,
  },
  ayahItem: {
    padding: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,115,36,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAyahItem: {
    backgroundColor: 'rgba(128, 128, 128, 0.8)',
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
    borderRadius: SIZES.base,
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
  },
  settingsButton: {
    // Left side
  },
  recordButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealButtonNew: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.base,
    padding: SIZES.small,
    borderWidth: 1,
    borderColor: COLORS.primary,
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
  },
  surahNavButton: {
    backgroundColor: 'rgba(51, 105, 78, 1)',
    padding: SIZES.medium,
    borderRadius: 24,
    marginVertical: 8,
    alignItems: 'center',
  },
  surahNavButtonText: {
    color: 'rgba(255, 165, 0, 0.8)',
    fontWeight: 'bold',
    fontSize: 22,
  },
  ayahDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginLeft: 8,
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