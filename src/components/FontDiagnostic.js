import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';

const FontDiagnostic = () => {
  const [fontResults, setFontResults] = useState({});
  const testText = "فَٱنصَبۡ";
  const simpleText = "فا";
  
  // Test ALL possible font family names
  const fontTests = [
    { name: 'System Default', family: undefined, description: 'No font specified' },
    { name: 'UthmanicHafs1Ver18', family: 'UthmanicHafs1Ver18', description: 'Filename' },
    { name: 'UthmanicHafs1Ver18.ttf', family: 'UthmanicHafs1Ver18.ttf', description: 'Filename with extension' },
    { name: 'KFGQPC HAFS Uthmanic Script Regular', family: 'KFGQPC HAFS Uthmanic Script Regular', description: 'Full font name' },
    { name: 'KFGQPC HAFS Uthmanic Script', family: 'KFGQPC HAFS Uthmanic Script', description: 'Font family name' },
    { name: 'KFGQPCHAFSUthmanicScript-Regula', family: 'KFGQPCHAFSUthmanicScript-Regula', description: 'PostScript name' },
    { name: 'KSAHeavy', family: 'KSAHeavy', description: 'Known working font' },
    { name: 'Montserrat-Regular', family: 'Montserrat-Regular', description: 'English font' },
  ];

  useEffect(() => {
    // Test if fonts are actually loading by comparing text metrics
    const testFontLoading = () => {
      const results = {};
      
      fontTests.forEach(font => {
        // Create a test element to measure text width
        // If font loads, text width might be different
        results[font.name] = {
          family: font.family,
          description: font.description,
          status: 'Testing...'
        };
      });
      
      setFontResults(results);
    };
    
    testFontLoading();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Font Loading Diagnostic</Text>
      <Text style={styles.subtitle}>Testing ALL possible font family names</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🎯 What This Tests:</Text>
        <Text style={styles.infoText}>• If any font looks different → Font is loading!</Text>
        <Text style={styles.infoText}>• If all fonts look identical → Font loading is broken</Text>
        <Text style={styles.infoText}>• We're testing 8 different font family names</Text>
      </View>

      {fontTests.map((font, index) => (
        <View key={index} style={styles.testSection}>
          <Text style={styles.sectionTitle}>
            {index + 1}. {font.name}
          </Text>
          <Text style={styles.fontDescription}>{font.description}</Text>
          
          <View style={styles.textContainer}>
            <Text style={styles.label}>Test Text:</Text>
            <Text style={[styles.testText, { fontFamily: font.family }]}>
              {testText}
            </Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.label}>Simple Text:</Text>
            <Text style={[styles.testText, { fontFamily: font.family }]}>
              {simpleText}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Status: {fontResults[font.name]?.status || 'Testing...'}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.conclusionContainer}>
        <Text style={styles.conclusionTitle}>🔍 Analysis:</Text>
        <Text style={styles.conclusionText}>
          • If sections 2-6 look different from section 1 → UthmanicHafs1Ver18 is loading!
        </Text>
        <Text style={styles.conclusionText}>
          • If sections 7-8 look different from section 1 → Font loading works in general
        </Text>
        <Text style={styles.conclusionText}>
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
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007bff',
  },
  fontDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  textContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
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
  statusContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  conclusionContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  conclusionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  conclusionText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 3,
  },
});

export default FontDiagnostic;
