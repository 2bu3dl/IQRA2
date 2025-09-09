import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const SimpleFontTest = () => {
  const testText = "فَٱنصَبۡ";
  const simpleText = "فا";
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simple Font Test</Text>
      <Text style={styles.subtitle}>Testing the most likely font family name</Text>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>1. System Font (No fontFamily)</Text>
        <Text style={styles.testText}>{testText}</Text>
        <Text style={styles.testText}>{simpleText}</Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>2. UthmanicHafs1Ver18 (Filename)</Text>
        <Text style={[styles.testText, { fontFamily: 'UthmanicHafs1Ver18' }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: 'UthmanicHafs1Ver18' }]}>
          {simpleText}
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>3. KFGQPC HAFS Uthmanic Script Regular (Full Name)</Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC HAFS Uthmanic Script Regular' }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC HAFS Uthmanic Script Regular' }]}>
          {simpleText}
        </Text>
      </View>
      
      <View style={styles.expectedContainer}>
        <Text style={styles.expectedTitle}>🎯 What to Look For:</Text>
        <Text style={styles.expectedText}>• If sections 2 or 3 look different from section 1 → Font is loading!</Text>
        <Text style={styles.expectedText}>• If wasla (ٱ) connects properly → Success!</Text>
        <Text style={styles.expectedText}>• If all sections look the same → Font loading is broken</Text>
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

export default SimpleFontTest;
