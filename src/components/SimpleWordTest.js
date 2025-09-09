import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SimpleWordTest = () => {
  // Exact word from qpc-hafs-word-by-word.json: "فَٱنصَبۡ"
  const testWord = "فَٱنصَبۡ";
  
  const baseWordStyle = {
    fontSize: 48,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 20,
  };

  const fontsToTest = [
    'KFGQPC HAFS Uthmanic Script',  // Actual name from UthmanicHafs1Ver18.ttf
    'KFGQPC Uthman Taha Naskh',     // Actual name from UthmanTN_v2-0.ttf
    'KFGQPC KSA Heavy',             // Actual name from KSAHeavy.ttf
    'KFGQPC Uthman Taha Naskh Bold', // Known working font
    'UthmanicHafs1Ver18',           // Filename (fallback)
    'UthmanTN_v2-0'                 // Filename (fallback)
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Font Test: Last Word of Surah 94:7</Text>
      <Text style={styles.subtitle}>Word: {testWord}</Text>
      <Text style={styles.subtitle}>From: qpc-hafs-word-by-word.json</Text>
      
      {fontsToTest.map((font, index) => (
        <View key={index} style={styles.fontTestContainer}>
          <Text style={styles.fontLabel}>Font: {font}</Text>
          <View style={styles.wordContainer}>
            <Text style={[baseWordStyle, { fontFamily: font }]}>
              {testWord}
            </Text>
          </View>
        </View>
      ))}
      
      <Text style={styles.info}>Unicode: {JSON.stringify(testWord)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666666',
    textAlign: 'center'
  },
  fontTestContainer: {
    marginBottom: 20,
    alignItems: 'center'
  },
  fontLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  wordContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    minWidth: 200
  },
  info: {
    fontSize: 14,
    color: '#888888',
    marginTop: 20,
    textAlign: 'center'
  }
});

export default SimpleWordTest;
