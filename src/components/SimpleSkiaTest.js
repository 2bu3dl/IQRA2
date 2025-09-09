import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Canvas, Path, useFont, Skia } from '@shopify/react-native-skia';

// Font asset
const FONT_ASSET = require('../assets/fonts/UthmanicHafs1Ver18.ttf');

// Simple Skia Test Component
const SimpleSkiaTest = () => {
  const testWord = "فَٱنصَبۡ";
  
  // Load the font for Skia
  const fontData = useFont(FONT_ASSET, 48);

  // Create a simple path for testing
  const testPath = React.useMemo(() => {
    if (!fontData) return null;
    
    // Create a simple test path - just a circle for now
    const path = Skia.Path.Make();
    path.addCircle(100, 100, 50);
    return path;
  }, [fontData]);

  const testCases = [
    {
      name: "Standard React Native Text",
      description: "Current approach with font fallback issues",
      render: () => (
        <Text style={[styles.standardText, { fontFamily: 'KFGQPC HAFS Uthmanic Script' }]}>
          {testWord}
        </Text>
      )
    },
    {
      name: "Skia Canvas Test",
      description: "Testing Skia rendering capability",
      render: () => (
        <View style={styles.skiaContainer}>
          <Canvas style={styles.canvas}>
            {testPath && <Path path={testPath} color="#ff0000" />}
          </Canvas>
        </View>
      )
    },
    {
      name: "Font Loading Test",
      description: "Test if font is properly loaded",
      render: () => (
        <View style={styles.fontTestContainer}>
          <Text style={styles.fontTestText}>
            Font loaded: {fontData ? '✅ Yes' : '❌ No'}
          </Text>
          <Text style={styles.fontTestText}>
            Font size: {fontData?.getSize() || 'N/A'}
          </Text>
        </View>
      )
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simple Skia Test</Text>
      <Text style={styles.subtitle}>Testing Skia installation and basic functionality</Text>
      <Text style={styles.subtitle}>Word: {testWord}</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔧 What We're Testing:</Text>
        <Text style={styles.infoText}>• Skia module installation and linking</Text>
        <Text style={styles.infoText}>• Font loading with useFont hook</Text>
        <Text style={styles.infoText}>• Basic Canvas and Path rendering</Text>
        <Text style={styles.infoText}>• Comparison with standard text rendering</Text>
      </View>

      {testCases.map((testCase, index) => (
        <View key={index} style={styles.testCaseContainer}>
          <Text style={styles.testCaseName}>{testCase.name}</Text>
          <Text style={styles.testCaseDescription}>{testCase.description}</Text>
          <View style={styles.testCaseRender}>
            {testCase.render()}
          </View>
        </View>
      ))}

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>📊 Status Check:</Text>
        <Text style={styles.statusText}>
          Skia Module: {typeof Skia !== 'undefined' ? '✅ Loaded' : '❌ Not loaded'}
        </Text>
        <Text style={styles.statusText}>
          useFont Hook: {typeof useFont !== 'undefined' ? '✅ Available' : '❌ Not available'}
        </Text>
        <Text style={styles.statusText}>
          Canvas Component: {typeof Canvas !== 'undefined' ? '✅ Available' : '❌ Not available'}
        </Text>
        <Text style={styles.statusText}>
          Path Component: {typeof Path !== 'undefined' ? '✅ Available' : '❌ Not available'}
        </Text>
      </View>

      <View style={styles.nextStepsContainer}>
        <Text style={styles.nextStepsTitle}>🚀 Next Steps:</Text>
        <Text style={styles.nextStepsText}>1. If Skia is working, we can implement the HarfBuzz solution</Text>
        <Text style={styles.nextStepsText}>2. If not, we need to fix the Skia installation</Text>
        <Text style={styles.nextStepsText}>3. The HarfBuzz server can be set up separately</Text>
        <Text style={styles.nextStepsText}>4. This will solve the wasla connection issue completely</Text>
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
  testCaseContainer: {
    marginBottom: 20,
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
    marginBottom: 10
  },
  testCaseRender: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  standardText: {
    fontSize: 48,
    textAlign: 'center',
    includeFontPadding: false,
    color: '#333333',
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 8,
    minWidth: 200
  },
  skiaContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  canvas: {
    flex: 1
  },
  fontTestContainer: {
    alignItems: 'center',
    padding: 10
  },
  fontTestText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 5
  },
  statusContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8
  },
  statusText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 3
  },
  nextStepsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8
  },
  nextStepsText: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 3
  }
});

export default SimpleSkiaTest;
