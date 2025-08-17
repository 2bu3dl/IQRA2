import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text as RNText,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
  SafeAreaView,
  TextInput,
  ScrollView,
  PanResponder,
  StyleSheet,
  Animated,
  Platform,
  Easing,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useLanguage } from '../utils/languageContext';
import Svg, { Polygon, Line } from 'react-native-svg';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { loadData, saveCurrentPosition, loadLastPosition, getCustomLists, getListSurahs } from '../utils/store';
import { getAllSurahs } from '../utils/quranData';

const COLORS = { ...BASE_COLORS, primary: '#33694e', accent: '#FFD700' };

const SCROLL_BAR_HEIGHT = 150;

// Thematic categories data structure - moved outside component for performance
const THEME_CATEGORIES = [
  {
    id: 'asma_husna',
    titleEn: 'Asma\' al-Husna',
    titleAr: 'الأسماء الحسنى',
    descEn: 'Surahs emphasizing the Beautiful Names of Allah',
    descAr: 'السور التي تؤكد على أسماء الله الحسنى',
    iconText: 'Names',
    subcategories: [
      {
        id: 'ar_rahman',
        titleEn: 'Ar-Rahman (The Merciful)',
        titleAr: 'الرحمن',
        surahs: [1, 55, 19, 21]
      },
      {
        id: 'al_ghafoor',
        titleEn: 'Al-Ghafoor (The Forgiving)',
        titleAr: 'الغفور',
        surahs: [39, 40, 67, 71]
      },
      {
        id: 'al_hakeem',
        titleEn: 'Al-Hakeem (The Wise)',
        titleAr: 'الحكيم',
        surahs: [31, 34, 35, 39]
      }
    ]
  },
  {
    id: 'concepts',
    titleEn: 'Islamic Concepts',
    titleAr: 'المفاهيم الإسلامية',
    descEn: 'Core spiritual and theological concepts',
    descAr: 'المفاهيم الروحية واللاهوتية الأساسية',
    iconText: 'Faith',
    subcategories: [
      {
        id: 'tawhid',
        titleEn: 'Tawhid (Unity of Allah)',
        titleAr: 'التوحيد',
        surahs: [112, 2, 3, 4]
      },
      {
        id: 'ihsan',
        titleEn: 'Ihsan (Excellence in Worship)',
        titleAr: 'الإحسان',
        surahs: [2, 3, 4, 16]
      },
      {
        id: 'khushoo',
        titleEn: 'Khushoo\' (Humility in Prayer)',
        titleAr: 'الخشوع',
        surahs: [23, 70, 107, 2]
      },
      {
        id: 'ikhlas',
        titleEn: 'Ikhlas (Sincerity)',
        titleAr: 'الإخلاص',
        surahs: [112, 39, 40, 98]
      }
    ]
  },
  {
    id: 'stories',
    titleEn: 'Prophetic Stories',
    titleAr: 'قصص الأنبياء',
    descEn: 'Stories of Prophets and righteous people',
    descAr: 'قصص الأنبياء والصالحين',
    iconText: 'Stories',
    subcategories: [
      {
        id: 'musa',
        titleEn: 'Prophet Musa (Moses)',
        titleAr: 'النبي موسى',
        surahs: [2, 7, 10, 20, 28]
      },
      {
        id: 'isa',
        titleEn: 'Prophet Isa (Jesus)',
        titleAr: 'النبي عيسى',
        surahs: [3, 4, 5, 19]
      },
      {
        id: 'yusuf',
        titleEn: 'Prophet Yusuf (Joseph)',
        titleAr: 'النبي يوسف',
        surahs: [12]
      },
      {
        id: 'ibrahim',
        titleEn: 'Prophet Ibrahim (Abraham)',
        titleAr: 'النبي إبراهيم',
        surahs: [2, 3, 4, 6, 14, 19]
      }
    ]
  },
  {
    id: 'dua',
    titleEn: 'Du\'a in Qur\'an',
    titleAr: 'الدعاء في القرآن',
    descEn: 'Supplications and prayers found in the Qur\'an',
    descAr: 'الأدعية والصلوات الموجودة في القرآن',
    iconText: 'Du\'a',
    subcategories: [
      {
        id: 'seeking_guidance',
        titleEn: 'Seeking Guidance',
        titleAr: 'طلب الهداية',
        surahs: [1, 2, 25]
      },
      {
        id: 'seeking_forgiveness',
        titleEn: 'Seeking Forgiveness',
        titleAr: 'طلب المغفرة',
        surahs: [3, 59, 110]
      },
      {
        id: 'protection',
        titleEn: 'Seeking Protection',
        titleAr: 'طلب الحماية',
        surahs: [113, 114, 2]
      }
    ]
  },
  {
    id: 'environmental',
    titleEn: 'Environmental Stewardship',
    titleAr: 'حماية البيئة',
    descEn: 'Our relationship with and responsibility over nature',
    descAr: 'علاقتنا ومسؤوليتنا تجاه الطبيعة',
    iconText: 'Nature',
    subcategories: [
      {
        id: 'creation',
        titleEn: 'Signs in Creation',
        titleAr: 'آيات في الخلق',
        surahs: [2, 3, 6, 16, 30]
      },
      {
        id: 'balance',
        titleEn: 'Natural Balance',
        titleAr: 'التوازن الطبيعي',
        surahs: [55, 67, 76]
      },
      {
        id: 'gratitude',
        titleEn: 'Gratitude for Provisions',
        titleAr: 'الشكر على النعم',
        surahs: [14, 16, 35]
      }
    ]
  },
  {
    id: 'heart',
    titleEn: 'Purification of Heart',
    titleAr: 'تطهير القلب',
    descEn: 'Spiritual purification and diseases of the heart',
    descAr: 'التطهر الروحي وأمراض القلب',
    iconText: 'Heart',
    subcategories: [
      {
        id: 'taqwa',
        titleEn: 'Taqwa (God-consciousness)',
        titleAr: 'التقوى',
        surahs: [2, 3, 4, 5]
      },
      {
        id: 'patience',
        titleEn: 'Sabr (Patience)',
        titleAr: 'الصبر',
        surahs: [2, 3, 103, 90]
      },
      {
        id: 'remembrance',
        titleEn: 'Dhikr (Remembrance of Allah)',
        titleAr: 'ذكر الله',
        surahs: [13, 29, 39, 62]
      }
    ]
  }
];

