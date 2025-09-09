import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getRecommendedArabicFont } from '../utils/fontChecker';

const FontPriorityTest = () => {
  const testText = "فَٱنصَبۡ";
  const simpleText = "فا";
  const recommendedFont = getRecommendedArabicFont();
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Font Priority Fix Test</Text>
      <Text style={styles.subtitle}>Testing if UthmanicHafs1Ver18 is now the primary font</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔧 What We Fixed:</Text>
        <Text style={styles.infoText}>• Swapped font priority: UthmanicHafs1Ver18 → First</Text>
        <Text style={styles.infoText}>• UthmanTN_v2-0 → Second (fallback)</Text>
        <Text style={styles.infoText}>• UthmanicHafs1Ver18 HAS wasla (U+0671)</Text>
        <Text style={styles.infoText}>• UthmanTN_v2-0 MISSING wasla</Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>📊 Current Status:</Text>
        <Text style={styles.statusText}>Recommended Font: {recommendedFont}</Text>
        <Text style={styles.statusText}>
          {recommendedFont === 'KFGQPC HAFS Uthmanic Script' ? '✅ CORRECT' : '❌ WRONG'}
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>1. Using Recommended Font (should be UthmanicHafs1Ver18)</Text>
        <Text style={[styles.testText, { fontFamily: recommendedFont }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: recommendedFont }]}>
          {simpleText}
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>2. Direct UthmanicHafs1Ver18 (KFGQPC HAFS Uthmanic Script)</Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC HAFS Uthmanic Script' }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC HAFS Uthmanic Script' }]}>
          {simpleText}
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>3. Old Priority Font (UthmanTN_v2-0) - Should be different</Text>
        <Text style={[styles.testText, { fontFamily: 'UthmanTN_v2-0' }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: 'UthmanTN_v2-0' }]}>
          {simpleText}
        </Text>
      </View>
      
      <View style={styles.expectedContainer}>
        <Text style={styles.expectedTitle}>🎯 Expected Results:</Text>
        <Text style={styles.expectedText}>• Sections 1 & 2 should look the same (both using UthmanicHafs1Ver18)</Text>
        <Text style={styles.expectedText}>• Section 3 should look different (using UthmanTN_v2-0)</Text>
        <Text style={styles.expectedText}>• Wasla (ٱ) should connect properly in sections 1 & 2</Text>
        <Text style={styles.expectedText}>• ب should connect properly in all sections</Text>
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
  statusContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 3,
    fontFamily: 'monospace',
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
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#dee2e6',
    includeFontPadding: false,
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

export default FontPriorityTest;
