import React from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLanguage } from '../utils/languageContext';
import Button from '../components/Button';
import Text from '../components/Text';
import Card from '../components/Card';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const AuthScreen = ({ navigation }) => {
  const { language, t } = useLanguage();

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text variant="h1" style={styles.title}>
            {t('account')}
          </Text>
          
          <Text variant="body1" style={styles.subtitle}>
            Account management is coming soon! 
          </Text>
          
          <Text variant="body2" style={styles.description}>
            This feature will allow you to:
            {'\n\n'}• Create an account with email and password
            {'\n'}• Sync your progress across devices  
            {'\n'}• Backup your memorization data to the cloud
            {'\n'}• Access your data from any device
            {'\n\n'}Firebase setup is required to enable this feature.
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title={t('back')}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
          </View>
        </Card>
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
    padding: SIZES.large,
    justifyContent: 'center',
  },
  card: {
    padding: SIZES.large,
    margin: SIZES.medium,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SIZES.medium,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SIZES.medium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: SIZES.large,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    marginTop: SIZES.medium,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    marginTop: SIZES.small,
  },
});

export default AuthScreen; 