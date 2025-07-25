import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, Animated, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Text from './Text';
import Button from './Button';
import { COLORS, SIZES } from '../utils/theme';

const AnimatedRewardModal = ({ 
  visible, 
  rewardAmount, 
  onClose, 
  onNext, 
  isLastAyah = false,
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
      
      // Start entrance animation
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
    // Step 1: Show letter count calculation (immediately)
    const letterCount = rewardAmount / 10;
    setLetterCount(letterCount);
    numberAnim.setValue(letterCount);

    // Step 2: Show multiplication
    timeoutsRef.current.push(setTimeout(() => {
      setCurrentStep(2);
      animateTextScale();
    }, 800)); // So user sees letter count for a bit

    // Step 3: Show result
    timeoutsRef.current.push(setTimeout(() => {
      setCurrentStep(3);
      setCalculationComplete(true);
      animateResult();
    }, 1600));
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
          <Text variant="h2" style={[styles.title, { fontFamily: 'Montserrat-Bold' }]}>
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
              <Text variant="body1" style={styles.resultText}>
                {language === 'ar' ? (
                  <>
                    لقد كسبت{' '}
                    <Text style={styles.rewardNumber}>
                      {toArabicNumber(rewardAmount)}
                    </Text>
                    {' '}حسنة لهذه الآية!
                  </>
                ) : (
                  <>
                    You've earned{' '}
                    <Text style={styles.rewardNumber}>
                      {toArabicNumber(rewardAmount)}
                    </Text>
                    {' '}7asanat for this Ayah!
                  </>
                )}
              </Text>
              <Text variant="body2" style={styles.inshaAllahText}>
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
      <TouchableWithoutFeedback onPress={skipAnimation}>
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent, 
              { 
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim
              }
            ]}
          >
            {renderCalculationStep()}
            {calculationComplete && (
              <Animated.View 
                style={[styles.buttonContainer, { opacity: resultAnim }]}
              >
                <View style={styles.rewardButtonRow}>
                  <Button
                    title={language === 'ar' ? 'مراجعة' : 'Revise'}
                    onPress={onClose}
                    style={[styles.rewardButton, { backgroundColor: '#5b7f67', marginRight: 8 }]}
                  />
                  <Button
                    title={isLastAyah 
                      ? (language === 'ar' ? 'السورة التالية' : 'Next Surah') 
                      : (language === 'ar' ? 'الآية التالية' : 'Next Ayah')
                    }
                    onPress={onNext}
                    style={[styles.rewardButton, { backgroundColor: '#5b7f67' }]}
                  />
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
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
    backgroundColor: '#F5E6C8',
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
  },
});

export default AnimatedRewardModal; 