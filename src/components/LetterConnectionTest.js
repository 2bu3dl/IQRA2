import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const LetterConnectionTest = () => {
  // Test different Arabic letter combinations
  const testCases = [
    {
      name: "Original word from qpc-hafs-word-by-word.json",
      text: "فَٱنصَبۡ",
      description: "The problematic word with wasla"
    },
    {
      name: "With regular alif instead of wasla",
      text: "فَانصَبۡ", 
      description: "Replace wasla (ٱ) with regular alif (ا)"
    },
    {
      name: "Simple test: fa + alif",
      text: "فا",
      description: "Basic connection test"
    },
    {
      name: "Simple test: alif + nun",
      text: "ان",
      description: "Another basic connection test"
    },
    {
      name: "Simple test: nun + sad",
      text: "نص",
      description: "Another basic connection test"
    },
    {
      name: "Simple test: sad + ba",
      text: "صب",
      description: "Test the problematic ba connection"
    },
    {
      name: "Word without wasla",
      text: "انصَبۡ",
      description: "Remove the fa and wasla to isolate the issue"
    },
    {
      name: "Just the last two letters",
      text: "صَبۡ",
      description: "Focus on the sad + ba connection"
    }
  ];

  const fontsToTest = [
    'KFGQPC Uthman Taha Naskh',
    'KFGQPC KSA Heavy'
  ];

  const baseStyle = {
    fontSize: 48,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 10,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Arabic Letter Connection Test</Text>
      <Text style={styles.subtitle}>Testing letter connections in different fonts</Text>
      
      {testCases.map((testCase, caseIndex) => (
        <View key={caseIndex} style={styles.testCaseContainer}>
          <Text style={styles.testCaseName}>{testCase.name}</Text>
          <Text style={styles.testCaseDescription}>{testCase.description}</Text>
          <Text style={styles.testCaseText}>Text: {testCase.text}</Text>
          
          {fontsToTest.map((font, fontIndex) => (
            <View key={fontIndex} style={styles.fontTestContainer}>
              <Text style={styles.fontLabel}>Font: {font}</Text>
              <View style={styles.wordContainer}>
                <Text style={[baseStyle, { fontFamily: font }]}>
                  {testCase.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
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
    marginBottom: 20,
    color: '#666666',
    textAlign: 'center'
  },
  testCaseContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  testCaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  testCaseDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5
  },
  testCaseText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 15,
    fontFamily: 'monospace'
  },
  fontTestContainer: {
    marginBottom: 15,
    alignItems: 'center'
  },
  fontLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  wordContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    minWidth: 200
  }
});

export default LetterConnectionTest;
