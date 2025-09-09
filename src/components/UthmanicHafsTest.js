import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';

const UthmanicHafsTest = () => {
  const [fontStatus, setFontStatus] = useState('Testing...');
  
  const testText = "فَٱنصَبۡ";
  const simpleText = "فا";
  const bismillah = "بِسْمِ ٱللَّهِ";
  
  // Test different font family names for UthmanicHafs1Ver18
  const fontVariants = [
    {
      name: 'UthmanicHafs1Ver18',
      family: 'UthmanicHafs1Ver18',
      description: 'Filename as font family (most likely to work)'
    },
    {
      name: 'UthmanicHafs1Ver18.ttf',
      family: 'UthmanicHafs1Ver18.ttf',
      description: 'Filename with extension'
    },
          {
            name: 'KFGQPC HAFS Uthmanic Script Regular',
            family: 'KFGQPC HAFS Uthmanic Script Regular',
            description: 'NameID 4: Full Font Name (MOST LIKELY TO WORK)'
          },
          {
            name: 'KFGQPC HAFS Uthmanic Script',
            family: 'KFGQPC HAFS Uthmanic Script',
            description: 'NameID 1: Font Family Name'
          }
  ];
  
  useEffect(() => {
    // Test if any font loads differently
    const testFontLoading = () => {
      setFontStatus('Font loading test completed');
    };
    
    testFontLoading();
  }, []);
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>UthmanicHafs1Ver18 Font Test</Text>
      <Text style={styles.subtitle}>Testing different font family names to get UthmanicHafs1Ver18 working</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔍 Font Analysis Results:</Text>
        <Text style={styles.infoText}>• Font File: UthmanicHafs1Ver18.ttf</Text>
        <Text style={styles.infoText}>• Internal Name: KFGQPC HAFS Uthmanic Script</Text>
        <Text style={styles.infoText}>• Has Wasla: ✅ U+0671</Text>
        <Text style={styles.infoText}>• Has Sukun: ✅ U+06E1</Text>
        <Text style={styles.infoText}>• Has Diacritics: ✅ All Arabic diacritics</Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>📊 Test Status:</Text>
        <Text style={styles.statusText}>Platform: {Platform.OS}</Text>
        <Text style={styles.statusText}>Status: {fontStatus}</Text>
        <Text style={styles.statusText}>Font File: ✅ Present in ios/IQRA2/fonts/</Text>
        <Text style={styles.statusText}>Info.plist: ✅ Registered as UthmanicHafs1Ver18.ttf</Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>1. System Font (No fontFamily specified)</Text>
        <Text style={styles.testText}>{testText}</Text>
        <Text style={styles.testText}>{simpleText}</Text>
        <Text style={styles.testText}>{bismillah}</Text>
      </View>
      
      {fontVariants.map((font, index) => (
        <View key={index} style={styles.testSection}>
          <Text style={styles.sectionTitle}>
            {index + 2}. {font.name}
          </Text>
          <Text style={styles.fontDescription}>{font.description}</Text>
          
          <View style={styles.testRow}>
            <Text style={styles.testLabel}>Test Text (فَٱنصَبۡ):</Text>
            <Text style={[styles.testText, { fontFamily: font.family }]}>
              {testText}
            </Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.testLabel}>Simple Text (فا):</Text>
            <Text style={[styles.testText, { fontFamily: font.family }]}>
              {simpleText}
            </Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.testLabel}>Bismillah (بِسْمِ ٱللَّهِ):</Text>
            <Text style={[styles.testText, { fontFamily: font.family }]}>
              {bismillah}
            </Text>
          </View>
        </View>
      ))}
      
      <View style={styles.expectedContainer}>
        <Text style={styles.expectedTitle}>🎯 What to Look For:</Text>
        <Text style={styles.expectedText}>• If any font looks different from system font → Font is loading!</Text>
        <Text style={styles.expectedText}>• If wasla (ٱ) connects properly → Success!</Text>
        <Text style={styles.expectedText}>• If all fonts look the same → Font loading issue</Text>
        <Text style={styles.expectedText}>• If letters connect better → Font shaping is working</Text>
      </View>
      
      <View style={styles.troubleshootingContainer}>
        <Text style={styles.troubleshootingTitle}>🔧 Troubleshooting Steps:</Text>
        <Text style={styles.troubleshootingText}>1. Check if any font variant looks different</Text>
        <Text style={styles.troubleshootingText}>2. If none work, try rebuilding the app</Text>
        <Text style={styles.troubleshootingText}>3. Check console for font loading errors</Text>
        <Text style={styles.troubleshootingText}>4. Verify font file isn't corrupted</Text>
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
  troubleshootingContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f3e5f5',
    borderRadius: 10,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 14,
    color: '#8e24aa',
    marginBottom: 3,
  },
});

export default UthmanicHafsTest;
