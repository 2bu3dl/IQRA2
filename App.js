import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './src/utils/theme';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SurahListScreen from './src/screens/SurahListScreen';
import MemorizationScreen from './src/screens/MemorizationScreen';
import RecordingsScreen from './src/screens/RecordingsScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
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
        <Stack.Screen name="Recordings" component={RecordingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App; 