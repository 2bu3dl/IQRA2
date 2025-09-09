import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const OfficialFontTest = () => {
  const testWord = "فَٱنصَبۡ";
  
  // Test cases following ChatGPT's recommendations
  const testCases = [
    {
      name: "Original Text (No Changes)",
      text: testWord,
      description: "Original text with wasla - should work with proper font"
    },
    {
      name: "ZWJ Before Wasla",
      text: "فَ\u200Dٱنصَبۡ", // ZWJ before wasla
      description: "Zero Width Joiner before wasla character"
    },
    {
      name: "ZWJ After Wasla", 
      text: "فَٱ\u200Dنصَبۡ", // ZWJ after wasla
      description: "Zero Width Joiner after wasla character"
    },
    {
      name: "ZWJ Both Sides",
      text: "فَ\u200Dٱ\u200Dنصَبۡ", // ZWJ before and after
      description: "Zero Width Joiner on both sides of wasla"
    },
    {
      name: "ZWNJ Before, ZWJ After",
      text: "فَ\u200Cٱ\u200Dنصَبۡ", // ZWNJ before, ZWJ after
      description: "Zero Width Non-Joiner before, ZWJ after"
    }
  ];

  const fontsToTest = [
    {
      name: "KFGQPC HAFS Uthmanic Script (Official)",
      fontFamily: 'KFGQPC HAFS Uthmanic Script'
    },
    {
      name: "KFGQPC Uthman Taha Naskh",
      fontFamily: 'KFGQPC Uthman Taha Naskh'
    },
    {
      name: "KFGQPC KSA Heavy",
      fontFamily: 'KFGQPC KSA Heavy'
    },
    {
      name: "System Default",
      fontFamily: undefined
    }
  ];

  const baseStyle = {
    fontSize: 48,
    textAlign: 'center',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 10,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Official Font + Unicode Test</Text>
      <Text style={styles.subtitle}>Following ChatGPT's recommendations</Text>
      <Text style={styles.subtitle}>Word: {testWord}</Text>
      
      {testCases.map((testCase, caseIndex) => (
        <View key={caseIndex} style={styles.testCaseContainer}>
          <Text style={styles.testCaseName}>{testCase.name}</Text>
          <Text style={styles.testCaseDescription}>{testCase.description}</Text>
          <Text style={styles.testCaseText}>Text: {testCase.text}</Text>
          
          {fontsToTest.map((font, fontIndex) => (
            <View key={fontIndex} style={styles.fontTestContainer}>
              <Text style={styles.fontLabel}>Font: {font.name}</Text>
              <View style={styles.wordContainer}>
                <Text style={[baseStyle, { fontFamily: font.fontFamily }]}>
                  {testCase.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>What to Look For:</Text>
        <Text style={styles.summaryText}>• Does the official KFGQPC HAFS font handle wasla properly?</Text>
        <Text style={styles.summaryText}>• Do any of the ZWJ/ZWNJ approaches improve connections?</Text>
        <Text style={styles.summaryText}>• Which combination works best?</Text>
        <Text style={styles.summaryText}>• Remember: Only apply fixes at render time, not in stored data</Text>
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
    marginBottom: 5,
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

export default OfficialFontTest;
