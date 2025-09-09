import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

const CreativeSolutions = () => {
  const testWord = "فَٱنصَبۡ";
  const [solutions, setSolutions] = useState([]);

  // Creative Solution 1: Character-by-character rendering with custom spacing
  const renderCharacterByCharacter = (text, fontFamily) => {
    return text.split('').map((char, index) => (
      <Text 
        key={index}
        style={[
          styles.characterText,
          { 
            fontFamily,
            marginLeft: char === 'ٱ' ? -8 : 0, // Negative margin to pull wasla closer
            marginRight: char === 'ٱ' ? -8 : 0,
          }
        ]}
      >
        {char}
      </Text>
    ));
  };

  // Creative Solution 2: Overlay approach - render wasla on top of previous character
  const renderOverlayApproach = (text, fontFamily) => {
    const chars = text.split('');
    const waslaIndex = chars.findIndex(char => char === 'ٱ');
    
    if (waslaIndex === -1) return <Text style={[styles.baseText, { fontFamily }]}>{text}</Text>;
    
    const beforeWasla = chars.slice(0, waslaIndex).join('');
    const afterWasla = chars.slice(waslaIndex + 1).join('');
    
    return (
      <View style={styles.overlayContainer}>
        <Text style={[styles.baseText, { fontFamily }]}>
          {beforeWasla}{afterWasla}
        </Text>
        <View style={styles.waslaOverlay}>
          <Text style={[styles.waslaText, { fontFamily }]}>ٱ</Text>
        </View>
      </View>
    );
  };

  // Creative Solution 3: SVG-like approach with absolute positioning
  const renderAbsolutePositioning = (text, fontFamily) => {
    const chars = text.split('');
    const waslaIndex = chars.findIndex(char => char === 'ٱ');
    
    if (waslaIndex === -1) return <Text style={[styles.baseText, { fontFamily }]}>{text}</Text>;
    
    const beforeWasla = chars.slice(0, waslaIndex).join('');
    const afterWasla = chars.slice(waslaIndex + 1).join('');
    
    return (
      <View style={styles.absoluteContainer}>
        <Text style={[styles.baseText, { fontFamily }]}>
          {beforeWasla}{afterWasla}
        </Text>
        <Text 
          style={[
            styles.absoluteWasla, 
            { fontFamily }
          ]}
        >
          ٱ
        </Text>
      </View>
    );
  };

  // Creative Solution 4: Transform approach - scale and translate
  const renderTransformApproach = (text, fontFamily) => {
    return (
      <View style={styles.transformContainer}>
        <Text style={[styles.baseText, { fontFamily }]}>
          {text.replace('ٱ', '')}
        </Text>
        <Text 
          style={[
            styles.transformWasla, 
            { fontFamily }
          ]}
        >
          ٱ
        </Text>
      </View>
    );
  };

  // Creative Solution 5: Custom font loading with different approach
  const renderCustomFontApproach = (text, fontFamily) => {
    return (
      <Text 
        style={[
          styles.baseText, 
          { 
            fontFamily,
            letterSpacing: -2, // Negative letter spacing
            textAlign: 'center',
            includeFontPadding: false,
            lineHeight: 48,
          }
        ]}
      >
        {text}
      </Text>
    );
  };

  // Creative Solution 6: Multiple text layers
  const renderLayeredApproach = (text, fontFamily) => {
    return (
      <View style={styles.layeredContainer}>
        {/* Background layer - regular alif */}
        <Text style={[styles.backgroundText, { fontFamily }]}>
          {text.replace('ٱ', 'ا')}
        </Text>
        {/* Foreground layer - wasla */}
        <Text style={[styles.foregroundText, { fontFamily }]}>
          {text}
        </Text>
      </View>
    );
  };

  const creativeSolutions = [
    {
      name: "Character-by-Character with Custom Spacing",
      description: "Render each character separately with negative margins for wasla",
      render: renderCharacterByCharacter
    },
    {
      name: "Overlay Approach",
      description: "Render wasla on top of previous character using absolute positioning",
      render: renderOverlayApproach
    },
    {
      name: "Absolute Positioning",
      description: "Position wasla absolutely to connect with previous character",
      render: renderAbsolutePositioning
    },
    {
      name: "Transform Approach",
      description: "Use transforms to position wasla correctly",
      render: renderTransformApproach
    },
    {
      name: "Custom Font Loading",
      description: "Negative letter spacing and custom font properties",
      render: renderCustomFontApproach
    },
    {
      name: "Layered Rendering",
      description: "Multiple text layers - background with regular alif, foreground with wasla",
      render: renderLayeredApproach
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
      <Text style={styles.title}>Creative Solutions Test</Text>
      <Text style={styles.subtitle}>Innovative approaches to fix wasla connection</Text>
      <Text style={styles.subtitle}>Word: {testWord}</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🎨 Creative Approaches:</Text>
        <Text style={styles.infoText}>• Character-by-character rendering with custom spacing</Text>
        <Text style={styles.infoText}>• Overlay and absolute positioning techniques</Text>
        <Text style={styles.infoText}>• Transform and scaling approaches</Text>
        <Text style={styles.infoText}>• Layered rendering with multiple text layers</Text>
        <Text style={styles.infoText}>• Custom font loading with negative spacing</Text>
      </View>

      {creativeSolutions.map((solution, solutionIndex) => (
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
        <Text style={styles.comparisonTitle}>🔬 Side-by-Side Comparison</Text>
        <Text style={styles.comparisonDescription}>
          Compare all creative solutions in one view
        </Text>
        
        {fontsToTest.map((font, fontIndex) => (
          <View key={fontIndex} style={styles.fontTestContainer}>
            <Text style={styles.fontLabel}>Font: {font.name}</Text>
            <View style={styles.comparisonGrid}>
              {creativeSolutions.map((solution, solutionIndex) => (
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
        <Text style={styles.summaryText}>• Any solution that shows proper wasla connection</Text>
        <Text style={styles.summaryText}>• Visual improvements over standard rendering</Text>
        <Text style={styles.summaryText}>• Which approach works best with which font</Text>
        <Text style={styles.summaryText}>• Creative positioning that achieves the goal</Text>
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
  characterText: {
    fontSize: 48,
    textAlign: 'center',
    includeFontPadding: false,
    color: '#333333',
  },
  overlayContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  waslaOverlay: {
    position: 'absolute',
    top: 0,
    left: 20, // Adjust position to overlap with previous character
    zIndex: 1
  },
  waslaText: {
    fontSize: 48,
    color: '#ff0000', // Red color to see overlay
    includeFontPadding: false,
  },
  absoluteContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  absoluteWasla: {
    position: 'absolute',
    top: 0,
    left: 15, // Adjust position
    fontSize: 48,
    color: '#ff0000', // Red color to see positioning
    includeFontPadding: false,
  },
  transformContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  transformWasla: {
    fontSize: 48,
    color: '#ff0000', // Red color to see transform
    includeFontPadding: false,
    transform: [{ translateX: -10 }] // Adjust transform
  },
  layeredContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backgroundText: {
    fontSize: 48,
    color: '#cccccc', // Light gray for background
    includeFontPadding: false,
    position: 'absolute'
  },
  foregroundText: {
    fontSize: 48,
    color: '#333333', // Dark for foreground
    includeFontPadding: false,
    zIndex: 1
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

export default CreativeSolutions;
