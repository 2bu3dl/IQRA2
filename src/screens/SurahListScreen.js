import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ImageBackground, TextInput, Animated } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { loadData, saveCurrentPosition } from '../utils/store';
import { getAllSurahs } from '../utils/quranData';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useLanguage } from '../utils/languageContext';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const COLORS = { ...BASE_COLORS, primary: '#33694e', accent: '#FFD700' };

const SCROLL_BAR_HEIGHT = 150;

const SurahListScreen = ({ navigation, route }) => {
  const { language, t } = useLanguage();
  // Helper to convert numbers to Arabic-Indic if needed
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };
  const [data, setData] = useState({
    memorizedAyahs: {
      'Al-Fatihah': {
        total: 7,
        memorized: 0,
      },
    },
  });
  const [selectedSurahId, setSelectedSurahId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(1);
  const [visibleHeight, setVisibleHeight] = useState(1);
  const flatListRef = useRef(null);
  const scrollBarRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Original surah names mapping for search functionality
  const ORIGINAL_SURAH_NAMES = {
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
    18: 'Al-Kahf',
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

  // English translations for surah names
  const SURAH_ENGLISH_TRANSLATIONS = {
    1: 'The Opening',
    2: 'The Cow',
    3: 'Family of Imran',
    4: 'The Women',
    5: 'The Table Spread',
    6: 'The Cattle',
    7: 'The Heights',
    8: 'The Spoils of War',
    9: 'The Repentance',
    10: 'Jonah',
    11: 'Hud',
    12: 'Joseph',
    13: 'The Thunder',
    14: 'Abraham',
    15: 'The Rocky Tract',
    16: 'The Bees',
    17: 'The Night Journey',
    18: 'The Cave',
    19: 'Mary',
    20: 'Ta-Ha',
    21: 'The Prophets',
    22: 'The Pilgrimage',
    23: 'The Believers',
    24: 'The Light',
    25: 'The Criterion',
    26: 'The Poets',
    27: 'The Ants',
    28: 'The Stories',
    29: 'The Spider',
    30: 'The Romans',
    31: 'Luqman',
    32: 'The Prostration',
    33: 'The Combined Forces',
    34: 'Sheba',
    35: 'Originator',
    36: 'Ya-Sin',
    37: 'Those Who Set The Ranks',
    38: 'Sad',
    39: 'The Troops',
    40: 'The Forgiver',
    41: 'Explained in Detail',
    42: 'The Consultation',
    43: 'The Ornaments of Gold',
    44: 'The Smoke',
    45: 'The Kneeling',
    46: 'The Wind-Curved Sandhills',
    47: 'Muhammad',
    48: 'The Victory',
    49: 'The Private Apartments',
    50: 'Qaf',
    51: 'The Winnowing Winds',
    52: 'The Mount',
    53: 'The Star',
    54: 'The Moon',
    55: 'The Beneficent',
    56: 'The Event',
    57: 'The Iron',
    58: 'The Pleading Woman',
    59: 'The Exile',
    60: 'The Woman to be Examined',
    61: 'The Ranks',
    62: 'The Congregation',
    63: 'The Hypocrites',
    64: 'The Mutual Disillusion',
    65: 'Divorce',
    66: 'The Prohibition',
    67: 'The Sovereignty',
    68: 'The Pen',
    69: 'The Reality',
    70: 'The Ascending Stairways',
    71: 'Noah',
    72: 'The Jinn',
    73: 'The Enshrouded One',
    74: 'The Cloaked One',
    75: 'The Resurrection',
    76: 'Man',
    77: 'The Emissaries',
    78: 'The Tidings',
    79: 'The Extractors',
    80: 'He Frowned',
    81: 'The Overthrowing',
    82: 'The Cleaving',
    83: 'The Defrauding',
    84: 'The Splitting Open',
    85: 'The Mansions of the Stars',
    86: 'The Morning Star',
    87: 'The Most High',
    88: 'The Overwhelming',
    89: 'The Dawn',
    90: 'The City',
    91: 'The Sun',
    92: 'The Night',
    93: 'The Morning Hours',
    94: 'The Relief',
    95: 'The Fig',
    96: 'The Clot',
    97: 'The Power',
    98: 'The Clear Proof',
    99: 'The Earthquake',
    100: 'The Coursers',
    101: 'The Calamity',
    102: 'The Rivalry in World Increase',
    103: 'The Declining Day',
    104: 'The Traducer',
    105: 'The Elephant',
    106: 'Quraysh',
    107: 'The Small Kindnesses',
    108: 'The Abundance',
    109: 'The Disbelievers',
    110: 'The Victory',
    111: 'The Palm Fiber',
    112: 'Sincerity',
    113: 'The Daybreak',
    114: 'Mankind',
  };

  // Ensure loadScreenData is defined at the top level
    const loadScreenData = async () => {
      const loadedData = await loadData();
      setData(loadedData);
    };

  useEffect(() => {
    loadScreenData();

    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', loadScreenData);
    return unsubscribe;
  }, [navigation]);

  // Handle refresh parameter from navigation and clear it after use
  useEffect(() => {
    if (route.params?.refresh) {
      loadScreenData();
      navigation.setParams({ refresh: false });
    }
  }, [route.params?.refresh]);

  // Check if we're coming from MemorizationScreen with current ayah info
  useEffect(() => {
    if (route.params?.currentSurahId) {
      setSelectedSurahId(route.params.currentSurahId);
      // Scroll to the selected surah after a short delay to ensure the list is rendered
      setTimeout(() => {
        const surahIndex = surahs.findIndex(s => s.id === route.params.currentSurahId);
        if (surahIndex !== -1 && flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: surahIndex,
            animated: true,
            viewPosition: 0.3, // Show the item in the upper third of the screen
          });
        }
      }, 100);
    }
  }, [route.params?.currentSurahId]);

  // Debug: Log memorizedAyahs keys and surah names used for lookup
  useEffect(() => {
    if (data && data.memorizedAyahs) {
      // console.log('[SurahListScreen] memorizedAyahs keys:', Object.keys(data.memorizedAyahs));
    }
  }, [data]);

  // Use offline Quran data for surah list - memoized to prevent re-creation on every render
  const surahs = useMemo(() => {
    return getAllSurahs().map(({ surah, name, ayaat }) => {
      const cleanedName = name.replace(/^\d+\s+/, ''); // Remove the number prefix from the name
      // Debug: Log the surah name and cleanedName
      // console.log('[SurahListScreen] Surah:', name, 'Cleaned:', cleanedName, 'Memorized:', data.memorizedAyahs[name]?.memorized, data.memorizedAyahs[cleanedName]?.memorized);
      return {
    id: surah,
        name: cleanedName,
        originalName: name, // Keep the original name for progress lookup
    totalAyahs: surah === 1 ? 7 : ayaat.length,
    memorizedAyahs: Math.min(
      data.memorizedAyahs[name]?.memorized || data.memorizedAyahs[cleanedName]?.memorized || 0,
      surah === 1 ? 7 : ayaat.length
    ),
      };
    });
  }, [data.memorizedAyahs]); // Only recreate when memorized data changes

  // Filter surahs based on search text - memoized to prevent unnecessary re-renders
  const filteredSurahs = useMemo(() => {
    if (!searchText.trim()) {
      return surahs;
    }
    
    const searchLower = searchText.toLowerCase();
    return surahs.filter(surah => {
      const currentName = surah.name.toLowerCase();
      const originalName = ORIGINAL_SURAH_NAMES[surah.id]?.toLowerCase() || '';
      const surahNumber = surah.id.toString();
      
      return currentName.includes(searchLower) || 
             originalName.includes(searchLower) || 
             surahNumber.includes(searchLower);
    });
  }, [surahs, searchText]); // Only recalculate when surahs or search text changes

  const renderSurahItem = ({ item, index }) => {
    const isSelected = selectedSurahId === item.id;
    const isCompleted = item.memorizedAyahs === item.totalAyahs && item.totalAyahs > 0;
    
    return (
      <View style={[
        isCompleted && {
          shadowColor: '#fae29f',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 5,
          borderRadius: SIZES.small,
          marginHorizontal: SIZES.medium,
          marginBottom: SIZES.medium,
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.surahCard, 
            {
              backgroundColor: 'rgba(0, 0, 0, 0.93)',
              borderColor: isSelected ? COLORS.primary : 'rgba(165,115,36,0.8)',
              borderWidth: isSelected ? 2 : 1,
              marginHorizontal: isCompleted ? 0 : SIZES.medium,
              // Add softer glowing border effect for completed surahs
              ...(isCompleted && {
                borderColor: '#fae29f',
                borderWidth: 2,
                shadowColor: '#fae29f',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 12,
                elevation: 8,
              }),
            }
          ]}
          onPress={() => navigation.navigate('Memorization', { surah: item })}
          onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
          activeOpacity={0.8}
        >
      <View style={styles.surahInfo}>
            <View style={{ 
              flexDirection: language === 'ar' ? 'row-reverse' : 'row', 
              alignItems: 'center',
              justifyContent: language === 'ar' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}>
              <Text variant="h3" style={{ 
                color: 'rgba(165,115,36,0.8)', 
                marginRight: language === 'ar' ? 0 : 4,
                marginLeft: language === 'ar' ? 4 : 0
              }}>
                {language === 'ar' ? `.${toArabicNumber(item.id)}` : `${toArabicNumber(item.id)}.`}
              </Text>
              <Text variant="h3" style={{ 
                color: isSelected ? COLORS.primary : '#F5E6C8',
                textAlign: language === 'ar' ? 'right' : 'left',
                flex: language === 'ar' ? 1 : undefined
              }}>
                {language === 'ar' ? t(`surah_${item.id}`) : item.name}
              </Text>
            </View>
            {language === 'en' && (
              <Text variant="body2" style={{ color: 'rgba(51, 105, 78, 0.8)', marginTop: 2, fontStyle: 'italic', marginLeft: 20, marginBottom: 8 }}>
                {SURAH_ENGLISH_TRANSLATIONS[item.id]}
              </Text>
            )}
            <Text variant="body2" color="textSecondary" style={[styles.progressText, { 
              textAlign: 'center', 
              marginTop: 0 
            }]}>
              {language === 'ar' ? (
                <>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{toArabicNumber(item.totalAyahs)}</Text>
                  /<Text style={[
                    isCompleted ? {
                      textShadowColor: '#fae29f',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 4,
                    } : {}
                  ]}>
                    {toArabicNumber(item.memorizedAyahs)}
                  </Text> {t('ayaat_memorized')}
                </>
              ) : (
                <>
                  <Text style={[
                    isCompleted ? {
                      textShadowColor: '#fae29f',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 4,
                    } : {}
                  ]}>
                    {toArabicNumber(item.memorizedAyahs)}
                  </Text>
                  /<Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{toArabicNumber(item.totalAyahs)}</Text> {t('ayaat_memorized')}
                </>
              )}
        </Text>
        <View style={styles.progressContainer}>
          <ProgressBar 
                key={`progress-${item.id}`}
            progress={item.memorizedAyahs} 
            total={item.totalAyahs} 
                height={8}
                completed={isCompleted}
              />
            </View>
            {isSelected && (
              <View style={styles.currentIndicator}>
                <Text variant="body2" color="primary" style={styles.currentText}>
                  {t('memorize')}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handleScrollBarTouch = (y) => {
    const scrollBar = scrollBarRef.current;
    if (!scrollBar) return;
    scrollBar.measure((fx, fy, width, height, px, py) => {
      const scrollBarHeight = height;
      const scrollPercent = Math.max(0, Math.min(1, y / scrollBarHeight));
      
      if (flatListRef.current) {
        const totalSurahs = filteredSurahs.length;
        const itemHeight = 60;
        const totalContentHeight = totalSurahs * itemHeight;
        const scrollableHeight = Math.max(1, totalContentHeight - 400); // 400 is approximate visible height
        const offset = scrollPercent * scrollableHeight;
        
        // Use immediate response for smooth finger following
        flatListRef.current.scrollToOffset({ 
          offset, 
          animated: false 
        });
      }
    });
  };

  const renderScrollBar = () => {
    const totalSurahs = filteredSurahs.length;
    const itemHeight = 60;
    const totalContentHeight = contentHeight; // Use actual content height instead of fixed
    const scrollBarHeight = 663; // Slightly increased to ensure it reaches bottom
    const handleHeight = 40; // Height of the handle
    const maxHandlePosition = scrollBarHeight - handleHeight; // Full range
    
    const scrollHandlePosition = scrollY.interpolate({
      inputRange: [0, Math.max(1, totalContentHeight - visibleHeight)], // Use actual scrollable range
      outputRange: [0, maxHandlePosition],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.scrollBarContainer, {
        right: language === 'ar' ? undefined : 10,
        left: language === 'ar' ? 10 : undefined
      }]}>
        <View style={styles.scrollBar}>
          <Animated.View 
            style={[
              styles.scrollHandle,
              {
                transform: [{ translateY: scrollHandlePosition }],
              },
            ]} 
          />
        </View>
      </View>
  );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground 
        source={require('../assets/IQRA2background.png')} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
            <View style={styles.headerBlurContainer}>
              <View style={styles.headerTextContainer}>
                {language === 'ar' ? (
                  <Text variant="h1" style={{ 
                    fontSize: 30, 
                    fontWeight: 'bold', 
                    color: '#F5E6C8', 
                    marginTop: 16, 
                    marginBottom: 16,
                    textShadowColor: '#000',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3
                  }}>{t('welcome_subtitle')}</Text>
                ) : (
                  <>
                    <Text variant="h1" style={[styles.titleText, { 
                      color: '#F5E6C8',
                      marginTop: language === 'ar' ? 12 : 0,
                      paddingTop: language === 'ar' ? 4 : 0
                    }]}>{language === 'ar' ? 'السور' : 'Surahs'}</Text>
                    <Text variant="body1" style={styles.headerSubtitle}>{t('welcome_subtitle')}</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Search bar is now a sibling, not a child, of the header */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { 
              backgroundColor: isSearchFocused ? 'rgba(245, 230, 200, 0.8)' : 'rgba(245, 230, 200, 0.6)' 
            }]}>
              <Image 
                source={require('../assets/app_icons/search.png')} 
                style={{ width: 20, height: 20, tintColor: COLORS.primary, marginRight: SIZES.small }}
                resizeMode="contain"
              />
              <TextInput
                style={[styles.searchInput, { 
                  fontWeight: isSearchFocused ? 'bold' : 'normal',
                  textAlign: language === 'ar' ? 'right' : 'left',
                  writingDirection: language === 'ar' ? 'rtl' : 'ltr'
                }]}
                placeholder={t('search_surahs')}
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
              )}
        </View>
      </View>
      
          <View style={styles.contentContainer}>
            <Animated.FlatList
              ref={flatListRef}
              data={filteredSurahs}
        renderItem={renderSurahItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
              onContentSizeChange={(w, h) => setContentHeight(h)}
              onLayout={e => setVisibleHeight(e.nativeEvent.layout.height)}
              initialNumToRender={20}
              windowSize={21}
              maxToRenderPerBatch={15}
              updateCellsBatchingPeriod={16}
              removeClippedSubviews={true}
              onScrollToIndexFailed={() => {
                console.warn('Failed to scroll to index');
              }}
              bounces={true}
              overScrollMode="always"
            />
            
            {renderScrollBar()}
          </View>
          
          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={async () => {
                ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
                // Save current position if a surah is selected
                if (selectedSurahId && surahs && surahs.length > 0) {
                  const selectedSurah = surahs.find(s => s.id === selectedSurahId);
                  if (selectedSurah) {
                    // Find the memorizedAyahs data for this surah
                    const surahData = data.memorizedAyahs[selectedSurah.name];
                    // Save the current flashcard index if available
                    if (surahData && surahData.currentFlashcardIndex !== undefined) {
                      try {
                        await saveCurrentPosition(selectedSurah.name, surahData.currentFlashcardIndex);
                      } catch (error) {
                        console.error('[SurahListScreen] Error saving current position on Home:', error);
                      }
                    }
                  }
                }
                navigation.navigate('Home');
              }}
              onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
            >
              <Image
                source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')}
                style={[styles.homeIcon]}
              />
              <Text style={styles.homeButtonText}>{t('home')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
                // Find the surah with the highest currentFlashcardIndex (most recent activity)
                let lastMemorizedSurah = null;
                let highestFlashcardIndex = -1;
                
                surahs.forEach(surah => {
                  const surahData = data.memorizedAyahs[surah.name];
                  if (surahData?.currentFlashcardIndex !== undefined && surahData?.currentFlashcardIndex > highestFlashcardIndex) {
                    lastMemorizedSurah = surah;
                    highestFlashcardIndex = surahData.currentFlashcardIndex;
                  }
                });
                
                if (lastMemorizedSurah) {
                  // Use the saved flashcard index directly
                  const flashcardIndex = data.memorizedAyahs[lastMemorizedSurah.name].currentFlashcardIndex;
                  console.log('[SurahListScreen] Continue: lastMemorizedSurah', lastMemorizedSurah.name, 'flashcardIndex', flashcardIndex);
                  
                  navigation.navigate('Memorization', { 
                    surah: lastMemorizedSurah,
                    currentSurahId: lastMemorizedSurah.id,
                    resumeFromIndex: flashcardIndex
                  });
                } else {
                  // If no memorized surahs, start with the first one
                  navigation.navigate('Memorization', { 
                    surah: surahs[0],
                    currentSurahId: surahs[0].id 
                  });
                }
              }}
              onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
            >
              <Text style={styles.continueButtonText}>{t('continue')}</Text>
              <Image 
                source={require('../assets/app_icons/down-up.png')} 
                style={{
                  width: 36, 
                  height: 36, 
                  tintColor: 'rgba(165,115,36,1.0)',
                  marginLeft: 12,
                  transform: [{ rotate: '-90deg' }],
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: SIZES.extraLarge,
    borderBottomRightRadius: SIZES.extraLarge,
    marginTop: 0,
    minHeight: 100,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  titleText: {
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(165,115,36,0.8)',
    textDecorationStyle: 'solid',
    textDecorationThickness: 4,
  },
  headerSubtitle: {
    color: '#CCCCCC',
    fontSize: 18,
    marginTop: 4,
    fontWeight: 'bold',
  },
  list: {
    padding: SIZES.medium,
    paddingTop: SIZES.large,
    marginTop: 160, // Reduced from 190 to move closer to search bar
    paddingBottom: SIZES.extraLarge * 6, // Increased from 4 to 6 for more bottom space
  },
  surahCard: {
    marginBottom: SIZES.medium,
    backgroundColor: 'rgba(0, 0, 0, 0.93)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    borderRadius: SIZES.small,
    overflow: 'hidden',
    marginHorizontal: SIZES.medium,
    padding: SIZES.medium,
  },
  surahInfo: {
    flex: 1,
  },
  progressContainer: {
    marginTop: 0,
  },
  progressText: {
    marginBottom: 0,
  },
  homeButton: {
    padding: SIZES.medium,
    backgroundColor: 'rgba(165,115,36,0.8)',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SIZES.small / 2,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  homeIcon: {
    width: 48,
    height: 48,
    borderRadius: 80,
  },
  homeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SIZES.small,
  },
  currentIndicator: {
    marginTop: SIZES.small,
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '20',
    borderRadius: SIZES.small,
    alignSelf: 'flex-start',
  },
  currentText: {
    fontWeight: 'bold',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: SIZES.medium,
    backgroundColor: 'rgba(64, 64, 64, 0.9)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchContainer: {
    padding: SIZES.medium,
    position: 'absolute',
    top: 140, // Move down a bit more
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: SIZES.small,
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  searchIcon: {
    marginRight: SIZES.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: SIZES.small,
  },
  continueButton: {
    padding: SIZES.medium,
    backgroundColor: 'rgba(51, 105, 78, 0.8)',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: SIZES.small / 2,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SIZES.small,
  },
  scrollBarContainer: {
    position: 'absolute',
    right: 10,
    top: 180,
    bottom: 100,
    width: 20,
    zIndex: 1000,
  },
  scrollBar: {
    backgroundColor: 'rgba(200, 200, 200, 0.4)',
    borderRadius: 10,
    width: 4,
    height: '100%',
    alignSelf: 'center',
  },
  scrollHandle: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: 'rgba(165,115,36,0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  contentContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  headerBlurContainer: {
    flex: 1,
    backgroundColor: 'rgba(51, 105, 78, 0.85)',
    borderBottomLeftRadius: SIZES.extraLarge,
    borderBottomRightRadius: SIZES.extraLarge,
    padding: SIZES.large,
    paddingTop: 0,
    paddingBottom: SIZES.medium,
  },
});

export default SurahListScreen; 