import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const FontDebugTest = () => {
  const testWord = "فَٱنصَبۡ";
  
  // Try different font name variations
  const fontVariations = [
    // Actual font family names (from fc-query)
    'KFGQPC HAFS Uthmanic Script',
    'KFGQPC Uthman Taha Naskh',
    'KFGQPC KSA Heavy',
    
    // Filenames (sometimes work)
    'UthmanicHafs1Ver18',
    'UthmanTN_v2-0',
    'UthmanTNB_v2-0', 
    'KSAHeavy',
    
    // With .ttf extension
    'UthmanicHafs1Ver18.ttf',
    'UthmanTN_v2-0.ttf', 
    'UthmanTNB_v2-0.ttf',
    'KSAHeavy.ttf',
    
    // Known working fonts
    'KFGQPC Uthman Taha Naskh Bold',
    
    // System fonts for comparison
    'System',
    'Arial',
    'Helvetica'
  ];

  const baseStyle = {
    fontSize: 32,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 10,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Font Debug Test</Text>
      <Text style={styles.subtitle}>Platform: {Platform.OS}</Text>
      <Text style={styles.subtitle}>Word: {testWord}</Text>
      
      {fontVariations.map((font, index) => (
        <View key={index} style={styles.fontTestContainer}>
          <Text style={styles.fontLabel}>Font: {font}</Text>
          <View style={styles.wordContainer}>
            <Text style={[baseStyle, { fontFamily: font }]}>
              {testWord}
            </Text>
          </View>
        </View>
      ))}
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
    marginBottom: 15,
    alignItems: 'center'
  },
  fontLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 3
  },
  wordContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 150
  }
});

export default FontDebugTest;
