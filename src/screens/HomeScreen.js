import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Image, ImageBackground, Modal, TouchableOpacity } from 'react-native';
import { COLORS as BASE_COLORS, SIZES } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { loadData, resetProgress } from '../utils/store';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

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

  // Function to format large numbers with appropriate font sizes
  const formatLargeNumber = (num) => {
    if (num >= 1000000) {
      return {
        text: (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M',
        fontSize: 24
      };
    } else if (num >= 100000) {
      return {
        text: num.toLocaleString(),
        fontSize: 28
      };
    } else {
      return {
        text: num.toLocaleString(),
        fontSize: 32
      };
    }
  };

  // Function to format streak numbers with appropriate font sizes
  const formatStreakNumber = (num) => {
    if (num >= 1000) {
      return {
        text: num.toLocaleString(),
        fontSize: 28
      };
    } else if (num >= 100) {
      return {
        text: num.toString(),
        fontSize: 32
      };
    } else {
      return {
        text: num.toString(),
        fontSize: 36
      };
    }
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

  // Calculate percentage
  const progressPercentage = data.totalAyaat > 0 ? Math.round((data.memorizedAyaat / data.totalAyaat) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
    <ImageBackground
        source={require('../assets/IQRA2background.png')}
      style={styles.background}
        imageStyle={{ opacity: 0.2 }}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <TouchableOpacity style={styles.introButton} onPress={() => setIntroVisible(true)}>
              <Ionicons name="help-circle-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
              <Image source={require('../assets/IQRA2icon.png')} style={styles.logo} resizeMode="contain" />
            <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
              <Ionicons name="settings-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
          <Card variant="elevated" style={styles.progressCard}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 12 }}>
                  <Text variant="h2" style={{ textAlign: 'center', color: 'rgba(0,0,0,0.8)', fontWeight: 'bold' }}>Memorization Progress</Text>
                </View>
              </View>
              <Text variant="body1" style={{ marginBottom: SIZES.small, textAlign: 'center' }}>
                <Text style={{ color: '#f5c860', fontWeight: 'bold' }}>{data.memorizedAyaat}</Text> out of <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{data.totalAyaat}</Text> ayaat memorized
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text variant="body2" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
              {progressPercentage}% Complete
            </Text>
          </Card>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
                <Text variant="h3" style={{ textAlign: 'center' }}>7asanaat gains</Text>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', marginVertical: 8 }}>
                  <Text variant="h1" style={{ color: 'rgba(245,200,96,0.8)', fontWeight: 'bold', textAlign: 'center', fontSize: formatLargeNumber(data.totalHasanat).fontSize }}>{formatLargeNumber(data.totalHasanat).text}</Text>
                </View>
                <Text variant="body2" color="textSecondary" style={{ textAlign: 'center' }}>+{formatLargeNumber(data.todayHasanat).text} today</Text>
                <Text variant="body2" style={{ textAlign: 'center', color: '#FFF', marginTop: 8, marginBottom: 4 }}>insha2Allah</Text>
            </Card>
            <Card style={styles.statCard}>
                <Text variant="h3" style={{ textAlign: 'center' }}>Daily Streak</Text>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', marginVertical: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Text variant="h1" style={{ color: '#5b7f67', textAlign: 'center', fontWeight: 'bold', fontSize: formatStreakNumber(data.streak).fontSize, lineHeight: formatStreakNumber(data.streak).fontSize * 1.2 }}>{formatStreakNumber(data.streak).text}</Text>
                </View>
                <Text variant="body2" color="textSecondary" style={{ textAlign: 'center' }}>days</Text>
                <Text variant="body2" style={{ textAlign: 'center', color: '#FFF', marginTop: 8, marginBottom: 4 }}>masha2Allah</Text>
            </Card>
          </View>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.gridButton, { shadowColor: '#fae29f', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 12, flexDirection: 'column', alignItems: 'center' }]}
              onPress={() => navigation.navigate('SurahList')}
            >
              <View style={styles.buttonIconContainer}>
                <Image source={require('../assets/openQuran.png')} style={styles.buttonIcon} resizeMode="contain" />
              </View>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#fae29f', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 8 }}>
                  <Text variant="body1" style={[styles.gridButtonText, { color: '#fae29f', textAlign: 'center', width: '100%', fontWeight: 'bold', fontSize: 22, textShadowColor: '#fae29f', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 }]}>Memorize Qur2an b2ithnAllah</Text>
                </View>
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
    </View>
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
    width: 120,
    height: 120,
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
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    padding: SIZES.medium,
  },
  progressBar: {
    height: 20,
    backgroundColor: 'rgba(51,51,51,0.3)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#33694e',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.medium,
  },
  statCard: {
    flex: 1,
    padding: SIZES.medium,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    borderRadius: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'transparent',
    borderRadius: SIZES.base,
  },
  gridButtonText: {
    marginTop: SIZES.small,
    textAlign: 'center',
  },
  buttonIconContainer: {
    padding: SIZES.small,
    shadowColor: '#fae29f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 15,
    elevation: 12,
  },
  buttonIcon: {
    width: 35,
    height: 35,
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