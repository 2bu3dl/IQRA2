import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './src/utils/theme';
import { LanguageProvider } from './src/utils/languageContext';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SurahListScreen from './src/screens/SurahListScreen';
import MemorizationScreen from './src/screens/MemorizationScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
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
      </Stack.Navigator>
    </NavigationContainer>
    </LanguageProvider>
  );
}

export default App; 