// Juz-to-Surah mapping - defines which Surahs belong to each Juz
const JUZ_SURAH_MAPPING = {
  1: { surahs: [1, 2], range: "Al-Fatihah to Al-Baqarah 141", startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
  2: { surahs: [2], range: "Al-Baqarah 142-252", startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
  3: { surahs: [2, 3], range: "Al-Baqarah 253 to Ali Imran 92", startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
  4: { surahs: [3, 4], range: "Ali Imran 93 to An-Nisa 23", startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
  5: { surahs: [4], range: "An-Nisa 24-147", startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
  6: { surahs: [4, 5], range: "An-Nisa 148 to Al-Ma'idah 81", startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
  7: { surahs: [5, 6], range: "Al-Ma'idah 82 to Al-An'am 110", startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
  8: { surahs: [6, 7], range: "Al-An'am 111 to Al-A'raf 87", startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
  9: { surahs: [7, 8], range: "Al-A'raf 88 to Al-Anfal 40", startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
  10: { surahs: [8, 9], range: "Al-Anfal 41 to At-Tawbah 92", startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
  11: { surahs: [9, 10, 11], range: "At-Tawbah 93 to Hud 5", startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
  12: { surahs: [11, 12], range: "Hud 6 to Yusuf 52", startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
  13: { surahs: [12, 13, 14], range: "Yusuf 53 to Ibrahim 52", startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
  14: { surahs: [15, 16], range: "Al-Hijr to An-Nahl 128", startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
  15: { surahs: [17, 18], range: "Al-Isra to Al-Kahf 74", startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
  16: { surahs: [18, 19, 20], range: "Al-Kahf 75 to Ta-Ha 135", startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
  17: { surahs: [21, 22], range: "Al-Anbya to Al-Hajj 78", startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
  18: { surahs: [23, 24, 25], range: "Al-Mu'minun to Al-Furqan 20", startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
  19: { surahs: [25, 26, 27], range: "Al-Furqan 21 to An-Naml 55", startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
  20: { surahs: [27, 28, 29], range: "An-Naml 56 to Al-Ankabut 45", startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
  21: { surahs: [29, 30, 31, 32, 33], range: "Al-Ankabut 46 to Al-Ahzab 30", startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
  22: { surahs: [33, 34, 35, 36], range: "Al-Ahzab 31 to Ya-Sin 27", startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
  23: { surahs: [36, 37, 38, 39], range: "Ya-Sin 28 to Az-Zumar 31", startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
  24: { surahs: [39, 40, 41], range: "Az-Zumar 32 to Fussilat 46", startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
  25: { surahs: [41, 42, 43, 44, 45], range: "Fussilat 47 to Al-Jathiyah 37", startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
  26: { surahs: [46, 47, 48, 49, 50, 51], range: "Al-Ahqaf to Adh-Dhariyat 30", startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
  27: { surahs: [51, 52, 53, 54, 55, 56, 57], range: "Adh-Dhariyat 31 to Al-Hadid 29", startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
  28: { surahs: [58, 59, 60, 61, 62, 63, 64, 65, 66], range: "Al-Mujadila to At-Tahrim 12", startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
  29: { surahs: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77], range: "Al-Mulk to Al-Mursalat 50", startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
  30: { surahs: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114], range: "An-Naba to An-Nas", startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 }
};

const SurahListScreen = ({ navigation, route }) => {
  const { language, t } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [juzFilter, setJuzFilter] = useState({ isActive: false });
  const [previousJuzFilter, setPreviousJuzFilter] = useState({ isActive: false }); // Store previous Juz state
  const [isSearchBarHidden, setIsSearchBarHidden] = useState(false);

  // Check if we're in Juz mode - now using state instead of route params
  const isJuzMode = juzFilter.isActive;
  const juzNumber = juzFilter.juzNumber;
  const juzData = juzFilter.juzData;
  const juzTitle = juzFilter.title;
  const juzSubtitle = juzFilter.subtitle;

  // Helper to convert numbers to Arabic-Indic if needed
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };

  // Function to clear Juz filter
  const clearJuzFilter = () => {
    setPreviousJuzFilter(juzFilter); // Save current Juz state before clearing
    setJuzFilter({ isActive: false });
    setSearchText(''); // Clear search when clearing filter
    // haptic feedback removed;
  };

  // Function to return to previous Juz
  const returnToPreviousJuz = () => {
    if (previousJuzFilter.isActive) {
      setJuzFilter(previousJuzFilter);
      // haptic feedback removed;
    }
  };

  // Function to animate tabs when selection changes
  const animateTabs = (selectedTabId) => {
    // Normal tab animations - like standard iOS tabs
    const animations = tabs.map((tab, index) => {
      const isSelected = tab.id === selectedTabId;
      
      return Animated.timing(tabAnimations[index], {
        toValue: isSelected ? 1 : 0.7, // Normal: selected = 1, others = 0.7
        duration: 200, // Standard iOS tab animation duration
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      });
    });
    
    // Run tab animations
    Animated.parallel(animations).start();
  };

  // Tab data
  const tabs = [
    { id: 0, titleKey: 'surah' },
    { id: 1, titleKey: 'juz' },
    { id: 2, titleKey: 'categories' },
    { id: 3, titleKey: 'bookmarks' }
  ];

  // Animated values for tab animations
  const tabAnimations = useRef(tabs.map(() => new Animated.Value(0))).current;
  
  // Add slide animation for content
  const contentSlideAnimation = useRef(new Animated.Value(0)).current;

  // Initialize animations on mount
  useEffect(() => {
    animateTabs(activeTab);
  }, []);
  
  // Add swipe functionality for tabs
  const tabSwipeResponder = useRef(null);
  const pageSwipeResponder = useRef(null);
  
  useEffect(() => {
    // PanResponder for tab bar area - slide finger across tabs
    tabSwipeResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Never capture on initial touch
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes on tab bar
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: (evt) => {
        // Don't change selection on initial touch - let tab buttons handle it
      },
      onPanResponderMove: (evt, gestureState) => {
        // Slide finger across tabs to change
        const screenWidth = Dimensions.get('window').width;
        const tabWidth = screenWidth / tabs.length;
        const fingerX = evt.nativeEvent.pageX;
        const newTabIndex = Math.floor(fingerX / tabWidth);
        const clampedTabIndex = Math.max(0, Math.min(newTabIndex, tabs.length - 1));
        
        if (clampedTabIndex !== activeTab) {
          console.log('Switching to tab:', clampedTabIndex);
          setActiveTab(clampedTabIndex);
          animateTabs(clampedTabIndex);
        }
      },
      onPanResponderRelease: () => {
        // Tab selection is already updated during move
      }
    });
    
    // PanResponder for above tab area - page swiping like iPhone
    pageSwipeResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Never capture on initial touch
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes above tab bar
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 50;
      },
      onPanResponderGrant: (evt) => {
        // Don't change selection on initial touch
      },
      onPanResponderMove: (evt, gestureState) => {
        // Page swiping - one page at a time
        const screenWidth = Dimensions.get('window').width;
        const swipeThreshold = screenWidth * 0.3; // 30% of screen width
        
        if (Math.abs(gestureState.dx) > swipeThreshold) {
          if (gestureState.dx > 0 && activeTab > 0) {
            // Swipe right - go to previous tab
            const newTab = activeTab - 1;
            setActiveTab(newTab);
            animateTabs(newTab);
          } else if (gestureState.dx < 0 && activeTab < tabs.length - 1) {
            // Swipe left - go to next tab
            const newTab = activeTab + 1;
            setActiveTab(newTab);
            animateTabs(newTab);
          }
        }
      },
      onPanResponderRelease: () => {
        // Tab selection is already updated during move
      }
    });
  }, [activeTab, tabs.length]);

  const renderTabBar = () => (
    <View 
      style={styles.tabBar}
      {...(tabSwipeResponder.current?.panHandlers || {})}
    >
      {tabs.map((tab, index) => {
        const isSelected = activeTab === tab.id;
        const animationValue = tabAnimations[index];
        
        return (
          <Animated.View
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton,
              language === 'ar' && { marginHorizontal: 4 },
              {
                transform: [
                  {
                    scale: animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1.0],
                    })
                  }
                ],
                opacity: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                })
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabButtonInner,
                language === 'ar' && {
                  paddingVertical: 4,
                  paddingHorizontal: SIZES.extraSmall,
                }
              ]}
              activeOpacity={0.7}
              onPress={() => {
                console.log('Tab pressed:', tab.id, 'Current activeTab:', activeTab);
                // haptic feedback removed;
                
                // Immediately switch to the selected tab
                setActiveTab(tab.id);
                animateTabs(tab.id);
                
                if (isJuzMode) {
                  // Handle special actions when in Juz mode
                  if (tab.id === 0) {
                    // Tapping "Surah" acts like "All Surahs" button
                    clearJuzFilter();
                  } else if (tab.id === 1) {
                    // Tapping "Juz" goes back to Juz selection
                    clearJuzFilter();
                  } else if (tab.id === 2) {
                    // Tapping "Categories" goes to categories
                    clearJuzFilter();
                  }
                }
              }}
            >
              <RNText style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
                language === 'ar' && { fontSize: 10 }
              ]}>
                {t(tab.titleKey)}
                {tab.id === 0 && isJuzMode && ' ⬢'} {/* Use hexagon instead of sparkle */}
              </RNText>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <AllSurahsTab 
          navigation={navigation} 
          route={route} 
          searchText={searchText} 
          isJuzMode={isJuzMode} 
          juzData={juzData}
          isSearchBarHidden={isSearchBarHidden}
          setIsSearchBarHidden={setIsSearchBarHidden}
        />;
      case 1:
        return <JuzWheelTab navigation={navigation} setJuzFilter={setJuzFilter} setPreviousJuzFilter={setPreviousJuzFilter} setActiveTab={setActiveTab} setSearchText={setSearchText} language={language} />;
      case 2:
        return <ThemesTab 
          navigation={navigation} 
          isSearchBarHidden={isSearchBarHidden}
          setIsSearchBarHidden={setIsSearchBarHidden}
        />;
              case 3:
          return <ListsTab navigation={navigation} route={route} searchText={searchText} />;
      default:
        return <AllSurahsTab navigation={navigation} route={route} searchText={searchText} isJuzMode={isJuzMode} juzData={juzData} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground 
        source={require('../assets/IQRA2background.png')} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
          {/* Header */}
          <View 
            style={styles.header}
            {...(pageSwipeResponder.current?.panHandlers || {})}
          >
            <View style={styles.headerBlurContainer}>
              <View style={styles.headerTextContainer}>
                {isJuzMode ? (
                  // Juz mode header
                  <>
                    <RNText variant="h1" style={[
                      { fontFamily: 'KFGQPC Uthman Taha Naskh', fontSize: 40, fontWeight: 'bold', color: '#F5E6C8', marginTop: 50, marginBottom: 8, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }
                    ]}>{juzTitle}</RNText>
                    <RNText variant="body1" style={[
                      { fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh' : 'Montserrat-Regular', fontSize: 16, color: '#CCCCCC', textAlign: 'center', marginBottom: 16 }
                    ]}>{juzSubtitle}</RNText>

                  </>
                ) : language === 'ar' ? (
                  <RNText variant="h1" style={[
                    { 
                      fontFamily: 'KFGQPC Uthman Taha Naskh', 
                      fontSize: 40, // Make all titles consistently larger
                      fontWeight: 'bold', 
                      color: '#F5E6C8', 
                      marginTop: 50, // Brought down more
                      marginBottom: 16, 
                      textShadowColor: '#000', 
                      textShadowOffset: { width: 1, height: 1 }, 
                      textShadowRadius: 3 
                    }
                  ]}>
                    {activeTab === 0 ? t('welcome_subtitle') : (activeTab === 1 ? 'الجزء' : 'الفئات')}
                  </RNText>
                ) : (
                  <>
                    <RNText variant="h1" style={[FONTS.h1.getFont(language), styles.titleText, { 
                      color: '#F5E6C8', 
                      marginTop: 50, // Brought down more
                      paddingTop: language === 'ar' ? 4 : 0,
                      fontSize: 40 // Make all titles larger and consistent
                    }]}>
                      {language === 'ar' ? 
                        (activeTab === 0 ? 'السور' : activeTab === 1 ? 'الجزء' : activeTab === 2 ? 'المواضيع' : 'الآيات المحفوظة') : 
                        (activeTab === 0 ? 'Surahs' : activeTab === 1 ? 'Juz' : activeTab === 2 ? 'Topics' : 'Saved Ayaat')
                      }
                    </RNText>
                    {activeTab === 0 && (
                      <RNText variant="body1" style={[FONTS.body1.getFont(language), styles.headerSubtitle]}>{t('welcome_subtitle')}</RNText>
                    )}
                  </>
                )}
              </View>
              
              {/* Search icon in header when search bar is hidden */}
              {activeTab === 0 && isSearchBarHidden && (
                <TouchableOpacity 
                  style={{ 
                    position: 'absolute',
                    top: 70,
                    right: language === 'ar' ? 20 : 20,
                    zIndex: 1000
                  }}
                  onPress={() => setIsSearchBarHidden(false)}
                >
                  <Image 
                    source={require('../assets/app_icons/search.png')} 
                    style={{ width: 24, height: 24, tintColor: 'rgba(165,115,36,0.8)' }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              
              {/* Search icon in header when search bar is hidden for Topics tab */}
              {activeTab === 2 && isSearchBarHidden && (
                <TouchableOpacity 
                  style={{ 
                    position: 'absolute',
                    top: 70,
                    right: language === 'ar' ? 20 : 20,
                    zIndex: 9999
                  }}
                  onPress={() => setIsSearchBarHidden(false)}
                >
                  <Image 
                    source={require('../assets/app_icons/search.png')} 
                    style={{ width: 24, height: 24, tintColor: 'rgba(165,115,36,0.8)' }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search bar - only show for All Surahs tab */}
          {activeTab === 0 && !isSearchBarHidden && (
            <View style={[styles.searchContainer, { 
              position: 'absolute',
              top: isJuzMode ? (language === 'ar' ? 180 : 160) : (language === 'ar' ? 157 : 137), // Brought down search box in Surah tab
              left: SIZES.medium,
              right: SIZES.medium,
              zIndex: 10,
              flexDirection: isJuzMode ? 'row' : 'column',
              alignItems: isJuzMode ? 'center' : 'stretch',
            }]}>
              <View style={[styles.searchInputContainer, { 
                backgroundColor: isSearchFocused ? 'rgba(245, 230, 200, 0.2)' : 'rgba(245, 230, 200, 0.15)', // Made even more transparent
                flex: isJuzMode ? 1 : undefined,
                marginRight: isJuzMode ? SIZES.small : 0,
                ...(Platform.OS === 'android' && { paddingVertical: SIZES.small / 4 })
              }]}>
                <TextInput
                  style={[styles.searchInput, { 
                    fontFamily: 'KFGQPC Uthman Taha Naskh', 
                    fontWeight: isSearchFocused ? 'bold' : 'normal', 
                    textAlign: language === 'ar' ? 'right' : 'left', 
                    writingDirection: language === 'ar' ? 'rtl' : 'ltr',
                    ...(Platform.OS === 'android' && { fontSize: 12 })
                  }]}
                  placeholder={isJuzMode ? 
                    (language === 'ar' ? `البحث في ${juzTitle}...` : `Search in ${juzTitle}...`) : 
                    t('search_surahs')
                  }
                  placeholderTextColor="#666"
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  allowFontScaling={false}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                
                {/* Search icon on the right side */}
                <Image 
                  source={require('../assets/app_icons/search.png')} 
                  style={{ 
                    width: 20, 
                    height: 20, 
                    tintColor: 'rgba(165,115,36,0.8)', 
                    marginLeft: SIZES.small,
                    position: 'absolute',
                    right: 12
                  }}
                  resizeMode="contain"
                />
                
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                                  )}
                </View>
                

                
                {/* Show "All Surahs" button when in Juz mode */}
              {isJuzMode && (
                <TouchableOpacity 
                  style={styles.allSurahsButton}
                  onPress={clearJuzFilter}
                >
                  <RNText style={[styles.allSurahsButtonText, {
                    fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh' : 'Montserrat-Bold'
                  }]}>
                    {language === 'ar' ? 'جميع السور' : 'All Surahs'}
                  </RNText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tab Content */}
          <View style={styles.tabContentContainer}>
            {renderTabContent()}
          </View>

          {/* Tab Bar - always show */}
          {renderTabBar()}

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => {
                // haptic feedback removed;
                navigation.navigate('Home');
              }}
            >
              <Image
                source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')}
                style={[styles.homeIcon]}
              />
              <RNText style={[FONTS.body2.getFont(language), styles.homeButtonText]}>{t('home')}</RNText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={async () => {
                // haptic feedback removed;
                
                try {
                  // Load user's last position
                  const lastPosition = await loadLastPosition();
                  console.log('[DEBUG] Continue button - loaded last position:', lastPosition);
                  
                  if (lastPosition && lastPosition.surahNumber && lastPosition.flashcardIndex !== undefined) {
                    // Use the saved last position
                    const targetSurah = { 
                      id: lastPosition.surahNumber, 
                      name: lastPosition.surahName 
                    };
                    const resumeFromIndex = lastPosition.flashcardIndex;
                    
                    console.log('[Continue] Using last position:', targetSurah, 'index:', resumeFromIndex);
                    navigation.navigate('Memorization', { 
                      surah: targetSurah, 
                      resumeFromIndex: resumeFromIndex 
                    });
                  } else {
                    // Fallback to Al-Fatiha if no saved position
                    console.log('[Continue] No last position found, defaulting to Al-Fatiha');
                    navigation.navigate('Memorization', { surah: { id: 1 } });
                  }
                } catch (error) {
                  console.error('Error loading last position:', error);
                  // Fallback to Al-Fatiha if there's an error
                  navigation.navigate('Memorization', { surah: { id: 1 } });
                }
              }}
            >
              <RNText style={[FONTS.body2.getFont(language), styles.continueButtonText]}>{t('continue')}</RNText>
              <Image 
                source={require('../assets/app_icons/down-up.png')} 
                style={{
                  width: 36, 
                  height: 36, 
                  tintColor: 'rgba(165,115,36,1.0)',
                  marginLeft: language === 'ar' ? 0 : 12,
                  marginRight: language === 'ar' ? 12 : 0,
                  transform: [{ rotate: language === 'ar' ? '90deg' : '-90deg' }],
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

// Phase 1: All Surahs Tab Component
const AllSurahsTab = ({ navigation, route, searchText, isJuzMode, juzData, isSearchBarHidden, setIsSearchBarHidden }) => {
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
  const [contentHeight, setContentHeight] = useState(1);
  const [visibleHeight, setVisibleHeight] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);


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
  // Helper function to find the best matching storage key for a surah
  const findBestStorageKey = useCallback((surahId, surahName, cleanedName) => {
    const storageKeys = Object.keys(data.memorizedAyahs);
    
    // Get the original surah name from ORIGINAL_SURAH_NAMES
    const originalName = ORIGINAL_SURAH_NAMES[surahId];
    
    // Create comprehensive list of possible storage keys
    const possibleKeys = [
      // Original names from ORIGINAL_SURAH_NAMES (what SurahListScreen expects)
      originalName, // "Al-Baqarah"
      `Surah ${originalName}`, // "Surah Al-Baqarah"
      
      // Names from getAllSurahs() (what MemorizationScreen might save)
      surahName, // "2 Al-Baqara"
      cleanedName, // "Al-Baqara"
      `Surah ${cleanedName}`, // "Surah Al-Baqara"
      `Surah ${surahName}`, // "Surah 2 Al-Baqara"
      
      // Alternative variations
      surahId.toString(), // "2"
      `Surah ${surahId}`, // "Surah 2"
      
      // Remove prefixes
      cleanedName.replace(/^Surah\s+/i, ''),
      originalName.replace(/^Surah\s+/i, ''),
      
      // Handle common variations
      originalName.replace(/^Al-/, ''), // "Baqarah" instead of "Al-Baqarah"
      cleanedName.replace(/^Al-/, ''), // "Baqara" instead of "Al-Baqara"
      
      // Handle numbers
      `${surahId} ${originalName}`, // "2 Al-Baqarah"
      `${surahId} ${cleanedName}`, // "2 Al-Baqara"
    ];
    
    // Find the first matching key
    const matchingKey = possibleKeys.find(key => storageKeys.includes(key));
    
    if (surahId === 2 || surahId === 3) {
      console.log(`[SurahListScreen] Finding storage key for Surah ${surahId}:`, {
        surahName,
        cleanedName,
        originalName,
        possibleKeys,
        storageKeys: storageKeys.filter(key => 
          key.toLowerCase().includes(cleanedName.toLowerCase()) || 
          key.toLowerCase().includes(originalName.toLowerCase()) ||
          key.toLowerCase().includes(surahId.toString())
        ),
        matchingKey
      });
    }
    
    return matchingKey;
  }, [data.memorizedAyahs]);

  const loadScreenData = async () => {
    try {
      console.log('[SurahListScreen] Loading screen data...');
      const loadedData = await loadData();
      console.log('[SurahListScreen] Loaded data:', loadedData.memorizedAyahs);
      console.log('[SurahListScreen] All storage keys:', Object.keys(loadedData.memorizedAyahs));
      console.log('[SurahListScreen] Setting new data state...');
      setData(loadedData);
      setRefreshKey(prev => prev + 1); // Force re-render
      console.log('[SurahListScreen] Data state updated, refresh key incremented');
    } catch (error) {
      console.error('[SurahListScreen] Error loading data:', error);
    }
  };

  useEffect(() => {
    loadScreenData();

    // Refresh data when screen comes into focus
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('[SurahListScreen] Screen focused, refreshing data...');
      loadScreenData();
    });

    // Also refresh when screen becomes visible (for better reliability)
    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('[SurahListScreen] Screen blurred');
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  // Handle refresh parameter from navigation and clear it after use
  useEffect(() => {
    if (route.params?.refresh) {
      console.log('[SurahListScreen] Refresh parameter detected, refreshing data...');
      loadScreenData();
      // Clear the parameter after a short delay to ensure data is loaded
      setTimeout(() => {
        navigation.setParams({ refresh: undefined });
      }, 100);
    }
  }, [route.params?.refresh, navigation]);

  // Check if we're coming from MemorizationScreen with current surah info
  useEffect(() => {
    if (route.params?.currentSurahId) {
      setSelectedSurahId(route.params.currentSurahId);
      
      // More robust scrolling with multiple attempts
      const scrollToSurah = (attempts = 0) => {
        const surahIndex = surahs.findIndex(s => s.id === route.params.currentSurahId);
        
        if (surahIndex !== -1 && flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({
              index: surahIndex,
              animated: true,
              viewPosition: 0.5, // Show the item in the middle of the screen
            });
            // Clear the selected surah after scrolling to remove green border
            setTimeout(() => setSelectedSurahId(null), 1000);
          } catch (error) {
            console.log(`Scroll attempt ${attempts + 1} failed, retrying...`);
            if (attempts < 3) {
              setTimeout(() => scrollToSurah(attempts + 1), 200);
            }
          }
        } else if (attempts < 3) {
          // If surah not found or FlatList not ready, retry
          setTimeout(() => scrollToSurah(attempts + 1), 200);
        }
      };
      
      // Start scrolling after a delay to ensure list is rendered
      setTimeout(() => scrollToSurah(), 300);
      
      // Clear the parameter after use to prevent re-scrolling
      navigation.setParams({ currentSurahId: undefined });
    }
  }, [route.params?.currentSurahId]);

  // Use offline Quran data for surah list - memoized to prevent re-creation on every render
  const surahs = useMemo(() => {
    console.log('[SurahListScreen] Recalculating surahs, memorizedAyahs:', data.memorizedAyahs);
    
          let allSurahs = getAllSurahs().map(({ surah, name, ayaat }) => {
        const cleanedName = name.replace(/^\d+\s+/, ''); // Remove the number prefix from the name
        
        // Use the ORIGINAL_SURAH_NAMES for consistent storage key matching
        const originalName = ORIGINAL_SURAH_NAMES[surah];
        
        // Use the helper function to find the best matching storage key
        const storageKey = findBestStorageKey(surah, name, originalName);
        const memorizedCount = storageKey ? data.memorizedAyahs[storageKey]?.memorized || 0 : 0;
        
        // Debug logging for surahs 2 and 3 specifically
        if (surah === 2 || surah === 3) {
          console.log(`[SurahListScreen] Surah ${surah} (${cleanedName}):`, {
            originalName: name,
            cleanedName: cleanedName,
            mappedOriginalName: originalName,
            storageKey: storageKey,
            storageNames: Object.keys(data.memorizedAyahs).filter(key => 
              key.toLowerCase().includes(cleanedName.toLowerCase()) || 
              key.toLowerCase().includes(originalName.toLowerCase()) ||
              key.toLowerCase().includes(name.toLowerCase())
            ),
            memorizedCount: memorizedCount,
            totalAyaat: surah === 1 ? 7 : ayaat.length,
            allStorageKeys: Object.keys(data.memorizedAyahs)
          });
        }
        
        return {
          id: surah,
          name: cleanedName,
          originalName: originalName, // Use the consistent name for progress lookup
          totalAyahs: surah === 1 ? 7 : ayaat.length,
          memorizedAyahs: Math.min(memorizedCount, surah === 1 ? 7 : ayaat.length),
        };
      });

    // Filter by Juz if in Juz mode
    if (isJuzMode && juzData) {
      allSurahs = allSurahs.filter(surah => juzData.surahs.includes(surah.id));
    }

    console.log('[SurahListScreen] Calculated surahs:', allSurahs.slice(0, 3).map(s => ({ id: s.id, name: s.name, memorized: s.memorizedAyahs, total: s.totalAyahs })));
    return allSurahs;
  }, [data.memorizedAyahs, isJuzMode, juzData]); // Only recreate when memorized data changes or Juz mode changes

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
        {
          marginBottom: 4,
        },
        isCompleted && {
          shadowColor: '#fae29f',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 5,
          borderRadius: 30, // Increased from 20 to 30 for even more rounded borders
          marginHorizontal: SIZES.medium,
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.surahCard, 
            {
              backgroundColor: 'rgba(0, 0, 0, 0.4)', // Less transparent black background for readability
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
          activeOpacity={0.8}
        >
      <View style={styles.surahInfo}>
            <View style={{ 
              flexDirection: language === 'ar' ? 'row-reverse' : 'row', 
              alignItems: 'center',
              justifyContent: language === 'ar' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}>
              <RNText variant="h3" style={[FONTS.h3.getFont(language), { color: 'rgba(165,115,36,0.8)', marginRight: language === 'ar' ? 0 : 4, marginLeft: language === 'ar' ? 4 : 0 }]}>
                {language === 'ar' ? `.${toArabicNumber(item.id)}` : `${toArabicNumber(item.id)}.`}
              </RNText>
              <RNText variant="h3" style={[
  language === 'ar'
                  ? { 
                      fontFamily: 'KFGQPC Uthman Taha Naskh', 
                      fontSize: 24, // Increased from 20 to make surah names larger
                      lineHeight: 28, // Adjusted line height accordingly
                      color: isSelected ? COLORS.primary : '#F5E6C8', 
                      textAlign: 'right', 
                      flex: 1,
                      writingDirection: 'rtl',
                      includeFontPadding: false,
                      textAlignVertical: 'center'
                    }
                  : [FONTS.h3.getFont(language), { color: isSelected ? COLORS.primary : '#F5E6C8', textAlign: 'left', fontSize: 22 }], // Increased English size too
              ]} lang={language === 'ar' ? 'ar' : undefined}>
                {language === 'ar' ? t(`surah_${item.id}`) : item.name}
              </RNText>
            </View>
            {language === 'en' && (
              <RNText variant="body2" style={[FONTS.body2.getFont(language), { color: 'rgba(51, 105, 78, 0.8)', marginTop: 2, fontStyle: 'italic', marginLeft: 20, marginBottom: 8 }]}>
                {SURAH_ENGLISH_TRANSLATIONS[item.id]}
              </RNText>
            )}
            <RNText variant="body2" style={[FONTS.body2.getFont(language), styles.progressText, { 
              textAlign: 'center', 
              marginTop: 0,
              color: '#CCCCCC' // Made more visible by adding explicit color
            }]}>
              {language === 'ar' ? (
                <>
                  <RNText style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{toArabicNumber(item.totalAyahs)}</RNText>
                  /<RNText style={[
                    isCompleted ? {
                      textShadowColor: '#fae29f',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 4,
                    } : {}
                  ]}>
                    {toArabicNumber(item.memorizedAyahs)}
                  </RNText> <RNText style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{t('ayaat_memorized')}</RNText>
                </>
              ) : (
                <>
                  <RNText style={[
                    isCompleted ? {
                      textShadowColor: '#fae29f',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 4,
                    } : {}
                  ]}>
                    {toArabicNumber(item.memorizedAyahs)}
                  </RNText>
                  <RNText style={{ color: 'rgba(255, 255, 255, 0.6)' }}>/</RNText><RNText style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{toArabicNumber(item.totalAyahs)}</RNText> <RNText style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{t('ayaat_memorized')}</RNText>
                </>
              )}
            </RNText>
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
                <RNText variant="body2" color="primary" style={[FONTS.body2.getFont(language), styles.currentText]}>
                  {t('memorize')}
                </RNText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderScrollBar = () => {
    if (contentHeight <= visibleHeight) return null; // Don't show if no scrolling needed
    
    // Calculate actual scroll bar height based on container positioning (top: 180, bottom: 200)
    // Assuming screen height around 800px, actual height would be 800 - 180 - 200 = 420px
    const scrollBarHeight = visibleHeight - 380; // 180 (top) + 200 (bottom) = 380
    const handleHeight = 40;
    const trackHeight = Math.max(100, scrollBarHeight - handleHeight); // Ensure minimum track height
    
    const scrollableDistance = contentHeight - visibleHeight;
    
    const handlePosition = scrollY.interpolate({
      inputRange: [0, scrollableDistance],
      outputRange: [0, trackHeight],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.scrollBarContainer, {
        right: language === 'ar' ? undefined : 0,
        left: language === 'ar' ? 0 : undefined
      }]}>
        <View style={styles.scrollBar}>
          <Animated.View 
            style={[
              styles.scrollHandle,
              {
                transform: [{ translateY: handlePosition }],
              },
            ]} 
          />
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
          <View style={[styles.contentContainer, { height: '100%' }]}>
            <Animated.FlatList
              ref={flatListRef}
              data={filteredSurahs}
              renderItem={renderSurahItem}
              keyExtractor={(item) => item.id.toString()}
              key={refreshKey} // Force re-render when data changes
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="never"

              

              onScroll={(event) => {
                // Update scrollY for scroll bar animation
                scrollY.setValue(event.nativeEvent.contentOffset.y);
                // Real-time search bar hide/show based on scroll position
                const currentScrollY = event.nativeEvent.contentOffset.y;
                setIsSearchBarHidden(currentScrollY > 50);
              }}
              scrollEventThrottle={8}
              onContentSizeChange={(w, h) => setContentHeight(h)}
              onLayout={e => setVisibleHeight(e.nativeEvent.layout.height)}
              initialNumToRender={20}
              windowSize={21}
              maxToRenderPerBatch={15}
              updateCellsBatchingPeriod={16}
              removeClippedSubviews={true}
              getItemLayout={(data, index) => ({
                length: 120, // Approximate height of each surah item
                offset: 120 * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                console.warn('Failed to scroll to index:', info);
                // Try alternative scrolling method
                if (route.params?.currentSurahId) {
                  const surahIndex = surahs.findIndex(s => s.id === route.params.currentSurahId);
                  if (surahIndex !== -1 && flatListRef.current) {
                    // Use scrollToOffset as fallback
                    const estimatedOffset = surahIndex * 150; // Approximate item height
                    flatListRef.current.scrollToOffset({
                      offset: estimatedOffset,
                      animated: true,
                    });
                  }
                }
              }}
              bounces={true}
              overScrollMode="always"
            />
            
            {renderScrollBar()}
          </View>
    </View>
  );
};

// Phase 2: Juz Wheel Tab Component
const JuzWheelTab = ({ navigation, setJuzFilter, setPreviousJuzFilter, setActiveTab, setSearchText, language }) => {
  const { t } = useLanguage();
  const [selectedJuz, setSelectedJuz] = useState(30); // Start at 30 by default
  
  // Helper to convert numbers to Arabic-Indic if needed
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };
  const panResponder = useRef(null);
  const [containerLayout, setContainerLayout] = useState({ width: 300, height: 300 });
  const lastHapticTime = useRef(0); // Add reference to track last haptic feedback time

  const handleJuzPress = () => {
    // haptic feedback removed;
    console.log(`Filtering to Juz ${selectedJuz}`);
    
    const juzData = JUZ_SURAH_MAPPING[selectedJuz];
    if (juzData) {
      // Clear search text and switch to Surah tab (tab 0) and apply Juz filter
      setSearchText('');
      setActiveTab(0);
      const newJuzFilter = {
        isActive: true,
        juzNumber: selectedJuz,
        juzData: juzData,
        title: language === 'ar' ? `الجزء ${selectedJuz}` : `Juz ${selectedJuz}`,
        subtitle: juzData.range
      };
      setPreviousJuzFilter(newJuzFilter); // Save this as the previous state for returning later
      setJuzFilter(newJuzFilter);
    }
  };

  const calculateJuzFromTouch = (x, y) => {
    const centerX = containerLayout.width / 2;
    const centerY = containerLayout.height / 2;
    const relativeX = x - centerX;
    const relativeY = y - centerY;
    
    // Calculate distance from center
    const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
    
    // Only respond to touches within the polygon ring area
    // Inner radius: 80 (central button area), Outer radius: 150 (edge of component)
    if (distance < 80 || distance > 150) {
      return selectedJuz; // Return current selection if touch is outside valid area
    }
    
    // Calculate angle using atan2 which gives us -π to π
    let angle = Math.atan2(relativeY, relativeX);
    
    // Convert to degrees (-180 to 180)
    angle = (angle * 180) / Math.PI;
    
    // Adjust so that top (12 o'clock) is 0°
    // In standard coordinates: top = -90°, right = 0°, bottom = 90°, left = 180°/-180°
    // We want: top = 0°, so add 90°
    angle = angle + 90;
    
    // Normalize to 0-360°
    if (angle < 0) angle += 360;
    if (angle >= 360) angle -= 360;
    
    // Calculate Juz number (1-30)
    // Each Juz takes up 360/30 = 12 degrees
    const juzNumber = Math.floor(angle / 12) + 1;
    
    // Ensure we stay within bounds
    const clampedJuzNumber = Math.max(1, Math.min(30, juzNumber));
    
    console.log(`Touch: (${x.toFixed(1)}, ${y.toFixed(1)}) -> Distance: ${distance.toFixed(1)} -> Relative: (${relativeX.toFixed(1)}, ${relativeY.toFixed(1)}) -> Angle: ${angle.toFixed(1)}° -> Juz: ${clampedJuzNumber}`);
    
    return clampedJuzNumber;
  };

  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Don't change selection on initial touch - just acknowledge the gesture
        console.log('Touch started - maintaining current selection');
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const juzNumber = calculateJuzFromTouch(locationX, locationY);
        
        if (juzNumber !== selectedJuz && juzNumber >= 1 && juzNumber <= 30) {
          setSelectedJuz(juzNumber);
          const now = Date.now();
          if (now - lastHapticTime.current > 50) { // Limit haptic feedback to every 50ms
            // haptic feedback removed;
            lastHapticTime.current = now;
          }
        }
      },
    });
  }, [selectedJuz, containerLayout]);

  // Generate 30-sided polygon points
  const generatePolygonPoints = (centerX, centerY, radius, sides = 6) => { // Changed from 30 to 6 for hexagon
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i) / sides;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <View style={styles.juzContainer}>
      <RNText variant="h2" style={[styles.juzTitle, { fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh' : 'Montserrat-Bold' }]}>
        {language === 'ar' ? 'اختر' : 'Select'}
      </RNText>

      <View 
        style={styles.polygonContainer}
        {...(panResponder.current?.panHandlers || {})}
        onLayout={e => setContainerLayout(e.nativeEvent.layout)}
      >
                       {/* Background hexagon */}
               <Svg width={300} height={300} style={styles.polygonSvg}>
                 <Polygon
                   points={generatePolygonPoints(150, 150, 140)}
                   fill="rgba(165, 115, 36, 0.1)"
                   stroke="#A57324"
                   strokeWidth="2"
                 />
                 <Polygon
                   points={generatePolygonPoints(150, 150, 120)}
                   fill="rgba(165, 115, 36, 0.05)"
                   stroke="#A57324"
                   strokeWidth="1"
                   strokeDasharray="5,5"
                 />
                 
                 {/* 30 lines pointing inward */}
                 {Array.from({ length: 30 }, (_, i) => {
                   const angle = (2 * Math.PI * i) / 30;
                   const outerRadius = 145;
                   const innerRadius = 125;
                   
                   // Calculate angle to match touch detection
                   // Juz 1 at top (12 o'clock) = -90° in standard coordinates
                   // Each Juz is 12° clockwise from there
                   const angleInDegrees = -90 + (i * 12); // Start at top, go clockwise
                   const adjustedAngle = (angleInDegrees * Math.PI) / 180; // Convert to radians
                   
                   const outerX = 150 + outerRadius * Math.cos(adjustedAngle);
                   const outerY = 150 + outerRadius * Math.sin(adjustedAngle);
                   const innerX = 150 + innerRadius * Math.cos(adjustedAngle);
                   const innerY = 150 + innerRadius * Math.sin(adjustedAngle);
                   
                   const isSelected = i + 1 === selectedJuz;
                   
                   return (
                     <React.Fragment key={i}>
                       {/* Glow effect for selected juz */}
                       {isSelected && (
                         <>
                           <Line
                             key={`glow1_${i}`}
                             x1={outerX}
                             y1={outerY}
                             x2={innerX}
                             y2={innerY}
                             stroke="rgba(51, 105, 78, 0.4)"
                             strokeWidth={4}
                             strokeLinecap="round"
                           />
                           <Line
                             key={`glow2_${i}`}
                             x1={outerX}
                             y1={outerY}
                             x2={innerX}
                             y2={innerY}
                             stroke="rgba(51, 105, 78, 0.3)"
                             strokeWidth={3}
                             strokeLinecap="round"
                           />
                         </>
                       )}
                       {/* Main line */}
                       <Line
                         key={`main_${i}`}
                         x1={outerX}
                         y1={outerY}
                         x2={innerX}
                         y2={innerY}
                         stroke={isSelected ? '#33694e' : 'rgba(165, 115, 36, 0.4)'}
                         strokeWidth={isSelected ? 3 : 2}
                         strokeLinecap="round"
                       />
                     </React.Fragment>
                   );
                 })}
                 
                 {/* Central hexagon button */}
                 <Polygon
                   points={generatePolygonPoints(150, 150, 70)}
                   fill="rgba(51, 105, 78, 0.2)"
                   stroke="#33694e"
                   strokeWidth="2"
                 />
                 {/* Glow effect for central button */}
                 <Polygon
                   points={generatePolygonPoints(150, 150, 75)}
                   fill="transparent"
                   stroke="rgba(51, 105, 78, 0.4)"
                   strokeWidth="1"
                 />
               </Svg>

        {/* Central hexagon button with text */}
            <TouchableOpacity
          style={styles.centralJuzButton}
          onPress={handleJuzPress}
        >
          <RNText style={[styles.juzNumber, { fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh Bold' : 'Montserrat-Bold' }]}>
            {language === 'ar' ? toArabicNumber(selectedJuz) : selectedJuz}
          </RNText>
          <RNText style={[styles.juzLabel, { fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh' : 'Montserrat-Regular' }]}>
            {language === 'ar' ? 'اضغط للدخول' : 'Tap to Enter'}
          </RNText>
        </TouchableOpacity>
      </View>

      <RNText variant="body1" style={[styles.juzInfo, { fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh' : 'Montserrat-Regular' }]}>
        {language === 'ar' 
          ? <>
              <RNText>الجزء </RNText>
              <RNText style={{ color: '#F5E6C8', fontWeight: 'bold' }}>{toArabicNumber(selectedJuz)}</RNText>
              <RNText> من القرآن الكريم</RNText>
            </>
          : <>
              <RNText>Juz </RNText>
              <RNText style={{ color: '#F5E6C8', fontWeight: 'bold' }}>{selectedJuz}</RNText>
              <RNText> of the Holy Qur'an</RNText>
            </>
        }
      </RNText>
    </View>
  );
};

// Phase 3: Themes/Categories Tab Component
const ThemesTab = ({ navigation, isSearchBarHidden, setIsSearchBarHidden }) => {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [searchTheme, setSearchTheme] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Add scroll bar functionality
  const [contentHeight, setContentHeight] = useState(1);
  const [visibleHeight, setVisibleHeight] = useState(1);
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Convert numbers to Arabic if needed
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchTheme.trim()) return THEME_CATEGORIES;
    
    return THEME_CATEGORIES.filter(category => {
      const titleMatch = (language === 'ar' ? category.titleAr : category.titleEn)
        .toLowerCase().includes(searchTheme.toLowerCase());
      const descMatch = (language === 'ar' ? category.descAr : category.descEn)
        .toLowerCase().includes(searchTheme.toLowerCase());
      const subcategoryMatch = category.subcategories.some(sub => 
        (language === 'ar' ? sub.titleAr : sub.titleEn)
          .toLowerCase().includes(searchTheme.toLowerCase())
      );
      
      return titleMatch || descMatch || subcategoryMatch;
    });
  }, [searchTheme, language]);

  const renderCategoryCard = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryCard,
        selectedCategory?.id === category.id && styles.selectedCategoryCard
      ]}
      onPress={() => {
        // haptic feedback removed;
        setSelectedCategory(selectedCategory?.id === category.id ? null : category);
        setSelectedSubcategory(null);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryTextContainer, { alignItems: 'center', textAlign: 'center' }]}>
          <RNText style={[styles.categoryTitle, { 
            fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh Bold' : 'Montserrat-Bold',
            textAlign: 'center'
          }]}>
            {language === 'ar' ? category.titleAr : category.titleEn}
          </RNText>
          <RNText style={[styles.categoryDesc, {
            fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh' : 'Montserrat-Regular',
            textAlign: 'center'
          }]}>
            {language === 'ar' ? category.descAr : category.descEn}
          </RNText>
        </View>
      </View>
      
      {selectedCategory?.id === category.id && (
        <View style={styles.subcategoryContainer}>
          <View style={styles.subcategoryDivider} />
          {category.subcategories.map((sub, index) => (
            <TouchableOpacity
              key={sub.id}
              style={[
                styles.subcategoryCard,
                selectedSubcategory?.id === sub.id && styles.selectedSubcategoryCard,
                index === category.subcategories.length - 1 && { marginBottom: 0 }
              ]}
              onPress={() => {
                // haptic feedback removed;
                setSelectedSubcategory(selectedSubcategory?.id === sub.id ? null : sub);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.subcategoryHeader}>
                <RNText style={[styles.subcategoryTitle, {
                  fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh Bold' : 'Montserrat-Bold'
                }]}>
                  {language === 'ar' ? sub.titleAr : sub.titleEn}
                </RNText>
                <RNText style={[styles.subcategorySurahs, {
                  fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh' : 'Montserrat-Regular'
                }]}>
                  {language === 'ar' ? 'السور: ' : 'Surahs: '}
                  {sub.surahs.map(s => toArabicNumber(s)).join(', ')}
                </RNText>
              </View>
              
              {selectedSubcategory?.id === sub.id && (
                <TouchableOpacity
                  style={styles.exploreSubcategoryButton}
                  onPress={() => {
                    // haptic feedback removed;
                    // Navigate to first surah in this subcategory
                  navigation.navigate('Memorization', { 
                      surah: { id: sub.surahs[0] }
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <RNText style={[styles.exploreSubcategoryButtonText, {
                    fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh Bold' : 'Montserrat-Bold',
                    textAlign: 'center' // Center the text
                  }]}>
                    {language === 'ar' ? 'استكشف هذا الموضوع' : 'Explore this Theme'}
                  </RNText>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  // Render scroll bar for categories
  const renderCategoriesScrollBar = () => {
    if (contentHeight <= visibleHeight) return null; // Don't show if no scrolling needed
    
    // Calculate actual scroll bar height based on container positioning
    const scrollBarHeight = visibleHeight - 380; // Same calculation as main scroll bar
    const handleHeight = 40;
    const trackHeight = Math.max(100, scrollBarHeight - handleHeight); // Ensure minimum track height
    
    const scrollableDistance = contentHeight - visibleHeight;
    
    const handlePosition = scrollY.interpolate({
      inputRange: [0, scrollableDistance],
      outputRange: [0, trackHeight],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.scrollBarContainer, {
        right: language === 'ar' ? undefined : 0,
        left: language === 'ar' ? 0 : undefined
      }]}>
        <View style={styles.scrollBar}>
          <Animated.View 
            style={[
              styles.scrollHandle,
              {
                transform: [{ translateY: handlePosition }],
              },
            ]} 
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.themesTabContent}>
      {/* Search bar for themes - positioned absolutely like Surah tab */}
      {!isSearchBarHidden && (
        <View style={[styles.themeSearchContainer, {
          top: language === 'ar' ? 113 : 93 // Brought down search bar in categories tab more
        }]}>
        <View style={[styles.themeSearchInputContainer, {
          backgroundColor: isSearchFocused ? 'rgba(245, 230, 200, 0.15)' : 'rgba(245, 230, 200, 0.1)',
                          ...(Platform.OS === 'android' && { paddingVertical: SIZES.small / 4 })
        }]}>
          <Image 
            source={require('../assets/app_icons/search.png')} 
            style={{ width: 20, height: 20, tintColor: 'rgba(165,115,36,0.8)', marginRight: SIZES.small }}
            resizeMode="contain"
          />
                    <TextInput
            style={[styles.themeSearchInput, {
              fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh' : 'Montserrat-Regular',
              textAlign: language === 'ar' ? 'right' : 'left',
              writingDirection: language === 'ar' ? 'rtl' : 'ltr',
              ...(Platform.OS === 'android' && { fontSize: 12 })
            }]}
            placeholder={language === 'ar' ? 'ابحث في الفئات...' : 'Search through categories...'}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchTheme}
            onChangeText={setSearchTheme}
            autoCapitalize="none"
            autoCorrect={false}
            allowFontScaling={false}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchTheme.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTheme('')} style={styles.clearThemeButton}>
              <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      )}
      
      <Animated.FlatList
        ref={flatListRef}
        data={filteredCategories}
        renderItem={({ item }) => renderCategoryCard(item)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesList}
        showsVerticalScrollIndicator={false}
        bounces={true}
        style={styles.categoriesScrollView}
        onScroll={(event) => {
          // Update scrollY for scroll bar animation
          scrollY.setValue(event.nativeEvent.contentOffset.y);
          // Real-time search bar hide/show based on scroll position
          const currentScrollY = event.nativeEvent.contentOffset.y;
          setIsSearchBarHidden(currentScrollY > 50);
        }}
        scrollEventThrottle={8}
        onContentSizeChange={(w, h) => setContentHeight(h)}
        onLayout={e => setVisibleHeight(e.nativeEvent.layout.height)}
        ListEmptyComponent={() => (
          <View style={styles.emptyThemes}>
            <RNText style={styles.emptyThemesText}>
              {language === 'ar' ? 'لا توجد نتائج' : 'No themes found'}
            </RNText>
          </View>
        )}
      />
      {renderCategoriesScrollBar()}
    </View>
  );
};

// Lists Tab Component
const ListsTab = ({ navigation, route, searchText }) => {
  const { language, t } = useLanguage();
  const [customLists, setCustomLists] = useState([]);
  const [selectedList, setSelectedList] = useState('Favorites');
  const [listSurahs, setListSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Helper to convert numbers to Arabic-Indic if needed
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };

  // Load custom lists
  useEffect(() => {
    const loadCustomLists = async () => {
      try {
        const lists = await getCustomLists();
        setCustomLists(lists);
        if (lists.length > 0) {
          setSelectedList(lists[0]);
        }
      } catch (error) {
        console.error('[ListsTab] Error loading custom lists:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCustomLists();
  }, []);

  // Load individual ayahs for selected list
  useEffect(() => {
    const loadListAyahs = async () => {
      try {
        const surahs = await getListSurahs(selectedList);
        // Flatten surahs into individual ayahs
        const allAyahs = [];
        surahs.forEach(surah => {
          surah.bookmarkedAyaat.forEach(ayahNumber => {
            allAyahs.push({
              surahName: surah.surahName,
              surahNumber: surah.surahNumber,
              ayahNumber: ayahNumber,
              id: `${surah.surahNumber}_${ayahNumber}`
            });
          });
        });
        setListSurahs(allAyahs);
      } catch (error) {
        console.error('[ListsTab] Error loading list ayahs:', error);
      }
    };
    
    if (selectedList) {
      loadListAyahs();
    }
  }, [selectedList]);

  // Filter ayahs based on search
  const filteredAyahs = useMemo(() => {
    if (!searchText.trim()) return listSurahs;
    
    return listSurahs.filter(ayah => {
      const surahName = language === 'ar' ? t(`surah_${ayah.surahNumber}`) : ayah.surahName;
      return surahName.toLowerCase().includes(searchText.toLowerCase()) ||
             ayah.ayahNumber.toString().includes(searchText);
    });
  }, [listSurahs, searchText, language, t]);

  const renderAyah = ({ item, index }) => (
    <TouchableOpacity
      style={styles.ayahCard}
      onPress={() => {
        // haptic feedback removed;
        // Navigate to specific ayah
        navigation.navigate('Memorization', {
          surah: { id: item.surahNumber, name: item.surahName },
          resumeFromIndex: 0,
          targetAyah: item.ayahNumber
        });
      }}
      activeOpacity={0.8}
    >
      <View style={styles.ayahInfo}>
        <View style={[
          styles.ayahHeader,
          language === 'ar' && { flexDirection: 'row-reverse' }
        ]}>
          <RNText style={[styles.surahNumber, {
            fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh Bold' : 'Montserrat-Bold'
          }]}>
            {toArabicNumber(item.surahNumber)}
          </RNText>
          <RNText style={[styles.surahName, {
            fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh Bold' : 'Montserrat-Bold'
          }]}>
            {language === 'ar' ? t(`surah_${item.surahNumber}`) : item.surahName}
          </RNText>
        </View>
        
        <View style={styles.ayahDetails}>
          <RNText style={[styles.ayahNumber, {
            fontFamily: language === 'ar' ? 'KFGQPC Uthman Taha Naskh' : 'Montserrat-Regular'
          }]}>
            {language === 'ar' ? 
              `الآية ${toArabicNumber(item.ayahNumber)}` : 
              `Ayah ${item.ayahNumber}`
            }
          </RNText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListSelector = () => (
    <View style={styles.dropdownContainer}>
      {/* Select List Label */}
      <RNText style={[
        styles.selectListLabel,
        language === 'ar' && { 
          marginTop: SIZES.extraLarge * 2,
          textAlign: 'center',
          fontSize: 18
        },
        Platform.OS === 'android' && { marginTop: SIZES.extraLarge * 4 }
      ]}>
        {language === 'ar' ? 'اختر القائمة' : 'Select List'}
      </RNText>
      
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowDropdown(!showDropdown)}
        activeOpacity={0.8}
      >
        <RNText style={styles.dropdownButtonText}>
          {selectedList}
        </RNText>
      </TouchableOpacity>
    
      {showDropdown && (
        <ScrollView 
          style={styles.dropdownList}
          showsVerticalScrollIndicator={customLists.length > 4}
          nestedScrollEnabled={true}
          indicatorStyle="white"
        >
          {customLists.map((listName) => (
            <TouchableOpacity
              key={listName}
              style={[
                styles.dropdownItem,
                selectedList === listName && styles.selectedDropdownItem
              ]}
              onPress={() => {
                setSelectedList(listName);
                setShowDropdown(false);
              }}
              activeOpacity={0.8}
            >
              <RNText style={[
                styles.dropdownItemText,
                selectedList === listName && styles.selectedDropdownItemText
              ]}>
                {listName}
              </RNText>
              {selectedList === listName && (
                <RNText style={styles.checkmark}>✓</RNText>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <RNText style={styles.loadingText}>
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </RNText>
      </View>
    );
  }

  return (
    <View style={styles.bookmarksTabContent}>
      {renderListSelector()}
      
      <FlatList
        data={filteredAyahs}
        renderItem={renderAyah}
        keyExtractor={(item) => `list_${selectedList}_${item.id}`}
        contentContainerStyle={styles.bookmarksList}
                        showsVerticalScrollIndicator={true}
                        ListEmptyComponent={() => (
                          <View style={styles.emptyBookmarks}>
                            <RNText style={styles.emptyBookmarksText}>
                              {language === 'ar' ?
                                'لا توجد آيات محفوظة في هذه القائمة' :
                                'No saved ayahs in this list'
                              }
                            </RNText>
                            <RNText style={styles.emptyBookmarksSubtext}>
                              {language === 'ar' ?
                                'اضغط على أيقونة الإشارة المرجعية في شاشة الحفظ لحفظ الآيات' :
                                'Tap the bookmark icon in memorization screen to save ayahs'
                              }
                            </RNText>
                          </View>
                        )}
                      />
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
    minHeight: 45, // Made even shorter
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10, // Made even shorter for more compact header
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
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },


  list: {
    padding: SIZES.medium,
    paddingTop: 180, // Bring items back down to original position
    marginTop: 0, // Removed margin to allow content to show through headers
    paddingBottom: SIZES.extraLarge * 12, // Increased significantly more for proper tab clearance
    minHeight: '100%', // Ensure list takes full height
  },
  surahCard: {
    marginBottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.93)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    borderRadius: 30, // Increased from 20 to 30 for even more rounded borders
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
    marginBottom: 4, // Add some space below
    fontSize: 14, // Make it slightly larger
    fontWeight: '500', // Make it slightly bolder
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
    top: 150, // Moved down a tiny bit from 140
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: SIZES.small / 2, // Reduced padding to make search bar thinner
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  searchIcon: {
    marginRight: SIZES.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF', // Made text whiter
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // Add text shadow for better readability
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  clearButton: {
    padding: SIZES.small,
  },
  allSurahsButton: {
    backgroundColor: 'rgba(51, 105, 78, 0.8)',
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  allSurahsButtonText: {
    color: '#F5E6C8',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
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
    bottom: 200, // Increased from 100 to make scroll bar visually shorter
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
    flex: 1,
    height: '100%',
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(45, 85, 65, 0.85)', // More muted green (reduced saturation)
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    position: 'absolute',
    bottom: 110, // Brought back up a tiny bit from 100
    left: 0,
    right: 0,
    justifyContent: 'space-around',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.small,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Thinner, slightly transparent black
    transform: [{ scale: 1 }], // Default scale
    marginHorizontal: 8, // Add spacing between tabs
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  activeTabButton: {
    backgroundColor: 'rgba(165,115,36,0.8)',
                    transform: [{ scale: 1.3 }], // Make selected tab larger
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: COLORS.white,
  },
  tabContentContainer: {
    flex: 1,
    marginTop: 20, // Space for search bar
    marginBottom: 0, // Remove margin to allow content all the way down
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.large,
  },
  comingSoonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SIZES.small,
  },
  comingSoonSubtext: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
  },
  wheelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.large,
    position: 'relative',
  },
  juzNumber: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 32, // Much larger since it's just the number now
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  wheelCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(165,115,36,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  wheelCenterText: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.extraSmall,
  },
  wheelCenterSubtext: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  juzDetails: {
    marginTop: SIZES.large,
    padding: SIZES.medium,
    backgroundColor: 'rgba(64, 64, 64, 0.9)',
    borderRadius: SIZES.medium,
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.8)',
    alignSelf: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  juzDetailsTitle: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.small,
  },
  juzDetailsRange: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: SIZES.small,
  },
  juzDetailsSurahs: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: SIZES.medium,
  },
  exploreJuzButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exploreJuzButtonText: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  juzWheelTitle: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.large,
  },
  juzWheelInstructions: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: SIZES.medium,
  },
  themesTabContent: {
    flex: 1,
    backgroundColor: 'transparent', // Make black background completely transparent
    padding: 0, // Removed padding to allow content to flow through headers
  },
  themesHeader: {
    width: '100%',
    alignItems: 'center',
    marginTop: SIZES.extraLarge * 2, // Move components down further under Categories title
    marginBottom: SIZES.medium,
  },
  themesTitle: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.small,
  },
  themesSubtitle: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: SIZES.large,
  },
  themeSearchContainer: {
    position: 'absolute', // Position absolutely like Surah search
    left: 0,
    right: 0,
    zIndex: 10,
    padding: SIZES.medium, // Add padding like Surah search
  },
  themeSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20, // Match Surah search
    padding: SIZES.small, // Match Surah search
    borderWidth: 1,
    borderColor: '#C0C0C0', // Match Surah search
    backgroundColor: 'transparent', // Match Surah search
  },
  themeSearchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text, // Use default text color to match Surah search
    paddingHorizontal: 0, // Match Surah search
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // Add text shadow for better readability
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  clearThemeButton: {
    padding: SIZES.small,
  },
  categoriesList: {
    paddingTop: Platform.OS === 'android' ? 200 : 160, // Brought down first category box
    paddingBottom: SIZES.extraLarge * 8, // Increased significantly more for proper tab clearance
    paddingHorizontal: SIZES.medium, // Add horizontal padding for proper spacing
  },
  categoryCard: {
    backgroundColor: 'rgba(64, 64, 64, 0.4)', // Made more transparent
    borderRadius: SIZES.large,
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.3)',
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    marginHorizontal: SIZES.large, // Add horizontal margins to make boxes less wide
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedCategoryCard: {
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 2,
    backgroundColor: 'rgba(165, 115, 36, 0.1)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(165, 115, 36, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.small,
  },
  categoryIcon: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(165,115,36,0.8)',
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5E6C8', // Match title color
    marginBottom: SIZES.extraSmall,
  },
  categoryDesc: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  expandIcon: {
    padding: SIZES.small,
  },
  subcategoryContainer: {
    width: '100%',
  },
  subcategoryDivider: {
    height: 1,
    backgroundColor: 'rgba(165, 115, 36, 0.5)',
    marginVertical: SIZES.small,
  },
  subcategoryCard: {
    backgroundColor: 'rgba(80, 80, 80, 0.9)',
    borderRadius: SIZES.medium,
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.8)',
    padding: SIZES.medium,
    marginBottom: SIZES.small,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedSubcategoryCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  subcategoryHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SIZES.extraSmall,
  },
  subcategoryTitle: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5E6C8', // Match title color
    marginBottom: SIZES.extraSmall,
  },
  subcategorySurahs: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  exploreSubcategoryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: SIZES.small,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exploreSubcategoryButtonText: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  juzProgressContainer: {
    position: 'absolute',
    width: 40,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  progressBarBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  juzProgressNumber: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  juzContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.large,
    backgroundColor: 'transparent', // Made fully transparent
    marginTop: -30, // Brought up a tiny bit more (from -20)
  },
  juzTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5E6C8',
    textAlign: 'center',
    marginBottom: SIZES.large,
  },
  juzSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: SIZES.extraLarge,
  },
  polygonContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  polygonSvg: {
    position: 'absolute',
  },
  centralJuzButton: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'transparent', // Made transparent since hexagon is in SVG
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  juzLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },

  juzInfo: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: SIZES.medium,
  },
  emptyThemes: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.large,
  },
  emptyThemesText: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 20,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  categoriesScrollView: {
    flex: 1,
  },
  // Bookmarks Tab Styles
  bookmarksTabContent: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: SIZES.large, // Brought content closer to dropdown
  },
  bookmarksList: {
    padding: SIZES.medium,
    paddingTop: SIZES.extraSmall, // Brought content closer to dropdown
    paddingBottom: SIZES.extraLarge * 12,
  },
  bookmarkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.small,
  },
  bookmarkCount: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: SIZES.small,
  },
  emptyBookmarks: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.large,
  },
  emptyBookmarksText: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 20,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: SIZES.medium,
  },
  emptyBookmarksSubtext: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: SIZES.small,
    paddingHorizontal: SIZES.large,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
                  loadingText: {
                  fontFamily: 'KFGQPC Uthman Taha Naskh',
                  fontSize: 18,
                  color: '#CCCCCC',
                  textAlign: 'center',
                },
                bookmarksHeader: {
                  paddingHorizontal: SIZES.medium,
                  paddingTop: SIZES.large,
                  paddingBottom: SIZES.medium,
                },
                bookmarksTitle: {
                  fontFamily: 'KFGQPC Uthman Taha Naskh Bold',
                  fontSize: 24,
                  color: '#F5E6C8',
                  textAlign: 'center',
                },
                themesHeader: {
                  paddingHorizontal: SIZES.medium,
                  paddingTop: SIZES.large,
                  paddingBottom: SIZES.medium,
                },
                themesTitle: {
                  fontFamily: 'KFGQPC Uthman Taha Naskh Bold',
                  fontSize: 24,
                  color: '#F5E6C8',
                  textAlign: 'center',
                },
                dropdownContainer: {
                  paddingHorizontal: SIZES.medium,
                  paddingVertical: SIZES.small,
                  paddingTop: Platform.OS === 'android' ? SIZES.extraLarge * 6 : SIZES.extraLarge * 4, // Lowered dropdown
                  zIndex: 1000,
                },
                dropdownButton: {
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: SIZES.small,
                  paddingHorizontal: SIZES.medium,
                  paddingVertical: SIZES.small,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 230, 200, 0.3)',
                },
                dropdownButtonText: {
                  fontFamily: 'KFGQPC Uthman Taha Naskh',
                  fontSize: 16,
                  color: '#F5E6C8',
                  fontWeight: 'bold',
                },
                dropdownList: {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  borderRadius: SIZES.small,
                  marginTop: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 230, 200, 0.3)',
                  maxHeight: 200,
                  overflow: 'hidden',
                },
                dropdownItem: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: SIZES.medium,
                  paddingVertical: SIZES.small,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(245, 230, 200, 0.1)',
                  minHeight: 44,
                },
                selectedDropdownItem: {
                  backgroundColor: 'rgba(91, 127, 103, 0.3)',
                },
                dropdownItemText: {
                  fontFamily: 'KFGQPC Uthman Taha Naskh',
                  fontSize: 16,
                  color: '#F5E6C8',
                },
                selectedDropdownItemText: {
                  color: '#5b7f67',
                  fontWeight: 'bold',
                },
                selectListLabel: {
                  fontFamily: 'KFGQPC Uthman Taha Naskh',
                  fontSize: 16,
                  color: '#C0C0C0',
                  marginBottom: SIZES.small,
                  marginTop: SIZES.medium,
                  textShadowColor: '#000',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                },
                checkmark: {
                  fontFamily: 'KFGQPC Uthman Taha Naskh',
                  fontSize: 16,
                  color: '#5b7f67',
                  marginLeft: SIZES.small,
                },
  ayahCard: {
    marginBottom: SIZES.medium,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    borderRadius: SIZES.small,
    overflow: 'hidden',
    marginHorizontal: SIZES.medium,
    padding: SIZES.medium,
  },
  ayahInfo: {
    flex: 1,
  },
  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.small,
  },
  surahNumber: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 18,
    color: '#CCCCCC',
  },
  surahName: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 16,
    color: '#F5E6C8',
  },
  ayahDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ayahNumber: {
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    fontSize: 14,
    color: '#CCCCCC',
  },
});

export default SurahListScreen; 