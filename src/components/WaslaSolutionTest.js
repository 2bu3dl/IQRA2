import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { processQuranText, hasMissingCharacters, getMissingCharacters } from '../utils/waslaReplacer';

const WaslaSolutionTest = () => {
  const originalText = "فَٱنصَبۡ";
  const processedText = processQuranText(originalText);
  const hasMissing = hasMissingCharacters(originalText);
  const missingChars = getMissingCharacters(originalText);
  
  const testCases = [
    {
      text: "فَٱنصَبۡ",
      description: "Surah Ash-Sharh Ayah 7 (original problem)"
    },
    {
      text: "بِسْمِ ٱللَّهِ",
      description: "Bismillah (common text)"
    },
    {
      text: "ٱلْحَمْدُ لِلَّهِ",
      description: "Alhamdulillah (with wasla)"
    },
    {
      text: "فَٱعْلَمْ",
      description: "Simple wasla test"
    }
  ];
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Wasla Solution Test</Text>
      <Text style={styles.subtitle}>Definitive solution: Replace missing characters in source data</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔍 Root Cause Analysis:</Text>
        <Text style={styles.infoText}>• ALL fonts missing wasla (U+0671)</Text>
        <Text style={styles.infoText}>• ALL fonts missing sukun (U+06E1)</Text>
        <Text style={styles.infoText}>• Font loading issues with UthmanicHafs1Ver18</Text>
        <Text style={styles.infoText}>• Solution: Replace missing characters in source data</Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>📊 Test Results:</Text>
        <Text style={styles.statusText}>Original: {originalText}</Text>
        <Text style={styles.statusText}>Processed: {processedText}</Text>
        <Text style={styles.statusText}>Has Missing: {hasMissing ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>Missing Chars: {missingChars.join(', ')}</Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>1. Original Text (with missing characters)</Text>
        <Text style={styles.testText}>{originalText}</Text>
        <Text style={styles.explanation}>
          This shows the disconnected wasla (ٱ) and diacritics
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>2. Processed Text (missing characters replaced)</Text>
        <Text style={styles.testText}>{processedText}</Text>
        <Text style={styles.explanation}>
          This shows connected letters with wasla replaced by alif
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>3. Multiple Test Cases</Text>
        {testCases.map((testCase, index) => {
          const processed = processQuranText(testCase.text);
          return (
            <View key={index} style={styles.testCase}>
              <Text style={styles.testLabel}>{testCase.description}:</Text>
              <Text style={styles.testText}>{testCase.text}</Text>
              <Text style={styles.testText}>{processed}</Text>
            </View>
          );
        })}
      </View>
      
      <View style={styles.solutionContainer}>
        <Text style={styles.solutionTitle}>✅ The Solution:</Text>
        <Text style={styles.solutionText}>1. Replace wasla (ٱ) with alif (ا) in source data</Text>
        <Text style={styles.solutionText}>2. Remove problematic diacritics that cause spacing</Text>
        <Text style={styles.solutionText}>3. Use any available Arabic font (all have basic letters)</Text>
        <Text style={styles.solutionText}>4. This preserves the meaning while fixing display</Text>
      </View>
      
      <View style={styles.implementationContainer}>
        <Text style={styles.implementationTitle}>🚀 Implementation:</Text>
        <Text style={styles.implementationText}>• Use processQuranText() for all Quran text</Text>
        <Text style={styles.implementationText}>• Apply to MemorizationScreen, SurahListScreen, etc.</Text>
        <Text style={styles.implementationText}>• Works with any Arabic font</Text>
        <Text style={styles.implementationText}>• No font loading issues</Text>
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
    backgroundColor: '#ffebee',
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#d32f2f',
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
  explanation: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  testCase: {
    marginBottom: 15,
    alignItems: 'center',
  },
  testLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  solutionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  solutionText: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 3,
  },
  implementationContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
  },
  implementationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  implementationText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 3,
  },
});

export default WaslaSolutionTest;
