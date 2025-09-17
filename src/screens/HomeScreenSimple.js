import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

function HomeScreenSimple() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>IQRA2</Text>
        <Text style={styles.subtitle}>Welcome to IQRA2</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('SurahList')}
        >
          <Text style={styles.buttonText}>Start Learning</Text>
        </TouchableOpacity>
        
        <Text style={styles.status}>✅ App is working on device!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    color: '#27ae60',
    textAlign: 'center',
  },
});

export default HomeScreenSimple;
