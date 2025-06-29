import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { loadData } from '../utils/store';
import { getAllSurahs } from '../utils/quranData';

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
  const flatListRef = useRef(null);

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

  const renderSurahItem = ({ item, index }) => {
    const isSelected = selectedSurahId === item.id;
    
    return (
    <Card
      variant="elevated"
        style={[
          styles.surahCard, 
          {
            backgroundColor: COLORS.background,
            borderColor: isSelected ? COLORS.primary : COLORS.accent,
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

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground 
        source={require('../assets/IQRA2background.png')} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
              <Image source={require('../assets/IQRA2icon.png')} style={styles.homeIcon} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text variant="h1" color="primary">Suwarr</Text>
          <Text variant="body1" color="white">(Surahs)</Text>
        </View>
      </View>
      
      <FlatList
            ref={flatListRef}
        data={surahs}
        renderItem={renderSurahItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={() => {
              // Fallback if scrollToIndex fails
              console.warn('Failed to scroll to index');
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.large,
    paddingTop: SIZES.extraLarge, // Add extra padding for dynamic island
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: SIZES.extraLarge,
    borderBottomRightRadius: SIZES.extraLarge,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  list: {
    padding: SIZES.medium,
    paddingTop: SIZES.large, // Add extra padding at the top
  },
  surahCard: {
    marginBottom: SIZES.medium,
    backgroundColor: COLORS.background,
    borderColor: COLORS.accent,
    borderWidth: 1,
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
    marginRight: SIZES.medium,
  },
  homeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
});

export default SurahListScreen; 