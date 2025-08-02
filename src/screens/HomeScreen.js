import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Image, ImageBackground, Modal, TouchableOpacity, Dimensions, Alert, TextInput, Animated, ScrollView } from 'react-native';
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
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import AuthScreen from './AuthScreen';

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

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
  const [memorizeButtonHeld, setMemorizeButtonHeld] = useState(false);

    const loadScreenData = async () => {
      const loadedData = await loadData();
      setData(loadedData);
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
            <TouchableOpacity style={styles.introButton} onPress={() => setInfoVisible(true)} onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}>
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
                      ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
                      setIntroVisible(true);
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
            <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsVisible(true)} onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}>
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
                        ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
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
            marginTop: -10, // Moved up from 10 to -10
            marginBottom: 20,
            position: 'relative',
            zIndex: 1,
            height: 120 // Fixed height
          }}>
            {(() => {
              const [pressed, setPressed] = useState(false);
              const glowAnimation = useRef(new Animated.Value(0)).current;
              
              // Fire-like glow animation
              useEffect(() => {
                const animateGlow = () => {
                  Animated.sequence([
                    Animated.timing(glowAnimation, {
                      toValue: 1,
                      duration: 2000,
                      useNativeDriver: false,
                    }),
                    Animated.timing(glowAnimation, {
                      toValue: 0.2,
                      duration: 1500,
                      useNativeDriver: false,
                    })
                  ]).start(() => animateGlow());
                };
                
                animateGlow();
                
                return () => {
                  glowAnimation.stopAnimation();
                };
              }, []);
              
              return (
                <Animated.View
                  style={{
                    flex: 1,
                    marginHorizontal: SIZES.small,
                    padding: SIZES.large,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    borderRadius: SIZES.base,
                    shadowColor: '#fae29f',
                    shadowOffset: { width: 0, height: 0 },
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
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 2,
                    height: 120
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
                    ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true }); 
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
                    shadowRadius: memorizeButtonHeld ? 40 : 35,
                    shadowOpacity: memorizeButtonHeld ? 8.5 : 5.0,
                    elevation: memorizeButtonHeld ? 25 : 15,
                  }]}>
                    <Image source={require('../assets/openQuran.png')} style={[styles.buttonIcon, { width: 45, height: 45 }]} resizeMode="contain" />
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
                    shadowOpacity: pressed ? 1.0 : 0.6, 
                    shadowRadius: pressed ? 24 : 10, 
                    elevation: pressed ? 20 : 8,
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

          <Card variant="elevated" style={{
            marginBottom: isSmallScreen ? -30 : -50,
            marginTop: isSmallScreen ? 20 : (isMediumScreen ? 25 : 30), // Reduced from 40/50/60 to 20/25/30
            backgroundColor: 'rgba(128,128,128,0.3)',
            borderColor: 'rgba(165,115,36,0.8)',
            borderWidth: 1,
            padding: SIZES.medium,
            shadowColor: '#000000',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
            elevation: 8,
            height: isSmallScreen ? 140 : 160
          }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 12 }}>
                  <Text variant="h2" style={[FONTS.h2.getFont(language), { 
                    textAlign: 'center', 
                    color: '#5b7f67', 
                    fontWeight: 'bold',
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
              marginTop: 8, 
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

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: SIZES.medium,
            marginTop: isSmallScreen ? 30 : (isMediumScreen ? 35 : 60), // Reduced from 40/60/80 to 20/30/40
            position: 'relative',
            zIndex: 1
          }}>
            <Card style={{
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
              height: isSmallScreen ? 150 : 180
            }}>
                <Text variant="h3" style={{ textAlign: 'center', color: '#CCCCCC' }}>{t('hasanat_gains')}</Text>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', marginVertical: 8 }}>
                  <Text variant="h1" style={{ 
                    color: 'rgba(245,200,96,0.8)', 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    fontSize: formatLargeNumber(data.totalHasanat).fontSize,
                    textShadowColor: '#fae29f',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 2,
                  }}>{toArabicNumber(formatLargeNumber(data.totalHasanat).text)}</Text>
                </View>
                <Text variant="body2" color="textSecondary" style={{ textAlign: 'center' }}>+{toArabicNumber(formatLargeNumber(data.todayHasanat).text)} {t('today_hasanat')}</Text>
                <Text variant="body2" style={{ textAlign: 'center', color: '#F5E6C8', marginTop: 8, marginBottom: 4 }}>{t('insha2allah')}</Text>
            </Card>
            <Card style={{
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
              height: isSmallScreen ? 150 : 180
            }}>
                <View style={{ marginTop: 8 }}>
                    <Text variant="h3" style={{ textAlign: 'center', color: '#CCCCCC', marginTop: 0 }}>{t('streak')}</Text>
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', marginVertical: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Text variant="h1" style={{ color: '#5b7f67', textAlign: 'center', fontWeight: 'bold', fontSize: formatStreakNumber(data.streak).fontSize, lineHeight: formatStreakNumber(data.streak).fontSize * 1.2 }}>{toArabicNumber(formatStreakNumber(data.streak).text)}</Text>
                    </View>
                    <Text variant="body2" color="textSecondary" style={{ textAlign: 'center' }}>{t('days')}</Text>
                    <Text variant="body2" style={{ textAlign: 'center', color: '#F5E6C8', marginTop: 8, marginBottom: 4 }}>{t('masha2allah')}</Text>
                </View>
            </Card>
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
                  marginTop: -40,
                  marginBottom: 20,
                }]}>
                  <Image 
                    source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')} 
                    style={styles.logo} 
                    resizeMode="contain" 
                  />
                </View>
                <Text style={{ 
                  fontSize: 28, 
                  fontWeight: 'bold', 
                  color: 'rgba(165,115,36,0.8)', 
                  marginBottom: 40, 
                  marginTop: 20,
                  textAlign: 'center',
                  lineHeight: 40,
                  textShadowColor: 'rgba(165,115,36,0.8)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 2,
                }}>
                  {t('intro_title')}
                </Text>
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
                {(() => {
                  const [bismillahPressed, setBismillahPressed] = useState(false);
                  
                  return (
                    <Animated.View style={{
                      shadowColor: '#fae29f',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: bismillahPressed ? 0.8 : 0.3,
                      shadowRadius: bismillahPressed ? 20 : 8,
                      elevation: bismillahPressed ? 15 : 6,
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
                          ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true }); 
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
              </View>
            </View>
          </Modal>

        <Modal
          visible={infoVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoVisible(false)}
        >
                      <View style={[styles.modalOverlay, { justifyContent: 'flex-end', paddingBottom: 20 }]}>
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
                    ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true }); 
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
                    ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true }); 
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
            </View>
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
            onPress={() => { setDuaVisible(false); setDuaExpanded(false); setDuaButtonPressed(false); setCurrentDuaIndex(0); }}
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
                paddingHorizontal: 40 
              }}>
                {/* Pagination Dots */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginBottom: 30 
                }}>
                  {Array.from({ length: 6 }, (_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setCurrentDuaIndex(index)}
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
                paddingHorizontal: 20,
                height: 50
              }}>
                {/* Left side - Back button or empty space */}
                <View style={{ width: 140, alignItems: 'flex-start' }}>
                  {currentDuaIndex > 0 && (
                    <TouchableOpacity
                      onPress={() => setCurrentDuaIndex(currentDuaIndex - 1)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        backgroundColor: 'rgba(165,115,36,0.3)',
                        borderRadius: 8,
                        minWidth: 80,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#fae29f', fontSize: 14, fontWeight: 'bold' }}>Back</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Center - Ameen button always here */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => { setDuaVisible(false); setDuaExpanded(false); setDuaButtonPressed(false); setCurrentDuaIndex(0); }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      backgroundColor: '#33694e',
                      borderRadius: 8,
                      minWidth: 100,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fae29f', fontSize: 16, fontWeight: 'bold' }}>
                      Ameen
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Right side - Next button or empty space */}
                <View style={{ width: 140, alignItems: 'flex-end' }}>
                  {currentDuaIndex < 5 && (
                    <TouchableOpacity
                      onPress={() => setCurrentDuaIndex(currentDuaIndex + 1)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        backgroundColor: 'rgba(165,115,36,0.3)',
                        borderRadius: 8,
                        minWidth: 80,
                        alignItems: 'center',
                      }}
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
                  onPress={() => { ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true }); changeLanguage('en'); }}
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
                  onPress={() => { ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true }); changeLanguage('ar'); }}
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
                        ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
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
                        ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
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
                    ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
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
                  onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
                />
              )}
              
              <Button
                title={t('reset_today')}
                onPress={async () => {
                  ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
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
                  ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
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
                onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
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
                onPress={() => { ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true }); setSettingsVisible(false); }}
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

                <View style={styles.confirmModalButtons}>
                  <TouchableOpacity
                    style={styles.confirmModalCancelButton}
                    onPress={() => {
                      ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
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
                      ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
                      setResetting(true);
                      setConfirmResetVisible(false);
                      await resetProgress();
                      setResetting(false);
                      const loadedData = await loadData();
                      setData(loadedData);
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
    justifyContent: 'center',
    alignItems: 'center',
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