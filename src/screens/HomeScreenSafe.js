import React, { useEffect, useState, useRef, Suspense } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import { COLORS } from '../utils/theme';

// Lazy load heavy components
const LazyHomeContent = React.lazy(() => import('./HomeScreenContent'));

const HomeScreenSafe = ({ navigation, route }) => {
  const { user, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize app safely
    const initializeApp = async () => {
      try {
        // Add a small delay to ensure all modules are loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if critical dependencies are available
        if (!isAuthenticated && user === null) {
          // This is normal - user might not be logged in
        }
        
        setIsReady(true);
      } catch (err) {
        console.error('HomeScreen initialization error:', err);
        setError(err.message);
        setIsReady(true); // Still show the app, but with error handling
      }
    };

    initializeApp();
  }, [isAuthenticated, user]);

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading IQRA2...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorSubtext}>Please restart the app</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Suspense fallback={
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      }>
        <LazyHomeContent navigation={navigation} route={route} />
      </Suspense>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreenSafe;
