import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const WorkingFontTest = () => {
  const testText = "فَٱنصَبۡ";
  const simpleText = "فا";
  const bismillah = "بِسْمِ ٱللَّهِ";
  
  // Test fonts that we know are working
  const workingFonts = [
    {
      name: 'KSAHeavy',
      family: 'KSAHeavy',
      description: 'Known working font'
    },
    {
      name: 'KSA Heavy',
      family: 'KSA Heavy',
      description: 'Alternative name for KSAHeavy'
    },
    {
      name: 'Montserrat-Regular',
      family: 'Montserrat-Regular',
      description: 'English font (should work)'
    },
    {
      name: 'KFGQPC HAFS Uthmanic Script Regular',
      family: 'KFGQPC HAFS Uthmanic Script Regular',
      description: 'UthmanicHafs1Ver18 with correct full name'
    },
    {
      name: 'System Default',
      family: undefined,
      description: 'No font family specified'
    }
  ];
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Working Font Test</Text>
      <Text style={styles.subtitle}>Testing fonts that should definitely work</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔍 Testing Strategy:</Text>
        <Text style={styles.infoText}>• Test fonts we know are working</Text>
        <Text style={styles.infoText}>• If these work, font loading is functional</Text>
        <Text style={styles.infoText}>• If these don't work, there's a deeper issue</Text>
      </View>
      
      {workingFonts.map((font, index) => (
        <View key={index} style={styles.testSection}>
          <Text style={styles.sectionTitle}>
            {index + 1}. {font.name}
          </Text>
          <Text style={styles.fontDescription}>{font.description}</Text>
          
          <View style={styles.testRow}>
            <Text style={styles.testLabel}>Test Text (فَٱنصَبۡ):</Text>
            <Text style={[styles.testText, font.family ? { fontFamily: font.family } : {}]}>
              {testText}
            </Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.testLabel}>Simple Text (فا):</Text>
            <Text style={[styles.testText, font.family ? { fontFamily: font.family } : {}]}>
              {simpleText}
            </Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.testLabel}>Bismillah (بِسْمِ ٱللَّهِ):</Text>
            <Text style={[styles.testText, font.family ? { fontFamily: font.family } : {}]}>
              {bismillah}
            </Text>
          </View>
        </View>
      ))}
      
      <View style={styles.expectedContainer}>
        <Text style={styles.expectedTitle}>🎯 What to Look For:</Text>
        <Text style={styles.expectedText}>• If KSAHeavy looks different → Font loading works!</Text>
        <Text style={styles.expectedText}>• If Montserrat looks different → Font loading works!</Text>
        <Text style={styles.expectedText}>• If all fonts look the same → Font loading is broken</Text>
        <Text style={styles.expectedText}>• This will tell us if the issue is specific to UthmanicHafs1Ver18</Text>
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
    marginBottom: 5,
    color: '#007bff',
  },
  fontDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  testRow: {
    marginBottom: 15,
    alignItems: 'center',
  },
  testLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
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

export default WorkingFontTest;
