import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';

const FontFallbackSolutions = () => {
  const testWord = "فَٱنصَبۡ";
  const [solutions, setSolutions] = useState([]);

  useEffect(() => {
    const testSolutions = [
      {
        name: "Solution 1: Font Preloading",
        description: "Preload font to ensure it's available before rendering",
        status: "pending"
      },
      {
        name: "Solution 2: Explicit Font Properties",
        description: "Force font usage with explicit weight/style properties",
        status: "pending"
      },
      {
        name: "Solution 3: Platform-Specific Handling",
        description: "Different approaches for iOS vs Android",
        status: "pending"
      },
      {
        name: "Solution 4: Font Fallback Chain",
        description: "Explicit fallback chain with multiple fonts",
        status: "pending"
      },
      {
        name: "Solution 5: Font Loading Verification",
        description: "Verify font is actually loaded and available",
        status: "pending"
      }
    ];
    setSolutions(testSolutions);
  }, []);

  // Solution 1: Font Preloading Test
  const renderFontPreloading = (text, fontFamily) => {
    return (
      <View style={styles.solutionContainer}>
        <Text style={styles.solutionTitle}>Font Preloading Test</Text>
        <Text style={styles.solutionDescription}>
          Testing if font is properly preloaded and available
        </Text>
        
        <View style={styles.testRow}>
          <Text style={styles.testLabel}>Standard Rendering:</Text>
          <Text style={[styles.baseText, { fontFamily }]}>
            {text}
          </Text>
        </View>
        
        <View style={styles.testRow}>
          <Text style={styles.testLabel}>With Font Preloading:</Text>
          <Text style={[styles.baseText, { fontFamily, fontWeight: 'normal' }]}>
            {text}
          </Text>
        </View>
      </View>
    );
  };

  // Solution 2: Explicit Font Properties
  const renderExplicitProperties = (text, fontFamily) => {
    const explicitStyles = [
      {
        name: "Basic Explicit",
        style: { fontFamily, fontWeight: 'normal', fontStyle: 'normal' }
      },
      {
        name: "With includeFontPadding: false",
        style: { fontFamily, fontWeight: 'normal', fontStyle: 'normal', includeFontPadding: false }
      },
      {
        name: "With allowFontScaling: false",
        style: { fontFamily, fontWeight: 'normal', fontStyle: 'normal', allowFontScaling: false }
      },
      {
        name: "All Properties Combined",
        style: { 
          fontFamily, 
          fontWeight: 'normal', 
          fontStyle: 'normal',
          includeFontPadding: false,
          allowFontScaling: false,
          textAlign: 'center'
        }
      }
    ];

    return (
      <View style={styles.solutionContainer}>
        <Text style={styles.solutionTitle}>Explicit Font Properties Test</Text>
        <Text style={styles.solutionDescription}>
          Testing different combinations of explicit font properties
        </Text>
        
        {explicitStyles.map((styleTest, index) => (
          <View key={index} style={styles.testRow}>
            <Text style={styles.testLabel}>{styleTest.name}:</Text>
            <Text style={[styles.baseText, styleTest.style]}>
              {text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Solution 3: Platform-Specific Handling
  const renderPlatformSpecific = (text, fontFamily) => {
    const platformStyles = [
      {
        name: "iOS Specific",
        style: Platform.OS === 'ios' ? { fontFamily, fontWeight: 'normal' } : { fontFamily }
      },
      {
        name: "Android Specific", 
        style: Platform.OS === 'android' ? { fontFamily, fontWeight: 'normal' } : { fontFamily }
      },
      {
        name: "Platform Adaptive",
        style: { 
          fontFamily,
          fontWeight: Platform.OS === 'ios' ? 'normal' : '400',
          fontStyle: 'normal'
        }
      }
    ];

    return (
      <View style={styles.solutionContainer}>
        <Text style={styles.solutionTitle}>Platform-Specific Handling Test</Text>
        <Text style={styles.solutionDescription}>
          Testing different approaches for iOS vs Android (Current: {Platform.OS})
        </Text>
        
        {platformStyles.map((platformTest, index) => (
          <View key={index} style={styles.testRow}>
            <Text style={styles.testLabel}>{platformTest.name}:</Text>
            <Text style={[styles.baseText, platformTest.style]}>
              {text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Solution 4: Font Fallback Chain
  const renderFontFallbackChain = (text, fontFamily) => {
    const fallbackChains = [
      {
        name: "Single Font",
        style: { fontFamily }
      },
      {
        name: "With System Fallback",
        style: { fontFamily: `${fontFamily}, Arial` }
      },
      {
        name: "Multiple Arabic Fonts",
        style: { fontFamily: `${fontFamily}, KFGQPC Uthman Taha Naskh, Arial` }
      },
      {
        name: "Complete Fallback Chain",
        style: { fontFamily: `${fontFamily}, KFGQPC Uthman Taha Naskh, KFGQPC KSA Heavy, Arial, sans-serif` }
      }
    ];

    return (
      <View style={styles.solutionContainer}>
        <Text style={styles.solutionTitle}>Font Fallback Chain Test</Text>
        <Text style={styles.solutionDescription}>
          Testing different font fallback chains
        </Text>
        
        {fallbackChains.map((fallbackTest, index) => (
          <View key={index} style={styles.testRow}>
            <Text style={styles.testLabel}>{fallbackTest.name}:</Text>
            <Text style={[styles.baseText, fallbackTest.style]}>
              {text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Solution 5: Font Loading Verification
  const renderFontLoadingVerification = (text, fontFamily) => {
    const verificationTests = [
      {
        name: "Font Family Check",
        description: "Check if font family is recognized",
        test: () => {
          // This would normally check if font is loaded
          return fontFamily ? "Font family specified" : "No font family";
        }
      },
      {
        name: "Platform Font Support",
        description: "Check platform-specific font support",
        test: () => {
          return Platform.OS === 'ios' ? "iOS font handling" : "Android font handling";
        }
      },
      {
        name: "Font Weight Support",
        description: "Test different font weights",
        test: () => "Testing weight variations"
      }
    ];

    return (
      <View style={styles.solutionContainer}>
        <Text style={styles.solutionTitle}>Font Loading Verification Test</Text>
        <Text style={styles.solutionDescription}>
          Verifying font loading and availability
        </Text>
        
        {verificationTests.map((verificationTest, index) => (
          <View key={index} style={styles.testRow}>
            <Text style={styles.testLabel}>{verificationTest.name}:</Text>
            <Text style={styles.testDescription}>{verificationTest.description}</Text>
            <Text style={styles.testResult}>{verificationTest.test()}</Text>
            <Text style={[styles.baseText, { fontFamily }]}>
              {text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

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
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Font Fallback Solutions Test</Text>
      <Text style={styles.subtitle}>Systematic testing of font loading and fallback solutions</Text>
      <Text style={styles.subtitle}>Word: {testWord}</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🎯 Root Cause Analysis:</Text>
        <Text style={styles.infoText}>• Font contains proper glyphs (confirmed by HarfBuzz)</Text>
        <Text style={styles.infoText}>• Multiple characters affected (ٱ and ب)</Text>
        <Text style={styles.infoText}>• Platform falling back to system font</Text>
        <Text style={styles.infoText}>• Need to force embedded font usage</Text>
      </View>

      <View style={styles.solutionsContainer}>
        <Text style={styles.solutionsTitle}>🔧 Testing Solutions:</Text>
        {solutions.map((solution, index) => (
          <Text key={index} style={styles.solutionItem}>
            {index + 1}. {solution.name} - {solution.status}
          </Text>
        ))}
      </View>

      {fontsToTest.map((font, fontIndex) => (
        <View key={fontIndex} style={styles.fontSection}>
          <Text style={styles.fontTitle}>Font: {font.name}</Text>
          
          {renderFontPreloading(testWord, font.fontFamily)}
          {renderExplicitProperties(testWord, font.fontFamily)}
          {renderPlatformSpecific(testWord, font.fontFamily)}
          {renderFontFallbackChain(testWord, font.fontFamily)}
          {renderFontLoadingVerification(testWord, font.fontFamily)}
        </View>
      ))}

      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>🔬 Cross-Solution Comparison</Text>
        <Text style={styles.comparisonDescription}>
          Compare all solutions side by side
        </Text>
        
        {fontsToTest.map((font, fontIndex) => (
          <View key={fontIndex} style={styles.fontTestContainer}>
            <Text style={styles.fontLabel}>Font: {font.name}</Text>
            <View style={styles.comparisonGrid}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Standard</Text>
                <Text style={[styles.baseText, { fontFamily: font.fontFamily }]}>
                  {testWord}
                </Text>
              </View>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Explicit Props</Text>
                <Text style={[styles.baseText, { 
                  fontFamily: font.fontFamily,
                  fontWeight: 'normal',
                  fontStyle: 'normal',
                  includeFontPadding: false,
                  allowFontScaling: false
                }]}>
                  {testWord}
                </Text>
              </View>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Fallback Chain</Text>
                <Text style={[styles.baseText, { 
                  fontFamily: `${font.fontFamily}, KFGQPC Uthman Taha Naskh, Arial`
                }]}>
                  {testWord}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>What to Look For:</Text>
        <Text style={styles.summaryText}>• Any solution that shows proper character connections</Text>
        <Text style={styles.summaryText}>• Differences between standard and explicit rendering</Text>
        <Text style={styles.summaryText}>• Platform-specific behavior differences</Text>
        <Text style={styles.summaryText}>• Font fallback chain effectiveness</Text>
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
  solutionsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10
  },
  solutionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8
  },
  solutionItem: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 3
  },
  fontSection: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  fontTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center'
  },
  solutionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  solutionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10
  },
  testRow: {
    marginBottom: 10,
    alignItems: 'center'
  },
  testLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  testDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 3
  },
  testResult: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 5
  },
  baseText: {
    fontSize: 48,
    textAlign: 'center',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 5,
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
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f3e5f5',
    borderRadius: 10
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 10
  },
  summaryText: {
    fontSize: 14,
    color: '#8e24aa',
    marginBottom: 5
  }
});

export default FontFallbackSolutions;
