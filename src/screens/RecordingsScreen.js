import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import Text from '../components/Text';
import Card from '../components/Card';
import AudioRecorder from '../components/AudioRecorder';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecorderService from '../utils/audioRecorder';
import { getAllSurahs } from '../utils/quranData';

const RecordingsScreen = ({ navigation }) => {
  const [recordings, setRecordings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllRecordings();
  }, []);

  const loadAllRecordings = async () => {
    try {
      setLoading(true);
      const surahs = getAllSurahs();
      const allRecordings = {};
      
      for (const surah of surahs) {
        const surahRecordings = await AudioRecorderService.getSurahRecordings(surah.name);
        if (Object.keys(surahRecordings).length > 0) {
          allRecordings[surah.name] = surahRecordings;
        }
      }
      
      setRecordings(allRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
      Alert.alert('Error', 'Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRecordingStats = (surahRecordings) => {
    const ayahRecordings = Object.keys(surahRecordings).filter(key => key.startsWith('ayah_'));
    const hasSurahRecording = surahRecordings.surah;
    
    return {
      ayahCount: ayahRecordings.length,
      hasSurahRecording,
      totalAyahs: ayahRecordings.length + (hasSurahRecording ? 1 : 0),
    };
  };

  const renderSurahItem = ({ item: surahName }) => {
    const surahRecordings = recordings[surahName];
    const stats = getRecordingStats(surahRecordings);
    
    return (
      <Card
        variant="elevated"
        style={styles.surahCard}
        onPress={() => navigation.navigate('SurahRecordings', { 
          surahName, 
          recordings: surahRecordings 
        })}
      >
        <View style={styles.surahHeader}>
          <Text variant="h3">{surahName}</Text>
          <View style={styles.statsContainer}>
            <Text variant="body2" color="textSecondary">
              {stats.ayahCount} Ayahs recorded
            </Text>
            {stats.hasSurahRecording && (
              <Text variant="body2" color="success" style={styles.surahRecorded}>
                ✓ Complete Surah
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.recordingsList}>
          {Object.keys(surahRecordings).map((key) => {
            const recording = surahRecordings[key];
            const isAyah = key.startsWith('ayah_');
            const ayahNumber = isAyah ? key.split('_')[1] : null;
            
            return (
              <View key={key} style={styles.recordingItem}>
                <View style={styles.recordingInfo}>
                  <Text variant="body2" color="textSecondary">
                    {isAyah ? `Ayah ${ayahNumber}` : 'Complete Surah'}
                  </Text>
                  <Text variant="body3" color="textSecondary">
                    {formatDate(recording.timestamp)}
                  </Text>
                </View>
                <AudioRecorder
                  surahName={surahName}
                  ayahNumber={ayahNumber}
                  type={isAyah ? 'ayah' : 'surah'}
                  existingRecording={recording}
                  style={styles.audioRecorder}
                />
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  const surahsWithRecordings = Object.keys(recordings);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text variant="h1" color="primary">My Recordings</Text>
          <Text variant="body1" color="white">Your Quran Recitations</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadAllRecordings}
        >
          <Ionicons name="refresh" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <Text variant="body1" color="textSecondary">Loading recordings...</Text>
        </View>
      ) : surahsWithRecordings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="mic-off" size={64} color={COLORS.textSecondary} />
          <Text variant="h3" color="textSecondary" style={styles.noRecordingsTitle}>
            No Recordings Yet
          </Text>
          <Text variant="body1" color="textSecondary" style={styles.noRecordingsText}>
            Start memorizing surahs to record your recitations
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('SurahList')}
          >
            <Text variant="body1" color="white">Start Memorizing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={surahsWithRecordings}
          renderItem={renderSurahItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
        />
      )}
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
  backButton: {
    marginRight: SIZES.medium,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  refreshButton: {
    marginLeft: SIZES.medium,
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
  surahHeader: {
    marginBottom: SIZES.medium,
  },
  statsContainer: {
    marginTop: SIZES.small,
  },
  surahRecorded: {
    marginTop: SIZES.small,
  },
  recordingsList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.medium,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recordingInfo: {
    flex: 1,
  },
  audioRecorder: {
    padding: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.large,
  },
  noRecordingsTitle: {
    marginTop: SIZES.medium,
    marginBottom: SIZES.small,
  },
  noRecordingsText: {
    textAlign: 'center',
    marginBottom: SIZES.large,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.base,
  },
});

export default RecordingsScreen; 