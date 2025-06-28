import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Image, ImageBackground, Modal, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { loadData, resetProgress } from '../utils/store';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    totalAyaat: 0,
    memorizedAyaat: 0,
  });
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  // Calculate percentage
  const progressPercentage = data.totalAyaat > 0 ? Math.round((data.memorizedAyaat / data.totalAyaat) * 100) : 0;

  return (
    <ImageBackground
      source={require('../assets/background-pattern.png')}
      style={styles.background}
      imageStyle={{ opacity: 0.35 }}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <TouchableOpacity style={styles.introButton} onPress={() => setIntroVisible(true)}>
              <Ionicons name="help-circle-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
              <Ionicons name="settings" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
          <Card variant="elevated" style={styles.progressCard}>
            <Text variant="h2" color="primary">Memorization Progress</Text>
            <Text variant="body1" style={{ marginBottom: SIZES.small }}>
              {data.memorizedAyaat} out of {data.totalAyaat} ayaat memorized
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
              {progressPercentage}% Complete
            </Text>
          </Card>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
                <Text variant="h3">Total 7asanaat</Text>
                <Text variant="h1" color="primary">{data.totalHasanat}</Text>
                <Text variant="body2" color="textSecondary">+{data.todayHasanat} today</Text>
            </Card>
            <Card style={styles.statCard}>
                <Text variant="h3">Daily Streak</Text>
                <Text variant="h1" color="primary">{data.streak}</Text>
                <Text variant="body2" color="textSecondary">days</Text>
            </Card>
          </View>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={styles.gridButton}
              onPress={() => navigation.navigate('SurahList')}
            >
              <Ionicons name="book" size={32} color={COLORS.primary} />
              <Text variant="body1" color="primary" style={styles.gridButtonText}>Start Memorizing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridButton}
              onPress={() => navigation.navigate('Recordings')}
            >
              <Ionicons name="mic" size={32} color={COLORS.primary} />
              <Text variant="body1" color="primary" style={styles.gridButtonText}>My Recordings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={introVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIntroVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="h2" style={{ marginBottom: 16 }}>Welcome to IQRA2</Text>
              <Text variant="body1" style={{ marginBottom: 12, textAlign: 'center' }}>
                IQRA2 is your personal Quran memorization companion. Track your progress, earn hasanat, and maintain your daily streak.
              </Text>
              <Text variant="body2" color="textSecondary" style={{ marginBottom: 16, textAlign: 'center' }}>
                • Start memorizing surahs and track your progress{'\n'}
                • Record your recitations for practice{'\n'}
                • Earn hasanat for each letter memorized{'\n'}
                • Maintain your daily streak
              </Text>
              <Button
                title="Get Started"
                onPress={() => setIntroVisible(false)}
                style={{ backgroundColor: COLORS.primary }}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={settingsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="h2" style={{ marginBottom: 16 }}>Settings</Text>
              <Button
                title={resetting ? 'Resetting...' : 'Reset All Progress'}
                onPress={async () => {
                  setResetting(true);
                  await resetProgress();
                  setResetting(false);
                  setSettingsVisible(false);
                  const loadedData = await loadData();
                  setData(loadedData);
                }}
                style={{ backgroundColor: COLORS.accent, marginBottom: 12 }}
                disabled={resetting}
              />
              <Button
                title="Reset Today's Progress Only"
                onPress={async () => {
                  setResetting(true);
                  // Reset only today's hasanat
                  const today = new Date().toISOString().split('T')[0];
                  await AsyncStorage.setItem('today_hasanat', '0');
                  await AsyncStorage.setItem('last_activity_date', today);
                  setResetting(false);
                  setSettingsVisible(false);
                  const loadedData = await loadData();
                  setData(loadedData);
                }}
                style={{ backgroundColor: COLORS.accent, marginBottom: 12 }}
                disabled={resetting}
              />
              <Button
                title="Close"
                onPress={() => setSettingsVisible(false)}
                style={{ backgroundColor: COLORS.primary }}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: SIZES.large,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: SIZES.medium,
  },
  logo: {
    width: 80,
    height: 80,
  },
  introButton: {
    padding: SIZES.small,
  },
  settingsButton: {
    padding: SIZES.small,
  },
  mainContent: {
    flex: 1,
    padding: SIZES.medium,
  },
  progressCard: {
    marginBottom: SIZES.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: COLORS.accent,
    borderWidth: 1,
    padding: SIZES.medium,
  },
  progressBar: {
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.medium,
  },
  statCard: {
    flex: 1,
    padding: SIZES.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: COLORS.accent,
    borderWidth: 1,
    borderRadius: SIZES.base,
    alignItems: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SIZES.medium,
  },
  gridButton: {
    flex: 1,
    marginHorizontal: SIZES.small,
    padding: SIZES.large,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: SIZES.base,
    borderColor: COLORS.accent,
    borderWidth: 1,
  },
  gridButtonText: {
    marginTop: SIZES.small,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: SIZES.large,
    borderRadius: SIZES.base,
    width: '80%',
    alignItems: 'center',
  },
});

export default HomeScreen; 