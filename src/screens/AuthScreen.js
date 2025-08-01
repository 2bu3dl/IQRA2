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
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import Button from '../components/Button';
import Text from '../components/Text';
import Card from '../components/Card';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { TextInput } from 'react-native';

const AuthScreen = ({ navigation, onClose, isModal = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { login, register, resetPassword, loading } = useAuth();
  const { language, t } = useLanguage();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('error'), t('please_fill_all_fields'));
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert(t('error'), t('invalid_email_format'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('password_min_length'));
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert(t('error'), t('passwords_dont_match'));
      return;
    }

    let result;
    if (isLogin) {
      result = await login(email.trim(), password);
    } else {
      result = await register(email.trim(), password);
    }

    if (!result.success) {
      Alert.alert(t('error'), result.error);
    } else {
      // Success - navigation will be handled by auth state change
      Alert.alert(
        t('success'), 
        isLogin ? t('login_successful') : t('registration_successful')
      );
      if (isModal && onClose) {
        onClose();
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('error'), t('enter_email_for_reset'));
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert(t('error'), t('invalid_email_format'));
      return;
    }

    const result = await resetPassword(email.trim());
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
                      value={email}
                      onChangeText={setEmail}
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
                    placeholder={t('email')}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
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
                    if (isModal && onClose) {
                      onClose();
                    } else {
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
    color: '#FFA500',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
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