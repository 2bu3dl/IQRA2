import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
  TextInput,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useLanguage } from '../utils/languageContext';
import audioRecorder from '../utils/audioRecorder';
import sharingService from '../utils/sharingService';

const RecordingsModal = ({ 
  visible, 
  onClose, 
  surahName, 
  ayahNumber,
  onRecordingChange 
}) => {
  const { language, t } = useLanguage();
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingRecording, setEditingRecording] = useState(null);
  const [editName, setEditName] = useState('');
  const playbackIntervalRef = useRef(null);
  const [selectedRecordings, setSelectedRecordings] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExitButtonPressed, setIsExitButtonPressed] = useState(false);
  const [highlightedRecordings, setHighlightedRecordings] = useState([]);

  // Ensure props are not null/undefined
  const safeSurahName = surahName || '';
  const safeAyahNumber = ayahNumber || 0;

  const loadHighlightedRecordings = async () => {
    try {
      const key = `highlighted_${safeSurahName}_${safeAyahNumber}`;
      console.log('Loading highlights with key:', key);
      const saved = await AsyncStorage.getItem(key);
      console.log('Loaded saved highlights:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Parsed highlights:', parsed);
        setHighlightedRecordings(parsed);
      } else {
        console.log('No saved highlights found, setting empty array');
        setHighlightedRecordings([]);
      }
    } catch (error) {
      console.log('Error loading highlighted recordings:', error);
      setHighlightedRecordings([]);
    }
  };

  const saveHighlightedRecordings = async (recordings) => {
    try {
      const key = `highlighted_${safeSurahName}_${safeAyahNumber}`;
      console.log('Saving highlights with key:', key);
      console.log('Recordings to save:', recordings);
      await AsyncStorage.setItem(key, JSON.stringify(recordings));
      console.log('Successfully saved highlights to AsyncStorage');
    } catch (error) {
      console.log('Error saving highlighted recordings:', error);
    }
  };

  // Load highlighted recordings when modal opens
  useEffect(() => {
    if (visible && safeSurahName && safeAyahNumber) {
      loadHighlightedRecordings();
    }
  }, [visible, safeSurahName, safeAyahNumber]);

  const toArabicNumber = (num) => {
    // Handle null, undefined, or invalid values
    if (num === null || num === undefined || isNaN(num)) {
      return '';
    }
    
    if (language === 'ar') {
      const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)] || digit).join('');
    }
    return num.toString();
  };

  const loadRecordings = useCallback(async () => {
    try {
      const loadedRecordings = await audioRecorder.loadRecordings(safeSurahName, safeAyahNumber);
      setRecordings(loadedRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  }, [safeSurahName, safeAyahNumber]);

  useEffect(() => {
    if (visible && safeSurahName && safeAyahNumber) {
      loadRecordings();
    }
  }, [visible, safeSurahName, safeAyahNumber, loadRecordings]);

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  const handlePlayRecording = async (recording) => {
    try {
      if (isPlaying) {
        await audioRecorder.stopPlayback();
        setIsPlaying(false);
        setSelectedRecording(null);
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
        }
      } else {
        await audioRecorder.playRecording(recording.uri);
        setIsPlaying(true);
        setSelectedRecording(recording.uri);
        
        // Check playback status periodically
        playbackIntervalRef.current = setInterval(async () => {
          try {
            const status = await audioRecorder.getStatus();
            if (!status.isPlaying) {
              setIsPlaying(false);
              setSelectedRecording(null);
              if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
              }
            }
          } catch (error) {
            console.error('Error checking playback status:', error);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await audioRecorder.startRecording(safeSurahName, safeAyahNumber);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      await audioRecorder.stopRecording();
      setIsRecording(false);
      await loadRecordings(); // Refresh recordings list
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  const handleNewRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleSelectMode = () => {
    if (isMultiSelectMode) {
      setIsMultiSelectMode(false);
      setSelectedRecordings([]);
    } else {
      setIsMultiSelectMode(true);
      setSelectedRecordings([]);
    }
  };

  const handleRecordingSelect = (recording) => {
    if (selectedRecordings.includes(recording.uri)) {
      setSelectedRecordings(selectedRecordings.filter(uri => uri !== recording.uri));
    } else {
      setSelectedRecordings([...selectedRecordings, recording.uri]);
    }
  };

  const handleShareSelected = async () => {
    if (selectedRecordings.length === 0) {
      Alert.alert('No Recordings Selected', 'Please select recordings to share.');
      return;
    }

    // Get the selected recordings with their metadata
    const selectedRecordingsData = recordings.filter(recording => 
      selectedRecordings.includes(recording.uri)
    );

    if (selectedRecordingsData.length === 0) {
      Alert.alert('Error', 'Selected recordings not found.');
      return;
    }

    // If only one recording is selected, show sharing options
    if (selectedRecordingsData.length === 1) {
      const recording = selectedRecordingsData[0];
      
      Alert.alert(
        'Share Recording',
        `Share "${recording.name || 'Recording'}" via:`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Share Sheet', 
            onPress: async () => {
              try {
                await sharingService.shareSingleRecording(
                  recording.uri,
                  recording.name || 'Recording',
                  safeSurahName,
                  safeAyahNumber
                );
              } catch (error) {
                console.error('Error sharing recording:', error);
                Alert.alert('Sharing Error', 'Failed to share recording.');
              }
            }
          },
          { 
            text: 'AirDrop', 
            onPress: async () => {
              try {
                await sharingService.shareToSpecificApp(
                  recording.uri,
                  recording.name || 'Recording',
                  safeSurahName,
                  safeAyahNumber,
                  'airdrop'
                );
              } catch (error) {
                console.error('Error sharing via AirDrop:', error);
                Alert.alert('AirDrop Error', 'Failed to share via AirDrop.');
              }
            }
          },
          { 
            text: 'Messages', 
            onPress: async () => {
              try {
                await sharingService.shareToSpecificApp(
                  recording.uri,
                  recording.name || 'Recording',
                  safeSurahName,
                  safeAyahNumber,
                  'messages'
                );
              } catch (error) {
                console.error('Error sharing via Messages:', error);
                Alert.alert('Messages Error', 'Failed to share via Messages.');
              }
            }
          },
          { 
            text: 'Mail', 
            onPress: async () => {
              try {
                await sharingService.shareToSpecificApp(
                  recording.uri,
                  recording.name || 'Recording',
                  safeSurahName,
                  safeAyahNumber,
                  'mail'
                );
              } catch (error) {
                console.error('Error sharing via Mail:', error);
                Alert.alert('Mail Error', 'Failed to share via Mail.');
              }
            }
          },
          { 
            text: 'WhatsApp', 
            onPress: async () => {
              try {
                await sharingService.shareToSpecificApp(
                  recording.uri,
                  recording.name || 'Recording',
                  safeSurahName,
                  safeAyahNumber,
                  'whatsapp'
                );
              } catch (error) {
                console.error('Error sharing via WhatsApp:', error);
                Alert.alert('WhatsApp Error', 'Failed to share via WhatsApp.');
              }
            }
          },
          { 
            text: 'Telegram', 
            onPress: async () => {
              try {
                await sharingService.shareToSpecificApp(
                  recording.uri,
                  recording.name || 'Recording',
                  safeSurahName,
                  safeAyahNumber,
                  'telegram'
                );
              } catch (error) {
                console.error('Error sharing via Telegram:', error);
                Alert.alert('Telegram Error', 'Failed to share via Telegram.');
              }
            }
          }
        ]
      );
    } else {
      // Multiple recordings selected - share them one by one
      Alert.alert(
        'Share Multiple Recordings',
        `Share ${selectedRecordingsData.length} recordings via:`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Share All', 
            onPress: async () => {
              try {
                const fileUris = selectedRecordingsData.map(r => r.uri);
                const fileNames = selectedRecordingsData.map(r => r.name || 'Recording');
                
                await sharingService.shareMultipleRecordings(
                  fileUris,
                  fileNames,
                  safeSurahName,
                  safeAyahNumber
                );
              } catch (error) {
                console.error('Error sharing recordings:', error);
                Alert.alert('Sharing Error', 'Failed to share recordings.');
              }
            }
          },
          { 
            text: 'Share Individually', 
            onPress: async () => {
              try {
                for (const recording of selectedRecordingsData) {
                  await sharingService.shareSingleRecording(
                    recording.uri,
                    recording.name || 'Recording',
                    safeSurahName,
                    safeAyahNumber
                  );
                }
              } catch (error) {
                console.error('Error sharing recordings:', error);
                Alert.alert('Sharing Error', 'Failed to share recordings.');
              }
            }
          }
        ]
      );
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRecordings.length === 0) {
      Alert.alert('No Recordings Selected', 'Please select recordings to delete.');
      return;
    }

    Alert.alert(
      'Delete Recordings',
      `Are you sure you want to delete ${selectedRecordings.length} recording(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              for (const uri of selectedRecordings) {
                await audioRecorder.deleteRecording(uri);
              }
              setSelectedRecordings([]);
              setIsMultiSelectMode(false);
              await loadRecordings();
            } catch (error) {
              console.error('Error deleting recordings:', error);
              Alert.alert('Error', 'Failed to delete recordings');
            }
          }
        },
      ]
    );
  };

  const handleCancelSelect = () => {
    setIsMultiSelectMode(false);
    setSelectedRecordings([]);
    // Don't clear highlights when canceling select mode
  };

  const handleRecordingsModalClose = () => {
    setIsMultiSelectMode(false);
    setSelectedRecordings([]);
    // Don't clear highlights when closing modal
    onClose();
  };

  const handleRenameSelected = () => {
    if (selectedRecordings.length !== 1) {
      Alert.alert('Error', 'Please select only one recording to rename.');
      return;
    }
    const recordingUri = selectedRecordings[0];
    const recording = recordings.find(r => r.uri === recordingUri);
    if (recording) {
      setEditingRecording(recordingUri);
      setEditName(recording.name || '');
    }
  };

  const handleSaveRename = async () => {
    if (editingRecording && editName.trim()) {
      try {
        await audioRecorder.renameRecording(editingRecording, editName.trim());
        setEditingRecording(null);
        setEditName('');
        loadRecordings(); // Refresh recordings list
      } catch (error) {
        console.error('Error renaming recording:', error);
        Alert.alert('Error', 'Failed to rename recording.');
      }
    }
  };

  const handleCancelRename = () => {
    setEditingRecording(null);
    setEditName('');
  };

  const handleHighlightSelected = () => {
    console.log('handleHighlightSelected called');
    console.log('selectedRecordings:', selectedRecordings);
    console.log('current highlightedRecordings:', highlightedRecordings);
    
    if (selectedRecordings.length > 0) {
      if (isOnlyHighlightedSelected()) {
        console.log('Unhighlighting selected recordings');
        // If only highlighted recordings are selected, unhighlight them
        const newHighlighted = highlightedRecordings.filter(uri => 
          !selectedRecordings.includes(uri)
        );
        console.log('New highlighted after unhighlighting:', newHighlighted);
        setHighlightedRecordings(newHighlighted);
        // Save to AsyncStorage
        saveHighlightedRecordings(newHighlighted);
      } else {
        console.log('Highlighting selected recordings');
        // Add the selected recordings to existing highlights (avoid duplicates)
        const newHighlighted = [...highlightedRecordings];
        selectedRecordings.forEach(uri => {
          if (!newHighlighted.includes(uri)) {
            newHighlighted.push(uri);
          }
        });
        console.log('New highlighted after highlighting:', newHighlighted);
        setHighlightedRecordings(newHighlighted);
        // Save to AsyncStorage
        saveHighlightedRecordings(newHighlighted);
      }
      // Exit select mode
      setIsMultiSelectMode(false);
      setSelectedRecordings([]);
    }
  };


  const isOnlyHighlightedSelected = () => {
    if (selectedRecordings.length === 0) return false;
    return selectedRecordings.every(uri => highlightedRecordings.includes(uri));
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleRecordingsModalClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleRecordingsModalClose}
      >
        <TouchableOpacity
          style={[
            styles.modalContent,
            safeAyahNumber === 'full-surah' && { backgroundColor: '#5b7f67' } // Green background for full surah (matching MemorizationScreen)
          ]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[
              styles.title,
              safeAyahNumber === 'full-surah' && { color: '#F5E6C8' } // Parchment color for full surah
            ]}>
              {safeAyahNumber === 'full-surah' ? 'Full Surah Recitation' : 'Ayah Recitations'}
            </Text>
            <Text style={[
              styles.subtitle,
              safeAyahNumber === 'full-surah' && { color: '#F5E6C8' } // Parchment color for full surah
            ]}>
              {safeAyahNumber === 'full-surah' ? safeSurahName : `${safeSurahName} - ${toArabicNumber(safeAyahNumber)}`}
            </Text>
            
            {/* Exit Button */}
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleRecordingsModalClose}
              onPressIn={() => setIsExitButtonPressed(true)}
              onPressOut={() => setIsExitButtonPressed(false)}
            >
              <View style={[
                styles.exitButtonOverlay,
                isExitButtonPressed && styles.exitButtonOverlayPressed
              ]}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: isExitButtonPressed ? '#FF4444' : '#F5E6C8',
                  textAlign: 'center',
                }}>
                  ×
                </Text>
              </View>
            </TouchableOpacity>

            {/* Highlight Button (Top Left) - Only visible in select mode */}
            {isMultiSelectMode && (
              <TouchableOpacity
                style={[
                  styles.highlightButton,
                  isOnlyHighlightedSelected() && styles.highlightButtonActive
                ]}
                onPress={handleHighlightSelected}
              >
                <Image 
                  source={require('../assets/app_icons/select.png')}
                  style={{ 
                    width: 20, 
                    height: 20,
                    tintColor: selectedRecordings.length > 0 
                      ? (isOnlyHighlightedSelected() ? '#5b7f67' : '#5b7f67') // Keep icon green when filled with parchment
                      : '#F5E6C8'
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Recordings List */}
          <ScrollView 
            style={styles.recordingsList}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
          >
            {/* Selected Count Display */}
            {isMultiSelectMode && selectedRecordings.length > 0 && (
                                <Text style={styles.selectedCountText}>
                    <Text style={styles.selectedCountParentheses}>(</Text>{selectedRecordings.length} recitations selected<Text style={styles.selectedCountParentheses}>)</Text>
                  </Text>
            )}
            
            {recordings.map((recording, index) => (
              <TouchableOpacity
                key={recording.uri}
                style={[
                  styles.recordingItem,
                  isMultiSelectMode && styles.recordingItemSelectable,
                  selectedRecordings.includes(recording.uri) && styles.recordingItemSelected,
                  highlightedRecordings.includes(recording.uri) && styles.recordingItemHighlighted,
                  safeAyahNumber === 'full-surah' && { 
                    backgroundColor: '#F5E6C8',
                    borderColor: selectedRecordings.includes(recording.uri) ? '#333333' : 
                               (highlightedRecordings.includes(recording.uri) ? 'rgba(165,115,36,0.8)' : '#F5E6C8') // Super dark gray for selected, orange for highlighted
                  } // Parchment background for full surah recordings
                ]}
                onPress={() => {
                  if (isMultiSelectMode) {
                    handleRecordingSelect(recording);
                  } else {
                    handlePlayRecording(recording);
                  }
                }}
                onLongPress={() => {
                  if (isMultiSelectMode) {
                    handleRecordingSelect(recording);
                  }
                }}
              >
                {/* Play Button */}
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    selectedRecording === recording.uri && styles.playingButton
                  ]}
                  onPress={() => handlePlayRecording(recording)}
                >
                  <Image 
                    source={
                      selectedRecording === recording.uri
                        ? require('../assets/app_icons/audio.png')
                        : require('../assets/app_icons/continue.png')
                    }
                    style={{ 
                      width: 20, 
                      height: 20,
                      tintColor: selectedRecording === recording.uri ? '#FFFFFF' : undefined
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                {/* Recording Info */}
                <View style={styles.recordingInfo}>
                  <Text style={[
                    styles.recordingName,
                    safeAyahNumber === 'full-surah' && { color: '#F5E6C8' } // Parchment color for full surah
                  ]} numberOfLines={1}>
                    {recording.name}
                  </Text>
                  <Text style={[
                    styles.recordingDuration,
                    safeAyahNumber === 'full-surah' && { color: '#2D5016' } // Dark green for full surah (visible on parchment background)
                  ]}>
                    {recordings.indexOf(recording) + 1}. <Text style={[
                      styles.durationNumber,
                      safeAyahNumber === 'full-surah' && { color: '#2D5016' } // Dark green for full surah (visible on parchment background)
                    ]}>{recording.duration ? recording.duration.toFixed(3) : '00.000'}</Text> • {recording.name || 'Unnamed Recording'}
                  </Text>
                  <Text style={[
                    styles.recordingTimestamp,
                    safeAyahNumber === 'full-surah' && { color: '#2D5016' } // Dark green for full surah (visible on parchment background)
                  ]}>
                    {recording.timestamp ? new Date(recording.timestamp).toLocaleDateString() + ' • ' + new Date(recording.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Unknown date'}
                  </Text>
                </View>

                {/* Rename Button */}
                <TouchableOpacity
                  style={styles.individualRenameButton}
                  onPress={() => {
                    setEditingRecording(recording.uri);
                    setEditName(recording.name || '');
                  }}
                >
                  <Image 
                    source={require('../assets/app_icons/rename.png')}
                    style={{ 
                      width: 18, 
                      height: 18,
                      tintColor: '#999999'
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom Buttons */}
          <View style={styles.bottomButtonsWrapper}>
            {!isMultiSelectMode ? (
              // Normal mode - show New and Select buttons
              <View style={[
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
                safeAyahNumber === 'full-surah' && { 
                  justifyContent: recordings.length === 0 ? 'center' : 'space-between', // Center recite button when no recordings
                  gap: 20 // Add gap between buttons for full surah
                } // Center buttons for full surah
              ]}>
                {/* Select Button (Left) - Only show when there are recordings for full surah */}
                {!(safeAyahNumber === 'full-surah' && recordings.length === 0) && (
                  <TouchableOpacity
                    style={[
                      styles.bottomButton, 
                      styles.selectButton,
                      safeAyahNumber === 'full-surah' && { 
                        backgroundColor: 'transparent',
                        borderWidth: 1, // Thinner border
                        borderColor: '#555555', // Lighter gray border for full surah
                        minWidth: 140, // Wider select button
                        paddingHorizontal: 20, // More horizontal padding
                        paddingVertical: 8 // Shorter height
                      }
                    ]}
                    onPress={handleSelectMode}
                  >
                    <Image 
                      source={require('../assets/app_icons/select.png')}
                      style={{ 
                        width: safeAyahNumber === 'full-surah' ? 20 : 24, // Smaller icon for full surah
                        height: safeAyahNumber === 'full-surah' ? 20 : 24, // Smaller icon for full surah
                        tintColor: safeAyahNumber === 'full-surah' ? '#F5E6C8' : undefined // Parchment color for full surah
                      }}
                      resizeMode="contain"
                    />
                    <Text style={[
                      styles.bottomButtonText,
                      safeAyahNumber === 'full-surah' && { 
                        color: '#555555', // Lighter gray for full surah
                        fontSize: 14 // Smaller text for full surah
                      }
                    ]}>Select</Text>
                  </TouchableOpacity>
                )}
          
                {/* Recite Button (Center) */}
                <TouchableOpacity
                  style={[
                    styles.bottomButton,
                    isRecording && styles.recordingButton,
                    safeAyahNumber === 'full-surah' && { 
                      borderRadius: 50, // Perfect circle
                      borderWidth: isRecording ? 0 : 4, // No border when recording
                      borderColor: '#555555', // Lighter gray border
                      width: 60, // Smaller width for perfect circle
                      height: 60, // Smaller height for perfect circle
                      paddingVertical: 4, // Minimal padding
                      paddingHorizontal: 8, // Minimal padding
                      alignSelf: 'center' // Center the button
                    }
                  ]}
                  onPress={handleNewRecording}
                >
                  <Image 
                    source={
                      isRecording 
                        ? require('../assets/app_icons/mic-on.png')
                        : require('../assets/app_icons/mic-off.png')
                    }
                    style={{ 
                      width: 24, 
                      height: 24,
                      tintColor: safeAyahNumber === 'full-surah' ? '#F5E6C8' : undefined // Parchment color for full surah
                    }}
                    resizeMode="contain"
                  />
                  <Text style={[
                    styles.bottomButtonText,
                    isRecording && styles.recordingButtonText,
                    safeAyahNumber === 'full-surah' && { 
                      color: '#555555', // Lighter gray for full surah
                      fontSize: 16 // Larger text
                    }
                  ]}>
                    {isRecording ? 'Reciting...' : 'Recite'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Multi-select mode - show Delete, Cancel, and Share buttons
              <View style={styles.bottomButtonsContainer}>
                <View style={styles.bottomButtons}>
                  {/* Delete Button (Left) */}
                  <TouchableOpacity
                    style={[
                      styles.bottomButton,
                      styles.bottomButtonSmall
                    ]}
                    onPress={handleDeleteSelected}
                    disabled={selectedRecordings.length === 0}
                  >
                    <Image 
                      source={require('../assets/app_icons/remove.png')}
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                    <Text style={[
                      styles.bottomButtonText,
                      styles.bottomButtonTextSmall,
                      { fontSize: 16 }, // Larger text
                      selectedRecordings.length === 0 && styles.bottomButtonTextDisabled
                    ]}>
                      Delete
                    </Text>
                  </TouchableOpacity>

                  {/* Cancel Button (Middle) */}
                  <TouchableOpacity
                    style={[
                      styles.bottomButton,
                      styles.bottomButtonSmall,
                      styles.cancelButton
                    ]}
                    onPress={handleCancelSelect}
                  >
                    <Text style={[
                      styles.bottomButtonText,
                      styles.bottomButtonTextSmall,
                      styles.cancelButtonText,
                      { fontSize: 16 } // Larger text
                    ]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  {/* Share Button (Right) */}
                  <TouchableOpacity
                    style={[
                      styles.bottomButton,
                      styles.bottomButtonSmall
                    ]}
                    onPress={handleShareSelected}
                    disabled={selectedRecordings.length === 0}
                  >
                    <Image 
                      source={require('../assets/app_icons/share.png')}
                      style={{ 
                        width: 20, 
                        height: 20,
                        tintColor: '#000000' // Black icon
                      }}
                      resizeMode="contain"
                    />
                    <Text style={[
                      styles.bottomButtonText,
                      styles.bottomButtonTextSmall,
                      { fontSize: 16 }, // Larger text
                      selectedRecordings.length === 0 && styles.bottomButtonTextDisabled
                    ]}>
                      Share
                    </Text>
                  </TouchableOpacity>


                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Rename Modal */}
      {editingRecording && (
        <Modal
          visible={editingRecording !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelRename}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={handleCancelRename}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Rename Recording</Text>
              </View>
              
              <TextInput
                style={styles.renameInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter new name"
                autoFocus={true}
              />
              
              <View style={styles.renameButtons}>
                <TouchableOpacity
                  style={[styles.renameButton, styles.cancelRenameButton]}
                  onPress={handleCancelRename}
                >
                  <Text style={styles.cancelRenameButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.renameButton, styles.saveRenameButton]}
                  onPress={handleSaveRename}
                >
                  <Text style={styles.saveRenameButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F5E6C8',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5b7f67',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
    textAlign: 'center',
  },
  recordingsList: {
    maxHeight: 350,
    flexGrow: 0,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  recordingItemSelectable: {
    opacity: 0.7,
  },
  recordingItemSelected: {
    backgroundColor: 'rgba(165, 115, 36, 0.2)',
    borderColor: 'rgba(165, 115, 36, 0.8)',
    borderWidth: 2,
  },
  recordingItemHighlighted: {
    backgroundColor: 'rgba(165, 115, 36, 0.2)', // Orange highlight matching memorization screen
    borderColor: 'rgba(165, 115, 36, 0.8)', // Orange border
    borderWidth: 3, // Thicker outline
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5b7f67',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  playingButton: {
    backgroundColor: 'rgba(165,115,36,0.8)',
    borderColor: 'rgba(165,115,36,0.8)',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  recordingDuration: {
    fontSize: 12,
    color: 'rgba(165,115,36,0.8)',
    marginTop: 2,
  },
  durationNumber: {
    color: '#5b7f67',
  },
  recordingTimestamp: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  renameButton: {
    padding: 2,
    marginLeft: 10,
  },
  bottomButtonsWrapper: {
    marginTop: 20,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'transparent', // Remove background
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bottomButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 120,
  },
  bottomButtonText: {
    marginTop: 5,
    fontSize: 14,
    color: '#5b7f67',
    fontWeight: 'bold',
  },
  bottomButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomButtonActive: {
    backgroundColor: '#5b7f67',
    borderColor: '#5b7f67',
    borderWidth: 1,
  },
  deleteButtonActive: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  recordingButton: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
    borderWidth: 1,
  },
  recordingButtonText: {
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#CCCCCC',
  },
  cancelButtonText: {
    color: '#666666',
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#5b7f67',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    fontSize: 18,
    color: '#333333',
  },
  renameButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  renameButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5b7f67',
  },
  individualRenameButton: {
    padding: 2,
    marginLeft: 10,
  },
  cancelRenameButton: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  cancelRenameButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveRenameButton: {
    backgroundColor: '#5b7f67',
    borderColor: '#5b7f67',
  },
  saveRenameButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomButtonsContainer: {
    alignItems: 'center',
  },
  bottomButtonSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: 'transparent',
    minWidth: 80,
    marginHorizontal: 3,
  },
  bottomButtonTextSmall: {
    marginTop: 3,
    fontSize: 12,
    color: '#5b7f67',
    fontWeight: 'bold',
  },
  bottomButtonTextDisabled: {
    color: '#999999',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#CCCCCC', // Light gray
    marginBottom: 10,
    textAlign: 'center',
  },
  selectedCountParentheses: {
    color: '#666666',
  },
  exitButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  exitButtonOverlay: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exitButtonOverlayPressed: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  highlightButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  highlightButtonActive: {
    backgroundColor: '#F5E6C8', // Parchment color when highlighted recordings are selected
  },
  selectButton: {
    backgroundColor: '#E0E0E0',
  },
};

export default RecordingsModal; 