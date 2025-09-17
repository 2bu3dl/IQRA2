import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import { COLORS } from '../utils/theme';
import { loadData } from '../utils/store';

const HomeScreenContent = ({ navigation, route }) => {
  const { user, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const [data, setData] = useState({
    totalHasanat: 0,
    todayHasanat: 0,
    streak: 0,
    memorizedAyaat: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScreenData();
  }, []);

  const loadScreenData = async () => {
    try {
      const loadedData = await loadData();
      setData(loadedData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>IQRA2</Text>
        <Text style={styles.subtitle}>Welcome to your Quran memorization journey</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.totalHasanat.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Hasanat</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.streak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.memorizedAyaat}</Text>
          <Text style={styles.statLabel}>Memorized Ayaat</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('SurahList')}
        >
          <Text style={styles.actionButtonText}>Start Memorizing</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.actionButtonText}>View Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.actionButtonText}>Leaderboard</Text>
        </TouchableOpacity>
      </View>

      {!isAuthenticated && (
        <View style={styles.authContainer}>
          <Text style={styles.authText}>Sign in to sync your progress</Text>
          <TouchableOpacity 
            style={styles.authButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  authText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreenContent;
