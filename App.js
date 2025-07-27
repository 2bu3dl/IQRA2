import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './src/utils/theme';
import { LanguageProvider } from './src/utils/languageContext';
import { AuthProvider } from './src/utils/authContext';
import { Linking } from 'react-native';
import { supabase } from './src/utils/supabase';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SurahListScreen from './src/screens/SurahListScreen';
import MemorizationScreen from './src/screens/MemorizationScreen';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createNativeStackNavigator();

function App() {
  useEffect(() => {
    // Handle deep links for email confirmation
    const handleDeepLink = (url) => {
      if (url) {
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN') {
            console.log('User signed in via email confirmation');
          }
        });
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming links when app is already running
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
              headerStyle: {
                backgroundColor: COLORS.primary,
              },
              headerTintColor: COLORS.white,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerShown: false,
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