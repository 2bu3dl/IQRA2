import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecorderService from '../utils/audioRecorder';

const AudioRecorder = ({ 
  surahName, 
  ayahNumber = null, 
  type = 'ayah', 
  onRecordingComplete = null,
  existingRecording = null,
  style = {},
  showModal = false,
  onCloseModal = null
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingPath, setRecordingPath] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState([5, 5, 5, 5, 5, 5, 5, 5]);
  const [showSaveCancel, setShowSaveCancel] = useState(false);

  const recordingTimer = useRef(null);
  const playbackTimer = useRef(null);
  const playbackListener = useRef(null);
  const waveformTimer = useRef(null);

  // Initialize with existing recording
  useEffect(() => {
    if (existingRecording && existingRecording.filePath) {
      setRecordingPath(existingRecording.filePath);
      setRecordingDuration(5); // Default duration for existing recordings
    }
  }, [existingRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (playbackTimer.current) clearInterval(playbackTimer.current);
      if (playbackListener.current) AudioRecorderService.audioRecorderPlayer.removePlayBackListener(playbackListener.current);
      if (waveformTimer.current) clearInterval(waveformTimer.current);
    };
  }, []);

  // Animate waveform during recording and playback
  useEffect(() => {
    if (isRecording || isPlaying) {
      waveformTimer.current = setInterval(() => {
        setWaveformHeights([
          Math.random() * 25 + 10,
          Math.random() * 25 + 10,
          Math.random() * 25 + 10,
          Math.random() * 25 + 10,
          Math.random() * 25 + 10,
          Math.random() * 25 + 10,
          Math.random() * 25 + 10,
          Math.random() * 25 + 10,
        ]);
      }, 200);
    } else {
      if (waveformTimer.current) {
        clearInterval(waveformTimer.current);
        waveformTimer.current = null;
      }
      setWaveformHeights([5, 5, 5, 5, 5, 5, 5, 5]);
    }
  }, [isRecording, isPlaying]);

  // Playback completion listener
  useEffect(() => {
    if (isPlaying) {
      playbackListener.current = (e) => {
        if (e.currentPosition >= e.duration) {
          setIsPlaying(false);
          if (playbackTimer.current) {
            clearInterval(playbackTimer.current);
            playbackTimer.current = null;
          }
          setCurrentPosition(0);
          AudioRecorderService.audioRecorderPlayer.removePlayBackListener(playbackListener.current);
        }
      };
      AudioRecorderService.audioRecorderPlayer.addPlayBackListener(playbackListener.current);
    }
    return () => {
      if (playbackListener.current) AudioRecorderService.audioRecorderPlayer.removePlayBackListener(playbackListener.current);
    };
  }, [isPlaying]);

  // Start recording to temp for ayah
  const handleStartRecording = async () => {
    try {
      const tempPath = AudioRecorderService.getTempAyahRecordingPath(surahName, ayahNumber);
      await AudioRecorderService.deleteTempAyahRecording(surahName, ayahNumber);
      const path = await AudioRecorderService.startRecording(tempPath, true);
      setRecordingPath(path);
      setIsRecording(true);
      setRecordingDuration(0);
      setShowSaveCancel(false);
      recordingTimer.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    } catch (error) {
      Alert.alert('Recording Error', error.message);
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    try {
      const path = await AudioRecorderService.stopRecording();
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setRecordingPath(path);
      setTotalDuration(recordingDuration);
      setShowSaveCancel(true);
    } catch (error) {
      Alert.alert('Recording Error', error.message);
    }
  };

  // Play temp recording
  const handlePlayRecording = async () => {
    if (!recordingPath) return;
    try {
      await AudioRecorderService.playRecording(recordingPath);
      setIsPlaying(true);
      setCurrentPosition(0);
      playbackTimer.current = setInterval(() => {
        setCurrentPosition(prev => {
          const newPos = prev + 1;
          if (newPos >= totalDuration) {
            if (playbackTimer.current) {
              clearInterval(playbackTimer.current);
              playbackTimer.current = null;
            }
            setIsPlaying(false);
            return 0;
          }
          return newPos;
        });
      }, 1000);
    } catch (error) {
      Alert.alert('Playback Error', error.message);
    }
  };

  // Stop playback
  const handleStopPlaying = async () => {
    try {
      await AudioRecorderService.stopPlaying();
      setIsPlaying(false);
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
        playbackTimer.current = null;
      }
      if (playbackListener.current) {
        AudioRecorderService.audioRecorderPlayer.removePlayBackListener(playbackListener.current);
        playbackListener.current = null;
      }
      setCurrentPosition(0);
    } catch (error) {
      Alert.alert('Playback Error', error.message);
    }
  };

  // Save temp recording to permanent
  const handleSave = async () => {
    try {
      const permanentPath = await AudioRecorderService.moveTempAyahRecordingToPermanent(surahName, ayahNumber);
      if (onRecordingComplete) {
        onRecordingComplete(permanentPath, recordingDuration);
      }
      setShowSaveCancel(false);
      if (onCloseModal) onCloseModal();
    } catch (error) {
      Alert.alert('Save Error', error.message);
    }
  };

  // Cancel and delete temp
  const handleCancel = async () => {
    try {
      await AudioRecorderService.deleteTempAyahRecording(surahName, ayahNumber);
      setRecordingPath(null);
      setShowSaveCancel(false);
      if (onCloseModal) onCloseModal();
    } catch (error) {
      Alert.alert('Cancel Error', error.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonIcon = () => {
    if (isRecording) return 'stop-circle';
    else if (isPlaying) return 'stop';
    else if (recordingPath) return 'play';
    else return 'mic';
  };

  const getButtonColor = () => {
    if (isRecording) return COLORS.error;
    else if (isPlaying) return COLORS.warning;
    else if (recordingPath) return COLORS.success;
    else return COLORS.primary;
  };

  const handleButtonPress = () => {
    if (isRecording) handleStopRecording();
    else if (isPlaying) handleStopPlaying();
    else if (recordingPath) handlePlayRecording();
    else handleStartRecording();
  };

  // Generate waveform bars
  const renderWaveform = () => {
    return waveformHeights.map((height, index) => (
      <View
        key={index}
        style={[
          styles.waveformBar,
          {
            height: height,
            backgroundColor: isRecording ? COLORS.error : COLORS.success,
          }
        ]}
      />
    ));
  };

  // Modal UI for ayah recording
  if (type === 'ayah' && showModal) {
    return (
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={handleCancel}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, style]}>
            {/* Modal header with exit button */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
              <TouchableOpacity onPress={onCloseModal} style={{ padding: 12 }}>
                <Ionicons name="close" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <Text variant="h2" style={{ marginBottom: 16 }}>Ayah Recording</Text>
            <View style={[styles.container, { marginBottom: 16 }]}> 
              <TouchableOpacity
                style={[styles.recordButton, { backgroundColor: getButtonColor() }]}
                onPress={handleButtonPress}
                disabled={isRecording && recordingDuration < 1}
              >
                <Ionicons name={getButtonIcon()} size={24} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.infoContainer}>
                <Text variant="body2" color="textSecondary">
                  {isRecording ? 'Recording...' : isPlaying ? 'Playing...' : recordingPath ? 'Tap to play' : 'Record Ayah'}
                </Text>
                {(isRecording || recordingPath || isPlaying) && (
                  <Text variant="body2" color="textSecondary" style={styles.timeText}>
                    {isRecording ? formatTime(recordingDuration) : isPlaying ? `${formatTime(currentPosition)} / ${formatTime(totalDuration)}` : formatTime(totalDuration || recordingDuration)}
                  </Text>
                )}
                {(isRecording || isPlaying) && (
                  <View style={styles.waveformContainer}>{renderWaveform()}</View>
                )}
              </View>
            </View>
            {showSaveCancel && (
              <View style={styles.saveCancelRow}>
                <TouchableOpacity style={[styles.saveCancelButton, { backgroundColor: COLORS.primary }]} onPress={handleSave}>
                  <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveCancelButton, { backgroundColor: COLORS.error }]} onPress={handleCancel}>
                  <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // Default inline UI (for surah or non-modal usage)
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.recordButton, { backgroundColor: getButtonColor() }]}
        onPress={handleButtonPress}
        disabled={isRecording && recordingDuration < 1}
      >
        <Ionicons 
          name={getButtonIcon()} 
          size={24} 
          color={COLORS.white} 
        />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text variant="body2" color="textSecondary">
          {isRecording ? 'Recording...' : 
           isPlaying ? 'Playing...' : 
           recordingPath ? 'Tap to play' : 
           `Record ${type === 'surah' ? 'Surah' : 'Ayah'}`}
        </Text>
        {(isRecording || recordingPath || isPlaying) && (
          <Text variant="body2" color="textSecondary" style={styles.timeText}>
            {isRecording ? formatTime(recordingDuration) : 
             isPlaying ? `${formatTime(currentPosition)} / ${formatTime(totalDuration)}` : 
             formatTime(totalDuration || recordingDuration)}
          </Text>
        )}
        {(isRecording || isPlaying) && (
          <View style={styles.waveformContainer}>{renderWaveform()}</View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.small,
  },
  recordButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    marginTop: 4,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 40,
    marginTop: 8,
    gap: 2,
    alignSelf: 'center',
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.base,
    padding: SIZES.large,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    margin: 0,
  },
  saveCancelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  saveCancelButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default AudioRecorder; 