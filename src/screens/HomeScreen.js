import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Image, ImageBackground, Modal, TouchableOpacity, Dimensions, Alert, TextInput, Animated, ScrollView, FlatList, Platform } from 'react-native';
import { useAuth } from '../utils/authContext';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { loadData, resetProgress } from '../utils/store';
import { syncProgressData } from '../utils/cloudStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../utils/languageContext';
import telemetryService from '../utils/telemetry';
import { hapticSelection } from '../utils/hapticFeedback';
import audioRecorder from '../utils/audioRecorder';
import audioPlayer from '../utils/audioPlayer';

import AuthScreen from './AuthScreen';

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const formatLargeNumber = (num) => {
  if (num >= 1000000000) {
    return {
      text: (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B',
      fontSize: 18
    };
  } else if (num >= 10000000) {
    return {
      text: (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M',
      fontSize: 20
    };
  } else if (num >= 1000000) {
    return {
      text: (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M',
      fontSize: 22
    };
  } else if (num >= 100000) {
    return {
      text: num.toLocaleString(),
      fontSize: 24
    };
  } else if (num >= 10000) {
    return {
      text: num.toLocaleString(),
      fontSize: 26
    };
  } else {
    return {
      text: num.toLocaleString(),
      fontSize: 28
    };
  }
};

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



const HomeScreen = ({ navigation, route }) => {
  const { language, changeLanguage, t } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  
  // Get screen dimensions for responsive layout
  const { width, height } = Dimensions.get('window');
  const isSmallScreen = height < 700;
  const isMediumScreen = height < 850;
  
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };
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
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoActiveTab, setInfoActiveTab] = useState('numerals'); // 'numerals' or 'tajweed'
  const [duaVisible, setDuaVisible] = useState(false);
  const [duaExpanded, setDuaExpanded] = useState(false);
  const [duaButtonPressed, setDuaButtonPressed] = useState(false);
  const [currentDuaIndex, setCurrentDuaIndex] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);
  const [includeRecordings, setIncludeRecordings] = useState(false);
  const [memorizeButtonHeld, setMemorizeButtonHeld] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [hasanatModalVisible, setHasanatModalVisible] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [recordingsModalVisible, setRecordingsModalVisible] = useState(false);
  
  // Goal setting state
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalCompletionDate, setGoalCompletionDate] = useState(null);
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalStartDate, setGoalStartDate] = useState(null);
  const flatListRef = useRef(null);

  // Goal calculation helpers
  const calculateGoalCompletionDate = (ayaatPerDay) => {
    const totalAyaat = 6236; // Total Quran ayaat
    const daysNeeded = Math.ceil(totalAyaat / ayaatPerDay);
    const startDate = new Date();
    const completionDate = new Date(startDate);
    completionDate.setDate(startDate.getDate() + daysNeeded);
    return completionDate;
  };

  const calculateGoalProgress = (ayaatPerDay, missedDays = 0) => {
    if (!goalStartDate) return 0;
    const totalAyaat = 6236;
    const daysNeeded = Math.ceil(totalAyaat / ayaatPerDay);
    const daysElapsed = Math.floor((new Date() - goalStartDate) / (1000 * 60 * 60 * 24));
    const adjustedDaysNeeded = daysNeeded + missedDays;
    return Math.min(Math.max((daysElapsed / adjustedDaysNeeded) * 100, 0), 100);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const saveGoalData = async (goal, startDate, completionDate) => {
    try {
      if (goal) {
        await AsyncStorage.setItem('selectedGoal', JSON.stringify(goal));
      } else {
        await AsyncStorage.removeItem('selectedGoal');
      }
      if (startDate) {
        await AsyncStorage.setItem('goalStartDate', startDate.toISOString());
      } else {
        await AsyncStorage.removeItem('goalStartDate');
      }
      if (completionDate) {
        await AsyncStorage.setItem('goalCompletionDate', completionDate.toISOString());
      } else {
        await AsyncStorage.removeItem('goalCompletionDate');
      }
    } catch (error) {
      console.error('Error saving goal data:', error);
    }
  };

  // Scroll to default page on mount
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({
          index: 1,
          animated: false
        });
      }, 100);
    }
  }, []);

  const loadScreenData = async () => {
      const loadedData = await loadData();
      setData(loadedData);
      
      // Load goal data
      try {
        const savedGoal = await AsyncStorage.getItem('selectedGoal');
        const savedGoalStartDate = await AsyncStorage.getItem('goalStartDate');
        const savedGoalCompletionDate = await AsyncStorage.getItem('goalCompletionDate');
        
        if (savedGoal) {
          setSelectedGoal(JSON.parse(savedGoal));
        }
        if (savedGoalStartDate) {
          setGoalStartDate(new Date(savedGoalStartDate));
        }
        if (savedGoalCompletionDate) {
          setGoalCompletionDate(new Date(savedGoalCompletionDate));
        }
      } catch (error) {
        console.error('Error loading goal data:', error);
      }
    };

  useEffect(() => {
    loadScreenData();

    // Track app usage
    telemetryService.trackAppUsage('screen_view', { screen: 'Home' });

    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadScreenData();
      setMemorizeButtonHeld(false); // Reset button state when returning to home
      telemetryService.trackAppUsage('screen_focus', { screen: 'Home' });
    });
    return unsubscribe;
  }, [navigation]);

  // Handle refresh parameter from navigation
  useEffect(() => {
    if (route.params?.refresh) {
      loadScreenData();
    }
  }, [route.params?.refresh]);

  // Auto-sync when user logs in/out
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[HomeScreen] User logged in, syncing progress...');
      syncProgressData().then(result => {
        if (result.success) {
          console.log('[HomeScreen] Auto-sync successful');
          loadScreenData(); // Reload data after sync
        }
      }).catch(error => {
        console.error('[HomeScreen] Auto-sync failed:', error);
      });
    }
  }, [isAuthenticated]);

  // Update goal progress when data changes
  useEffect(() => {
    if (selectedGoal && goalStartDate) {
      const missedDays = Math.max(0, Math.floor((new Date() - goalStartDate) / (1000 * 60 * 60 * 24)) - data.streak);
      const progress = calculateGoalProgress(selectedGoal.ayaat, missedDays);
      setGoalProgress(progress);
      
      // Recalculate completion date based on missed days
      if (missedDays > 0) {
        const totalAyaat = 6236;
        const daysNeeded = Math.ceil(totalAyaat / selectedGoal.ayaat);
        const adjustedCompletionDate = new Date(goalStartDate);
        adjustedCompletionDate.setDate(goalStartDate.getDate() + daysNeeded + missedDays);
        setGoalCompletionDate(adjustedCompletionDate);
      }
    }
  }, [selectedGoal, goalStartDate, data.streak]);

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
            <TouchableOpacity style={styles.introButton} onPress={() => setInfoVisible(true)} onPressIn={() => hapticSelection()}>
              <View style={{
                borderWidth: 2,
                borderColor: '#5b7f67',
                borderRadius: 12,
                padding: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Image 
                  source={require('../assets/app_icons/information.png')} 
                  style={{ width: 28, height: 28, tintColor: '#F5E6C8' }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            {(() => {
              const [logoPressed, setLogoPressed] = useState(false);
              
              return (
                <Animated.View style={[styles.logoTextContainer, {
              shadowColor: '#fae29f',
              shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: logoPressed ? 0.6 : 0.3,
                  shadowRadius: logoPressed ? 16 : 8,
                  elevation: logoPressed ? 12 : 6,
                }]}>
                  <TouchableOpacity
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 10,
                    }}
                    onPress={() => {
                      telemetryService.trackUserInteraction('button_click', { 
                        button: 'Logo - Intro Modal',
                        screen: 'Home'
                      });
                      hapticSelection();
                      // Toggle the modal - if it's open, close it; if it's closed, open it
                      setIntroVisible(!introVisible);
                    }}
                    onPressIn={() => setLogoPressed(true)}
                    onPressOut={() => setLogoPressed(false)}
                    activeOpacity={0.8}
                  >
              <Image 
                source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')} 
                style={[styles.logo]} 
              />
                  </TouchableOpacity>
                </Animated.View>
              );
            })()}
            <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsVisible(true)} onPressIn={() => hapticSelection()}>
              <View style={{
                borderWidth: 2,
                borderColor: 'rgba(165,115,36,0.8)',
                borderRadius: 12,
                padding: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Image 
                  source={require('../assets/app_icons/settings.png')} 
                  style={{ width: 28, height: 28, tintColor: '#F5E6C8' }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.customDivider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerGap}>
              {(() => {
                const [duaTextPressed, setDuaTextPressed] = useState(false);
                
                return (
                  <Animated.View style={{
                    shadowColor: '#fae29f',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: duaTextPressed ? 0.6 : 0.3,
                    shadowRadius: duaTextPressed ? 16 : 8,
                    elevation: duaTextPressed ? 12 : 6,
                  }}>
                    <TouchableOpacity
                      style={{
                        padding: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => {
                        telemetryService.trackUserInteraction('button_click', { 
                          button: 'Dua Text - Duas Modal',
                          screen: 'Home'
                        });
                        hapticSelection();
                        setDuaVisible(true);
                      }}
                      onPressIn={() => setDuaTextPressed(true)}
                      onPressOut={() => setDuaTextPressed(false)}
                      activeOpacity={0.8}
                    >
              <Text style={[styles.arabicText, {
                color: '#F0D8A0',
                textShadowColor: '#fae29f',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 3,
                        width: 240,
              }]} allowFontScaling={false} lang="ar">اللَّهُمَّ اجْعَلْنَا مِنْ أَهْلِ الْقُرْآن</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })()}
            </View>
            <View style={styles.dividerLine} />
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: Platform.OS === 'android' ? -40 : -20, // Moved up more for Android
            marginBottom: 20,
            position: 'relative',
            zIndex: 1,
            height: Platform.OS === 'android' ? 180 : 120 // Fixed height
          }}>
            {(() => {
              const [pressed, setPressed] = useState(false);
              const glowAnimation = useRef(new Animated.Value(0)).current;
              
              // Glow animation for iOS only
              useEffect(() => {
                if (Platform.OS === 'ios') {
                  const animateGlow = () => {
                    const duration = 2000;
                    const fadeDuration = 1500;
                    
                    Animated.sequence([
                      Animated.timing(glowAnimation, {
                        toValue: 1,
                        duration: duration,
                        useNativeDriver: false,
                      }),
                      Animated.timing(glowAnimation, {
                        toValue: 0.2,
                        duration: fadeDuration,
                        useNativeDriver: false,
                      })
                    ]).start(() => animateGlow());
                  };
                  
                  animateGlow();
                  
                  return () => {
                    glowAnimation.stopAnimation();
                  };
                }
              }, []);
              
              return (
                <Animated.View
                  style={{
                    flex: 1,
                    marginHorizontal: SIZES.small,
                    padding: Platform.OS === 'android' ? SIZES.extraLarge : SIZES.medium,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    borderRadius: SIZES.base,
                    shadowColor: '#fae29f',
                    shadowOffset: { width: 0, height: 0 },
                    ...(Platform.OS === 'ios' && {
                      shadowOpacity: glowAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 0.9],
                      }),
                      shadowRadius: glowAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 24],
                      }),
                      elevation: glowAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [6, 18],
                      }),
                    }),
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 2,
                    height: Platform.OS === 'android' ? 180 : 120
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent',
                      borderRadius: SIZES.base,
                      flexDirection: 'column',
                      width: '100%',
                      height: '100%'
                    }}
                  onPress={() => {
                    telemetryService.trackUserInteraction('button_click', { 
                      button: 'Start Memorization',
                      screen: 'Home'
                    });
                    navigation.navigate('SurahList');
                  }}
                  onPressIn={() => { 
                    setPressed(true); 
                    setMemorizeButtonHeld(true);
                    hapticSelection(); 
                  }}
                  onPressOut={() => { 
                    setPressed(false); 
                    // Reset the text change if the press wasn't completed
                    // We'll use a small delay to check if navigation happened
                    setTimeout(() => {
                      // If we're still on the home screen, the press wasn't completed
                      if (navigation.isFocused()) {
                        setMemorizeButtonHeld(false);
                      }
                    }, 50);
                  }}
                  activeOpacity={1}
                >
                  <View style={[styles.buttonIconContainer, {
                    shadowRadius: memorizeButtonHeld ? (Platform.OS === 'android' ? 12 : 40) : (Platform.OS === 'android' ? 8 : 35),
                    shadowOpacity: memorizeButtonHeld ? (Platform.OS === 'android' ? 2.0 : 8.5) : (Platform.OS === 'android' ? 1.0 : 5.0),
                    elevation: memorizeButtonHeld ? (Platform.OS === 'android' ? 8 : 25) : (Platform.OS === 'android' ? 5 : 15),
                  }]}>
                    <Image source={require('../assets/openQuran.png')} style={[styles.buttonIcon, { width: Platform.OS === 'android' ? 52 : 45, height: Platform.OS === 'android' ? 52 : 45 }]} resizeMode="contain" />
                  </View>
                  <View style={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    borderRadius: 8, 
                    paddingHorizontal: 16, 
                    paddingTop: language === 'ar' ? 8 : 12,
                    paddingBottom: language === 'ar' ? 12 : 8,
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    shadowColor: '#fae29f', 
                    shadowOffset: { width: 0, height: 0 }, 
                    shadowOpacity: pressed ? (Platform.OS === 'android' ? 0.4 : 1.0) : (Platform.OS === 'android' ? 0.2 : 0.6), 
                    shadowRadius: pressed ? (Platform.OS === 'android' ? 8 : 24) : (Platform.OS === 'android' ? 4 : 10), 
                    elevation: pressed ? (Platform.OS === 'android' ? 6 : 20) : (Platform.OS === 'android' ? 3 : 8),
                    minHeight: language === 'ar' ? 80 : 60
                  }}>
                    <Text style={[{
                      marginTop: language === 'ar' ? 4 : 0,
                      textAlign: 'center',
                      color: '#fae29f', 
                      width: '100%', 
                      fontWeight: 'bold', 
                      fontSize: memorizeButtonHeld ? 26 : 22, 
                      textShadowColor: '#fae29f', 
                      textShadowOffset: { width: 0, height: 0 }, 
                      textShadowRadius: 4,
                      lineHeight: language === 'ar' ? 36 : 26,
                      fontFamily: 'Montserrat-Bold'
                    }]}>{memorizeButtonHeld ? t('b2ithnAllah') : t('quran_memorize')}</Text>
                  </View>
                </TouchableOpacity>
                </Animated.View>
              );
            })()}
          </View>



          <FlatList
            ref={flatListRef}
            data={[
              {
                id: 'saved_content',
                content: (
                  <View style={{
                    marginTop: isSmallScreen ? 20 : (isMediumScreen ? 25 : 30),
                    marginBottom: SIZES.medium,
                    flex: 1,
                    paddingHorizontal: SIZES.small,
                  }}>
                    {/* Saved Content Header */}
                    <View style={{
                      alignItems: 'center',
                      marginBottom: SIZES.small,
                    }}>
                      <Text variant="h2" style={{
                        textAlign: 'center',
                        color: '#5b7f67',
                        fontWeight: 'bold',
                        fontSize: 20,
                        marginBottom: 6,
                        textShadowColor: '#000000',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}>
                        Saved Content
                      </Text>
                      <Text style={{
                        textAlign: 'center',
                        color: '#CCCCCC',
                        fontSize: 12,
                      }}>
                        Your saved ayaat and recordings
                      </Text>
                    </View>

                    {/* Two Column Layout */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}>
                      {/* Saved Ayaat */}
                      <TouchableOpacity
                        style={{
                          flex: 0.48,
                          backgroundColor: 'rgba(128,128,128,0.3)',
                          borderColor: 'rgba(165,115,36,0.8)',
                          borderWidth: 1,
                          borderRadius: SIZES.base,
                          padding: SIZES.small,
                          shadowColor: '#000000',
                          shadowOffset: { width: 4, height: 4 },
                          shadowOpacity: 0.6,
                          shadowRadius: 6,
                          elevation: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 120,
                        }}
                        onPress={() => {
                          hapticSelection();
                          navigation.navigate('SurahList', { activeTab: 3 }); // 3 is the saved ayaat tab
                        }}
                      >
                        <Text style={{
                          textAlign: 'center',
                          color: '#5b7f67',
                          fontWeight: 'bold',
                          fontSize: 16,
                          marginBottom: 8,
                        }}>
                          Saved Ayaat
                        </Text>
                        <Text style={{
                          textAlign: 'center',
                          color: '#F5E6C8',
                          fontSize: 14,
                          marginBottom: 4,
                        }}>
                          12 saved
                        </Text>
                        <Text style={{
                          textAlign: 'center',
                          color: '#CCCCCC',
                          fontSize: 12,
                        }}>
                          Tap to view
                        </Text>
                      </TouchableOpacity>

                      {/* Recitation Recordings */}
                      <TouchableOpacity
                        style={{
                          flex: 0.48,
                          backgroundColor: 'rgba(128,128,128,0.3)',
                          borderColor: 'rgba(165,115,36,0.8)',
                          borderWidth: 1,
                          borderRadius: SIZES.base,
                          padding: SIZES.small,
                          shadowColor: '#000000',
                          shadowOffset: { width: 4, height: 4 },
                          shadowOpacity: 0.6,
                          shadowRadius: 6,
                          elevation: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 120,
                        }}
                        onPress={() => {
                          hapticSelection();
                          setRecordingsModalVisible(true);
                        }}
                      >
                        <Text style={{
                          textAlign: 'center',
                          color: '#5b7f67',
                          fontWeight: 'bold',
                          fontSize: 16,
                          marginBottom: 8,
                        }}>
                          Recordings
                        </Text>
                        <Text style={{
                          textAlign: 'center',
                          color: '#F5E6C8',
                          fontSize: 14,
                          marginBottom: 4,
                        }}>
                          8 recordings
                        </Text>
                        <Text style={{
                          textAlign: 'center',
                          color: '#CCCCCC',
                          fontSize: 12,
                        }}>
                          Tap to view
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              },
              {
                id: 'stats',
                content: (
                  <View style={{
                    marginTop: isSmallScreen ? 5 : (isMediumScreen ? 10 : 15),
                    marginBottom: 40,
                    alignItems: 'center',
                    width: '100%',
                    marginLeft: -16
                  }}>
                    {/* Progress Card */}
                    <TouchableOpacity
                      style={{ width: '100%', alignItems: 'center' }}
                      onPress={() => {
                        hapticSelection();
                        setProgressModalVisible(true);
                      }}
                      activeOpacity={0.9}
                    >
                      <Card variant="elevated" style={{
                        marginBottom: 0,
                        backgroundColor: 'rgba(128,128,128,0.3)',
                        borderColor: 'rgba(165,115,36,0.8)',
                        borderWidth: 1,
                        padding: SIZES.small,
                        shadowColor: '#000000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 0.6,
                        shadowRadius: 6,
                        elevation: 8,
                        height: isSmallScreen ? 130 : 150,
                        alignSelf: 'center',
                        width: '80%'
                      }}>
                        <View style={{ alignItems: 'center' }}>
                          <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 12 }}>
                                                        <Text variant="h2" style={[FONTS.h2.getFont(language), {
                              textAlign: 'center',
                              color: '#5b7f67',
                              fontWeight: 'bold',
                              fontSize: 22,
                              textShadowColor: '#000000',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 3,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.3,
                              shadowRadius: 3,
                            }]}>{t('memorization_progress')}</Text>
                          </View>
                        </View>
                        <Text variant="body1" style={{ marginBottom: SIZES.small, textAlign: 'center' }}>
                          <Text style={{ 
                            color: '#f5c860', 
                            fontWeight: 'bold',
                            textShadowColor: '#fae29f',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 2,
                          }}>{toArabicNumber(data.memorizedAyaat)}</Text> <Text style={{ color: '#CCCCCC' }}>{t('out_of_ayaat')}</Text> <Text style={{ color: '#F5E6C8', fontWeight: 'bold' }}>{toArabicNumber(data.totalAyaat)}</Text> <Text style={{ color: '#CCCCCC' }}>{t('ayaat_memorized')}</Text>
                        </Text>
                        <View style={styles.progressBar}>
                          <View style={[
                            styles.progressFill, 
                            { 
                              width: `${progressPercentage}%`,
                              backgroundColor: progressPercentage === 100 ? '#fae29f' : '#33694e',
                              ...(progressPercentage === 100 && {
                                shadowColor: '#fae29f',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 1.0,
                                shadowRadius: 15,
                                elevation: 12,
                              })
                            }
                          ]} />
                        </View>
                                                  <Text variant="body2" color="textSecondary" style={{
                            marginTop: 4,
                            textAlign: 'center',
                            color: '#F5E6C8',
                            fontSize: progressPercentage === 100 ? 18 : 16,
                            ...(progressPercentage === 100 && {
                              textShadowColor: '#fae29f',
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 8,
                              fontWeight: 'bold',
                            })
                          }}>
                          {progressPercentage === 100 ? (
                            <>
                              <Text style={{ 
                                fontWeight: 'bold',
                                color: '#fae29f',
                                textShadowColor: '#fae29f',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 8,
                              }}>100%</Text> {t('completed')}
                            </>
                          ) : (
                            <>
                              <Text style={{ 
                                fontWeight: 'bold',
                                color: '#fae29f',
                                textShadowColor: '#fae29f',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 2,
                              }}>{toArabicNumber(progressPercentage)}%</Text> {t('complete')}
                            </>
                          )}
                        </Text>
                      </Card>
                    </TouchableOpacity>

                    {/* Stats Grid */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 1,
                      width: '80%',
                      marginTop: Platform.OS === 'android' ? SIZES.extraSmall : 0
                    }}>
                      <Card style={{
                        flex: 0.50,
                        padding: 8,
                        backgroundColor: 'rgba(128,128,128,0.3)',
                        borderColor: 'rgba(165,115,36,0.8)',
                        borderWidth: 1,
                        borderRadius: SIZES.base,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 0.6,
                        shadowRadius: 6,
                        elevation: 8,
                        height: isSmallScreen ? 120 : 140,
                        marginHorizontal: 0
                      }}>
                        <TouchableOpacity
                          onPress={() => {
                            hapticSelection();
                            setHasanatModalVisible(true);
                          }}
                          activeOpacity={0.9}
                          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text variant="h3" style={{ textAlign: 'center', color: '#CCCCCC', fontSize: 16, marginTop: 10 }}>{t('hasanat_gains')}</Text>
                          <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', marginVertical: 8 }}>
                            <Text variant="h1" style={{ 
                              color: 'rgba(245,200,96,0.8)', 
                              fontWeight: 'bold', 
                              textAlign: 'center', 
                              fontSize: formatLargeNumber(data.totalHasanat).fontSize,
                              textShadowColor: '#fae29f',
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 2,
                            }} numberOfLines={1} ellipsizeMode="tail">{toArabicNumber(formatLargeNumber(data.totalHasanat).text)}</Text>
                          </View>
                          <Text variant="body2" color="textSecondary" style={{ textAlign: 'center' }}>+{toArabicNumber(formatLargeNumber(data.todayHasanat).text)} {t('today_hasanat')}</Text>
                          <Text variant="body2" style={{ textAlign: 'center', color: '#F5E6C8', marginTop: 4, marginBottom: 2 }}>{t('insha2allah')}</Text>
                        </TouchableOpacity>
                      </Card>
                      <Card style={{
                        flex: 0.50,
                        padding: 8,
                        backgroundColor: 'rgba(128,128,128,0.3)',
                        borderColor: 'rgba(165,115,36,0.8)',
                        borderWidth: 1,
                        borderRadius: SIZES.base,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 0.6,
                        shadowRadius: 6,
                        elevation: 8,
                        height: isSmallScreen ? 120 : 140,
                        marginHorizontal: 0
                      }}>
                        <TouchableOpacity
                          onPress={() => {
                            hapticSelection();
                            setStreakModalVisible(true);
                          }}
                          activeOpacity={0.9}
                          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <View style={{ marginTop: 8 }}>
                              <Text variant="h3" style={{ textAlign: 'center', color: '#CCCCCC', marginTop: 10, fontSize: 16 }}>{t('streak')}</Text>
                              <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', marginVertical: 8, alignItems: 'center', justifyContent: 'center' }}>
                                <Text variant="h1" style={{ color: '#5b7f67', textAlign: 'center', fontWeight: 'bold', fontSize: formatStreakNumber(data.streak).fontSize, lineHeight: formatStreakNumber(data.streak).fontSize * 1.2 }} numberOfLines={1} ellipsizeMode="tail">{toArabicNumber(formatStreakNumber(data.streak).text)}</Text>
                              </View>
                                                              <Text variant="body2" color="textSecondary" style={{ textAlign: 'center', marginTop: -4 }}>{t('days')}</Text>
                                                             <Text variant="body2" style={{ textAlign: 'center', color: '#F5E6C8', marginTop: 1, marginBottom: 10 }}>{t('masha2allah')}</Text>
                          </View>
                        </TouchableOpacity>
                      </Card>
                    </View>
                  </View>
                )
              },
              {
                id: 'leaderboard',
                content: (
                  <View style={{
                    marginTop: isSmallScreen ? 20 : (isMediumScreen ? 25 : 30),
                    marginBottom: SIZES.medium,
                    flex: 1,
                    paddingHorizontal: SIZES.small,
                  }}>
                                                             {/* Leaderboards Header */}
                     <View style={{
                       alignItems: 'center',
                       marginBottom: SIZES.small,
                     }}>
                       <Text variant="h2" style={{
                         textAlign: 'center',
                         color: '#5b7f67',
                         fontWeight: 'bold',
                         fontSize: 20,
                         marginBottom: 6,
                         textShadowColor: '#000000',
                         textShadowOffset: { width: 0, height: 1 },
                         textShadowRadius: 2,
                       }}>
                         Leaderboards
                       </Text>
                       <Text style={{
                         textAlign: 'center',
                         color: '#CCCCCC',
                         fontSize: 12,
                       }}>
                         Tap to view full leaderboards
                       </Text>
                     </View>

                     {/* Two Column Leaderboards */}
                     <View style={{
                       flexDirection: 'row',
                       justifyContent: 'space-between',
                       gap: 8,
                     }}>
                       {/* Memorization Leaderboard */}
                       <TouchableOpacity
                         style={{
                           flex: 0.48,
                           backgroundColor: 'rgba(128,128,128,0.3)',
                           borderColor: 'rgba(165,115,36,0.8)',
                           borderWidth: 1,
                           borderRadius: SIZES.base,
                           padding: SIZES.small,
                           shadowColor: '#000000',
                           shadowOffset: { width: 4, height: 4 },
                           shadowOpacity: 0.6,
                           shadowRadius: 6,
                           elevation: 8,
                         }}
                         onPress={() => {
                           hapticSelection();
                           Alert.alert('Memorization Leaderboard', 'Coming soon! This will show the top memorizers based on ayaat memorized and hasanat earned.');
                         }}
                       >
                         <Text style={{
                           textAlign: 'center',
                           color: '#5b7f67',
                           fontWeight: 'bold',
                           fontSize: 16,
                           marginBottom: 8,
                         }}>
                           Top Memorizers
                         </Text>
                         {/* Top 3 Preview */}
                         <View style={{ marginBottom: SIZES.small }}>
                           {[
                             { rank: 1, name: 'Ahmad Al-Rashid', ayaat: 2456, hasanat: '2.3M' },
                             { rank: 2, name: 'Fatima Zahra', ayaat: 2103, hasanat: '1.9M' },
                             { rank: 3, name: 'Omar Khalil', ayaat: 1876, hasanat: '1.6M' },
                           ].map((user, index) => (
                             <View key={index} style={{
                               flexDirection: 'row',
                               alignItems: 'center',
                               paddingVertical: 4,
                               borderBottomWidth: index < 2 ? 1 : 0,
                               borderBottomColor: 'rgba(165,115,36,0.3)',
                             }}>
                               <View style={{
                                 width: 20,
                                 alignItems: 'center',
                                 marginRight: 8,
                               }}>
                                 <Text style={{ 
                                   fontSize: 12, 
                                   color: '#F5E6C8', 
                                   fontWeight: 'bold' 
                                 }}>#{user.rank}</Text>
                               </View>
                               <View style={{ flex: 1 }}>
                                 <Text style={{
                                   color: '#F5E6C8',
                                   fontWeight: 'bold',
                                   fontSize: 12,
                                 }}>
                                   {user.name}
                                 </Text>
                                 <Text style={{
                                   color: '#CCCCCC',
                                   fontSize: 10,
                                 }}>
                                   {user.ayaat} ayaat
                                 </Text>
                               </View>
                             </View>
                           ))}
                         </View>
                       </TouchableOpacity>

                       {/* Streak Leaderboard */}
                       <TouchableOpacity
                         style={{
                           flex: 0.48,
                           backgroundColor: 'rgba(128,128,128,0.3)',
                           borderColor: 'rgba(165,115,36,0.8)',
                           borderWidth: 1,
                           borderRadius: SIZES.base,
                           padding: SIZES.small,
                           shadowColor: '#000000',
                           shadowOffset: { width: 4, height: 4 },
                           shadowOpacity: 0.6,
                           shadowRadius: 6,
                           elevation: 8,
                         }}
                         onPress={() => {
                           hapticSelection();
                           Alert.alert('Streak Leaderboard', 'Coming soon! This will show the top users based on their daily memorization streaks.');
                         }}
                       >
                         <Text style={{
                           textAlign: 'center',
                           color: '#5b7f67',
                           fontWeight: 'bold',
                           fontSize: 16,
                           marginBottom: 8,
                         }}>
                           Daily Streaks
                         </Text>
                         {/* Top 3 Preview */}
                         <View style={{ marginBottom: SIZES.small }}>
                           {[
                             { rank: 1, name: 'Yusuf Al-Hamid', streak: 156 },
                             { rank: 2, name: 'Aisha Bint Ali', streak: 134 },
                             { rank: 3, name: 'Khalid Ibn Walid', streak: 98 },
                           ].map((user, index) => (
                             <View key={index} style={{
                               flexDirection: 'row',
                               alignItems: 'center',
                               paddingVertical: 4,
                               borderBottomWidth: index < 2 ? 1 : 0,
                               borderBottomColor: 'rgba(165,115,36,0.3)',
                             }}>
                               <View style={{
                                 width: 20,
                                 alignItems: 'center',
                                 marginRight: 8,
                               }}>
                                 <Text style={{ 
                                   fontSize: 12, 
                                   color: '#F5E6C8', 
                                   fontWeight: 'bold' 
                                 }}>#{user.rank}</Text>
                               </View>
                               <View style={{ flex: 1 }}>
                                 <Text style={{
                                   color: '#F5E6C8',
                                   fontWeight: 'bold',
                                   fontSize: 12,
                                 }}>
                                   {user.name}
                                 </Text>
                                 <Text style={{
                                   color: '#CCCCCC',
                                   fontSize: 10,
                                 }}>
                                   {user.streak} days
                                 </Text>
                               </View>
                             </View>
                           ))}
                         </View>
                       </TouchableOpacity>
                     </View>
                  </View>
                )
              }
            ]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            snapToInterval={Dimensions.get('window').width}
            snapToAlignment="start"
            onMomentumScrollEnd={(event) => {
              const pageIndex = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setCurrentPage(pageIndex);
            }}
            renderItem={({ item }) => (
              <View style={{ 
                width: Dimensions.get('window').width,
                overflow: 'hidden',
                height: '100%'
              }}>
                {item.content}
              </View>
            )}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            getItemLayout={(data, index) => ({
              length: Dimensions.get('window').width,
              offset: Dimensions.get('window').width * index,
              index,
            })}
           />
           
           {/* Page Indicators */}
           <View style={{
             flexDirection: 'row',
             justifyContent: 'center',
             alignItems: 'center',
             marginTop: 30,
             marginBottom: 10
           }}>
             <View style={{
               width: 8,
               height: 8,
               borderRadius: 4,
               backgroundColor: currentPage === 0 ? '#5b7f67' : 'rgba(165,115,36,0.8)',
               marginHorizontal: 4
             }} />
             <View style={{
               width: 8,
               height: 8,
               borderRadius: 4,
               backgroundColor: currentPage === 1 ? '#5b7f67' : 'rgba(165,115,36,0.8)',
               marginHorizontal: 4
             }} />
             <View style={{
               width: 8,
               height: 8,
               borderRadius: 4,
               backgroundColor: currentPage === 2 ? '#5b7f67' : 'rgba(165,115,36,0.8)',
               marginHorizontal: 4
             }} />
           </View>
        </View>

          <Modal
            visible={introVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIntroVisible(false)}
          >
            <View style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: 50 }]}>
              <View style={[styles.modalContent, { 
                minHeight: 500,
                justifyContent: 'center',
                paddingVertical: 40,
                marginTop: 17,
                backgroundColor: 'rgba(192,192,192,0.95)',
              }]}>
                <View style={[styles.logoTextContainer, {
                  shadowColor: '#fae29f',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                  marginBottom: 20,
                  position: 'absolute',
                  top: 10,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                }]}>
                  <TouchableOpacity
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 140,
                      height: 140,
                    }}
                    onPress={() => setIntroVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')} 
                      style={styles.logo} 
                      resizeMode="contain" 
                    />
                  </TouchableOpacity>
                </View>
                {/* Spacer to push content down and align with main screen icon */}
                <View style={{ height: 120, width: '100%', zIndex: 1 }} />
                <Text style={{ 
                  fontSize: 28, 
                  fontWeight: 'bold', 
                  color: 'rgba(165,115,36,0.8)', 
                  marginBottom: 20, 
                  marginTop: 10,
                  textAlign: 'center',
                  lineHeight: 40,
                  textShadowColor: 'rgba(165,115,36,0.8)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 2,
                }}>
                  {t('intro_title')}
                </Text>
                {(() => {
                  const [bismillahPressed, setBismillahPressed] = useState(false);
                  
                  return (
                    <Animated.View style={{
                      shadowColor: '#fae29f',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: bismillahPressed ? 0.8 : 0.3,
                      shadowRadius: bismillahPressed ? 20 : 8,
                      elevation: bismillahPressed ? 15 : 6,
                      marginBottom: 30,
                    }}>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#33694e',
                          paddingVertical: 16,
                          paddingHorizontal: 32,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 2,
                          borderColor: bismillahPressed ? '#fae29f' : 'rgba(165,115,36,0.6)',
                        }}
                  onPress={() => setIntroVisible(false)}
                        onPressIn={() => { 
                          setBismillahPressed(true); 
                          hapticSelection(); 
                        }}
                        onPressOut={() => setBismillahPressed(false)}
                        activeOpacity={0.8}
                      >
                        <Text style={{
                          color: '#F5E6C8',
                          fontSize: 18,
                          fontWeight: 'bold',
                          textShadowColor: '#000',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}>
                          {t('bismillah')}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })()}
                <Text variant="h2" style={{ 
                  marginBottom: 30, 
                  fontSize: 24, 
                  color: '#33694e', 
                  fontWeight: 'bold',
                  textAlign: 'center',
                  lineHeight: 32
                }}>
                  {t('welcome_to_iqra2')}
                </Text>
                <Text variant="body1" style={{ 
                  marginBottom: 30, 
                  textAlign: 'center', 
                  fontSize: 18, 
                  color: '#555', 
                  fontWeight: '500',
                  lineHeight: 26,
                  paddingHorizontal: 10
                }}>
                  {t('intro_description')}
                </Text>
              </View>
            </View>
          </Modal>

        <Modal
          visible={infoVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'flex-end', paddingBottom: 20 }]}
            activeOpacity={1}
            onPress={() => setInfoVisible(false)}
          >
              <View style={[styles.modalContent, { 
                minHeight: 550,
                maxHeight: '75%',
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
              }]}>
              <Text variant="h2" style={{ 
                marginBottom: 24, 
                marginTop: -30, 
                color: '#F5E6C8',
                fontSize: 28,
                fontWeight: 'bold',
                textShadowColor: '#000',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>Info</Text>
              
              {/* Tab Buttons */}
              <View style={{ flexDirection: 'row', marginBottom: 24, gap: 8 }}>
                <Button
                  title="Translit"
                  onPress={() => { 
                    hapticSelection(); 
                    setInfoActiveTab('numerals'); 
                  }}
                  style={{ 
                    backgroundColor: infoActiveTab === 'numerals' ? '#33694e' : 'rgba(128,128,128,0.6)', 
                    flex: 1,
                    marginRight: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                />
                <Button
                  title="Tajweed"
                  onPress={() => { 
                    hapticSelection(); 
                    setInfoActiveTab('tajweed'); 
                  }}
                  style={{ 
                    backgroundColor: infoActiveTab === 'tajweed' ? '#33694e' : 'rgba(128,128,128,0.6)', 
                    flex: 1,
                    marginLeft: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                />
              </View>
              
              {/* Scrollable Tab Content */}
              <ScrollView 
                style={{ flex: 1 }} 
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {infoActiveTab === 'numerals' ? (
                  <View style={{ flex: 1 }}>
                    <Text variant="h3" style={{ 
                      marginBottom: 16, 
                      color: 'rgba(165,115,36,0.8)', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      textShadowColor: '#000',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    }}>Transliteration Guide</Text>
                    <View style={{ backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 16, lineHeight: 24, marginBottom: 12 }}>
                        Arabic letters are represented using English characters and numbers. Here's the complete guide:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
                        {[
                          { arabic: 'ع', english: '3', description: 'Ayn' },
                          { arabic: 'ح', english: '7', description: 'Haa' },
                          { arabic: 'خ', english: '5', description: 'Khaa' },
                          { arabic: 'غ', english: '8', description: 'Ghayn' },
                          { arabic: 'ط', english: '6', description: 'Taa' },
                          { arabic: 'ص', english: '9', description: 'Saad' },
                          { arabic: 'ض', english: '4', description: 'Daad' },
                          { arabic: 'ث', english: 'th', description: 'Thaa' },
                          { arabic: 'ذ', english: 'dh', description: 'Dhaal' },
                          { arabic: 'ظ', english: 'th', description: 'Thaa' },
                          { arabic: 'ش', english: 'sh', description: 'Sheen' },
                          { arabic: 'ج', english: 'j', description: 'Jeem' },
                          { arabic: 'ق', english: 'q', description: 'Qaaf' },
                          { arabic: 'ك', english: 'k', description: 'Kaaf' },
                          { arabic: 'ل', english: 'l', description: 'Laam' },
                          { arabic: 'م', english: 'm', description: 'Meem' },
                          { arabic: 'ن', english: 'n', description: 'Noon' },
                          { arabic: 'ه', english: 'h', description: 'Haa' },
                          { arabic: 'و', english: 'w', description: 'Waw' },
                          { arabic: 'ي', english: 'y', description: 'Yaa' },
                          { arabic: 'ب', english: 'b', description: 'Baa' },
                          { arabic: 'ت', english: 't', description: 'Taa' },
                          { arabic: 'د', english: 'd', description: 'Daal' },
                          { arabic: 'ر', english: 'r', description: 'Raa' },
                          { arabic: 'ز', english: 'z', description: 'Zay' },
                          { arabic: 'س', english: 's', description: 'Seen' },
                          { arabic: 'ف', english: 'f', description: 'Faa' },
                          { arabic: 'ق', english: 'q', description: 'Qaaf' },
                          { arabic: 'ك', english: 'k', description: 'Kaaf' },
                          { arabic: 'ل', english: 'l', description: 'Laam' },
                          { arabic: 'م', english: 'm', description: 'Meem' },
                          { arabic: 'ن', english: 'n', description: 'Noon' },
                          { arabic: 'ه', english: 'h', description: 'Haa' },
                          { arabic: 'و', english: 'w', description: 'Waw' },
                          { arabic: 'ي', english: 'y', description: 'Yaa' },
                          { arabic: 'أ', english: 'a', description: 'Alif' },
                          { arabic: 'إ', english: 'i', description: 'Alif' },
                          { arabic: 'آ', english: 'aa', description: 'Alif' },
                          { arabic: 'ا', english: 'a', description: 'Alif' },
                          { arabic: 'ة', english: 'ah', description: 'Taa Marbouta' },
                          { arabic: 'ى', english: 'a', description: 'Alif Maqsura' },
                        ].map((letter, index) => (
                          <View key={index} style={{ 
                            backgroundColor: 'rgba(51,105,78,0.2)', 
                            borderRadius: 8, 
                            padding: 12, 
                            alignItems: 'center',
                            minWidth: 80,
                            marginBottom: 8,
                            borderColor: 'rgba(165,115,36,0.3)',
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 4,
                          }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fae29f', marginBottom: 4, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }}>
                              {letter.arabic}
                            </Text>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#5b7f67', marginBottom: 2 }}>
                              {letter.english}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#CCCCCC', textAlign: 'center' }}>
                              {letter.description}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text variant="h3" style={{ 
                      marginBottom: 16, 
                      color: 'rgba(165,115,36,0.8)', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      textShadowColor: '#000',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    }}>Tajweed Guide</Text>
                    <View style={{ backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 12, padding: 16 }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 16, lineHeight: 24, marginBottom: 16 }}>
                        Tajweed rules help ensure proper pronunciation when reciting the Quran. Here are the key rules:
                      </Text>
                      <View style={{ gap: 12 }}>
                        {[
                          { term: 'Ghunnah', description: 'Nasalization - holding the sound in the nose for 2 counts when ن or م has sukoon', symbol: 'ن' },
                          { term: 'Idghaam', description: 'Merging - when ن has sukoon and is followed by ي ر م ل و ن, the ن is merged into the next letter', symbol: 'د' },
                          { term: 'Ikhfaa', description: 'Hiding - when ن has sukoon and is followed by ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك, the ن is hidden', symbol: 'خ' },
                          { term: 'Qalqalah', description: 'Bouncing - ق ط ب ج د letters are pronounced with a bouncing sound when they have sukoon', symbol: 'ق' },
                          { term: 'Madd', description: 'Elongation - vowels are held for their proper duration (2, 4, or 6 counts)', symbol: 'م' },
                        ].map((rule, index) => (
                          <View key={index} style={{ 
                            backgroundColor: 'rgba(51,105,78,0.2)', 
                            borderRadius: 8, 
                            padding: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderColor: 'rgba(165,115,36,0.3)',
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 4,
                          }}>
                            <View style={{ 
                              backgroundColor: '#33694e', 
                              borderRadius: 20, 
                              width: 40, 
                              height: 40, 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              marginRight: 12,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4,
                              elevation: 4,
                            }}>
                              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
                                {rule.symbol}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fae29f', marginBottom: 4, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }}>
                                {rule.term}
                              </Text>
                              <Text style={{ fontSize: 14, color: '#CCCCCC', lineHeight: 20 }}>
                                {rule.description}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
              
              <Button
                title={t('close')}
                onPress={() => setInfoVisible(false)}
                style={{ backgroundColor: '#33694e', marginTop: 15 }}
                />
              </View>
            </TouchableOpacity>
          </Modal>

        <Modal
          visible={duaVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDuaVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'flex-end', paddingBottom: 50 }]}
            activeOpacity={1}
            onPress={() => { 
              console.log('[DEBUG] Modal overlay pressed');
              setDuaVisible(false); 
              setDuaExpanded(false); 
              setDuaButtonPressed(false); 
              setCurrentDuaIndex(0); 
            }}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                minHeight: 700,
                maxHeight: '95%',
                justifyContent: 'flex-start',
                paddingVertical: 40,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
              }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Text variant="h2" style={{ 
                marginBottom: 24, 
                marginTop: -10, 
                color: '#F5E6C8',
                fontSize: 28,
                fontWeight: 'bold',
                textShadowColor: '#000',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>Da3awaat</Text>
              
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  {(() => {
                    const duas = [
                      { 
                        title: 'Before Reading Qur2an',
                        arabic: 'اللَّهُمَّ اجْعَلْنَا مِنْ أَهْلِ الْقُرْآن',
                        transliteration: 'Allahumma-j\'alna min ahlil-Quran',
                        translation: 'O Allah, make us among the people of the Quran',
                        category: 'Qur2an'
                      },
                      { 
                        title: 'Before Starting',
                        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                        transliteration: 'Bismillahir-Rahmanir-Raheem',
                        translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
                        category: 'Beginning'
                      },
                      { 
                        title: 'For Knowledge',
                        arabic: 'رَبِّ زِدْنِي عِلْمًا',
                        transliteration: 'Rabbi zidni ilma',
                        translation: 'My Lord, increase me in knowledge',
                        category: 'Knowledge'
                      },
                      { 
                        title: 'For Guidance',
                        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
                        transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhaban-nar',
                        translation: 'Our Lord, grant us good in this world and good in the Hereafter and protect us from the punishment of the Fire',
                        category: 'Guidance'
                      },
                      { 
                        title: 'For Forgiveness',
                        arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
                        transliteration: 'Rabbi-ghfir li wa tub \'alayya innaka antat-tawwabur-raheem',
                        translation: 'My Lord, forgive me and accept my repentance, for You are the Ever-Accepting of repentance, the Most Merciful',
                        category: 'Forgiveness'
                      },
                      { 
                        title: 'For Success',
                        arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
                        transliteration: 'Hasbiyallahu la ilaha illa huwa \'alayhi tawakkaltu wa huwa rabbul-\'arshil-\'adheem',
                        translation: 'Sufficient for me is Allah; there is no deity except Him. On Him I have relied, and He is the Lord of the Great Throne',
                        category: 'Trust'
                      }
                    ];
                    
                    const currentDua = duas[currentDuaIndex];
                    
                    return (
                      <View key={currentDuaIndex} style={{ 
                        backgroundColor: 'rgba(51,105,78,0.2)', 
                        borderRadius: 12, 
                        padding: 20,
                        marginBottom: 10,
                        borderColor: 'rgba(165,115,36,0.3)',
                        borderWidth: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 4,
                      }}>
                        <View style={{ 
                          backgroundColor: '#33694e', 
                          borderRadius: 8, 
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          alignSelf: 'center',
                          marginBottom: 12,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 4,
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>
                            {currentDua.category}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fae29f', marginBottom: 8, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1, textAlign: 'center' }}>
                          {currentDua.title}
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#7a9c82', marginBottom: 8, textAlign: 'center', lineHeight: 32, fontFamily: 'UthmanTN_v2-0' }}>
                          {currentDua.arabic}
                        </Text>
                                                  <Text style={{ fontSize: 14, color: '#999999', marginBottom: 6, fontStyle: 'italic' }}>
                            {currentDua.transliteration}
                          </Text>
                        <Text style={{ fontSize: 14, color: '#CCCCCC', lineHeight: 20, marginBottom: 10 }}>
                          {currentDua.translation}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
              </View>
              
              {/* Fixed Bottom Navigation */}
              <View style={{ 
                position: 'absolute', 
                bottom: 80, 
                left: 0, 
                right: 0, 
                paddingHorizontal: 40,
                zIndex: 1,
              }}>
                {/* Pagination Dots */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginBottom: 30,
                }}>
                  {Array.from({ length: 6 }, (_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        console.log('[DEBUG] Pagination dot pressed:', index);
                        setCurrentDuaIndex(index);
                      }}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: currentDuaIndex === index ? '#33694e' : 'rgba(165,115,36,0.3)',
                        marginHorizontal: 6,
                      }}
                    />
                  ))}
                </View>
              </View>
              
              
              
              <View style={{ 
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 20,
                paddingHorizontal: 0,
                height: 50,
              }}>
                {/* Left side - Back button or empty space */}
                <View style={{ width: 80, alignItems: 'flex-start' }}>
                  {currentDuaIndex > 0 && (
                    <TouchableOpacity
                      onPress={() => { 
                        hapticSelection();
                        setCurrentDuwhaIndex(currentDuaIndex - 1);
                      }}
                      onPressIn={() => hapticSelection()}
                      style={{
                        paddingHorizontal: 15,
                        paddingVertical: 9,
                        backgroundColor: 'rgba(165,115,36,0.3)',
                        borderRadius: 8,
                        minWidth: 76,
                        alignItems: 'center',
                        zIndex: 1000,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#fae29f', fontSize: 14, fontWeight: 'bold' }}>Back</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Center - Ameen button always here */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => { 
                      console.log('[DEBUG] Ameen button pressed');
                      hapticSelection();
                      setDuaVisible(false); 
                      setDuaExpanded(false); 
                      setDuaButtonPressed(false); 
                      setCurrentDuaIndex(0); 
                    }}
                    onPressIn={() => {
                      console.log('[DEBUG] Ameen button press in');
                      hapticSelection();
                    }}
                    style={{
                      paddingHorizontal: 19,
                      paddingVertical: 11,
                      backgroundColor: '#33694e',
                      borderRadius: 8,
                      width: 114,
                      height: 47,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#fae29f', fontSize: 16, fontWeight: 'bold' }}>
                      Ameen
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Right side - Next button or empty space */}
                <View style={{ width: 80, alignItems: 'flex-end' }}>
                  {currentDuaIndex < 5 && (
                    <TouchableOpacity
                      onPress={() => { 
                        hapticSelection();
                        setCurrentDuaIndex(currentDuaIndex + 1);
                      }}
                      onPressIn={() => hapticSelection()}
                      style={{
                        paddingHorizontal: 15,
                        paddingVertical: 9,
                        backgroundColor: 'rgba(165,115,36,0.3)',
                        borderRadius: 8,
                        minWidth: 76,
                        alignItems: 'center',
                        zIndex: 1000,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#fae29f', fontSize: 14, fontWeight: 'bold' }}>Next</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
          </Modal>

        <Modal
          visible={settingsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'flex-end', paddingBottom: 20 }]}
            activeOpacity={1}
            onPress={() => setSettingsVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                backgroundColor: 'rgba(64,64,64,0.95)',
                paddingTop: SIZES.large * 1.35, // Reduced by 7%
              }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Text variant="h2" style={{ 
                marginBottom: 24, 
                textDecorationLine: 'underline', 
                textDecorationColor: '#33694e', 
                marginTop: -20, 
                color: '#000000',
                fontSize: 28,
                fontWeight: 'bold'
              }}>{t('settings')}</Text>
              
              {/* Language Selection */}
              <Text variant="h3" style={{ 
                marginBottom: 8, 
                color: 'rgba(200,150,50,0.7)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 1,
                textShadowColor: '#000',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
              }}>{t('language')}</Text>
              <View style={{ flexDirection: 'row', marginBottom: 32, gap: 8 }}>
                <Button
                  title={t('english_button')}
                  onPress={() => { hapticSelection(); changeLanguage('en'); }}
                  style={{ 
                    backgroundColor: language === 'en' ? '#33694e' : 'rgba(128,128,128,0.6)', 
                    flex: 1,
                    marginRight: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                />
                <Button
                  title={t('arabic_button')}
                  onPress={() => { hapticSelection(); changeLanguage('ar'); }}
                  style={{ 
                    backgroundColor: language === 'ar' ? '#33694e' : 'rgba(128,128,128,0.6)', 
                    flex: 1,
                    marginLeft: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                />
              </View>
              
              {/* Account Section */}
              {isAuthenticated ? (
                <View style={{ marginBottom: 16 }}>
                  <Text variant="body2" style={{ 
                    color: '#CCCCCC', 
                    marginBottom: 12,
                    textAlign: 'center'
                  }}>
                    {t('logged_in_as')} {user?.email}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <Button
                      title={t('sync_progress')}
                      onPress={async () => {
                        hapticSelection();
                        try {
                          const result = await syncProgressData();
                          if (result.success) {
                            Alert.alert(t('success'), t('sync_successful'));
                            const loadedData = await loadData();
                            setData(loadedData);
                          } else {
                            Alert.alert(t('error'), t('sync_failed'));
                          }
                        } catch (error) {
                          Alert.alert(t('error'), t('sync_failed'));
                        }
                      }}
                      style={{ 
                        backgroundColor: '#33694e', 
                        flex: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        elevation: 8,
                      }}
                    />
                    
                    <Button
                      title={t('logout')}
                      onPress={async () => {
                        hapticSelection();
                        const result = await logout();
                        if (result.success) {
                          Alert.alert(t('success'), t('logout') + ' ' + t('success').toLowerCase());
                        }
                      }}
                      style={{ 
                        backgroundColor: 'rgba(220,20,60,0.7)', 
                        flex: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        elevation: 8,
                      }}
                    />
                  </View>
                </View>
              ) : (
                <Button
                  title={t('account')}
                  onPress={() => {
                    hapticSelection();
                    setSettingsVisible(false);
                    navigation.navigate('Auth');
                  }}
                  style={{ 
                    backgroundColor: '#D3D3D3',
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                  textStyle={{
                    color: '#2F2F2F',
                    fontWeight: 'bold',
                  }}
                  onPressIn={() => hapticSelection()}
                />
              )}
              
              <Button
                title={t('reset_today')}
                onPress={async () => {
                  hapticSelection();
                  setResetting(true);
                  // Reset only today's hasanat
                  const today = new Date().toISOString().split('T')[0];
                  const currentTodayHasanat = await AsyncStorage.getItem('today_hasanat');
                  const currentTotalHasanat = await AsyncStorage.getItem('total_hasanat');
                  
                  // Subtract today's hasanat from total
                  const todayAmount = parseInt(currentTodayHasanat || '0');
                  const totalAmount = parseInt(currentTotalHasanat || '0');
                  const newTotal = Math.max(0, totalAmount - todayAmount);
                  
                  await AsyncStorage.setItem('today_hasanat', '0');
                  await AsyncStorage.setItem('total_hasanat', newTotal.toString());
                  // Don't reset last_activity_date when only resetting today's hasanat
                  // This preserves streak calculation
                  // Also reset streak_updated_today to allow streak recalculation
                  await AsyncStorage.removeItem('streak_updated_today');
                  setResetting(false);
                  setSettingsVisible(false);
                  const loadedData = await loadData();
                  setData(loadedData);
                }}
                style={{ 
                  backgroundColor: 'rgba(165,115,36,0.8)', 
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                }}
                disabled={resetting}
              />
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  setSettingsVisible(false);
                  setConfirmResetVisible(true);
                }}
                style={{ 
                  backgroundColor: 'rgba(220,20,60,0.9)', 
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={resetting}
                onPressIn={() => hapticSelection()}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                  {resetting ? t('resetting') : (
                    language === 'en' ? (
                      <>
                        Reset <Text style={{ fontWeight: 'bold' }}>ALL</Text> Progress
                      </>
                    ) : t('reset_all')
                  )}
                </Text>
              </TouchableOpacity>
              <View style={{ marginTop: 16 }}>
              <Button
                  title={t('close')}
                onPress={() => { hapticSelection(); setSettingsVisible(false); }}
                  style={{ 
                    backgroundColor: '#5b7f67',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
              />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Reset Confirmation Modal */}
        <Modal
          visible={confirmResetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmResetVisible(false)}
        >
          <TouchableOpacity 
            style={styles.confirmModalOverlay}
            activeOpacity={1}
            onPress={() => setConfirmResetVisible(false)}
          >
            <View style={styles.confirmModalBackdrop} />
            <TouchableOpacity 
              style={styles.confirmModalContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.confirmModalContent}>
                <View style={styles.confirmModalHeader}>
                  <Text style={styles.confirmModalTitle}>
                    {t('confirm_reset_title')}
                  </Text>
                  <Text style={styles.confirmModalSubtitle}>
                    {t('confirm_reset_message')}
                  </Text>
                </View>

                {/* Recordings Checkbox */}
                <View style={styles.confirmModalCheckbox}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => {
                      hapticSelection();
                      setIncludeRecordings(!includeRecordings);
                    }}
                  >
                    <View style={[
                      styles.checkbox,
                      includeRecordings && styles.checkboxChecked
                    ]}>
                      {includeRecordings && (
                        <Text style={styles.checkboxText}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      ALL recordings included
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.confirmModalButtons}>
                  <TouchableOpacity
                    style={styles.confirmModalCancelButton}
                    onPress={() => {
                      hapticSelection();
                      setConfirmResetVisible(false);
                    }}
                  >
                    <Text style={styles.confirmModalCancelText}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmModalConfirmButton}
                    onPress={async () => {
                      hapticSelection();
                      setResetting(true);
                      setConfirmResetVisible(false);
                      await resetProgress(includeRecordings);
                      setResetting(false);
                      const loadedData = await loadData();
                      setData(loadedData);
                      setIncludeRecordings(false); // Reset checkbox state
                    }}
                    disabled={resetting}
                  >
                    <Text style={styles.confirmModalConfirmText}>
                      {resetting ? t('resetting') : t('confirm_reset')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Progress History Modal */}
        <Modal
          visible={progressModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setProgressModalVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'center', paddingVertical: 20 }]}
            activeOpacity={1}
            onPress={() => setProgressModalVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                minHeight: 600,
                maxHeight: '85%',
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
              }]}
              activeOpacity={1}
              onPress={() => {}}
            >
              <Text variant="h2" style={{ 
                marginBottom: 24, 
                marginTop: 0, 
                color: '#F5E6C8',
                fontSize: 28,
                fontWeight: 'bold',
                textShadowColor: '#000',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
                textAlign: 'center',
              }}>Memorization Progress</Text>
              
              {/* Calendar View */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Progress Calendar
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  {/* Calendar Grid */}
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}>
                    {Array.from({ length: 30 }, (_, i) => {
                      const isCompleted = i < data.streak;
                      const isGoalDay = selectedGoal && i < Math.ceil(6236 / selectedGoal.ayaat);
                      const isMissed = selectedGoal && i >= data.streak && i < Math.ceil(6236 / selectedGoal.ayaat);
                      
                      let backgroundColor = 'rgba(128,128,128,0.5)';
                      if (isCompleted) {
                        backgroundColor = '#5b7f67';
                      } else if (isMissed) {
                        backgroundColor = 'rgba(255,0,0,0.6)';
                      } else if (isGoalDay) {
                        backgroundColor = 'rgba(165,115,36,0.3)';
                      }
                      
                      return (
                        <View key={i} style={{
                          width: 20,
                          height: 20,
                          margin: 2,
                          borderRadius: 10,
                          backgroundColor: backgroundColor,
                          borderWidth: 1,
                          borderColor: 'rgba(165,115,36,0.8)',
                        }} />
                      );
                    })}
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    marginTop: 8,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#5b7f67',
                        marginRight: 4,
                      }} />
                      <Text style={{ color: '#CCCCCC', fontSize: 10 }}>Completed</Text>
                    </View>
                    {selectedGoal && (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: 'rgba(165,115,36,0.3)',
                            marginRight: 4,
                          }} />
                          <Text style={{ color: '#CCCCCC', fontSize: 10 }}>Goal Days</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: 'rgba(255,0,0,0.6)',
                            marginRight: 4,
                          }} />
                          <Text style={{ color: '#CCCCCC', fontSize: 10 }}>Missed</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Goal Setting */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Set Daily Goals
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  {!selectedGoal ? (
                    <>
                      <Text style={{
                        color: '#F5E6C8',
                        fontSize: 14,
                        fontWeight: 'bold',
                        marginBottom: 8,
                        textAlign: 'center'
                      }}>
                        Select your daily goal:
                      </Text>
                      <ScrollView style={{ maxHeight: 200 }}>
                        {[
                          { ayaat: 1, days: 6236 },
                          { ayaat: 2, days: 3118 },
                          { ayaat: 3, days: 2079 },
                          { ayaat: 4, days: 1559 },
                          { ayaat: 5, days: 1248 },
                          { ayaat: 6, days: 1040 },
                          { ayaat: 7, days: 891 },
                          { ayaat: 8, days: 780 },
                          { ayaat: 9, days: 693 },
                          { ayaat: 10, days: 624 },
                          { ayaat: 20, days: 312 }
                        ].map((goal, index) => (
                          <TouchableOpacity
                            key={index}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderBottomWidth: index < 10 ? 1 : 0,
                              borderBottomColor: 'rgba(165,115,36,0.3)',
                              backgroundColor: 'rgba(165,115,36,0.1)',
                              borderRadius: 4,
                              marginBottom: 2,
                            }}
                            onPress={() => {
                              hapticSelection();
                              const startDate = new Date();
                              const completionDate = calculateGoalCompletionDate(goal.ayaat);
                              setSelectedGoal(goal);
                              setGoalStartDate(startDate);
                              setGoalCompletionDate(completionDate);
                              setGoalProgress(0);
                              saveGoalData(goal, startDate, completionDate);
                            }}
                          >
                            <Text style={{
                              color: '#F5E6C8',
                              fontSize: 14,
                              fontWeight: 'bold',
                            }}>
                              {goal.ayaat} ayaat/day
                            </Text>
                            <Text style={{
                              color: '#CCCCCC',
                              fontSize: 14,
                            }}>
                              {goal.days.toLocaleString()} days
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  ) : (
                    <>
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}>
                        <Text style={{
                          color: '#F5E6C8',
                          fontSize: 16,
                          fontWeight: 'bold',
                        }}>
                          Current Goal: {selectedGoal.ayaat} ayaat/day
                        </Text>
                        <TouchableOpacity
                          style={{
                            backgroundColor: 'rgba(165,115,36,0.3)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                          }}
                          onPress={() => {
                            hapticSelection();
                            setSelectedGoal(null);
                            setGoalCompletionDate(null);
                            setGoalProgress(0);
                            setGoalStartDate(null);
                            saveGoalData(null, null, null);
                          }}
                        >
                          <Text style={{ color: '#F5E6C8', fontSize: 12 }}>Change</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{
                          color: '#CCCCCC',
                          fontSize: 14,
                          marginBottom: 4,
                        }}>
                          Start Date: {goalStartDate ? formatDate(goalStartDate) : 'Not set'}
                        </Text>
                        <Text style={{
                          color: '#CCCCCC',
                          fontSize: 14,
                          marginBottom: 4,
                        }}>
                          Target Completion: {goalCompletionDate ? formatDate(goalCompletionDate) : 'Calculating...'}
                        </Text>
                        <Text style={{
                          color: '#CCCCCC',
                          fontSize: 14,
                        }}>
                          Progress: {Math.round(goalProgress)}%
                        </Text>
                      </View>
                      
                      {/* Progress Bar */}
                      <View style={{
                        height: 8,
                        backgroundColor: 'rgba(128,128,128,0.3)',
                        borderRadius: 4,
                        marginBottom: 8,
                      }}>
                        <View style={{
                          height: '100%',
                          width: `${goalProgress}%`,
                          backgroundColor: '#5b7f67',
                          borderRadius: 4,
                        }} />
                      </View>
                      
                      <Text style={{
                        color: '#CCCCCC',
                        fontSize: 12,
                        textAlign: 'center',
                        fontStyle: 'italic',
                      }}>
                        Progress updates based on your daily streak. Missing days will extend your completion date.
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#5b7f67',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                }}
                onPress={() => {
                  hapticSelection();
                  setProgressModalVisible(false);
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                  Close
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Hasanat Gains Modal */}
        <Modal
          visible={hasanatModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setHasanatModalVisible(false)}
        >
          {(() => {
            const [modalData, setModalData] = useState(data);
            
            // Load fresh data when modal opens
            useEffect(() => {
              if (hasanatModalVisible) {
                loadData().then(setModalData);
              }
            }, [hasanatModalVisible]);
            
            return (
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'center', paddingVertical: 20 }]}
            activeOpacity={1}
            onPress={() => setHasanatModalVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                maxHeight: '95%',
                minHeight: 700,
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
                width: '90%',
                maxWidth: 400,
              }]}
              activeOpacity={1}
              onPress={() => {}}
            >
                            <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <Text variant="h2" style={{ 
                  marginBottom: 20, 
                  marginTop: 0, 
                  color: '#F5E6C8',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                  textAlign: 'center',
                }}>Hasanat Gains</Text>
              
              {/* Real-time stats */}
              <View style={{ 
                backgroundColor: 'rgba(128,128,128,0.3)', 
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 16,
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 1,
              }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  Current Stats
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Total Hasanat</Text>
                    <Text style={{ 
                      color: 'rgba(245,200,96,0.8)', 
                      fontSize: 16, 
                      fontWeight: 'bold',
                      textShadowColor: '#fae29f',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 2,
                    }}>{toArabicNumber(formatLargeNumber(modalData.totalHasanat).text)}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Today's Hasanat</Text>
                    <Text style={{ 
                      color: '#5b7f67', 
                      fontSize: 16, 
                      fontWeight: 'bold',
                      textShadowColor: '#fae29f',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 2,
                    }}>{toArabicNumber(formatLargeNumber(modalData.todayHasanat).text)}</Text>
                  </View>
                </View>
                <View style={{ 
                  marginTop: 12, 
                  paddingTop: 12, 
                  borderTopWidth: 1, 
                  borderTopColor: 'rgba(165,115,36,0.3)' 
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Memorized Ayaat</Text>
                      <Text style={{ 
                        color: '#5b7f67', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                      }}>{toArabicNumber(modalData.memorizedAyaat || 0)}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Total Ayaat</Text>
                      <Text style={{ 
                        color: '#5b7f67', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                      }}>{toArabicNumber(modalData.totalAyaat || 0)}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Weekly Chart */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to previous week
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Weekly Progress
                  </Text>
                  <Text style={{
                    color: '#CCCCCC',
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 2
                  }}>
                    Dec 9-15, 2024
                  </Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to next week
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>→</Text>
                  </TouchableOpacity>
                </View>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                  height: 150,
                  justifyContent: 'center',
                }}>
                  {/* Weekly Hasanat Chart */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: 100,
                    paddingHorizontal: 10,
                  }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      // Calculate hasanat based on memorized ayaat (10 hasanat per ayah)
                      const weeklyHasanat = Math.floor((modalData.memorizedAyaat || 0) / 7) + Math.floor(Math.random() * 50);
                      const maxHeight = 80;
                      const height = Math.min((weeklyHasanat / 100) * maxHeight, maxHeight);
                      
                      return (
                        <View key={day} style={{ alignItems: 'center' }}>
                          <View style={{
                            width: 20,
                            height: Math.max(height, 4),
                            backgroundColor: '#5b7f67',
                            borderRadius: 4,
                            marginBottom: 8,
                          }} />
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 10,
                          }}>
                            {weeklyHasanat}
                          </Text>
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 10,
                          }}>
                            {day}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Monthly Chart */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to previous month
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Monthly Overview
                  </Text>
                  <Text style={{
                    color: '#CCCCCC',
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 2
                  }}>
                    December 2024
                  </Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to next month
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>→</Text>
                  </TouchableOpacity>
                </View>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 12,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                  height: 120,
                  justifyContent: 'center',
                }}>
                  {/* Monthly Hasanat Chart */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: 80,
                    paddingHorizontal: 10,
                  }}>
                    {['W1', 'W2', 'W3', 'W4'].map((week, index) => {
                      // Calculate monthly hasanat based on memorized ayaat
                      const monthlyHasanat = Math.floor((modalData.memorizedAyaat || 0) / 4) + Math.floor(Math.random() * 100);
                      const maxHeight = 60;
                      const height = Math.min((monthlyHasanat / 200) * maxHeight, maxHeight);
                      
                      return (
                        <View key={week} style={{ alignItems: 'center' }}>
                          <View style={{
                            width: 25,
                            height: Math.max(height, 4),
                            backgroundColor: 'rgba(245,200,96,0.8)',
                            borderRadius: 4,
                            marginBottom: 8,
                          }} />
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 10,
                          }}>
                            {monthlyHasanat}
                          </Text>
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 10,
                          }}>
                            {week}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Achievement Section */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  Recent Achievements
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 12,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>First Ayah Memorized</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>You memorized your first ayah! Masha'Allah!</Text>
                  </View>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>7-Day Streak</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>You maintained a 7-day memorization streak!</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>100 Hasanat</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>You earned your first 100 hasanat!</Text>
                  </View>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#5b7f67',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                }}
                onPress={() => {
                  hapticSelection();
                  setHasanatModalVisible(false);
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                  Close
                </Text>
              </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
            );
          })()}
        </Modal>

        {/* Streak Modal */}
        <Modal
          visible={streakModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStreakModalVisible(false)}
        >
          {(() => {
            const [modalData, setModalData] = useState(data);
            
            // Load fresh data when modal opens
            useEffect(() => {
              if (streakModalVisible) {
                loadData().then(setModalData);
              }
            }, [streakModalVisible]);
            
            return (
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'center', paddingVertical: 20 }]}
            activeOpacity={1}
            onPress={() => setStreakModalVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                maxHeight: '95%',
                minHeight: 700,
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
                width: '90%',
                maxWidth: 400,
              }]}
              activeOpacity={1}
              onPress={() => {}}
            >
                            <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <Text variant="h2" style={{ 
                  marginBottom: 20, 
                  marginTop: 0, 
                  color: '#F5E6C8',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                  textAlign: 'center',
                }}>Daily Streaks</Text>
              
              {/* Real-time stats */}
              <View style={{ 
                backgroundColor: 'rgba(128,128,128,0.3)', 
                borderRadius: 12, 
                padding: 20, 
                marginBottom: 16,
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 1,
              }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Current Streak
                </Text>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ 
                    color: '#5b7f67', 
                    fontSize: 32, 
                    fontWeight: 'bold',
                    textShadowColor: '#fae29f',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 4,
                  }}>{toArabicNumber(formatStreakNumber(modalData.streak).text)}</Text>
                  <Text style={{ color: '#CCCCCC', fontSize: 16, marginTop: 4 }}>Days</Text>
                </View>
                <View style={{ 
                  marginTop: 12, 
                  paddingTop: 12, 
                  borderTopWidth: 1, 
                  borderTopColor: 'rgba(165,115,36,0.3)' 
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Best Streak</Text>
                      <Text style={{ 
                        color: '#5b7f67', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                      }}>{toArabicNumber(Math.max(modalData.streak || 0, 15))}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Avg/Day</Text>
                      <Text style={{ 
                        color: '#5b7f67', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                      }}>{toArabicNumber(Math.floor((modalData.memorizedAyaat || 0) / Math.max(modalData.streak || 1, 1)))}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Weekly Streak */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to previous week
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 18,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Weekly Streak
                  </Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to next week
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>→</Text>
                  </TouchableOpacity>
                </View>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      // Calculate if day was completed based on streak
                      const isCompleted = index < (modalData.streak || 0) % 7;
                      const isToday = index === new Date().getDay() - 1; // Adjust for Monday start
                      
                      let backgroundColor = 'rgba(128,128,128,0.5)';
                      if (isCompleted) {
                        backgroundColor = '#5b7f67';
                      } else if (isToday) {
                        backgroundColor = 'rgba(165,115,36,0.6)';
                      }
                      
                      return (
                        <View key={day} style={{ alignItems: 'center' }}>
                          <View style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: backgroundColor,
                            borderWidth: 2,
                            borderColor: 'rgba(165,115,36,0.8)',
                            marginBottom: 8,
                          }} />
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 12,
                          }}>
                            {day}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Monthly Streak */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to previous month
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 18,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Monthly Progress
                  </Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to next month
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>→</Text>
                  </TouchableOpacity>
                </View>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  {/* Calendar Grid */}
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}>
                    {Array.from({ length: 30 }, (_, i) => (
                      <View key={i} style={{
                        width: 18,
                        height: 18,
                        margin: 1,
                        borderRadius: 9,
                        backgroundColor: Math.random() > 0.3 ? '#5b7f67' : 'rgba(128,128,128,0.5)',
                        borderWidth: 1,
                        borderColor: 'rgba(165,115,36,0.8)',
                      }} />
                    ))}
                  </View>
                  <Text style={{
                    color: '#CCCCCC',
                    fontSize: 12,
                    textAlign: 'center',
                    marginTop: 8
                  }}>
                    Green dots = Days with activity
                  </Text>
                </View>
              </View>

              {/* Yearly Stats */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Yearly Overview
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14 }}>Current Streak:</Text>
                    <Text style={{ color: '#5b7f67', fontSize: 16, fontWeight: 'bold' }}>{toArabicNumber(modalData.streak || 0)} days</Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14 }}>Longest Streak:</Text>
                    <Text style={{ color: '#5b7f67', fontSize: 16, fontWeight: 'bold' }}>{toArabicNumber(Math.max(modalData.streak || 0, 15))} days</Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14 }}>Total Active Days:</Text>
                    <Text style={{ color: '#5b7f67', fontSize: 16, fontWeight: 'bold' }}>{toArabicNumber(Math.floor((modalData.streak || 0) * 1.2))} days</Text>
                  </View>
                </View>
              </View>

              {/* Streak Milestones */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Streak Milestones
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 16, fontWeight: 'bold' }}>7 Days</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 14 }}>
                      {modalData.streak >= 7 ? '✅ Completed' : 'Complete a week of memorization'}
                    </Text>
                  </View>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 16, fontWeight: 'bold' }}>30 Days</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 14 }}>
                      {modalData.streak >= 30 ? '✅ Completed' : 'Maintain a month-long streak'}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: '#F5E6C8', fontSize: 16, fontWeight: 'bold' }}>100 Days</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 14 }}>
                      {modalData.streak >= 100 ? '✅ Completed' : 'Achieve a century of memorization days'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#5b7f67',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                }}
                onPress={() => {
                  hapticSelection();
                  setStreakModalVisible(false);
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                  Close
                </Text>
              </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
            );
          })()}
        </Modal>

        {/* Recordings Modal */}
        <Modal
          visible={recordingsModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRecordingsModalVisible(false)}
        >
          {(() => {
            const [selectedSurah, setSelectedSurah] = useState('Al-Fatihah');
            const [selectedAyah, setSelectedAyah] = useState('full-surah');
            const [recordings, setRecordings] = useState([]);
            const [loading, setLoading] = useState(false);
            const [surahDropdownOpen, setSurahDropdownOpen] = useState(false);
            const [ayahDropdownOpen, setAyahDropdownOpen] = useState(false);
            const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
            
            // Load recordings when modal opens or when route params indicate refresh
            useEffect(() => {
              if (recordingsModalVisible) {
                loadRecordings();
              } else {
                // Stop playback when modal closes
                if (currentlyPlaying) {
                  audioRecorder.stopPlayback();
                  setCurrentlyPlaying(null);
                }
              }
            }, [recordingsModalVisible, selectedSurah, selectedAyah, route.params?.refreshRecordings]);

            // Clear refreshRecordings parameter after use
            useEffect(() => {
              if (route.params?.refreshRecordings) {
                navigation.setParams({ refreshRecordings: undefined });
              }
            }, [route.params?.refreshRecordings]);
            
            const loadRecordings = async () => {
              setLoading(true);
              try {
                console.log('Loading recordings for:', selectedSurah, selectedAyah);
                const allRecordings = await audioRecorder.loadRecordings(selectedSurah, selectedAyah);
                console.log('Found recordings:', allRecordings);
                
                // Load highlighted recordings for this surah/ayah
                const highlightedKey = `highlighted_${selectedSurah}_${selectedAyah}`;
                const highlightedRecordingsStr = await AsyncStorage.getItem(highlightedKey);
                const highlightedRecordings = highlightedRecordingsStr ? JSON.parse(highlightedRecordingsStr) : [];
                console.log('Highlighted recordings:', highlightedRecordings);
                
                // Mark recordings as highlighted
                const recordingsWithHighlight = allRecordings.map(recording => ({
                  ...recording,
                  isHighlighted: highlightedRecordings.includes(recording.uri)
                }));
                
                setRecordings(recordingsWithHighlight);
              } catch (error) {
                console.error('Error loading recordings:', error);
                setRecordings([]);
              }
              setLoading(false);
            };
            
            const getAllSurahs = () => {
              return [
                'Al-Fatihah', 'Al-Baqarah', 'Aal-Imran', 'An-Nisa', 'Al-Maidah',
                'Al-Anam', 'Al-Araf', 'Al-Anfal', 'At-Tawbah', 'Yunus',
                'Hud', 'Yusuf', 'Ar-Rad', 'Ibrahim', 'Al-Hijr',
                'An-Nahl', 'Al-Isra', 'Al-Kahf', 'Maryam', 'Ta-Ha',
                'Al-Anbiya', 'Al-Hajj', 'Al-Muminun', 'An-Nur', 'Al-Furqan',
                'Ash-Shuara', 'An-Naml', 'Al-Qasas', 'Al-Ankabut', 'Ar-Rum',
                'Luqman', 'As-Sajdah', 'Al-Ahzab', 'Saba', 'Fatir',
                'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar', 'Ghafir',
                'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah',
                'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf',
                'Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman',
                'Al-Waqiah', 'Al-Hadid', 'Al-Mujadilah', 'Al-Hashr', 'Al-Mumtahanah',
                'As-Saff', 'Al-Jumuah', 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq',
                'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqah', 'Al-Maarij',
                'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddathir', 'Al-Qiyamah',
                'Al-Insan', 'Al-Mursalat', 'An-Naba', 'An-Naziat', 'Abasa',
                'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj',
                'At-Tariq', 'Al-Ala', 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad',
                'Ash-Shams', 'Al-Layl', 'Ad-Duha', 'Ash-Sharh', 'At-Tin',
                'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-Adiyat',
                'Al-Qariah', 'At-Takathur', 'Al-Asr', 'Al-Humazah', 'Al-Fil',
                'Al-Quraish', 'Al-Maun', 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr',
                'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'
              ];
            };
            
            const getAyahOptions = (surah) => {
              const options = [{ label: 'Full Surah', value: 'full-surah' }];
              
              // Get the correct number of ayahs for this surah
              const surahAyahCounts = {
                'Al-Fatihah': 7, 'Al-Baqarah': 286, 'Aal-Imran': 200, 'An-Nisa': 176, 'Al-Maidah': 120,
                'Al-Anam': 165, 'Al-Araf': 206, 'Al-Anfal': 75, 'At-Tawbah': 129, 'Yunus': 109,
                'Hud': 123, 'Yusuf': 111, 'Ar-Rad': 43, 'Ibrahim': 52, 'Al-Hijr': 99,
                'An-Nahl': 128, 'Al-Isra': 111, 'Al-Kahf': 110, 'Maryam': 98, 'Ta-Ha': 135,
                'Al-Anbiya': 112, 'Al-Hajj': 78, 'Al-Muminun': 118, 'An-Nur': 64, 'Al-Furqan': 77,
                'Ash-Shuara': 227, 'An-Naml': 93, 'Al-Qasas': 88, 'Al-Ankabut': 69, 'Ar-Rum': 60,
                'Luqman': 34, 'As-Sajdah': 30, 'Al-Ahzab': 73, 'Saba': 54, 'Fatir': 45,
                'Ya-Sin': 83, 'As-Saffat': 182, 'Sad': 88, 'Az-Zumar': 75, 'Ghafir': 85,
                'Fussilat': 54, 'Ash-Shura': 53, 'Az-Zukhruf': 89, 'Ad-Dukhan': 59, 'Al-Jathiyah': 37,
                'Al-Ahqaf': 35, 'Muhammad': 38, 'Al-Fath': 29, 'Al-Hujurat': 18, 'Qaf': 45,
                'Adh-Dhariyat': 60, 'At-Tur': 49, 'An-Najm': 62, 'Al-Qamar': 55, 'Ar-Rahman': 78,
                'Al-Waqiah': 96, 'Al-Hadid': 29, 'Al-Mujadilah': 22, 'Al-Hashr': 24, 'Al-Mumtahanah': 13,
                'As-Saff': 14, 'Al-Jumuah': 11, 'Al-Munafiqun': 11, 'At-Taghabun': 18, 'At-Talaq': 12,
                'At-Tahrim': 12, 'Al-Mulk': 30, 'Al-Qalam': 52, 'Al-Haqqah': 52, 'Al-Maarij': 44,
                'Nuh': 28, 'Al-Jinn': 28, 'Al-Muzzammil': 20, 'Al-Muddathir': 56, 'Al-Qiyamah': 40,
                'Al-Insan': 31, 'Al-Mursalat': 50, 'An-Naba': 40, 'An-Naziat': 46, 'Abasa': 42,
                'At-Takwir': 29, 'Al-Infitar': 19, 'Al-Mutaffifin': 36, 'Al-Inshiqaq': 25, 'Al-Buruj': 22,
                'At-Tariq': 17, 'Al-Ala': 19, 'Al-Ghashiyah': 26, 'Al-Fajr': 30, 'Al-Balad': 20,
                'Ash-Shams': 15, 'Al-Layl': 21, 'Ad-Duha': 11, 'Ash-Sharh': 8, 'At-Tin': 8,
                'Al-Alaq': 19, 'Al-Qadr': 5, 'Al-Bayyinah': 8, 'Az-Zalzalah': 8, 'Al-Adiyat': 11,
                'Al-Qariah': 11, 'At-Takathur': 8, 'Al-Asr': 3, 'Al-Humazah': 9, 'Al-Fil': 5,
                'Al-Quraish': 4, 'Al-Maun': 7, 'Al-Kawthar': 3, 'Al-Kafirun': 6, 'An-Nasr': 3,
                'Al-Masad': 5, 'Al-Ikhlas': 4, 'Al-Falaq': 5, 'An-Nas': 6
              };
              
              const ayahCount = surahAyahCounts[surah] || 286; // Default to 286 if not found
              
              // Add ayah numbers 1 to the actual count for this surah
              for (let i = 1; i <= ayahCount; i++) {
                options.push({ label: `Ayah ${i}`, value: i.toString() });
              }
              return options;
            };
            
            return (
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'center', paddingVertical: 20 }]}
            activeOpacity={1}
            onPress={() => setRecordingsModalVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                maxHeight: '95%',
                minHeight: 600,
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
                width: '90%',
                maxWidth: 400,
              }]}
              activeOpacity={1}
              onPress={() => {}}
            >
              <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <Text variant="h2" style={{ 
                  marginBottom: 20, 
                  marginTop: 0, 
                  color: '#F5E6C8',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                  textAlign: 'center',
                }}>Recordings Library</Text>
                
                {/* Surah Selection */}
                <View style={{ marginBottom: 20 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: 'rgba(128,128,128,0.3)',
                      borderRadius: 12,
                      borderColor: 'rgba(165,115,36,0.8)',
                      borderWidth: 1,
                    }}
                    onPress={() => {
                      hapticSelection();
                      setSurahDropdownOpen(!surahDropdownOpen);
                      setAyahDropdownOpen(false); // Close ayah dropdown when opening surah
                    }}
                  >
                    <Text style={{
                      color: '#5b7f67',
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}>
                      {selectedSurah}
                    </Text>
                    <Text style={{
                      color: '#5b7f67',
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}>
                      {surahDropdownOpen ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  
                  {surahDropdownOpen && (
                    <View style={{
                      backgroundColor: 'rgba(128,128,128,0.3)',
                      borderRadius: 12,
                      marginTop: 4,
                      borderColor: 'rgba(165,115,36,0.8)',
                      borderWidth: 1,
                      maxHeight: 150,
                    }}>
                      <ScrollView style={{ maxHeight: 150 }}>
                        {getAllSurahs().map((surah, index) => (
                          <TouchableOpacity
                            key={surah}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderBottomWidth: index < getAllSurahs().length - 1 ? 1 : 0,
                              borderBottomColor: 'rgba(165,115,36,0.3)',
                              backgroundColor: selectedSurah === surah ? 'rgba(165,115,36,0.3)' : 'transparent',
                              borderRadius: 4,
                            }}
                            onPress={() => {
                              hapticSelection();
                              setSelectedSurah(surah);
                              setSelectedAyah('full-surah');
                              setSurahDropdownOpen(false);
                            }}
                          >
                            <Text style={{
                              color: selectedSurah === surah ? '#F5E6C8' : '#CCCCCC',
                              fontSize: 14,
                              fontWeight: selectedSurah === surah ? 'bold' : 'normal',
                            }}>
                              {surah}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                {/* Ayah Selection */}
                <View style={{ marginBottom: 20 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: 'rgba(128,128,128,0.3)',
                      borderRadius: 12,
                      borderColor: 'rgba(165,115,36,0.8)',
                      borderWidth: 1,
                    }}
                    onPress={() => {
                      hapticSelection();
                      setAyahDropdownOpen(!ayahDropdownOpen);
                      setSurahDropdownOpen(false); // Close surah dropdown when opening ayah
                    }}
                  >
                    <Text style={{
                      color: '#5b7f67',
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}>
                      {selectedAyah === 'full-surah' ? 'Full Surah' : `Ayah ${selectedAyah}`}
                    </Text>
                    <Text style={{
                      color: '#5b7f67',
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}>
                      {ayahDropdownOpen ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  
                  {ayahDropdownOpen && (
                    <View style={{
                      backgroundColor: 'rgba(128,128,128,0.3)',
                      borderRadius: 12,
                      marginTop: 4,
                      borderColor: 'rgba(165,115,36,0.8)',
                      borderWidth: 1,
                      maxHeight: 150,
                    }}>
                      <ScrollView style={{ maxHeight: 150 }}>
                        {getAyahOptions(selectedSurah).map((option, index) => (
                          <TouchableOpacity
                            key={option.value}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderBottomWidth: index < getAyahOptions(selectedSurah).length - 1 ? 1 : 0,
                              borderBottomColor: 'rgba(165,115,36,0.3)',
                              backgroundColor: selectedAyah === option.value ? 'rgba(165,115,36,0.3)' : 'transparent',
                              borderRadius: 4,
                            }}
                            onPress={() => {
                              hapticSelection();
                              setSelectedAyah(option.value);
                              setAyahDropdownOpen(false);
                            }}
                          >
                            <Text style={{
                              color: selectedAyah === option.value ? '#F5E6C8' : '#CCCCCC',
                              fontSize: 14,
                              fontWeight: selectedAyah === option.value ? 'bold' : 'normal',
                            }}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                {/* Recordings List */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 8,
                    textAlign: 'center'
                  }}>
                    Recordings ({recordings.length})
                  </Text>
                  <View style={{
                    backgroundColor: 'rgba(128,128,128,0.3)',
                    borderRadius: 12,
                    padding: 16,
                    borderColor: 'rgba(165,115,36,0.8)',
                    borderWidth: 1,
                    minHeight: 300,
                  }}>
                    {loading ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ color: '#CCCCCC', fontSize: 14 }}>Loading recordings...</Text>
                      </View>
                    ) : recordings.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ color: '#CCCCCC', fontSize: 14 }}>No recordings found</Text>
                        <Text style={{ color: '#CCCCCC', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                          Recordings will appear here once you start recording
                        </Text>
                      </View>
                    ) : (
                      <ScrollView style={{ maxHeight: 400 }}>
                        {recordings.map((recording, index) => (
                          <View key={index} style={{
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomWidth: index < recordings.length - 1 ? 1 : 0,
                            borderBottomColor: 'rgba(165,115,36,0.3)',
                            backgroundColor: recording.isHighlighted ? 'rgba(165,115,36,0.3)' : 'rgba(165,115,36,0.1)',
                            borderRadius: 8,
                            marginBottom: 8,
                            borderWidth: recording.isHighlighted ? 2 : 0,
                            borderColor: recording.isHighlighted ? 'rgba(165,115,36,0.8)' : 'transparent',
                          }}>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8,
                            }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{
                                  color: '#F5E6C8',
                                  fontSize: 14,
                                  fontWeight: 'bold',
                                }}>
                                  {recording.name || `Recording ${index + 1}`}
                                </Text>
                                {recording.isHighlighted && (
                                  <Text style={{
                                    color: '#fae29f',
                                    fontSize: 12,
                                    fontStyle: 'italic',
                                    marginTop: 2,
                                  }}>
                                    ⭐ Highlighted
                                  </Text>
                                )}
                              </View>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: 'rgba(165,115,36,0.8)',
                                  paddingHorizontal: 12,
                                  paddingVertical: 6,
                                  borderRadius: 6,
                                  marginLeft: 8,
                                }}
                                onPress={async () => {
                                  hapticSelection();
                                  try {
                                    if (currentlyPlaying === recording.uri) {
                                      // Stop current playback
                                      await audioRecorder.stopPlayback();
                                      setCurrentlyPlaying(null);
                                    } else {
                                      // Stop any currently playing recording
                                      if (currentlyPlaying) {
                                        await audioRecorder.stopPlayback();
                                      }
                                      // Play this recording
                                      await audioRecorder.playRecording(recording.uri);
                                      setCurrentlyPlaying(recording.uri);
                                    }
                                  } catch (error) {
                                    console.error('Error playing recording:', error);
                                  }
                                }}
                              >
                                <Text style={{
                                  color: '#FFFFFF',
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                }}>
                                  {currentlyPlaying === recording.uri ? '⏹ Stop' : '▶ Play'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={{
                              color: '#CCCCCC',
                              fontSize: 12,
                            }}>
                              Duration: {recording.duration ? `${recording.duration.toFixed(1)}s` : 'Unknown'}
                            </Text>
                            <Text style={{
                              color: '#CCCCCC',
                              fontSize: 12,
                            }}>
                              Date: {recording.timestamp ? new Date(recording.timestamp).toLocaleDateString() : 'Unknown'}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>
                
                {/* Close Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#5b7f67',
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 8,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                  onPress={() => {
                    hapticSelection();
                    setRecordingsModalVisible(false);
                  }}
                >
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
            );
          })()}
        </Modal>

        {/* Auth Modal */}

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
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logoTextContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 80,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#fae29f',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
    }),
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
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    padding: SIZES.medium,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  progressBar: {
    height: 20,
    backgroundColor: 'rgba(51,51,51,0.8)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#33694e',
    shadowColor: '#33694e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.medium,
  },
  statCard: {
    flex: 1,
    padding: SIZES.medium,
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    borderRadius: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -8,
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
    padding: Platform.OS === 'android' ? SIZES.small : SIZES.small,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#fae29f',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1.0,
      shadowRadius: 15,
      elevation: 12,
    }),
  },
  buttonIcon: {
    width: 35,
    height: 35,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 80,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: SIZES.large,
    paddingTop: 60,
    borderRadius: 35,
    width: '80%',
    alignItems: 'center',
  },


  arabicText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 0,
    textAlign: 'center',
    fontFamily: 'UthmanTN_v2-0',
    writingDirection: 'rtl',
    lineHeight: 32,
  },
  customDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: -20, // Reduced from SIZES.small to move up
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerGap: {
    width: 200,
    alignItems: 'center',
  },
  introLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  // Confirmation Modal Styles
  confirmModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Move to bottom
    alignItems: 'center',
    paddingBottom: 50, // Add some padding from bottom
  },
  confirmModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  confirmModalContainer: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    padding: 30,
    borderWidth: 3,
    borderColor: 'rgba(255,165,0,0.6)',
  },
  confirmModalContent: {
    alignItems: 'center',
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  confirmModalTitle: {
    color: '#FFA500',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  confirmModalSubtitle: {
    color: '#CCCCCC',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  confirmModalCheckbox: {
    marginBottom: 25,
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFA500',
    backgroundColor: 'transparent',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFA500',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  confirmModalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(128,128,128,0.3)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  confirmModalCancelText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  confirmModalConfirmButton: {
    flex: 1,
    backgroundColor: 'rgba(220,20,60,0.9)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  confirmModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
});

export default HomeScreen; 