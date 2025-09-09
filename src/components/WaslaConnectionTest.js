import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const WaslaConnectionTest = () => {
  // Test wasla alif connections specifically
  const testCases = [
    {
      name: "Wasla alif + nun (from our word)",
      text: "ٱن",
      description: "Test wasla (ٱ) connecting to nun (ن)"
    },
    {
      name: "Regular alif + nun (for comparison)",
      text: "ان",
      description: "Test regular alif (ا) connecting to nun (ن)"
    },
    {
      name: "Fa + wasla alif",
      text: "فٱ",
      description: "Test fa (ف) connecting to wasla (ٱ)"
    },
    {
      name: "Fa + regular alif (for comparison)",
      text: "فا",
      description: "Test fa (ف) connecting to regular alif (ا)"
    },
    {
      name: "Original problematic word",
      text: "فَٱنصَبۡ",
      description: "The full word with wasla"
    },
    {
      name: "With regular alif instead",
      text: "فَانصَبۡ",
      description: "Replace wasla with regular alif"
    },
    {
      name: "Just fa + wasla + nun",
      text: "فٱن",
      description: "Focus on the problematic connection"
    },
    {
      name: "Just fa + regular alif + nun",
      text: "فان",
      description: "Compare with regular alif"
    },
    {
      name: "Wasla at word beginning",
      text: "ٱللَّهِ",
      description: "Common wasla usage (from Bismillah)"
    },
    {
      name: "Wasla in middle of word",
      text: "فَٱنصَبۡ",
      description: "Our specific case"
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
      <Text style={styles.title}>Wasla Alif Connection Test</Text>
      <Text style={styles.subtitle}>Testing wasla (ٱ) vs regular alif (ا) connections</Text>
      
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
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Key Questions:</Text>
        <Text style={styles.summaryText}>1. Does wasla (ٱ) connect to the previous letter?</Text>
        <Text style={styles.summaryText}>2. Does regular alif (ا) connect to the previous letter?</Text>
        <Text style={styles.summaryText}>3. Are there visual differences between the two?</Text>
        <Text style={styles.summaryText}>4. Which font handles wasla better?</Text>
      </View>
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
    marginBottom: 25,
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
  },
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f4f8',
    borderRadius: 10
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5
  }
});

export default WaslaConnectionTest;
