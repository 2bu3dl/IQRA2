import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, Animated, StyleSheet, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import Text from './Text';
import Button from './Button';
import { COLORS, SIZES } from '../utils/theme';
import { hapticSelection, hapticImpactMedium } from '../utils/hapticFeedback';

const AnimatedRewardModal = ({ 
  visible, 
  rewardAmount, 
  onClose, 
  onNext, 
  onRecordFullSurah,
  onSurahList,
  isLastAyah = false,
  isFullSurah = false,
  language = 'en',
  toArabicNumber = (num) => num.toString()
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [letterCount, setLetterCount] = useState(0);
  const [calculationComplete, setCalculationComplete] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const textScaleAnim = useRef(new Animated.Value(1)).current;

  // Store timeout IDs so we can clear them
  const timeoutsRef = useRef([]);

  useEffect(() => {
    if (visible) {
      setCurrentStep(1); // Start at letter count
      setCalculationComplete(false);
      setLetterCount(0);
      
      // Start entrance animation - different for full surah
      if (isFullSurah) {
        // Full surah gets a slide-up from bottom entrance
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Regular ayah animation
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Start calculation animation sequence
      startCalculationAnimation();
    } else {
      // Reset animations
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      numberAnim.setValue(0);
      resultAnim.setValue(0);
      textScaleAnim.setValue(1);
      // Clear all timeouts when modal closes
      clearAllTimeouts();
    }
    // Also clear timeouts on unmount
    return () => clearAllTimeouts();
  }, [visible]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutsRef.current = [];
  };

  const skipAnimation = () => {
    clearAllTimeouts();
    hapticImpactMedium(); // Haptic feedback for skipping
    // Immediately show the final result
    setCurrentStep(3);
    setCalculationComplete(true);
    setLetterCount(rewardAmount / 10);
    
    // Animate to final state
    Animated.parallel([
      Animated.timing(resultAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startCalculationAnimation = () => {
    if (isFullSurah) {
      // For full surah, skip calculation animation and go straight to result
      setCurrentStep(3);
      setCalculationComplete(true);
      setLetterCount(rewardAmount / 10);
      animateResult();
      hapticImpactMedium(); // Haptic feedback for final result
    } else {
      // Step 1: Show letter count calculation (immediately)
      const letterCount = rewardAmount / 10;
      setLetterCount(letterCount);
      numberAnim.setValue(letterCount);
      hapticSelection(); // Haptic feedback for initial appearance

      // Step 2: Show multiplication
      timeoutsRef.current.push(setTimeout(() => {
        setCurrentStep(2);
        animateTextScale();
        hapticSelection(); // Haptic feedback for multiplication phase
      }, 800)); // So user sees letter count for a bit

      // Step 3: Show result
      timeoutsRef.current.push(setTimeout(() => {
        setCurrentStep(3);
        setCalculationComplete(true);
        animateResult();
        hapticImpactMedium(); // Stronger haptic feedback for final result
      }, 1600));
    }
  };

  const animateNumber = (from, to, duration) => {
    numberAnim.setValue(from);
    Animated.timing(numberAnim, {
      toValue: to,
      duration,
      useNativeDriver: false,
    }).start();
  };

  const animateTextScale = () => {
    Animated.sequence([
      Animated.timing(textScaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(textScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateResult = () => {
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderCalculationStep = () => {
    const letterCount = rewardAmount / 10;
    const multiplier = 10;
    const result = letterCount * multiplier;

    return (
      <View style={styles.modalContentInner}>
        {/* Masha'Allah title - always visible at top */}
        <Animated.View style={{ opacity: opacityAnim }}>
          <Text variant="h2" style={[
            styles.title, 
            { 
              fontFamily: 'Montserrat-Bold',
              color: isFullSurah ? '#F5E6C8' : '#33694e', // Parchment color for full surah
            }
          ]}>
            {language === 'ar' ? 'ماشاء الله' : 'Masha\'Allah'}
          </Text>
        </Animated.View>

        {/* Content based on current step */}
        {currentStep === 1 && (
          <View style={styles.calculationContainer}>
            <Animated.Text style={[styles.calculationText, { transform: [{ scale: textScaleAnim }] }]}> 
              {language === 'ar' ? (
                <>
                  <Text style={styles.calculationLabel}>عدد الحروف: </Text>
                  <Text style={styles.calculationNumber}>{toArabicNumber(letterCount)}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.calculationLabel}>Letter Count: </Text>
                  <Text style={styles.calculationNumber}>{letterCount}</Text>
                </>
              )}
            </Animated.Text>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.calculationContainer}>
            <Animated.Text style={[styles.calculationText, { transform: [{ scale: textScaleAnim }] }]}>
              {language === 'ar' ? (
                <>
                  <Text style={styles.calculationLabel}>عدد الحروف: </Text>
                  <Text style={styles.calculationNumber}>{toArabicNumber(letterCount)}</Text>
                  <Text style={styles.calculationLabel}> × </Text>
                  <Text style={styles.calculationNumber}>{toArabicNumber(multiplier)}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.calculationLabel}>Letter Count: </Text>
                  <Text style={styles.calculationNumber}>{letterCount}</Text>
                  <Text style={styles.calculationLabel}> × </Text>
                  <Text style={styles.calculationNumber}>{multiplier}</Text>
                </>
              )}
            </Animated.Text>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.resultContainer}>
            <Animated.View style={{ opacity: resultAnim, transform: [{ scale: resultAnim }] }}>
              <Text variant="body1" style={[
                styles.resultText,
                { fontSize: 20, fontWeight: 'bold' }
              ]}>
                {language === 'ar' ? (
                  <>
                    لقد كسبت{' '}
                    <Text style={[
                      styles.rewardNumber, 
                      { 
                        fontSize: 24, 
                        fontWeight: 'bold',
                        color: isFullSurah ? '#F5E6C8' : 'rgba(165,115,36,0.8)' // Parchment color for full surah
                      }
                    ]}>
                      {toArabicNumber(rewardAmount)}
                    </Text>
                    {' '}حسنة لهذه {isFullSurah ? 'السورة' : 'الآية'}!
                  </>
                ) : (
                  <>
                    You've earned{' '}
                    <Text style={[
                      styles.rewardNumber, 
                      { 
                        fontSize: 24, 
                        fontWeight: 'bold',
                        color: isFullSurah ? '#F5E6C8' : 'rgba(165,115,36,0.8)' // Parchment color for full surah
                      }
                    ]}>
                      {toArabicNumber(rewardAmount)}
                    </Text>
                    {' '}7asanat for this {isFullSurah ? 'Surah' : 'Ayah'}!
                  </>
                )}
              </Text>
              <Text variant="body2" style={[
                styles.inshaAllahText,
                { 
                  color: '#999999', // Lighter gray
                  fontSize: 18 // Larger font size
                }
              ]}>
                {language === 'ar' ? 'إن شاء الله' : 'Insha\'Allah'}
              </Text>
            </Animated.View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
              <TouchableOpacity 
          style={[
            styles.modalOverlay,
            isFullSurah && { justifyContent: 'flex-end' }
          ]}
          activeOpacity={1}
          onPress={onClose}
        >
        <TouchableOpacity 
          style={[
            styles.modalContent, 
            { 
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              backgroundColor: isFullSurah ? '#5b7f67' : '#F5E6C8', // Green background for full surah (matching surah recitations modal)
            }
          ]}
          activeOpacity={1}
          onPress={(e) => {
            e.stopPropagation();
            // Skip animation when modal content is tapped
            if (currentStep < 3) {
              skipAnimation();
            }
          }}
        >
            {renderCalculationStep()}
            {calculationComplete && (
              <Animated.View 
                style={[styles.buttonContainer, { opacity: resultAnim }]}
              >
                <View style={styles.rewardButtonRow}>
                  {isFullSurah ? (
                    <>
                      <Button
                        title={language === 'ar' ? 'قائمة السور' : 'Surah List'}
                        onPress={onSurahList}
                        style={[styles.rewardButton, { backgroundColor: '#F5E6C8', marginRight: 8 }]}
                        textStyle={{ color: '#2D5016', fontWeight: 'bold' }}
                      />
                      <Button
                        title={language === 'ar' ? 'تسجيل السورة كاملة' : 'Record Full Surah'}
                        onPress={onRecordFullSurah}
                        style={[styles.rewardButton, { backgroundColor: '#F5E6C8', marginRight: 8 }]}
                        textStyle={{ color: '#2D5016', fontWeight: 'bold' }}
                      />
                      <Button
                        title={language === 'ar' ? 'السورة التالية' : 'Next Surah'}
                        onPress={onNext}
                        style={[styles.rewardButton, { backgroundColor: '#F5E6C8' }]}
                        textStyle={{ color: '#2D5016', fontWeight: 'bold' }}
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        title={language === 'ar' ? 'مراجعة' : 'Revise'}
                        onPress={onClose}
                        style={[styles.rewardButton, { backgroundColor: '#5b7f67', marginRight: 8 }]}
                      />
                      <Button
                        title={isLastAyah 
                          ? (language === 'ar' ? 'متابعة' : 'Continue') 
                          : (language === 'ar' ? 'الآية التالية' : 'Next Ayah')
                        }
                        onPress={onNext}
                        style={[styles.rewardButton, { backgroundColor: '#5b7f67' }]}
                      />
                    </>
                  )}
                </View>
              </Animated.View>
            )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F5E6C8', // Default parchment color
    borderRadius: SIZES.base,
    padding: SIZES.large,
    alignItems: 'center',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    minWidth: 300,
  },
  title: {
    color: '#33694e',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContentInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  calculationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  calculationText: {
    fontSize: 24,
    color: '#3E2723',
    textAlign: 'center',
    lineHeight: 32,
  },
  calculationLabel: {
    color: '#3E2723',
    fontWeight: 'normal',
  },
  calculationNumber: {
    color: 'rgba(165,115,36,0.8)',
    fontWeight: 'bold',
    textShadowColor: 'rgba(165,115,36,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  resultTitle: {
    color: '#33694e',
    marginBottom: 16,
  },
  resultText: {
    color: '#3E2723',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 18,
  },
  rewardNumber: {
    color: 'rgba(165,115,36,0.8)',
    fontWeight: 'bold',
    textShadowColor: 'rgba(165,115,36,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  inshaAllahText: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
  },
  rewardButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  rewardButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AnimatedRewardModal; 