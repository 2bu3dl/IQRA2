import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, SafeAreaView, Dimensions, Animated, Image, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Import page images
import getPageImage from '../assets/mushaf_pages/index';

export default function SimpleMushafScreen({ navigation, route }) {
  const initialPage = route?.params?.pageNumber || 1;
  const [page, setPage] = useState(Math.min(604, Math.max(1, initialPage)));
  const [isHideMode, setIsHideMode] = useState(false);
  const [blockPosition, setBlockPosition] = useState({ x: 0, y: 200 });
  const [blockSize, setBlockSize] = useState({ width: 250, height: 300 });
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedStartAyah, setSelectedStartAyah] = useState(1);
  const [selectedEndAyah, setSelectedEndAyah] = useState(7);
  
  // Animated values for smooth movement
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const blockWidth = useRef(new Animated.Value(0.3)).current; // Start small
  const blockHeight = useRef(new Animated.Value(0.3)).current; // Start small

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
      setBlockPosition({ x: 0, y: 0 });
      setBlockSize({ width: 250, height: 300 });
      translateX.setValue(0);
      translateY.setValue(0);
      blockWidth.setValue(0.3); // Reset scale to small
      blockHeight.setValue(0.3); // Reset scale to small
    }
  };

  const handleNextPage = () => {
    if (page < 604) {
      setPage(page + 1);
      setBlockPosition({ x: 0, y: 0 });
      setBlockSize({ width: 250, height: 300 });
      translateX.setValue(0);
      translateY.setValue(0);
      blockWidth.setValue(0.3); // Reset scale to small
      blockHeight.setValue(0.3); // Reset scale to small
    }
  };

  const handleHideToggle = () => {
    setIsHideMode(!isHideMode);
  };

  const handleAudioToggle = () => {
    setShowAudioModal(true);
  };

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start general Quran recording
      console.log('Started general Quran recording');
      Alert.alert('Recording Started', 'Recording any part of the Quran');
    } else {
      // Stop recording
      console.log('Stopped recording');
      Alert.alert('Recording Stopped', 'Recording saved');
    }
  };

  const handleAudioPlay = () => {
    setShowAudioModal(false);
    setIsAudioMode(true);
    console.log(`Playing Surah ${selectedSurah}, Ayahs ${selectedStartAyah}-${selectedEndAyah}`);
    Alert.alert('Audio Playing', `Playing Surah ${selectedSurah}, Ayahs ${selectedStartAyah}-${selectedEndAyah}`);
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

    // Search by surah name (common English names)
    const surahNames = {
      'fatiha': 1, 'al-fatiha': 1, 'opening': 1,
      'baqarah': 2, 'al-baqarah': 2, 'cow': 2,
      'imran': 3, 'al-imran': 3, 'family of imran': 3,
      'nisa': 4, 'an-nisa': 4, 'women': 4,
      'maidah': 5, 'al-maidah': 5, 'table': 5,
      'anfal': 8, 'al-anfal': 8, 'spoils': 8,
      'taubah': 9, 'at-taubah': 9, 'repentance': 9,
      'yusuf': 12, 'joseph': 12,
      'ibrahim': 14, 'abraham': 14,
      'maryam': 19, 'mary': 19,
      'ta ha': 20, 'taha': 20,
      'anbiya': 21, 'al-anbiya': 21, 'prophets': 21,
      'hajj': 22, 'al-hajj': 22, 'pilgrimage': 22,
      'muminun': 23, 'al-muminun': 23, 'believers': 23,
      'nur': 24, 'an-nur': 24, 'light': 24,
      'furqan': 25, 'al-furqan': 25, 'criterion': 25,
      'shuara': 26, 'ash-shuara': 26, 'poets': 26,
      'naml': 27, 'an-naml': 27, 'ant': 27,
      'qasas': 28, 'al-qasas': 28, 'stories': 28,
      'ankabut': 29, 'al-ankabut': 29, 'spider': 29,
      'rum': 30, 'ar-rum': 30, 'romans': 30,
      'luqman': 31, 'lokman': 31,
      'sajdah': 32, 'as-sajdah': 32, 'prostration': 32,
      'ahzab': 33, 'al-ahzab': 33, 'clans': 33,
      'saba': 34, 'as-saba': 34, 'sheba': 34,
      'fatir': 35, 'al-fatir': 35, 'creator': 35,
      'yasin': 36, 'ya-sin': 36,
      'saffat': 37, 'as-saffat': 37, 'ranged': 37,
      'sad': 38,
      'zumar': 39, 'az-zumar': 39, 'troops': 39,
      'ghafir': 40, 'al-ghafir': 40, 'forgiver': 40,
      'fussilat': 41, 'al-fussilat': 41, 'explained': 41,
      'shura': 42, 'ash-shura': 42, 'consultation': 42,
      'zukhruf': 43, 'az-zukhruf': 43, 'ornaments': 43,
      'dukhan': 44, 'ad-dukhan': 44, 'smoke': 44,
      'jathiyah': 45, 'al-jathiyah': 45, 'kneeling': 45,
      'ahqaf': 46, 'al-ahqaf': 46, 'dunes': 46,
      'muhammad': 47,
      'fath': 48, 'al-fath': 48, 'victory': 48,
      'hujurat': 49, 'al-hujurat': 49, 'chambers': 49,
      'qaf': 50,
      'dhariyat': 51, 'ad-dhariyat': 51, 'scatterers': 51,
      'tur': 52, 'at-tur': 52, 'mountain': 52,
      'najm': 53, 'an-najm': 53, 'star': 53,
      'qamar': 54, 'al-qamar': 54, 'moon': 54,
      'rahman': 55, 'ar-rahman': 55, 'beneficent': 55,
      'waqiah': 56, 'al-waqiah': 56, 'event': 56,
      'hadid': 57, 'al-hadid': 57, 'iron': 57,
      'mujadilah': 58, 'al-mujadilah': 58, 'pleading': 58,
      'hashr': 59, 'al-hashr': 59, 'exile': 59,
      'mumtahanah': 60, 'al-mumtahanah': 60, 'examined': 60,
      'saff': 61, 'as-saff': 61, 'ranks': 61,
      'jumuah': 62, 'al-jumuah': 62, 'friday': 62,
      'munafiqun': 63, 'al-munafiqun': 63, 'hypocrites': 63,
      'taghabun': 64, 'at-taghabun': 64, 'mutual loss': 64,
      'talaq': 65, 'at-talaq': 65, 'divorce': 65,
      'tahrim': 66, 'at-tahrim': 66, 'forbidding': 66,
      'mulk': 67, 'al-mulk': 67, 'sovereignty': 67,
      'qalam': 68, 'al-qalam': 68, 'pen': 68,
      'haqqah': 69, 'al-haqqah': 69, 'reality': 69,
      'maarij': 70, 'al-maarij': 70, 'ascending': 70,
      'nuh': 71, 'noah': 71,
      'jinn': 72, 'al-jinn': 72,
      'muzzammil': 73, 'al-muzzammil': 73, 'enwrapped': 73,
      'muddaththir': 74, 'al-muddaththir': 74, 'cloaked': 74,
      'qiyamah': 75, 'al-qiyamah': 75, 'resurrection': 75,
      'insan': 76, 'al-insan': 76, 'man': 76,
      'mursalat': 77, 'al-mursalat': 77, 'emissaries': 77,
      'naba': 78, 'an-naba': 78, 'tidings': 78,
      'naziat': 79, 'an-naziat': 79, 'snatchers': 79,
      'abasa': 80, 'he frowned': 80,
      'takwir': 81, 'at-takwir': 81, 'folding': 81,
      'infitar': 82, 'al-infitar': 82, 'cleaving': 82,
      'mutaffifin': 83, 'al-mutaffifin': 83, 'defrauding': 83,
      'inshiqaq': 84, 'al-inshiqaq': 84, 'sundering': 84,
      'buruj': 85, 'al-buruj': 85, 'constellations': 85,
      'tariq': 86, 'at-tariq': 86, 'nightcomer': 86,
      'ala': 87, 'al-ala': 87, 'most high': 87,
      'ghashiyah': 88, 'al-ghashiyah': 88, 'overwhelming': 88,
      'fajr': 89, 'al-fajr': 89, 'dawn': 89,
      'balad': 90, 'al-balad': 90, 'land': 90,
      'shams': 91, 'ash-shams': 91, 'sun': 91,
      'layl': 92, 'al-layl': 92, 'night': 92,
      'duha': 93, 'ad-duha': 93, 'forenoon': 93,
      'sharh': 94, 'ash-sharh': 94, 'expansion': 94,
      'tin': 95, 'at-tin': 95, 'fig': 95,
      'alaq': 96, 'al-alaq': 96, 'clot': 96,
      'qadr': 97, 'al-qadr': 97, 'power': 97,
      'bayyinah': 98, 'al-bayyinah': 98, 'evidence': 98,
      'zalzalah': 99, 'az-zalzalah': 99, 'earthquake': 99,
      'adiyat': 100, 'al-adiyat': 100, 'coursers': 100,
      'qariah': 101, 'al-qariah': 101, 'calamity': 101,
      'takathur': 102, 'at-takathur': 102, 'rivalry': 102,
      'asr': 103, 'al-asr': 103, 'time': 103,
      'humazah': 104, 'al-humazah': 104, 'slanderer': 104,
      'fil': 105, 'al-fil': 105, 'elephant': 105,
      'quraysh': 106, 'al-quraysh': 106,
      'maun': 107, 'al-maun': 107, 'assistance': 107,
      'kawthar': 108, 'al-kawthar': 108, 'abundance': 108,
      'kafirun': 109, 'al-kafirun': 109, 'disbelievers': 109,
      'nasr': 110, 'an-nasr': 110, 'help': 110,
      'masad': 111, 'al-masad': 111, 'palm fiber': 111,
      'ikhlas': 112, 'al-ikhlas': 112, 'sincerity': 112,
      'falaq': 113, 'al-falaq': 113, 'daybreak': 113,
      'nas': 114, 'an-nas': 114, 'mankind': 114
    };

    for (const [name, surahNum] of Object.entries(surahNames)) {
      if (name.includes(queryLower)) {
        results.push({
          type: 'surah',
          title: `Surah ${surahNum}`,
          subtitle: `Go to Surah ${surahNum}`,
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
      setPage(result.pageNumber);
    } else if (result.type === 'surah') {
      // Navigate to first page of surah (simplified)
      const surahFirstPages = {
        1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
        10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
        18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
        26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
        34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
        42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
        50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
        58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
        66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 571, 73: 573,
        74: 574, 75: 575, 76: 577, 77: 578, 78: 580, 79: 581, 80: 582, 81: 583,
        82: 584, 83: 585, 84: 586, 85: 587, 86: 587, 87: 588, 88: 589, 89: 590,
        90: 590, 91: 591, 92: 591, 93: 592, 94: 592, 95: 593, 96: 593, 97: 594,
        98: 594, 99: 595, 100: 595, 101: 595, 102: 596, 103: 596, 104: 596,
        105: 596, 106: 597, 107: 597, 108: 597, 109: 598, 110: 598, 111: 598,
        112: 598, 113: 599, 114: 599
      };
      const pageNum = surahFirstPages[result.surahNumber] || 1;
      setPage(pageNum);
    } else if (result.type === 'ayah') {
      // Navigate to approximate page for ayah (simplified)
      const surahFirstPages = {
        1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
        10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
        18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
        26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
        34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
        42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
        50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
        58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
        66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 571, 73: 573,
        74: 574, 75: 575, 76: 577, 77: 578, 78: 580, 79: 581, 80: 582, 81: 583,
        82: 584, 83: 585, 84: 586, 85: 587, 86: 587, 87: 588, 88: 589, 89: 590,
        90: 590, 91: 591, 92: 591, 93: 592, 94: 592, 95: 593, 96: 593, 97: 594,
        98: 594, 99: 595, 100: 595, 101: 595, 102: 596, 103: 596, 104: 596,
        105: 596, 106: 597, 107: 597, 108: 597, 109: 598, 110: 598, 111: 598,
        112: 598, 113: 599, 114: 599
      };
      const pageNum = surahFirstPages[result.surahNumber] || 1;
      setPage(pageNum);
    }
  };

  const handleHome = () => {
    navigation.navigate('Memorization');
  };

  const handleBlockDrag = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    translateX.setValue(translationX);
    translateY.setValue(translationY);
  };

  const handleBlockDragEnd = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    // Smooth animation to final position
    Animated.spring(translateX, {
      toValue: translationX,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    Animated.spring(translateY, {
      toValue: translationY,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleResizeDrag = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    // Use scale instead of width/height for native driver compatibility
    // Scale from 0.1 to 3.0 for wider resize range (can get very thin)
    const scaleX = Math.max(0.1, Math.min(3.0, 0.3 + translationX / 300));
    const scaleY = Math.max(0.1, Math.min(3.0, 0.3 + translationY / 300));
    blockWidth.setValue(scaleX);
    blockHeight.setValue(scaleY);
  };

  const handleResizeDragEnd = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    // Smooth animation to final scale
    const scaleX = Math.max(0.1, Math.min(3.0, 0.3 + translationX / 300));
    const scaleY = Math.max(0.1, Math.min(3.0, 0.3 + translationY / 300));
    
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
          <Image source={require('../assets/IQRA2iconoctagon.png')} style={styles.homeIcon} />
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
      <View style={styles.imageContainer}>
        <ImageBackground
          source={getPageImage(page)}
          style={styles.pageImage}
          resizeMode="contain"
        >
          {/* Sliding block */}
          {isHideMode && (
            <Animated.View
              style={[
                styles.slidingBlock,
                {
                  left: 0,
                  top: 0,
                  width: 250,
                  height: 300,
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
              >
                <Animated.View style={styles.blockContent}>
                  {/* Empty content - no text or drag handle */}
                </Animated.View>
              </PanGestureHandler>
              
              {/* Resize handle at bottom right */}
              <PanGestureHandler
                onGestureEvent={handleResizeDrag}
                onHandlerStateChange={({ nativeEvent }) => {
                  if (nativeEvent.state === State.END) {
                    handleResizeDragEnd({ nativeEvent });
                  }
                }}
              >
                <Animated.View style={styles.resizeHandle}>
                  <Image
                    source={require('../assets/app_icons/display-frame.png')}
                    style={styles.resizeHandleIcon}
                    resizeMode="contain"
                  />
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          )}
        </ImageBackground>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
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
          style={[styles.controlButton, isHideMode && styles.controlButtonActive]}
          onPress={handleHideToggle}
        >
          <Text style={[styles.controlButtonText, isHideMode && styles.controlButtonTextActive]}>Hide</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, isAudioMode && styles.controlButtonActive]}
          onPress={handleAudioToggle}
        >
          <Image source={require('../assets/app_icons/audio.png')} style={styles.controlIcon} />
        </TouchableOpacity>
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
                placeholder="Search by page number, surah name, or ayah (e.g., 1, fatiha, 2:255)"
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
  },
  homeIcon: {
    width: 32,
    height: 32,
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
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    backgroundColor: 'transparent', // No background
    justifyContent: 'center',
    alignItems: 'center',
  },
  resizeHandleIcon: {
    width: 20,
    height: 20,
    tintColor: '#666666', // Gray color
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
});