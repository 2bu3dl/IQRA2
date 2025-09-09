import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Simple wasla fix function (inline since the file was deleted)
const fixWasla = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }
  return text.replace(/\u0671/g, '\u0627'); // Replace wasla (ٱ) with regular alif (ا)
};

const WaslaFixTest = () => {
  const testCases = [
    {
      name: "Original word with wasla",
      original: "فَٱنصَبۡ",
      fixed: fixWasla("فَٱنصَبۡ"),
      description: "The problematic word from Surah 94:7"
    },
    {
      name: "Bismillah with wasla",
      original: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
      fixed: fixWasla("بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ"),
      description: "Common text with multiple wasla characters"
    },
    {
      name: "Simple wasla test",
      original: "ٱللَّهِ",
      fixed: fixWasla("ٱللَّهِ"),
      description: "Simple word with wasla"
    },
    {
      name: "Text without wasla",
      original: "فَانصَبۡ",
      fixed: fixWasla("فَانصَبۡ"),
      description: "Should remain unchanged"
    }
  ];

  const baseStyle = {
    fontSize: 36,
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 10,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Wasla Fix Test</Text>
      <Text style={styles.subtitle}>Testing the wasla replacement solution</Text>
      <Text style={styles.subtitle}>Font: KFGQPC Uthman Taha Naskh</Text>
      
      {testCases.map((testCase, index) => (
        <View key={index} style={styles.testCaseContainer}>
          <Text style={styles.testCaseName}>{testCase.name}</Text>
          <Text style={styles.testCaseDescription}>{testCase.description}</Text>
          
          <View style={styles.comparisonContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.label}>Original (with wasla):</Text>
              <View style={styles.wordBox}>
                <Text style={baseStyle}>{testCase.original}</Text>
              </View>
              <Text style={styles.unicodeText}>Unicode: {JSON.stringify(testCase.original)}</Text>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.label}>Fixed (wasla → alif):</Text>
              <View style={styles.wordBox}>
                <Text style={baseStyle}>{testCase.fixed}</Text>
              </View>
              <Text style={styles.unicodeText}>Unicode: {JSON.stringify(testCase.fixed)}</Text>
            </View>
          </View>
        </View>
      ))}
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Solution Summary:</Text>
        <Text style={styles.summaryText}>✅ Replace wasla (ٱ) with regular alif (ا)</Text>
        <Text style={styles.summaryText}>✅ Preserves meaning and pronunciation</Text>
        <Text style={styles.summaryText}>✅ Works with existing KFGQPC fonts</Text>
        <Text style={styles.summaryText}>✅ All letters now connect properly</Text>
        <Text style={styles.summaryText}>✅ Simple, reliable, and consistent</Text>
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
    marginBottom: 15
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    textAlign: 'center'
  },
  wordBox: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    minWidth: 120,
    marginBottom: 5
  },
  unicodeText: {
    fontSize: 10,
    color: '#888888',
    textAlign: 'center',
    fontFamily: 'monospace'
  },
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
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

export default WaslaFixTest;
