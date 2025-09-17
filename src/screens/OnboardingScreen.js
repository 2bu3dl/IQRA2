import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';

const OnboardingScreen = ({ onComplete }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to IQRA2</Text>
      <Text style={styles.subtitle}>Your Quran memorization companion</Text>
      <Button
        title="Get Started"
        onPress={onComplete}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
});

export default OnboardingScreen;
