import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const FontCompareScreen = () => {
  const sample = "فَٱنصَبۡ";
  const fixed = sample.replace(/\u0671/g, '\u0627');

  function codepoints(s) {
    return Array.from(s).map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase()).join(' ');
  }

  useEffect(() => {
    console.log('=== FONT DIAGNOSTIC ===');
    console.log('original:', sample, codepoints(sample));
    console.log('fixed   :', fixed, codepoints(fixed));
    console.log('========================');
  }, []);

  const fontsToTest = [
    {
      name: "KFGQPC HAFS Uthmanic Script",
      fontFamily: 'KFGQPC HAFS Uthmanic Script',
      description: "Your current font"
    },
    {
      name: "KFGQPC Uthman Taha Naskh",
      fontFamily: 'KFGQPC Uthman Taha Naskh',
      description: "Alternative KFGQPC font"
    },
    {
      name: "KFGQPC KSA Heavy",
      fontFamily: 'KFGQPC KSA Heavy',
      description: "KFGQPC heavy variant"
    },
    {
      name: "System Default",
      fontFamily: undefined,
      description: "System fallback font"
    }
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Font Comparison Diagnostic</Text>
      <Text style={styles.subtitle}>ChatGPT's systematic approach to diagnose the issue</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔍 What We're Testing:</Text>
        <Text style={styles.infoText}>• Character replacement verification</Text>
        <Text style={styles.infoText}>• Font rendering comparison</Text>
        <Text style={styles.infoText}>• Codepoint analysis</Text>
        <Text style={styles.infoText}>• Shaping engine behavior</Text>
      </View>

      <View style={styles.codepointContainer}>
        <Text style={styles.codepointTitle}>📊 Codepoint Analysis:</Text>
        <Text style={styles.codepointText}>Original: {sample}</Text>
        <Text style={styles.codepointText}>Codepoints: {codepoints(sample)}</Text>
        <Text style={styles.codepointText}>Fixed: {fixed}</Text>
        <Text style={styles.codepointText}>Codepoints: {codepoints(fixed)}</Text>
        <Text style={styles.codepointText}>
          Replacement: {sample.includes('\u0671') ? '❌ Not applied' : '✅ Applied'}
        </Text>
      </View>

      {fontsToTest.map((font, fontIndex) => (
        <View key={fontIndex} style={styles.fontTestContainer}>
          <Text style={styles.fontName}>{font.name}</Text>
          <Text style={styles.fontDescription}>{font.description}</Text>
          
          <View style={styles.testRow}>
            <Text style={styles.testLabel}>1) Original (with wasla):</Text>
            <Text style={[styles.testText, { fontFamily: font.fontFamily }]}>
              {sample}
            </Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.testLabel}>2) Fixed (wasla → alif):</Text>
            <Text style={[styles.testText, { fontFamily: font.fontFamily }]}>
              {fixed}
            </Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.testLabel}>3) Simple test (فا):</Text>
            <Text style={[styles.testText, { fontFamily: font.fontFamily }]}>
              فا
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>📋 What to Look For:</Text>
        <Text style={styles.analysisText}>• Does the replacement actually work? (Check codepoints)</Text>
        <Text style={styles.analysisText}>• Which fonts show proper connections?</Text>
        <Text style={styles.analysisText}>• Is the issue font-specific or platform-wide?</Text>
        <Text style={styles.analysisText}>• Do simple letter pairs (فا) connect properly?</Text>
      </View>

      <View style={styles.expectedResultsContainer}>
        <Text style={styles.expectedResultsTitle}>🎯 Expected Results:</Text>
        <Text style={styles.expectedResultsText}>• If KFGQPC fonts show separation but system font works → Font coverage issue</Text>
        <Text style={styles.expectedResultsText}>• If all fonts show separation → Platform shaping issue</Text>
        <Text style={styles.expectedResultsText}>• If replacement didn't work → Code issue</Text>
        <Text style={styles.expectedResultsText}>• If simple pairs don't connect → Font loading issue</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  codepointContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10
  },
  codepointTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8
  },
  codepointText: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 3,
    fontFamily: 'monospace'
  },
  fontTestContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  fontName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  fontDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15
  },
  testRow: {
    marginBottom: 15,
    alignItems: 'center'
  },
  testLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  testText: {
    fontSize: 42,
    textAlign: 'center',
    includeFontPadding: false,
    color: '#333333',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 200
  },
  analysisContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8
  },
  analysisText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 3
  },
  expectedResultsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f3e5f5',
    borderRadius: 10
  },
  expectedResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 8
  },
  expectedResultsText: {
    fontSize: 14,
    color: '#8e24aa',
    marginBottom: 3
  }
});

export default FontCompareScreen;
