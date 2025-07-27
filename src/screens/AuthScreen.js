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
      <KeyboardAvoidingView 
        style={isModal ? { flex: 1, width: '100%' } : styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={isModal ? { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 } : styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text variant="h1" style={styles.title}>
              {t('reset_password')}
            </Text>
            <Text variant="body1" style={styles.subtitle}>
              {t('reset_password_instruction')}
            </Text>
          </View>

          <Card style={styles.formCard}>
            <TextInput
              style={[styles.input, { textAlign: language === 'ar' ? 'right' : 'left' }]}
              placeholder={t('email')}
              placeholderTextColor={COLORS.textSecondary}
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
                style={styles.primaryButton}
                disabled={loading}
              />
              
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setShowForgotPassword(false)}
              >
                <Text variant="body2" style={styles.linkText}>
                  {t('back_to_login')}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={isModal ? { flex: 1, width: '100%' } : styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={isModal ? { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 } : styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text variant="h1" style={styles.title}>
            {isLogin ? t('welcome_back') : t('create_account')}
          </Text>
          <Text variant="body1" style={styles.subtitle}>
            {isLogin ? t('login_subtitle') : t('register_subtitle')}
          </Text>
        </View>

        <Card style={styles.formCard}>
          <TextInput
            style={[styles.input, { textAlign: language === 'ar' ? 'right' : 'left' }]}
            placeholder={t('email')}
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, { textAlign: language === 'ar' ? 'right' : 'left' }]}
            placeholder={t('password')}
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {!isLogin && (
            <TextInput
              style={[styles.input, { textAlign: language === 'ar' ? 'right' : 'left' }]}
              placeholder={t('confirm_password')}
              placeholderTextColor={COLORS.textSecondary}
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
              style={styles.primaryButton}
              disabled={loading}
            />
            
            {isLogin && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setShowForgotPassword(true)}
              >
                <Text variant="body2" style={styles.linkText}>
                  {t('forgot_password')}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text variant="body2" style={styles.linkText}>
                {isLogin ? t('need_account') : t('have_account')}
              </Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <ActivityIndicator 
              size="large" 
              color={COLORS.primary} 
              style={styles.loader}
            />
          )}
        </Card>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            if (isModal && onClose) {
              onClose();
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <Text variant="body2" style={styles.skipText}>
            {t('continue_without_account')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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