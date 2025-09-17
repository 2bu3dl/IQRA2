import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './src/utils/theme';
import { LanguageProvider } from './src/utils/languageContext';
import { AuthProvider } from './src/utils/authContext';
import { Linking, LogBox, Platform } from 'react-native';
import { supabase } from './src/utils/supabase';

// Debug logging
console.log('🚀 App.js: Starting app initialization...');
console.log('📱 Platform:', Platform.OS, Platform.Version);
console.log('🎨 COLORS loaded:', Object.keys(COLORS).length, 'colors');

// Import screens
console.log('📦 App.js: Importing screens...');

import HomeScreen from './src/screens/HomeScreen';
console.log('✅ HomeScreen imported successfully');

import SurahListScreen from './src/screens/SurahListScreen';
console.log('✅ SurahListScreen imported successfully');

import MemorizationScreen from './src/screens/MemorizationScreen';
console.log('✅ MemorizationScreen imported successfully');

import AuthScreen from './src/screens/AuthScreen';
console.log('✅ AuthScreen imported successfully');

import ProfileDashboard from './src/screens/ProfileDashboard';
console.log('✅ ProfileDashboard imported successfully');

import ProfileScreen from './src/screens/ProfileScreen';
console.log('✅ ProfileScreen imported successfully');

import LeaderboardScreen from './src/screens/LeaderboardScreen';
console.log('✅ LeaderboardScreen imported successfully');

import RecordingsScreen from './src/screens/RecordingsScreen';
console.log('✅ RecordingsScreen imported successfully');

import NotesBoardScreen from './src/screens/NotesBoardScreen';
console.log('✅ NotesBoardScreen imported successfully');

console.log('📦 App.js: All screen imports completed');

const Stack = createNativeStackNavigator();

function App() {
  console.log('🎯 App function: Starting App component...');
  
  // Suppress legacy architecture warnings
  LogBox.ignoreLogs([
    'Warning: React Native is using the legacy architecture',
    'Warning: The legacy architecture is deprecated',
    'Warning: Please migrate to the new architecture',
  ]);
  console.log('🔇 App: Legacy warnings suppressed');

  useEffect(() => {
    console.log('🔗 App: Setting up deep linking...');
    
    // Handle deep links for email confirmation
    const handleDeepLink = (url) => {
      console.log('🔗 App: Deep link received:', url);
      if (url) {
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN') {
            console.log('✅ App: User signed in via email confirmation');
          }
        });
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      console.log('🔗 App: Initial URL:', url);
      if (url) {
        handleDeepLink(url);
      }
    }).catch((error) => {
      console.error('❌ App: Error getting initial URL:', error);
    });

    // Listen for incoming links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 App: URL event received:', event.url);
      handleDeepLink(event.url);
    });

    console.log('✅ App: Deep linking setup completed');

    return () => {
      console.log('🧹 App: Cleaning up deep link subscription');
      subscription?.remove();
    };
  }, []);

  console.log('🎨 App: Starting to render UI...');
  
  return (
    <AuthProvider>
      {console.log('🔐 App: AuthProvider rendered')}
      <LanguageProvider>
        {console.log('🌐 App: LanguageProvider rendered')}
        <NavigationContainer>
          {console.log('🧭 App: NavigationContainer rendered')}
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
              animation: 'none',
            }}>
            {console.log('📱 App: Stack.Navigator created with screens')}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="SurahList" component={SurahListScreen} />
            <Stack.Screen name="Memorization" component={MemorizationScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="ProfileDashboard" component={ProfileDashboard} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Recordings" component={RecordingsScreen} />
            <Stack.Screen name="NotesBoard" component={NotesBoardScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;