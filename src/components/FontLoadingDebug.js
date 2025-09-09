import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';

const FontLoadingDebug = () => {
  const [fontStatus, setFontStatus] = useState({});
  
  const testText = "فَٱنصَبۡ";
  const simpleText = "فا";
  
  const fontsToTest = [
    {
      name: 'KFGQPC HAFS Uthmanic Script',
      family: 'KFGQPC HAFS Uthmanic Script',
      description: 'Exact name from fc-query'
    },
    {
      name: 'UthmanicHafs1Ver18',
      family: 'UthmanicHafs1Ver18',
      description: 'Filename as font family'
    },
    {
      name: 'KFGQPC Uthman Taha Naskh',
      family: 'KFGQPC Uthman Taha Naskh',
      description: 'Known working font'
    },
    {
      name: 'System Default',
      family: undefined,
      description: 'No font family specified'
    }
  ];
  
  useEffect(() => {
    // Test font loading by checking if text renders differently
    const testFontLoading = () => {
      const status = {};
      fontsToTest.forEach(font => {
        // This is a simple test - in a real app you'd use Font.loadAsync or similar
        status[font.name] = 'Testing...';
      });
      setFontStatus(status);
    };
    
    testFontLoading();
  }, []);
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Font Loading Debug</Text>
      <Text style={styles.subtitle}>Testing different font family names and loading methods</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔍 Debugging Steps:</Text>
        <Text style={styles.infoText}>1. Check if font files are in iOS bundle</Text>
        <Text style={styles.infoText}>2. Check if font is registered in Info.plist</Text>
        <Text style={styles.infoText}>3. Check if font family name is correct</Text>
        <Text style={styles.infoText}>4. Check if React Native can load the font</Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>📊 Current Status:</Text>
        <Text style={styles.statusText}>Platform: {Platform.OS}</Text>
        <Text style={styles.statusText}>Font File: ✅ Present in ios/IQRA2/fonts/</Text>
        <Text style={styles.statusText}>Info.plist: ✅ Registered as UthmanicHafs1Ver18.ttf</Text>
        <Text style={styles.statusText}>Font Family: KFGQPC HAFS Uthmanic Script</Text>
      </View>
      
      {fontsToTest.map((font, index) => (
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
            <Text style={styles.testLabel}>Status:</Text>
            <Text style={styles.statusText}>
              {fontStatus[font.name] || 'Not tested'}
            </Text>
          </View>
        </View>
      ))}
      
      <View style={styles.expectedContainer}>
        <Text style={styles.expectedTitle}>🎯 What to Look For:</Text>
        <Text style={styles.expectedText}>• If all fonts look the same → Font loading issue</Text>
        <Text style={styles.expectedText}>• If some fonts look different → Font loading works</Text>
        <Text style={styles.expectedText}>• If KFGQPC HAFS Uthmanic Script looks different → Success!</Text>
        <Text style={styles.expectedText}>• If wasla connects in any font → That font works</Text>
      </View>
      
      <View style={styles.troubleshootingContainer}>
        <Text style={styles.troubleshootingTitle}>🔧 Troubleshooting:</Text>
        <Text style={styles.troubleshootingText}>1. Try rebuilding the app completely</Text>
        <Text style={styles.troubleshootingText}>2. Check Metro cache is cleared</Text>
        <Text style={styles.troubleshootingText}>3. Verify font file isn't corrupted</Text>
        <Text style={styles.troubleshootingText}>4. Try different font family names</Text>
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

export default FontLoadingDebug;
