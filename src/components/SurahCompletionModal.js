import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity, Alert } from 'react-native';
import Text from './Text';
import Button from './Button';
import { useLanguage } from '../utils/languageContext';
import { COLORS } from '../utils/theme';
import audioRecorder from '../utils/audioRecorder';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Image } from 'react-native';

const { width, height } = Dimensions.get('window');

const SurahCompletionModal = ({ 
  visible, 
  surahName, 
  totalReward, 
  onSurahList,
  onRevise,
  onNextSurah, 
  onStartFullRecording,
  onClose,
  hideAyah,
  showAyah,
  onRecordingComplete,
  showDoublingAnimation = false 
}) => {
  const { language, t } = useLanguage();
  const [showRecordingOption, setShowRecordingOption] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentReward, setCurrentReward] = useState(totalReward);
  const [isDoubled, setIsDoubled] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const doublingAnim = useRef(new Animated.Value(1)).current;
  const duplicateOpacity = useRef(new Animated.Value(0)).current;
  const duplicatePosition = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      celebrationAnim.setValue(0);
      pulseAnim.setValue(1);
      doublingAnim.setValue(1);
      duplicateOpacity.setValue(0);
      duplicatePosition.setValue(0);
      setCurrentReward(totalReward);
      setIsDoubled(false);
      
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Start celebration animation
        startCelebrationAnimation();
        
        // Start doubling animation if requested
        if (showDoublingAnimation) {
          setTimeout(() => {
            startDoublingAnimation();
          }, 2000); // Wait 2 seconds before doubling
        }
      });
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      celebrationAnim.setValue(0);
      pulseAnim.setValue(1);
      doublingAnim.setValue(1);
      duplicateOpacity.setValue(0);
      duplicatePosition.setValue(0);
    }
  }, [visible, showDoublingAnimation]);

  const startCelebrationAnimation = () => {
    // Celebration pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse for reward amount
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startDoublingAnimation = () => {
    // Show duplicate number sliding from side
    duplicateOpacity.setValue(1);
    duplicatePosition.setValue(-100);
    
    // Animate duplicate number moving to center
    Animated.timing(duplicatePosition, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Merge animation - scale both numbers and fade duplicate
      Animated.parallel([
        Animated.timing(doublingAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(duplicateOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update the reward value and change to gold
        setCurrentReward(totalReward * 2);
        setIsDoubled(true);
        
        // Scale back to normal
        Animated.timing(doublingAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    });
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      // Hide ayah when recording starts
      if (hideAyah) {
        hideAyah();
      }
      await audioRecorder.startRecording(surahName, 'full_surah');
      if (onStartFullRecording) {
        onStartFullRecording();
      }
    } catch (error) {
      console.error('Error starting full surah recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      await audioRecorder.stopRecording();
      setIsRecording(false);
      // Show ayah again
      if (showAyah) {
        showAyah();
      }
      // Trigger the SavedSurahsModal instead of alert
      if (onRecordingComplete) {
        onRecordingComplete();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
      setIsRecording(false);
      // Show ayah again on error
      if (showAyah) {
        showAyah();
      }
    }
  };

  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };

  if (!visible) return null;

  const celebrationScale = celebrationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const celebrationOpacity = celebrationAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1, 0.7],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { scale: celebrationScale }
          ]
        }
      ]}>
        <Animated.View style={[
          styles.content,
          { opacity: celebrationOpacity }
        ]}>
          {/* Completion Message */}
          <Text style={styles.title}>
            {language === 'ar' ? 'تم إنجاز السورة' : 'Surah Complete'}
          </Text>
          
          <Text style={styles.surahName}>
            {surahName}
          </Text>

          {/* Total Reward */}
          <View style={styles.rewardContainer}>
            <Text style={styles.rewardLabel}>
              {language === 'ar' ? 'المجموع' : 'Total'}
            </Text>
            <View style={styles.rewardAmountContainer}>
              <Animated.Text style={[
                styles.rewardAmount,
                { 
                  transform: [{ scale: doublingAnim }],
                  color: isDoubled ? '#FFD700' : '#5b7f67' // Gold when doubled
                }
              ]}>
                +{toArabicNumber(currentReward)}
              </Animated.Text>
              
              {/* Duplicate number for animation */}
              <Animated.Text style={[
                styles.rewardAmount,
                styles.duplicateReward,
                { 
                  opacity: duplicateOpacity,
                  transform: [{ translateX: duplicatePosition }],
                  color: '#5b7f67'
                }
              ]}>
                +{toArabicNumber(totalReward)}
              </Animated.Text>
            </View>
            <Text style={styles.rewardUnit}>
              {language === 'ar' ? 'حسنة' : '7asanat'}
            </Text>
          </View>

          {/* Full Surah Recording Option */}
          {showRecordingOption && (
            <View style={styles.recordingSection}>
              <Text style={styles.recordingSubtitle}>
                {language === 'ar' 
                  ? 'سجل تلاوتك للسورة كاملة (مضاعفة الحسنات)' 
                  : 'Record your recitation of full surah (double 7asanat gains)'
                }
              </Text>
              
              <View style={styles.recordingButtons}>
                {!isRecording ? (
                  <TouchableOpacity
                    style={styles.recordButton}
                    onPress={handleStartRecording}
                  >
                    <Image 
                      source={require('../assets/app_icons/mic-off.png')} 
                      style={styles.micIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.recordButton, styles.stopButton]}
                    onPress={handleStopRecording}
                  >
                    <Image 
                      source={require('../assets/app_icons/mic-on.png')} 
                      style={styles.micIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSurahList}
            >
              <Text style={styles.actionButtonText}>
                {language === 'ar' ? 'قائمة السور' : 'Surah List'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.middleButton]}
              onPress={onRevise}
            >
              <Text style={styles.actionButtonText}>
                {language === 'ar' ? 'مراجعة' : 'Revise'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onNextSurah}
            >
              <Text style={styles.actionButtonText}>
                {language === 'ar' ? 'السورة التالية' : 'Next Surah'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 2,
    borderColor: 'rgba(107,163,104,0.5)',
    minHeight: 450,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5b7f67', // Same green as memorize screen buttons
    textAlign: 'center',
    marginBottom: 10,
  },
  surahName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 25,
  },
  rewardContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(91,127,103,0.1)', // Same green as memorize screen
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(91,127,103,0.3)',
  },
  rewardLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  rewardAmountContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  rewardAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#5b7f67', // Same green as memorize screen
    textAlign: 'center',
    textShadowColor: '#5b7f67',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  duplicateReward: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  rewardUnit: {
    fontSize: 16,
    color: '#5b7f67',
    marginTop: 5,
  },
  recordingSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'rgba(165,115,36,0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.3)',
  },

  recordingSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  recordingButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    width: 60,
    height: 60,
  },
  stopButton: {
    backgroundColor: '#666666',
  },
  micIcon: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#5b7f67', // Same green as memorize screen
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleButton: {
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SurahCompletionModal;
