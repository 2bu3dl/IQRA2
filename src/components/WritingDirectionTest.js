import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const WritingDirectionTest = () => {
  const testCases = [
    {
      name: "Original word with wasla",
      text: "فَٱنصَبۡ",
      description: "The problematic word from Surah 94:7"
    },
    {
      name: "Simple wasla test",
      text: "ٱن",
      description: "Wasla + nun"
    },
    {
      name: "Fa + wasla",
      text: "فٱ",
      description: "Fa + wasla"
    },
    {
      name: "Regular alif for comparison",
      text: "فا",
      description: "Fa + regular alif"
    }
  ];

  const directionTests = [
    {
      name: "RTL (Right-to-Left)",
      writingDirection: 'rtl',
      description: "Current setting - might be causing issues"
    },
    {
      name: "LTR (Left-to-Right)", 
      writingDirection: 'ltr',
      description: "Opposite direction - might fix connections"
    },
    {
      name: "Auto (System Default)",
      writingDirection: 'auto',
      description: "Let the system decide"
    },
    {
      name: "No Direction Set",
      writingDirection: undefined,
      description: "No explicit direction"
    }
  ];

  const baseStyle = {
    fontSize: 48,
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    textAlign: 'center',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 10,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Writing Direction Test</Text>
      <Text style={styles.subtitle}>Testing if RTL direction is causing wasla connection issues</Text>
      
      {testCases.map((testCase, caseIndex) => (
        <View key={caseIndex} style={styles.testCaseContainer}>
          <Text style={styles.testCaseName}>{testCase.name}</Text>
          <Text style={styles.testCaseDescription}>{testCase.description}</Text>
          <Text style={styles.testCaseText}>Text: {testCase.text}</Text>
          
          {directionTests.map((directionTest, dirIndex) => (
            <View key={dirIndex} style={styles.directionTestContainer}>
              <Text style={styles.directionLabel}>
                {directionTest.name}: {directionTest.description}
              </Text>
              <View style={styles.wordContainer}>
                <Text style={[
                  baseStyle, 
                  { writingDirection: directionTest.writingDirection }
                ]}>
                  {testCase.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Theory:</Text>
        <Text style={styles.summaryText}>• RTL direction might be interfering with wasla connections</Text>
        <Text style={styles.summaryText}>• LTR or auto might allow proper letter connections</Text>
        <Text style={styles.summaryText}>• Look for differences in how wasla connects to previous letter</Text>
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
  directionTestContainer: {
    marginBottom: 15,
    alignItems: 'center'
  },
  directionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    textAlign: 'center'
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
    backgroundColor: '#fff3cd',
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

export default WritingDirectionTest;
