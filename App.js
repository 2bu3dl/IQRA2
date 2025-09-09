import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './src/utils/theme';
import { LanguageProvider } from './src/utils/languageContext';
import { AuthProvider } from './src/utils/authContext';
import { Linking, LogBox } from 'react-native';
import { supabase } from './src/utils/supabase';
// Removed debugging import

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SurahListScreen from './src/screens/SurahListScreen';
import MemorizationScreen from './src/screens/MemorizationScreen';
import AuthScreen from './src/screens/AuthScreen';
import ProfileDashboard from './src/screens/ProfileDashboard';
import ProfileScreen from './src/screens/ProfileScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import RecordingsScreen from './src/screens/RecordingsScreen';
import NotesBoardScreen from './src/screens/NotesBoardScreen';
import Surah94TestComponent from './src/components/Surah94TestComponent';
import SimpleWordTest from './src/components/SimpleWordTest';
import FontDebugTest from './src/components/FontDebugTest';
import LetterConnectionTest from './src/components/LetterConnectionTest';
import WaslaConnectionTest from './src/components/WaslaConnectionTest';
import WaslaFixTest from './src/components/WaslaFixTest';
import WritingDirectionTest from './src/components/WritingDirectionTest';
import ComprehensiveWaslaTest from './src/components/ComprehensiveWaslaTest';
import OfficialFontTest from './src/components/OfficialFontTest';
import CreativeSolutions from './src/components/CreativeSolutions';
import AlternativeDataTest from './src/components/AlternativeDataTest';
import FontPatchingTest from './src/components/FontPatchingTest';
import FontFallbackSolutions from './src/components/FontFallbackSolutions';
import FontAnalysisResults from './src/components/FontAnalysisResults';
import MultiFontTest from './src/components/MultiFontTest';
import HarfBuzzTest from './src/components/HarfBuzzSkiaRenderer';
import SimpleSkiaTest from './src/components/SimpleSkiaTest';
import FinalWaslaSolution from './src/components/FinalWaslaSolution';
import FontCompareScreen from './src/components/FontCompareScreen';
import QuranTextFallback from './src/components/QuranTextFallback';
import RawFontTest from './src/components/RawFontTest';
import FontPriorityTest from './src/components/FontPriorityTest';
import FontLoadingDebug from './src/components/FontLoadingDebug';
import WaslaSolutionTest from './src/components/WaslaSolutionTest';
import UthmanicHafsTest from './src/components/UthmanicHafsTest';
import FontRequireTest from './src/components/FontRequireTest';
import WorkingFontTest from './src/components/WorkingFontTest';
import SimpleFontTest from './src/components/SimpleFontTest';
// Removed debug component imports

const Stack = createNativeStackNavigator();

function App() {
  // Suppress legacy architecture warnings
  LogBox.ignoreLogs([
    'Warning: React Native is using the legacy architecture',
    'Warning: The legacy architecture is deprecated',
    'Warning: Please migrate to the new architecture',
  ]);

  // Removed debugging initialization

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
              animation: 'none',
            }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="SurahList" component={SurahListScreen} />
            <Stack.Screen name="Memorization" component={MemorizationScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="ProfileDashboard" component={ProfileDashboard} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Recordings" component={RecordingsScreen} />
            <Stack.Screen name="NotesBoard" component={NotesBoardScreen} />
            <Stack.Screen name="Surah94Test" component={Surah94TestComponent} />
            <Stack.Screen name="SimpleWordTest" component={SimpleWordTest} />
            <Stack.Screen name="FontDebugTest" component={FontDebugTest} />
            <Stack.Screen name="LetterConnectionTest" component={LetterConnectionTest} />
            <Stack.Screen name="WaslaConnectionTest" component={WaslaConnectionTest} />
            <Stack.Screen name="WaslaFixTest" component={WaslaFixTest} />
            <Stack.Screen name="WritingDirectionTest" component={WritingDirectionTest} />
            <Stack.Screen name="ComprehensiveWaslaTest" component={ComprehensiveWaslaTest} />
            <Stack.Screen name="OfficialFontTest" component={OfficialFontTest} />
            <Stack.Screen name="CreativeSolutions" component={CreativeSolutions} />
            <Stack.Screen name="AlternativeDataTest" component={AlternativeDataTest} />
            <Stack.Screen name="FontPatchingTest" component={FontPatchingTest} />
            <Stack.Screen name="FontFallbackSolutions" component={FontFallbackSolutions} />
            <Stack.Screen name="FontAnalysisResults" component={FontAnalysisResults} />
            <Stack.Screen name="MultiFontTest" component={MultiFontTest} />
            <Stack.Screen name="HarfBuzzTest" component={HarfBuzzTest} />
            <Stack.Screen name="SimpleSkiaTest" component={SimpleSkiaTest} />
            <Stack.Screen name="FinalWaslaSolution" component={FinalWaslaSolution} />
            <Stack.Screen name="FontCompareScreen" component={FontCompareScreen} />
            <Stack.Screen name="RawFontTest" component={RawFontTest} />
            <Stack.Screen name="FontPriorityTest" component={FontPriorityTest} />
            <Stack.Screen name="FontLoadingDebug" component={FontLoadingDebug} />
            <Stack.Screen name="WaslaSolutionTest" component={WaslaSolutionTest} />
            <Stack.Screen name="UthmanicHafsTest" component={UthmanicHafsTest} />
            <Stack.Screen name="FontRequireTest" component={FontRequireTest} />
            <Stack.Screen name="WorkingFontTest" component={WorkingFontTest} />
            <Stack.Screen name="SimpleFontTest" component={SimpleFontTest} />
            {/* Removed debug screens */}
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App; 