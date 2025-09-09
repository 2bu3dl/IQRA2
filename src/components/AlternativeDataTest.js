import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const AlternativeDataTest = () => {
  const [alternativeTexts, setAlternativeTexts] = useState([]);

  useEffect(() => {
    // Load alternative text sources
    const alternatives = [
      {
        name: "Original QPC HAFS",
        source: "qpc-hafs-word-by-word.json",
        text: "فَٱنصَبۡ",
        description: "Original source with wasla issue"
      },
      {
        name: "Manual Correction",
        source: "Manual fix",
        text: "فَانصَبۡ", // Regular alif instead of wasla
        description: "Manual replacement of wasla with regular alif"
      },
      {
        name: "Alternative Unicode",
        source: "Unicode variants",
        text: "فَٱنصَبۡ", // Keep original but test different approaches
        description: "Testing with different Unicode handling"
      },
      {
        name: "Font-Specific Variant",
        source: "Font optimization",
        text: "فَٱنصَبۡ",
        description: "Optimized for specific font rendering"
      }
    ];
    setAlternativeTexts(alternatives);
  }, []);

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
      <Text style={styles.title}>Alternative Data Sources Test</Text>
      <Text style={styles.subtitle}>Testing different text sources and approaches</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📚 Alternative Approaches:</Text>
        <Text style={styles.infoText}>• Different text sources and variants</Text>
        <Text style={styles.infoText}>• Manual corrections and optimizations</Text>
        <Text style={styles.infoText}>• Font-specific text variants</Text>
        <Text style={styles.infoText}>• Unicode handling differences</Text>
      </View>

      {alternativeTexts.map((alternative, altIndex) => (
        <View key={altIndex} style={styles.alternativeContainer}>
          <Text style={styles.alternativeName}>{alternative.name}</Text>
          <Text style={styles.alternativeSource}>Source: {alternative.source}</Text>
          <Text style={styles.alternativeDescription}>{alternative.description}</Text>
          <Text style={styles.alternativeText}>Text: {alternative.text}</Text>
          
          {fontsToTest.map((font, fontIndex) => (
            <View key={fontIndex} style={styles.fontTestContainer}>
              <Text style={styles.fontLabel}>Font: {font.name}</Text>
              <View style={styles.wordContainer}>
                <Text style={[baseStyle, { fontFamily: font.fontFamily }]}>
                  {alternative.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>🔬 Cross-Source Comparison</Text>
        <Text style={styles.comparisonDescription}>
          Compare all alternative sources side by side
        </Text>
        
        {fontsToTest.map((font, fontIndex) => (
          <View key={fontIndex} style={styles.fontTestContainer}>
            <Text style={styles.fontLabel}>Font: {font.name}</Text>
            <View style={styles.comparisonGrid}>
              {alternativeTexts.map((alternative, altIndex) => (
                <View key={altIndex} style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>{alternative.name}</Text>
                  <View style={styles.comparisonWordContainer}>
                    <Text style={[baseStyle, { fontFamily: font.fontFamily, fontSize: 32 }]}>
                      {alternative.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>📊 Analysis Instructions:</Text>
        <Text style={styles.analysisText}>1. Compare rendering quality across sources</Text>
        <Text style={styles.analysisText}>2. Look for any source that renders better</Text>
        <Text style={styles.analysisText}>3. Check if manual correction works</Text>
        <Text style={styles.analysisText}>4. Note font-specific differences</Text>
        <Text style={styles.analysisText}>5. Identify the best source-font combination</Text>
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Expected Results:</Text>
        <Text style={styles.summaryText}>• Manual correction should show proper connection</Text>
        <Text style={styles.summaryText}>• Different sources may render differently</Text>
        <Text style={styles.summaryText}>• Some font-source combinations may work better</Text>
        <Text style={styles.summaryText}>• Alternative approaches may provide solutions</Text>
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
  infoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 10
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 3
  },
  alternativeContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  alternativeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  alternativeSource: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 3
  },
  alternativeDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5
  },
  alternativeText: {
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
  comparisonContainer: {
    marginTop: 20,
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5
  },
  comparisonDescription: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 15
  },
  comparisonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  comparisonItem: {
    alignItems: 'center',
    margin: 5,
    minWidth: 120
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 5,
    textAlign: 'center'
  },
  comparisonWordContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 100,
    alignItems: 'center'
  },
  analysisContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f3e5f5',
    borderRadius: 10
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 8
  },
  analysisText: {
    fontSize: 14,
    color: '#8e24aa',
    marginBottom: 3
  },
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 10
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 10
  },
  summaryText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 5
  }
});

export default AlternativeDataTest;
