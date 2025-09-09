import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

const FontPatchingTest = () => {
  const testWord = "فَٱنصَبۡ";
  const [patchingResults, setPatchingResults] = useState([]);

  // Creative Solution 1: Font substitution at render time
  const renderFontSubstitution = (text, fontFamily) => {
    // Replace wasla with regular alif only for display
    const displayText = text.replace('ٱ', 'ا');
    return (
      <Text style={[styles.baseText, { fontFamily }]}>
        {displayText}
      </Text>
    );
  };

  // Creative Solution 2: Custom character mapping
  const renderCharacterMapping = (text, fontFamily) => {
    const charMap = {
      'ٱ': 'ا', // wasla to regular alif
      'ف': 'ف', // keep same
      'َ': 'َ', // keep same
      'ن': 'ن', // keep same
      'ص': 'ص', // keep same
      'َب': 'َب', // keep same
      'ۡ': 'ۡ'  // keep same
    };
    
    const mappedText = text.split('').map(char => charMap[char] || char).join('');
    return (
      <Text style={[styles.baseText, { fontFamily }]}>
        {mappedText}
      </Text>
    );
  };

  // Creative Solution 3: Dynamic font switching
  const renderDynamicFontSwitching = (text, fontFamily) => {
    const hasWasla = text.includes('ٱ');
    const targetFont = hasWasla ? 'KFGQPC Uthman Taha Naskh' : fontFamily;
    
    return (
      <Text style={[styles.baseText, { fontFamily: targetFont }]}>
        {text}
      </Text>
    );
  };

  // Creative Solution 4: Font fallback chain
  const renderFontFallbackChain = (text, fontFamily) => {
    const fallbackFonts = [
      fontFamily,
      'KFGQPC Uthman Taha Naskh',
      'KFGQPC KSA Heavy',
      undefined // system default
    ];
    
    return (
      <View style={styles.fallbackContainer}>
        {fallbackFonts.map((fallbackFont, index) => (
          <Text 
            key={index}
            style={[
              styles.baseText, 
              { 
                fontFamily: fallbackFont,
                opacity: index === 0 ? 1 : 0.3,
                position: index === 0 ? 'relative' : 'absolute',
                top: index === 0 ? 0 : 0,
                left: index === 0 ? 0 : 0,
              }
            ]}
          >
            {text}
          </Text>
        ))}
      </View>
    );
  };

  // Creative Solution 5: Custom text processing pipeline
  const renderTextProcessingPipeline = (text, fontFamily) => {
    // Step 1: Normalize text
    let processedText = text;
    
    // Step 2: Handle wasla specifically
    if (processedText.includes('ٱ')) {
      // Try different approaches
      processedText = processedText.replace('ٱ', 'ا'); // Simple replacement
    }
    
    // Step 3: Apply custom styling
    return (
      <Text 
        style={[
          styles.baseText, 
          { 
            fontFamily,
            letterSpacing: -1,
            textAlign: 'center',
            includeFontPadding: false,
          }
        ]}
      >
        {processedText}
      </Text>
    );
  };

  // Creative Solution 6: Hybrid approach - combine multiple techniques
  const renderHybridApproach = (text, fontFamily) => {
    return (
      <View style={styles.hybridContainer}>
        {/* Layer 1: Background with regular alif */}
        <Text style={[styles.backgroundLayer, { fontFamily }]}>
          {text.replace('ٱ', 'ا')}
        </Text>
        {/* Layer 2: Foreground with wasla */}
        <Text style={[styles.foregroundLayer, { fontFamily }]}>
          {text}
        </Text>
        {/* Layer 3: Overlay with corrected positioning */}
        <Text style={[styles.overlayLayer, { fontFamily }]}>
          {text.replace('ٱ', 'ا')}
        </Text>
      </View>
    );
  };

  const patchingSolutions = [
    {
      name: "Font Substitution",
      description: "Replace wasla with regular alif at render time",
      render: renderFontSubstitution
    },
    {
      name: "Character Mapping",
      description: "Custom character mapping for wasla handling",
      render: renderCharacterMapping
    },
    {
      name: "Dynamic Font Switching",
      description: "Switch fonts based on content (wasla detection)",
      render: renderDynamicFontSwitching
    },
    {
      name: "Font Fallback Chain",
      description: "Try multiple fonts in fallback chain",
      render: renderFontFallbackChain
    },
    {
      name: "Text Processing Pipeline",
      description: "Multi-step text processing with custom styling",
      render: renderTextProcessingPipeline
    },
    {
      name: "Hybrid Approach",
      description: "Combine multiple techniques in layers",
      render: renderHybridApproach
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
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Font Patching and Custom Rendering</Text>
      <Text style={styles.subtitle}>Advanced techniques for wasla handling</Text>
      <Text style={styles.subtitle}>Word: {testWord}</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔧 Advanced Techniques:</Text>
        <Text style={styles.infoText}>• Font substitution and character mapping</Text>
        <Text style={styles.infoText}>• Dynamic font switching based on content</Text>
        <Text style={styles.infoText}>• Font fallback chains and processing pipelines</Text>
        <Text style={styles.infoText}>• Hybrid approaches combining multiple techniques</Text>
      </View>

      {patchingSolutions.map((solution, solutionIndex) => (
        <View key={solutionIndex} style={styles.solutionContainer}>
          <Text style={styles.solutionName}>{solution.name}</Text>
          <Text style={styles.solutionDescription}>{solution.description}</Text>
          
          {fontsToTest.map((font, fontIndex) => (
            <View key={fontIndex} style={styles.fontTestContainer}>
              <Text style={styles.fontLabel}>Font: {font.name}</Text>
              <View style={styles.wordContainer}>
                {solution.render(testWord, font.fontFamily)}
              </View>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>🔬 Cross-Technique Comparison</Text>
        <Text style={styles.comparisonDescription}>
          Compare all patching techniques side by side
        </Text>
        
        {fontsToTest.map((font, fontIndex) => (
          <View key={fontIndex} style={styles.fontTestContainer}>
            <Text style={styles.fontLabel}>Font: {font.name}</Text>
            <View style={styles.comparisonGrid}>
              {patchingSolutions.map((solution, solutionIndex) => (
                <View key={solutionIndex} style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>{solution.name}</Text>
                  <View style={styles.comparisonWordContainer}>
                    {solution.render(testWord, font.fontFamily)}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>What to Look For:</Text>
        <Text style={styles.summaryText}>• Any technique that shows proper wasla connection</Text>
        <Text style={styles.summaryText}>• Visual improvements over standard rendering</Text>
        <Text style={styles.summaryText}>• Which approach works best with which font</Text>
        <Text style={styles.summaryText}>• Advanced techniques that achieve the goal</Text>
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
  solutionContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  solutionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  solutionDescription: {
    fontSize: 14,
    color: '#666666',
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
  wordContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    minWidth: 200,
    alignItems: 'center'
  },
  baseText: {
    fontSize: 48,
    textAlign: 'center',
    includeFontPadding: false,
    color: '#333333',
  },
  fallbackContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  hybridContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backgroundLayer: {
    fontSize: 48,
    color: '#cccccc',
    position: 'absolute',
    includeFontPadding: false,
  },
  foregroundLayer: {
    fontSize: 48,
    color: '#333333',
    zIndex: 1,
    includeFontPadding: false,
  },
  overlayLayer: {
    fontSize: 48,
    color: '#ff0000',
    position: 'absolute',
    top: 0,
    left: 5,
    zIndex: 2,
    includeFontPadding: false,
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

export default FontPatchingTest;
