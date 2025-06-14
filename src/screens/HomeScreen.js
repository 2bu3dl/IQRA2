import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Image, ImageBackground } from 'react-native';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { loadData } from '../utils/store';

const HomeScreen = ({ navigation }) => {
  const [data, setData] = useState({
    totalHasanat: 0,
    todayHasanat: 0,
    streak: 0,
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

  return (
    <ImageBackground
      source={require('../assets/background-pattern.png')}
      style={styles.background}
      imageStyle={{ opacity: 0.35 }}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text variant="h1" color="primary">IQRA2U</Text>
        </View>
        
        <View style={styles.content}>
          <Card variant="elevated" style={[styles.card, {backgroundColor: COLORS.white, borderColor: COLORS.accent, borderWidth: 1}]}>
            <Text variant="h3">Total 7asanaat</Text>
            <Text variant="h1" color="primary">{data.totalHasanat}</Text>
            <Text variant="body2" color="textSecondary">+{data.todayHasanat} today</Text>
          </Card>

          <Card variant="elevated" style={[styles.card, {backgroundColor: COLORS.white, borderColor: COLORS.accent, borderWidth: 1}]}>
            <Text variant="h3">Memorization Progress</Text>
            <Text variant="body1">
              Al-Fatihah: {data.memorizedAyahs['Al-Fatihah']?.memorized || 0}/{data.memorizedAyahs['Al-Fatihah']?.total || 7} Ayaat
            </Text>
          </Card>

          <Card variant="elevated" style={[styles.card, {backgroundColor: COLORS.white, borderColor: COLORS.accent, borderWidth: 1}]}>
            <Text variant="h3">Daily Streak</Text>
            <Text variant="h1" color="primary">{data.streak}</Text>
            <Text variant="body2" color="textSecondary">days</Text>
          </Card>

          <Button
            title="Start Memorizing"
            onPress={() => navigation.navigate('SurahList')}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SIZES.large,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: SIZES.extraLarge,
    borderBottomRightRadius: SIZES.extraLarge,
  },
  content: {
    flex: 1,
    padding: SIZES.medium,
  },
  card: {
    marginBottom: SIZES.medium,
    backgroundColor: COLORS.white,
    borderColor: COLORS.accent,
    borderWidth: 1,
  },
  button: {
    marginTop: SIZES.large,
    backgroundColor: COLORS.primary,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
    alignSelf: 'center',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default HomeScreen; 