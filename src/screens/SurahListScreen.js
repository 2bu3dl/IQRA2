import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Card from '../components/Card';
import { loadData } from '../utils/store';

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

  const surahs = [
    {
      id: 1,
      name: 'Al-Fatihah',
      totalAyahs: data.memorizedAyahs['Al-Fatihah']?.total || 7,
      memorizedAyahs: data.memorizedAyahs['Al-Fatihah']?.memorized || 0,
    },
    { id: 2, name: 'Al-Baqarah', totalAyahs: 286, memorizedAyahs: 0 },
    { id: 3, name: 'Ali Imran', totalAyahs: 200, memorizedAyahs: 0 },
    // Add more surahs as needed
  ];

  const renderSurahItem = ({ item }) => (
    <Card
      variant="elevated"
      style={[styles.surahCard, {backgroundColor: COLORS.white, borderColor: COLORS.accent, borderWidth: 1}]}
      onPress={() => navigation.navigate('Memorization', { surah: item })}>
      <View style={styles.surahInfo}>
        <Text variant="h3">{item.name}</Text>
        <Text variant="body2" color="textSecondary">
          {item.memorizedAyahs}/{item.totalAyahs} Ayaat memorized
        </Text>
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
        <Text variant="h1" color="primary">Surahs</Text>
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