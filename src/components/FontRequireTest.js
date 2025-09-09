import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Font family names to test (require() doesn't work for fonts in RN)
const fontFamilyNames = [
  'UthmanicHafs1Ver18',
  'KFGQPC HAFS Uthmanic Script Regular',
  'KFGQPC HAFS Uthmanic Script',
  'KFGQPCHAFSUthmanicScript-Regula'
];

const FontRequireTest = () => {
  const testText = "فَٱنصَبۡ";
  const simpleText = "فا";
  const bismillah = "بِسْمِ ٱللَّهِ";
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Font Require Test</Text>
      <Text style={styles.subtitle}>Testing direct font require() method</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔍 Testing Method:</Text>
        <Text style={styles.infoText}>• Using require() to load font directly</Text>
        <Text style={styles.infoText}>• This bypasses font family name issues</Text>
        <Text style={styles.infoText}>• Should work if font file is valid</Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>1. System Font (No fontFamily)</Text>
        <Text style={styles.testText}>{testText}</Text>
        <Text style={styles.testText}>{simpleText}</Text>
        <Text style={styles.testText}>{bismillah}</Text>
      </View>
      
      {fontFamilyNames.map((fontFamily, index) => (
        <View key={index} style={styles.testSection}>
          <Text style={styles.sectionTitle}>
            {index + 2}. {fontFamily}
          </Text>
          <Text style={[styles.testText, { fontFamily }]}>
            {testText}
          </Text>
          <Text style={[styles.testText, { fontFamily }]}>
            {simpleText}
          </Text>
          <Text style={[styles.testText, { fontFamily }]}>
            {bismillah}
          </Text>
        </View>
      ))}
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>🐛 Debug Info:</Text>
        <Text style={styles.debugText}>Testing {fontFamilyNames.length} different font family names</Text>
        <Text style={styles.debugText}>If any look different from system font → Font is loading!</Text>
      </View>
      
      <View style={styles.expectedContainer}>
        <Text style={styles.expectedTitle}>🎯 What to Look For:</Text>
        <Text style={styles.expectedText}>• If any font looks different from system font → Font is loading!</Text>
        <Text style={styles.expectedText}>• If wasla (ٱ) connects properly → Success!</Text>
        <Text style={styles.expectedText}>• If all fonts look the same → Font loading completely broken</Text>
        <Text style={styles.expectedText}>• This tests 4 different font family names</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  infoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 3,
  },
  testSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007bff',
  },
  testText: {
    fontSize: 48,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#dee2e6',
    includeFontPadding: false,
    minWidth: 200,
    marginBottom: 10,
  },
  debugContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#f57c00',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  expectedContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
  },
  expectedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  expectedText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 3,
  },
});

export default FontRequireTest;
