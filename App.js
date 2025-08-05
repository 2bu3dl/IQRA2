import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './src/utils/theme';
import { LanguageProvider } from './src/utils/languageContext';
import { AuthProvider } from './src/utils/authContext';
import { Linking, LogBox } from 'react-native';
import { supabase } from './src/utils/supabase';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SurahListScreen from './src/screens/SurahListScreen';
import MemorizationScreen from './src/screens/MemorizationScreen';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createNativeStackNavigator();

function App() {
  // Suppress legacy architecture warnings
  LogBox.ignoreLogs([
    'Warning: React Native',
    'Require cycle:',
    'ViewPropTypes will be removed',
    'AsyncStorage has been extracted',
  ]);

  useEffect(() => {
    // Handle deep linking
    const handleDeepLink = (url) => {
      console.log('Deep link received:', url);
    };

    // Get initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
            }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="SurahList" component={SurahListScreen} />
            <Stack.Screen name="Memorization" component={MemorizationScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App; 