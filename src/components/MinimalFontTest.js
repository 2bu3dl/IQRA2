import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MinimalFontTest = () => {
  const testText = "فَٱنصَبۡ";
  const simpleText = "فا";
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Minimal Font Test</Text>
      <Text style={styles.subtitle}>Testing with minimal setup</Text>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>1. No Font (System Default)</Text>
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
        <Text style={styles.sectionTitle}>3. KFGQPC HAFS Uthmanic Script Regular</Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC HAFS Uthmanic Script Regular' }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC HAFS Uthmanic Script Regular' }]}>
          {simpleText}
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>4. KSAHeavy (Known Working)</Text>
        <Text style={[styles.testText, { fontFamily: 'KSAHeavy' }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: 'KSAHeavy' }]}>
          {simpleText}
        </Text>
      </View>
      
      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>🔍 Analysis:</Text>
        <Text style={styles.analysisText}>
          • If sections 2-3 look different from section 1 → UthmanicHafs1Ver18 is loading!
        </Text>
        <Text style={styles.analysisText}>
          • If section 4 looks different from section 1 → Font loading works in general
        </Text>
        <Text style={styles.analysisText}>
          • If ALL sections look identical → Font loading is completely broken
        </Text>
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
  analysisContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 3,
  },
});

export default MinimalFontTest;
