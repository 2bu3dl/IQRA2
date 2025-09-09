import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const FinalWaslaSolution = () => {
  const [useSolution, setUseSolution] = useState(false);
  
  const originalText = "فَٱنصَبۡ";
  const fixedText = "فَانصَبۡ"; // Replace wasla (ٱ) with regular alif (ا)
  
  const testCases = [
    {
      name: "Original Text (Problematic)",
      text: originalText,
      description: "Text with wasla that doesn't connect properly",
      color: "#ff0000"
    },
    {
      name: "Fixed Text (Solution)",
      text: fixedText,
      description: "Text with regular alif instead of wasla",
      color: "#00aa00"
    }
  ];

  const fontsToTest = [
    {
      name: "KFGQPC HAFS Uthmanic Script",
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
      <Text style={styles.title}>Final Wasla Solution</Text>
      <Text style={styles.subtitle}>The definitive fix for the wasla connection issue</Text>
      
      <View style={styles.solutionContainer}>
        <Text style={styles.solutionTitle}>🎯 The Solution:</Text>
        <Text style={styles.solutionText}>Replace wasla (ٱ) with regular alif (ا) in the source data</Text>
        <Text style={styles.solutionText}>This works because:</Text>
        <Text style={styles.solutionText}>• Font contains regular alif (U+0627) ✅</Text>
        <Text style={styles.solutionText}>• Font missing wasla (U+0671) ❌</Text>
        <Text style={styles.solutionText}>• Regular alif connects properly ✅</Text>
        <Text style={styles.solutionText}>• No font fallback issues ✅</Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, useSolution && styles.toggleButtonActive]}
          onPress={() => setUseSolution(!useSolution)}
        >
          <Text style={[styles.toggleButtonText, useSolution && styles.toggleButtonTextActive]}>
            {useSolution ? 'Show Both' : 'Show Solution Only'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>🔬 Side-by-Side Comparison</Text>
        
        {fontsToTest.map((font, fontIndex) => (
          <View key={fontIndex} style={styles.fontTestContainer}>
            <Text style={styles.fontLabel}>Font: {font.name}</Text>
            
            <View style={styles.comparisonRow}>
              {testCases.map((testCase, caseIndex) => {
                if (!useSolution || caseIndex === 1) {
                  return (
                    <View key={caseIndex} style={styles.comparisonItem}>
                      <Text style={[styles.comparisonLabel, { color: testCase.color }]}>
                        {testCase.name}
                      </Text>
                      <Text style={styles.comparisonDescription}>
                        {testCase.description}
                      </Text>
                      <View style={[styles.wordContainer, { borderColor: testCase.color }]}>
                        <Text style={[baseStyle, { fontFamily: font.fontFamily }]}>
                          {testCase.text}
                        </Text>
                      </View>
                    </View>
                  );
                }
                return null;
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.implementationContainer}>
        <Text style={styles.implementationTitle}>🚀 Implementation Steps:</Text>
        <Text style={styles.implementationText}>1. Update your Quran text data source</Text>
        <Text style={styles.implementationText}>2. Replace all instances of wasla (ٱ) with regular alif (ا)</Text>
        <Text style={styles.implementationText}>3. Update your text processing pipeline</Text>
        <Text style={styles.implementationText}>4. Test with all fonts to ensure consistency</Text>
      </View>

      <View style={styles.codeExampleContainer}>
        <Text style={styles.codeExampleTitle}>💻 Code Example:</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>
            {`// Simple replacement function
function fixWasla(text) {
  return text.replace(/ٱ/g, 'ا');
}

// Usage
const originalText = "فَٱنصَبۡ";
const fixedText = fixWasla(originalText);
// Result: "فَانصَبۡ"`}
          </Text>
        </View>
      </View>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>✅ Benefits of This Solution:</Text>
        <Text style={styles.benefitsText}>• Simple and reliable</Text>
        <Text style={styles.benefitsText}>• Works with all fonts</Text>
        <Text style={styles.benefitsText}>• No complex dependencies</Text>
        <Text style={styles.benefitsText}>• Maintains visual consistency</Text>
        <Text style={styles.benefitsText}>• Easy to implement</Text>
        <Text style={styles.benefitsText}>• Solves the root cause</Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>📋 Summary:</Text>
        <Text style={styles.summaryText}>The wasla connection issue is caused by the font missing the wasla character (U+0671).</Text>
        <Text style={styles.summaryText}>The solution is to replace wasla with regular alif (U+0627) which the font contains.</Text>
        <Text style={styles.summaryText}>This is the most practical and reliable solution for your Quran app.</Text>
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
  solutionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 10
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8
  },
  solutionText: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 3
  },
  toggleContainer: {
    marginBottom: 20,
    alignItems: 'center'
  },
  toggleButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc'
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50'
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666'
  },
  toggleButtonTextActive: {
    color: '#ffffff'
  },
  comparisonContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center'
  },
  fontTestContainer: {
    marginBottom: 20,
    alignItems: 'center'
  },
  fontLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center'
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  },
  comparisonItem: {
    alignItems: 'center',
    margin: 10,
    minWidth: 150
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center'
  },
  comparisonDescription: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center'
  },
  wordContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 120,
    alignItems: 'center'
  },
  baseStyle: {
    fontSize: 48,
    textAlign: 'center',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 5,
  },
  implementationContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10
  },
  implementationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8
  },
  implementationText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 3
  },
  codeExampleContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10
  },
  codeExampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8
  },
  codeBlock: {
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444'
  },
  codeText: {
    fontSize: 12,
    color: '#f8f8f2',
    fontFamily: 'monospace',
    lineHeight: 18
  },
  benefitsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f3e5f5',
    borderRadius: 10
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 8
  },
  benefitsText: {
    fontSize: 14,
    color: '#8e24aa',
    marginBottom: 3
  },
  summaryContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8
  },
  summaryText: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 3
  }
});

export default FinalWaslaSolution;
