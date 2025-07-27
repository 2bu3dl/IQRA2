import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Image, ImageBackground, Modal, TouchableOpacity, Dimensions, Alert, TextInput } from 'react-native';
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
  const [resetting, setResetting] = useState(false);

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
            <TouchableOpacity style={styles.introButton} onPress={() => setIntroVisible(true)} onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}>
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
            <View style={[styles.logoTextContainer, {
              shadowColor: '#fae29f',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }]}>
              <Image 
                source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')} 
                style={[styles.logo]} 
              />
            </View>
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
              <Text style={[styles.arabicText, {
                color: '#F0D8A0',
                textShadowColor: '#fae29f',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 3,
              }]} allowFontScaling={false} lang="ar">اللَّهُمَّ اجْعَلْنَا مِنْ أَهْلِ الْقُرْآن</Text>
            </View>
            <View style={styles.dividerLine} />
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 25, // Fine-tune button position
            marginBottom: 20,
            position: 'relative',
            zIndex: 1,
            height: 120 // Fixed height
          }}>
            {(() => {
              const [pressed, setPressed] = useState(false);
              return (
                <TouchableOpacity
                  style={[{
                    flex: 1,
                    marginHorizontal: SIZES.small,
                    padding: SIZES.large,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    borderRadius: SIZES.base,
                    shadowColor: '#fae29f',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: pressed ? 0.9 : 0.2,
                    shadowRadius: pressed ? 24 : 8,
                    elevation: pressed ? 18 : 6,
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 2,
                    height: 120
                  }]}
                  onPress={() => {
                    telemetryService.trackUserInteraction('button_click', { 
                      button: 'Start Memorization',
                      screen: 'Home'
                    });
                    navigation.navigate('SurahList');
                  }}
                  onPressIn={() => { setPressed(true); ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true }); }}
                  onPressOut={() => setPressed(false)}
                  activeOpacity={1}
                >
                  <View style={styles.buttonIconContainer}>
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
                      marginTop: language === 'ar' ? 4 : SIZES.small,
                      textAlign: 'center',
                      color: '#fae29f', 
                      width: '100%', 
                      fontWeight: 'bold', 
                      fontSize: 22, 
                      textShadowColor: '#fae29f', 
                      textShadowOffset: { width: 0, height: 0 }, 
                      textShadowRadius: 4,
                      lineHeight: language === 'ar' ? 36 : 26,
                      fontFamily: 'Montserrat-Bold'
                    }]}>{t('quran_memorize')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })()}
          </View>

          <Card variant="elevated" style={{
            marginBottom: isSmallScreen ? -30 : -50,
            marginTop: isSmallScreen ? 40 : (isMediumScreen ? 50 : 60),
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
            marginTop: isSmallScreen ? 40 : (isMediumScreen ? 60 : 80),
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
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { 
                minHeight: 500,
                justifyContent: 'center',
                paddingVertical: 40
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
                <Button
                  title={t('bismillah')}
                  onPress={() => setIntroVisible(false)}
                  style={{ backgroundColor: '#33694e' }}
                  onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
                />
              </View>
            </View>
          </Modal>

        <Modal
          visible={settingsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: 'rgba(64,64,64,0.95)' }]}>
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
                  onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
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
                  onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
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
                onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
              />
              <TouchableOpacity
                onPress={async () => {
                  ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
                  setResetting(true);
                  await resetProgress();
                  setResetting(false);
                  setSettingsVisible(false);
                  const loadedData = await loadData();
                  setData(loadedData);
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
                  onPressIn={() => ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true })}
              />
              </View>
            </View>
          </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 0,
    textAlign: 'center',
    fontFamily: 'UthmanTN_v2-0',
    writingDirection: 'rtl',
  },
  customDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: SIZES.small,
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
});

export default HomeScreen; 