import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { COLORS as BASE_COLORS, SIZES } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { useLanguage } from '../utils/languageContext';
import audioRecorder from '../utils/audioRecorder';
import audioPlayer from '../utils/audioPlayer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const RecordingsScreen = ({ navigation }) => {
  const { language, t } = useLanguage();
  const [recordings, setRecordings] = useState([]);
  const [playingRecording, setPlayingRecording] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      // Get all recordings from audioRecorder
      const allRecordings = await audioRecorder.getAllRecordings();
      setRecordings(allRecordings || []);
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayRecording = async (recording) => {
    try {
      ReactNativeHapticFeedback.trigger('selection');
      
      // Stop current playing recording if any
      if (playingRecording) {
        await audioPlayer.stopAudio();
        setPlayingRecording(null);
      }

      // If clicking the same recording that was playing, just stop
      if (playingRecording?.id === recording.id) {
        return;
      }

      // Play the new recording
      await audioPlayer.playRecording(recording.path);
      setPlayingRecording(recording);

      // Listen for playback completion
      audioPlayer.setOnComplete(() => {
        setPlayingRecording(null);
      });
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Could not play recording');
    }
  };

  const handleDeleteRecording = async (recording) => {
    ReactNativeHapticFeedback.trigger('selection');
    
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete this recording?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await audioRecorder.deleteRecording(recording.id);
              await loadRecordings(); // Reload the list
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', 'Could not delete recording');
            }
          }
        }
      ]
    );
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderRecordingItem = (recording, index) => (
    <Card key={recording.id || index} style={styles.recordingCard}>
      <View style={styles.recordingHeader}>
        <View style={styles.recordingInfo}>
          <Text variant="h3" style={styles.recordingTitle}>
            {recording.surahName || `Surah ${recording.surahNumber}`}
          </Text>
          <Text variant="body2" style={styles.recordingSubtitle}>
            {recording.ayahNumber ? `Ayah ${recording.ayahNumber}` : 'Complete Surah'}
          </Text>
          <Text variant="body2" style={styles.recordingDate}>
            {formatDate(recording.createdAt)} • {formatDuration(recording.duration || 0)}
          </Text>
        </View>
        
        <View style={styles.recordingActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.playButton]}
            onPress={() => handlePlayRecording(recording)}
          >
            <Ionicons 
              name={playingRecording?.id === recording.id ? "pause" : "play"} 
              size={20} 
              color="#FFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRecording(recording)}
          >
            <Ionicons name="trash" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground
        source={require('../assets/IQRA2background.png')}
        style={styles.background}
        imageStyle={{ opacity: 0.2 }}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                ReactNativeHapticFeedback.trigger('selection');
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#F5E6C8" />
            </TouchableOpacity>
            
            <Text variant="h1" style={styles.headerTitle}>
              Recordings
            </Text>
            
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.centerContainer}>
                <Text variant="body1" style={styles.loadingText}>
                  Loading recordings...
                </Text>
              </View>
            ) : recordings.length === 0 ? (
              <View style={styles.centerContainer}>
                <Ionicons name="mic-off" size={64} color="#666" style={styles.emptyIcon} />
                <Text variant="h2" style={styles.emptyTitle}>
                  No Recordings Yet
                </Text>
                <Text variant="body1" style={styles.emptySubtitle}>
                  Start memorizing and record yourself to see your recordings here.
                </Text>
                
                <Button
                  title="Start Memorizing"
                  onPress={() => {
                    ReactNativeHapticFeedback.trigger('selection');
                    navigation.navigate('SurahList');
                  }}
                  style={styles.startButton}
                />
              </View>
            ) : (
              <View>
                <Text variant="h3" style={styles.sectionTitle}>
                  Your Recordings ({recordings.length})
                </Text>
                
                {recordings.map((recording, index) => 
                  renderRecordingItem(recording, index)
                )}
              </View>
            )}
          </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.large,
    paddingTop: SIZES.medium,
    paddingBottom: SIZES.medium,
  },
  backButton: {
    padding: SIZES.small,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5b7f67',
  },
  headerTitle: {
    color: '#F5E6C8',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44, // Same width as back button
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.large,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.extraLarge * 2,
  },
  loadingText: {
    color: '#CCCCCC',
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: SIZES.large,
  },
  emptyTitle: {
    color: '#F5E6C8',
    textAlign: 'center',
    marginBottom: SIZES.small,
  },
  emptySubtitle: {
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: SIZES.large,
    paddingHorizontal: SIZES.large,
  },
  startButton: {
    backgroundColor: '#33694e',
    marginTop: SIZES.medium,
  },
  sectionTitle: {
    color: '#F5E6C8',
    marginBottom: SIZES.medium,
    textAlign: 'center',
  },
  recordingCard: {
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    marginBottom: SIZES.medium,
    padding: SIZES.medium,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    color: '#F5E6C8',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recordingSubtitle: {
    color: '#fae29f',
    marginBottom: 4,
  },
  recordingDate: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#33694e',
  },
  deleteButton: {
    backgroundColor: 'rgba(220,20,60,0.8)',
  },
});

export default RecordingsScreen;
