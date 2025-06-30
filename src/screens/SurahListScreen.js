import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ImageBackground, TextInput, Animated } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { loadData } from '../utils/store';
import { getAllSurahs } from '../utils/quranData';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = { ...BASE_COLORS, primary: '#33694e', accent: '#FFD700' };

const SCROLL_BAR_HEIGHT = 200;

const SurahListScreen = ({ navigation, route }) => {
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
  const flatListRef = useRef(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const scrollBarRef = useRef(null);

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

  useEffect(() => {
    const loadScreenData = async () => {
      const loadedData = await loadData();
      setData(loadedData);
    };

    loadScreenData();

    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', loadScreenData);
    return unsubscribe;
  }, [navigation]);

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

  // Use offline Quran data for surah list
  const surahs = getAllSurahs().map(({ surah, name, ayaat }) => ({
    id: surah,
    name: name,
    totalAyahs: surah === 1 ? 7 : ayaat.length,
    memorizedAyahs: Math.min(data.memorizedAyahs[name]?.memorized || 0, surah === 1 ? 7 : ayaat.length),
  }));

  // Filter surahs based on search text
  const getFilteredSurahs = () => {
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
  };

  const renderSurahItem = ({ item, index }) => {
    const isSelected = selectedSurahId === item.id;
    
    return (
    <Card
      variant="elevated"
        style={[
          styles.surahCard, 
          {
            backgroundColor: COLORS.background,
            borderColor: isSelected ? COLORS.primary : 'rgba(165,115,36,0.8)',
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
      onPress={() => navigation.navigate('Memorization', { surah: item })}>
      <View style={styles.surahInfo}>
          <Text variant="h3" style={{ color: isSelected ? COLORS.primary : COLORS.text }}>
            {item.name}
          </Text>
        <Text variant="body2" color="textSecondary" style={styles.progressText}>
          {item.memorizedAyahs}/{item.totalAyahs} Ayaat memorized
        </Text>
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={item.memorizedAyahs} 
            total={item.totalAyahs} 
            height={10}
            animated={true}
          />
        </View>
          {isSelected && (
            <View style={styles.currentIndicator}>
              <Text variant="body2" color="primary" style={styles.currentText}>
                Currently Memorizing
              </Text>
            </View>
          )}
      </View>
    </Card>
  );
  };

  const handleScrollBarTouch = (y) => {
    const scrollBar = scrollBarRef.current;
    if (!scrollBar) return;
    scrollBar.measure((fx, fy, width, height, px, py) => {
      const scrollBarHeight = height;
      const scrollPercentage = Math.max(0, Math.min(1, y / scrollBarHeight));
      if (flatListRef.current) {
        const totalSurahs = getFilteredSurahs().length;
        const targetIndex = Math.floor(scrollPercentage * totalSurahs);
        const clampedIndex = Math.max(0, Math.min(totalSurahs - 1, targetIndex));
        flatListRef.current.scrollToIndex({
          index: clampedIndex,
          animated: false,
          viewPosition: 0,
        });
      }
    });
  };

  const renderScrollBar = () => {
    const totalSurahs = getFilteredSurahs().length;
    const circlesCount = Math.ceil(totalSurahs / 2);
    return (
      <View
        style={styles.scrollBarContainer}
        ref={scrollBarRef}
        onStartShouldSetResponder={() => true}
        onResponderGrant={e => {
          const y = e.nativeEvent.locationY;
          handleScrollBarTouch(y);
        }}
        onResponderMove={e => {
          const y = e.nativeEvent.locationY;
          handleScrollBarTouch(y);
        }}
      >
        <View style={styles.scrollBar}>
          {Array.from({ length: circlesCount }, (_, index) => {
            // Calculate circle size based on position
            const isTop = index < circlesCount * 0.2;
            const isBottom = index > circlesCount * 0.8;
            const isMiddle = !isTop && !isBottom;
            
            let circleSize = 4; // Default size
            if (isTop || isBottom) {
              circleSize = 2; // Smaller for top and bottom
            } else if (isMiddle) {
              circleSize = 4; // Normal size for middle
            }
            
            return (
              <View 
                key={index} 
                style={[
                  styles.scrollCircle, 
                  { 
                    width: circleSize, 
                    height: circleSize, 
                    borderRadius: circleSize / 2 
                  }
                ]} 
              />
            );
          })}
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
                <Text variant="h1" style={[styles.titleText, { color: COLORS.white }]}>Surahs</Text>
                <Text variant="body1" style={styles.headerSubtitle}>Qa2imat as-Suwar (Surah List)</Text>
              </View>
            </View>
          </View>

          {/* Search bar is now a sibling, not a child, of the header */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.primary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search surahs by name or number..."
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.contentContainer}>
            <FlatList
              ref={flatListRef}
              data={getFilteredSurahs()}
              renderItem={renderSurahItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={() => {
                console.warn('Failed to scroll to index');
              }}
            />
            
            {renderScrollBar()}
          </View>
          
          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Image
                source={require('../assets/IQRA2logo.png')}
                style={styles.homeIcon}
                resizeMode="contain"
              />
              <Text style={styles.homeButtonText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                // Find the last memorized surah
                const lastMemorizedSurah = surahs.find(surah => 
                  data.memorizedAyahs[surah.name]?.memorized > 0
                );
                
                if (lastMemorizedSurah) {
                  navigation.navigate('Memorization', { 
                    surah: lastMemorizedSurah,
                    currentSurahId: lastMemorizedSurah.id 
                  });
                } else {
                  // If no memorized surahs, start with the first one
                  navigation.navigate('Memorization', { 
                    surah: surahs[0],
                    currentSurahId: surahs[0].id 
                  });
                }
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
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
    color: '#222',
    fontSize: 16,
    marginTop: 4,
  },
  list: {
    padding: SIZES.medium,
    paddingTop: SIZES.large,
    marginTop: 160, // Reduced from 190 to move closer to search bar
  },
  surahCard: {
    marginBottom: SIZES.medium,
    backgroundColor: COLORS.background,
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    borderRadius: SIZES.small,
    overflow: 'hidden',
  },
  surahInfo: {
    flex: 1,
  },
  progressContainer: {
    marginTop: SIZES.small,
  },
  progressText: {
    marginBottom: SIZES.small,
  },
  homeButton: {
    padding: SIZES.medium,
    backgroundColor: 'rgba(64, 64, 64, 0.8)',
    borderRadius: SIZES.small,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SIZES.small,
    justifyContent: 'center',
  },
  homeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: SIZES.small,
    padding: SIZES.small,
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  searchIcon: {
    marginRight: SIZES.small,
  },
  searchInput: {
    flex: 1,
  },
  clearButton: {
    padding: SIZES.small,
  },
  continueButton: {
    padding: SIZES.medium,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.small,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: SIZES.small,
    justifyContent: 'center',
  },
  continueButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SIZES.small,
  },
  scrollBarContainer: {
    width: 30,
    height: SCROLL_BAR_HEIGHT,
    position: 'absolute',
    right: -5,
    top: '35%',
    transform: [{ translateY: -SCROLL_BAR_HEIGHT / 2 }],
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.small,
    justifyContent: 'center',
  },
  scrollBar: {
    backgroundColor: 'rgba(64, 64, 64, 0.1)',
    borderRadius: 15,
    paddingVertical: SIZES.small,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollCircle: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginVertical: 2,
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