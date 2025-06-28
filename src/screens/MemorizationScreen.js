import React, { useState, useRef, useCallback, memo, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Animated, Image, ScrollView, TextInput } from 'react-native';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import CardOrig from '../components/Card';
import ProgressBarOrig from '../components/ProgressBar';
import AudioRecorder from '../components/AudioRecorder';
import TranslationModal from '../components/TranslationModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { addHasanat, updateMemorizedAyahs, updateStreak } from '../utils/store';
import { getSurahAyaatWithTransliteration, getAllSurahs } from '../utils/quranData';
import AudioRecorderService from '../utils/audioRecorder';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import Svg, { Circle } from 'react-native-svg'; // Uncomment if using react-native-svg

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
  const [ayahRecordings, setAyahRecordings] = useState({});
  const [surahRecording, setSurahRecording] = useState(null);
  const [showSurahRecordingModal, setShowSurahRecordingModal] = useState(false);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [modalAyahIndex, setModalAyahIndex] = useState(null);
  const sessionHasanat = useRef(0);
  const rewardTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showAyahRecordingModal, setShowAyahRecordingModal] = useState(false);
  const ayahListRef = useRef(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const allSurahs = getAllSurahs();
  const currentSurahIndex = allSurahs.findIndex(s => s.surah === surahNumber);
  const prevSurah = currentSurahIndex > 0 ? allSurahs[currentSurahIndex - 1] : null;
  const nextSurah = currentSurahIndex < allSurahs.length - 1 ? allSurahs[currentSurahIndex + 1] : null;

  const loadRecordings = useCallback(async () => {
    try {
      // Load surah recording
      const surahRec = await AudioRecorderService.getSurahRecording(surah.name);
      setSurahRecording(surahRec);
      
      // Load ayah recordings
      const recordings = {};
      const ayahCards = ayaat.filter(a => a.type === 'ayah');
      for (let i = 0; i < ayahCards.length; i++) {
        const ayahNumber = i + 1;
        try {
          const recording = await AudioRecorderService.getAyahRecording(surah.name, ayahNumber);
          if (recording) {
            recordings[ayahNumber] = recording;
          }
        } catch (error) {
          console.warn(`[MemorizationScreen] Failed to load ayah ${ayahNumber} recording:`, error);
        }
      }
      setAyahRecordings(recordings);
    } catch (error) {
      console.error('[MemorizationScreen] Error loading recordings:', error);
    }
  }, [surah.name, ayaat]);

  React.useEffect(() => {
    async function fetchAyaat() {
      try {
        const data = await getSurahAyaatWithTransliteration(surahNumber);
        if (!data || !Array.isArray(data)) {
          console.error('[MemorizationScreen] Invalid data received from getSurahAyaatWithTransliteration');
          return;
        }
        setAyaat(data);
        setIsTextHidden(false);
      } catch (error) {
        console.error('[MemorizationScreen] Error fetching ayaat:', error);
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

  // Load recordings after ayaat is set
  React.useEffect(() => {
    if (ayaat.length > 0) {
      loadRecordings();
    }
  }, [ayaat, loadRecordings]);

  const handleAyahRecordingComplete = async (filePath, duration) => {
    try {
      const ayahNumber = flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length;
      await AudioRecorderService.saveAyahRecording(surah.name, ayahNumber, filePath);
      
      // Update local state
      setAyahRecordings(prev => ({
        ...prev,
        [ayahNumber]: {
          filePath,
          timestamp: new Date().toISOString(),
          surahName: surah.name,
          ayahNumber,
        }
      }));
    } catch (error) {
      console.error('Error saving ayah recording:', error);
    }
  };

  const handleSurahRecordingComplete = async (filePath, duration) => {
    try {
      await AudioRecorderService.saveSurahRecording(surah.name, filePath);
      setSurahRecording({
        filePath,
        timestamp: new Date().toISOString(),
        surahName: surah.name,
      });
      setShowSurahRecordingModal(false);
    } catch (error) {
      console.error('Error saving surah recording:', error);
    }
  };

  const handleResetAyahRecording = async () => {
    try {
      const ayahNumber = flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length;
      const key = `ayah_recordings_${surah.name}_${ayahNumber}`;
      await AsyncStorage.removeItem(key);
      
      // Update local state
      setAyahRecordings(prev => {
        const newRecordings = { ...prev };
        delete newRecordings[ayahNumber];
        return newRecordings;
      });
      
      // Force re-render by updating the current ayah index
      const currentIndex = currentAyahIndex;
      setCurrentAyahIndex(-1);
      setTimeout(() => setCurrentAyahIndex(currentIndex), 100);
      
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error resetting ayah recording:', error);
    }
  };

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
                      ayah.type === 'bismillah' ? 'BismAllah' :
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
    rewardTimeout.current = setTimeout(() => {
      setShowReward(false);
      if (currentAyahIndex < flashcards.length - 1) {
        setCurrentAyahIndex(idx => idx + 1);
        setIsTextHidden(false);
      } else {
        setShowSurahRecordingModal(true);
      }
    }, 2000);
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

  return (
    <SafeAreaView style={styles.container}>
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
          <Image source={require('../assets/logo.png')} style={styles.homeIcon} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text variant="h2" color="primary" style={{ textAlign: 'center', width: '100%' }}>{surah?.name || 'Surah'}</Text>
          <Text variant="body1" style={{ textAlign: 'center', width: '100%' }}>
            {flashcards && flashcards[currentAyahIndex]?.type === 'ayah'
              ? `Ayah ${flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length}`
              : flashcards && flashcards[currentAyahIndex]?.type === 'istiadhah'
                ? "Isti3aadhah"
                : 'BismAllah'}
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
                {/* Show transliteration only when revealed */}
                {!isTextHidden && (
                  <Text
                    variant="body2"
                    style={styles.transliterationText}
                    align="center"
                  >
                    {stripHtmlTags(flashcards[currentAyahIndex]?.transliteration || '')}
                  </Text>
                )}
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
            {/* Center: Record Button */}
            {flashcards[currentAyahIndex]?.type === 'ayah' && (
              <View style={styles.recordButtonContainer}>
                <TouchableOpacity
                  style={[styles.recordButton, { backgroundColor: COLORS.primary }]}
                  onPress={() => setShowAyahRecordingModal(true)}
                >
                  <Ionicons name="mic" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}
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
      </View>

      <View style={styles.navigation}>
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

      {/* Go To Modal */}
      <Modal
        visible={showGoToModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoToModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h2" style={{ marginBottom: 16 }}>Navigate to Ayah</Text>
            
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
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <TouchableOpacity style={[styles.surahNavButton, { flex: 1, marginRight: 4 }]} onPress={() => ayahListRef.current?.scrollTo({ y: 0, animated: true })}>
                <Text variant="body1" style={styles.surahNavButtonText}>Top</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.surahNavButton, { flex: 1, marginLeft: 4 }]} onPress={() => ayahListRef.current?.scrollToEnd({ animated: true })}>
                <Text variant="body1" style={styles.surahNavButtonText}>Bottom</Text>
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
                    ← {prevSurah.name}
                  </Text>
                </TouchableOpacity>
              )}
              {/* Ayah List */}
              {getFilteredAyaat().map((ayah, mapIndex) => {
                const originalIndex = flashcards.indexOf(ayah);
                const ayahNumber = flashcards.slice(0, originalIndex + 1).filter(a => a.type === 'ayah').length;
                const hasRecording = ayah.type === 'ayah' && ayahRecordings[ayahNumber];
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
                      <Text variant="body1" style={styles.ayahItemText}>
                        {ayah.type === 'istiadhah' ? "Isti'adhah" :
                         ayah.type === 'bismillah' ? 'BismAllah' :
                         `Ayah ${ayahNumber}`}
                      </Text>
                      {hasRecording && (
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
                  onPress={() => {
                    setShowGoToModal(false);
                    navigation.replace('Memorization', { surah: nextSurah });
                  }}
                >
                  <Text variant="body1" style={styles.surahNavButtonText}>
                    {nextSurah.name} →
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => {
                setShowGoToModal(false);
                setSearchText('');
              }}
              style={{ backgroundColor: COLORS.primary, marginTop: 16 }}
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
        <View style={styles.rewardModalOverlay}>
          <Animated.View style={[styles.rewardModalContent, { transform: [{ scale: rewardScale }] }] }>
            <Text variant="h2" color="primary">Masha'Allah</Text>
            <Text variant="body1">
              You've earned <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{rewardAmount}</Text> 7asanaat for this Ayah!
            </Text>
            <Text variant="body2" style={{ marginTop: 8, fontStyle: 'italic', color: COLORS.textSecondary }}>
              insha'Allah
            </Text>
            <Button
              title={currentAyahIndex === ayaat.length - 1 ? 'Next Surah' : 'Next Ayah'}
              onPress={async () => {
                setShowReward(false);
                if (currentAyahIndex < ayaat.length - 1) {
                  setCurrentAyahIndex(currentAyahIndex + 1);
                  setIsTextHidden(false);
                } else {
                  // Update streak when finishing surah
                  try {
                    await updateStreak();
                  } catch (error) {
                    console.error('[MemorizationScreen] Error updating streak on reward finish:', error);
                  }
                  addHasanat(sessionHasanat.current);
                  sessionHasanat.current = 0;
                  navigation.navigate('Home');
                }
              }}
              style={{ marginTop: SIZES.large }}
            />
          </Animated.View>
        </View>
      </Modal>

      {/* Surah Recording Modal */}
      <Modal
        visible={showSurahRecordingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSurahRecordingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h2" style={{ marginBottom: 16 }}>Record Complete Surah</Text>
            <Text variant="body1" style={{ marginBottom: 24, textAlign: 'center' }}>
              Now record yourself reciting the entire {surah.name} surah. This will be saved for your personal collection.
            </Text>
            
            <AudioRecorder
              surahName={surah.name}
              type="surah"
              onRecordingComplete={handleSurahRecordingComplete}
              existingRecording={surahRecording}
              style={styles.modalAudioRecorder}
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Skip Recording"
                onPress={async () => {
                  setShowSurahRecordingModal(false);
                  // Update streak when skipping recording
                  try {
                    await updateStreak();
                  } catch (error) {
                    console.error('[MemorizationScreen] Error updating streak on skip recording:', error);
                  }
                  addHasanat(sessionHasanat.current);
                  sessionHasanat.current = 0;
                  navigation.navigate('Home');
                }}
                style={{ backgroundColor: COLORS.accent, marginRight: SIZES.small }}
              />
              <Button
                title="Finish"
                onPress={async () => {
                  setShowSurahRecordingModal(false);
                  // Update streak when finishing recording
                  try {
                    await updateStreak();
                  } catch (error) {
                    console.error('[MemorizationScreen] Error updating streak on finish recording:', error);
                  }
                  addHasanat(sessionHasanat.current);
                  sessionHasanat.current = 0;
                  navigation.navigate('Home');
                }}
                style={{ backgroundColor: COLORS.primary }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Ayah Recording Modal */}
      <Modal
        visible={showAyahRecordingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAyahRecordingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h2" style={{ marginBottom: 16 }}>Record Ayah</Text>
            <Text variant="body1" style={{ marginBottom: 24, textAlign: 'center' }}>
              Record yourself reciting this ayah. This will be saved for your personal collection.
            </Text>
            
            <AudioRecorder
              surahName={surah.name}
              type="ayah"
              ayahNumber={flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length}
              onRecordingComplete={handleAyahRecordingComplete}
              existingRecording={ayahRecordings[flashcards.slice(0, currentAyahIndex + 1).filter(a => a.type === 'ayah').length]}
              style={styles.modalAudioRecorder}
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowAyahRecordingModal(false)}
                style={{ backgroundColor: COLORS.primary, flex: 1, marginRight: SIZES.small }}
              />
            </View>
          </View>
        </View>
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
            
            {flashcards[currentAyahIndex]?.type === 'ayah' && (
              <Button
                title="Reset Ayah Recording"
                onPress={handleResetAyahRecording}
                style={{ backgroundColor: COLORS.primary, marginBottom: SIZES.medium }}
              />
            )}
            
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
    padding: SIZES.extraLarge,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.accent,
    borderWidth: 1,
    width: '100%',
    maxHeight: '60%',
  },
  arabicText: {
    fontFamily: 'System',
    lineHeight: 40,
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
    backgroundColor: COLORS.white,
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
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
  goToButton: {
    marginLeft: SIZES.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.base,
    padding: SIZES.large,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  ayahList: {
    flex: 1,
    width: '100%',
  },
  ayahItem: {
    padding: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedAyahItem: {
    backgroundColor: COLORS.accent,
  },
  ayahItemText: {
    fontFamily: 'System',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
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
    backgroundColor: COLORS.accent,
    padding: SIZES.medium,
    borderRadius: SIZES.base,
    marginVertical: 8,
    alignItems: 'center',
  },
  surahNavButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
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
});

export default MemorizationScreen; 