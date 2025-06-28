import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { loadData } from '../utils/store';
import { getAllSurahs } from '../utils/quranData';

const SurahListScreen = ({ navigation }) => {
  const [data, setData] = useState({
    memorizedAyahs: {
      'Al-Fatihah': {
        total: 7,
        memorized: 0,
      },
    },
  });

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

  // Use offline Quran data for surah list
  const surahs = getAllSurahs().map(({ surah, name, ayaat }) => ({
    id: surah,
    name: name,
    totalAyahs: surah === 1 ? 7 : ayaat.length,
    memorizedAyahs: Math.min(data.memorizedAyahs[name]?.memorized || 0, surah === 1 ? 7 : ayaat.length),
  }));

  const renderSurahItem = ({ item }) => (
    <Card
      variant="elevated"
      style={[styles.surahCard, {backgroundColor: COLORS.white, borderColor: COLORS.accent, borderWidth: 1}]}
      onPress={() => navigation.navigate('Memorization', { surah: item })}>
      <View style={styles.surahInfo}>
        <Text variant="h3">{item.name}</Text>
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
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Image source={require('../assets/logo.png')} style={styles.homeIcon} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text variant="h1" color="primary">Suwarr</Text>
          <Text variant="body1" color="white">(Surahs)</Text>
        </View>
      </View>
      
      <FlatList
        data={surahs}
        renderItem={renderSurahItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
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
  },
  surahCard: {
    marginBottom: SIZES.medium,
    backgroundColor: COLORS.white,
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
});

export default SurahListScreen; 