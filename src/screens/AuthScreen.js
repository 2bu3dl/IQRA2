import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import Button from '../components/Button';
import Text from '../components/Text';
import Card from '../components/Card';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { TextInput } from 'react-native';
import { validateEmailOrUsername, validatePassword, validatePasswordConfirmation, logValidationAttempt } from '../utils/validation';

const AuthScreen = ({ navigation, isModal = false }) => {
  // Read navigation parameters for modal mode
  const route = useRoute();
  const routeParams = route.params;
  const modalMode = routeParams?.isModal || isModal;
  
  // Debug logging
  console.log('[AuthScreen] Route params:', routeParams);
  console.log('[AuthScreen] Modal mode:', modalMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { login, register, resetPassword, loading } = useAuth();
  const { language, t } = useLanguage();

  const handleAuth = async () => {
    // Validate email or username
    const identifierValidation = validateEmailOrUsername(identifier);
    logValidationAttempt('identifier', identifier, identifierValidation.isValid, 'auth');
    if (!identifierValidation.isValid) {
      Alert.alert(t('error'), identifierValidation.error);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    logValidationAttempt('password', password, passwordValidation.isValid, 'auth');
    if (!passwordValidation.isValid) {
      Alert.alert(t('error'), passwordValidation.error);
      return;
    }

    // Validate password confirmation for registration
    if (!isLogin) {
      const confirmValidation = validatePasswordConfirmation(password, confirmPassword);
      logValidationAttempt('confirmPassword', confirmPassword, confirmValidation.isValid, 'auth');
      if (!confirmValidation.isValid) {
        Alert.alert(t('error'), confirmValidation.error);
        return;
      }
    }

    let result;
    if (isLogin) {
      result = await login(identifierValidation.value, passwordValidation.value);
    } else {
      // For registration, we need to ensure it's an email
      if (identifierValidation.type !== 'email') {
        Alert.alert(t('error'), 'Registration requires an email address. Please enter your email address.');
        return;
      }
      result = await register(identifierValidation.value, passwordValidation.value);
    }

    if (!result.success) {
      // Provide more helpful error messages for username issues
      let errorMessage = result.error;
      if (result.error.includes('Username not found')) {
        errorMessage = 'Username not found. Please check your username or try logging in with your email address instead.';
      }
      Alert.alert(t('error'), errorMessage);
    } else {
      // Success - close modal first, then show success message
      console.log('[AuthScreen] Login success, modalMode:', modalMode);
      if (modalMode) {
        console.log('[AuthScreen] In modal mode, going back to settings');
        // Go back to previous screen (settings modal)
        navigation.goBack();
        // Show success message after going back
        setTimeout(() => {
          Alert.alert(
            t('success'), 
            isLogin ? t('login_successful') : t('registration_successful')
          );
        }, 300);
      } else {
        console.log('[AuthScreen] Not in modal mode, showing alert normally');
        // Not in modal mode, show alert normally
        Alert.alert(
          t('success'), 
          isLogin ? t('login_successful') : t('registration_successful')
        );
      }
    }
  };

  const handleForgotPassword = async () => {
    // For password reset, we need to validate that it's an email
    const emailValidation = validateEmailOrUsername(identifier);
    logValidationAttempt('identifier', identifier, emailValidation.isValid, 'forgot_password');
    
    if (!emailValidation.isValid) {
      Alert.alert(t('error'), emailValidation.error);
      return;
    }
    
    // Check if it's an email (required for password reset)
    if (emailValidation.type !== 'email') {
      Alert.alert(t('error'), 'Password reset requires an email address. Please enter your email address.');
      return;
    }

    const result = await resetPassword(emailValidation.value);
    if (result.success) {
      Alert.alert(t('success'), t('reset_email_sent'));
      setShowForgotPassword(false);
    } else {
      Alert.alert(t('error'), result.error);
    }
  };

  if (showForgotPassword) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <ImageBackground
          source={require('../assets/IQRA2background.png')}
          style={styles.background}
          imageStyle={{ opacity: 0.2 }}
        >
          <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
            <View style={styles.cardModalOverlay}>
              <View style={styles.cardModalBackdrop} />
              <View style={styles.cardModalContainer}>
                <View style={styles.cardModalContent}>
                  <View style={styles.cardModalHeader}>
                    <Text variant="h1" style={styles.cardModalTitle}>
                      {t('reset_password')}
                    </Text>
                    <Text variant="body1" style={styles.cardModalSubtitle}>
                      {t('reset_password_instruction')}
                    </Text>
                  </View>

                  <View style={styles.cardModalForm}>
                    <TextInput
                      style={[styles.cardModalInput, { textAlign: language === 'ar' ? 'right' : 'left' }]}
                      placeholder={t('email')}
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={identifier}
                      onChangeText={setIdentifier}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <View style={styles.buttonContainer}>
                      <Button
                        title={loading ? t('sending') : t('send_reset_email')}
                        onPress={handleForgotPassword}
                        style={styles.cardModalPrimaryButton}
                        disabled={loading}
                      />
                      
                      <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => setShowForgotPassword(false)}
                      >
                        <Text variant="body2" style={styles.cardModalLinkText}>
                          {t('back_to_login')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground
        source={require('../assets/IQRA2background.png')}
        style={styles.background}
        imageStyle={{ opacity: 0.2 }}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <View style={styles.cardModalOverlay}>
            <View style={styles.cardModalBackdrop} />
            <View style={styles.cardModalContainer}>
              <View style={styles.cardModalContent}>
                <View style={styles.cardModalHeader}>
                  <Text variant="h1" style={styles.cardModalTitle}>
                    {isLogin ? t('welcome_back') : t('create_account')}
                  </Text>
                  <Text variant="body1" style={styles.cardModalSubtitle}>
                    {isLogin ? t('login_subtitle') : t('register_subtitle')}
                  </Text>
                </View>

                <View style={styles.cardModalForm}>
                  <TextInput
                    style={[styles.cardModalInput, { textAlign: language === 'ar' ? 'right' : 'left' }]}
                    placeholder={t('email_or_username')}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />


                  <TextInput
                    style={[styles.cardModalInput, { textAlign: language === 'ar' ? 'right' : 'left' }]}
                    placeholder={t('password')}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  {!isLogin && (
                    <TextInput
                      style={[styles.cardModalInput, { textAlign: language === 'ar' ? 'right' : 'left' }]}
                      placeholder={t('confirm_password')}
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  )}

                  <View style={styles.buttonContainer}>
                    <Button
                      title={loading ? t('processing') : (isLogin ? t('login') : t('register'))}
                      onPress={handleAuth}
                      style={styles.cardModalPrimaryButton}
                      disabled={loading}
                    />
                    
                    {isLogin && (
                      <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => setShowForgotPassword(true)}
                      >
                        <Text variant="body2" style={styles.cardModalLinkText}>
                          {t('forgot_password')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() => setIsLogin(!isLogin)}
                    >
                      <Text variant="body2" style={styles.cardModalLinkText}>
                        {isLogin ? t('need_account') : t('have_account')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {loading && (
                    <ActivityIndicator 
                      size="large" 
                      color="#FFFFFF" 
                      style={styles.loader}
                    />
                  )}
                </View>

                <TouchableOpacity
                  style={styles.cardModalSkipButton}
                  onPress={() => {
                    if (modalMode) {
                      // In modal mode, go back to previous screen (settings modal)
                      navigation.goBack();
                    } else {
                      // Not in modal mode, navigate to home
                      navigation.navigate('Home');
                    }
                  }}
                >
                  <Text variant="body2" style={styles.cardModalSkipText}>
                    {t('continue_without_account')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  // Background styles
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  
  // Card Modal styles
  cardModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardModalContainer: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'transparent',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.3)',
  },
  cardModalContent: {
    alignItems: 'center',
  },
  cardModalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cardModalTitle: {
    color: '#F5E6C8',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
    textShadowColor: '#D4A574',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardModalSubtitle: {
    color: '#CCCCCC',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Montserrat-Regular',
  },
  cardModalForm: {
    width: '100%',
    marginBottom: 20,
  },
  cardModalInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
  },

  cardModalPrimaryButton: {
    marginBottom: 16,
    backgroundColor: '#33694e',
  },
  cardModalLinkText: {
    color: '#FFA500',
    textDecorationLine: 'underline',
    fontFamily: 'Montserrat-Regular',
  },
  cardModalSkipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cardModalSkipText: {
    color: '#CCCCCC',
    textDecorationLine: 'underline',
    fontFamily: 'Montserrat-Regular',
  },
  
  // Original styles (kept for reference)
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  title: {
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    padding: 24,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  buttonContainer: {
    marginTop: 8,
  },
  primaryButton: {
    marginBottom: 16,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipText: {
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  loader: {
    marginTop: 16,
  },

});

export default AuthScreen; 