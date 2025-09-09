import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ComprehensiveWaslaTest = () => {
  const testWord = "فَٱنصَبۡ";
  
  // All possible approaches to try
  const approaches = [
    // 1. Different fonts
    {
      name: "Different Fonts",
      tests: [
        { name: "KFGQPC Uthman Taha Naskh", fontFamily: 'KFGQPC Uthman Taha Naskh' },
        { name: "KFGQPC KSA Heavy", fontFamily: 'KFGQPC KSA Heavy' },
        { name: "KFGQPC HAFS Uthmanic Script", fontFamily: 'KFGQPC HAFS Uthmanic Script' },
        { name: "System Default", fontFamily: undefined },
      ]
    },
    
    // 2. Letter spacing variations
    {
      name: "Letter Spacing Variations",
      tests: [
        { name: "No Letter Spacing", letterSpacing: 0 },
        { name: "Negative Spacing -0.5", letterSpacing: -0.5 },
        { name: "Negative Spacing -1", letterSpacing: -1 },
        { name: "Negative Spacing -2", letterSpacing: -2 },
        { name: "Positive Spacing 0.5", letterSpacing: 0.5 },
      ]
    },
    
    // 3. Margin variations
    {
      name: "Margin Variations",
      tests: [
        { name: "No Margins", marginHorizontal: 0 },
        { name: "Negative Margin -1", marginHorizontal: -1 },
        { name: "Negative Margin -2", marginHorizontal: -2 },
        { name: "Negative Margin -3", marginHorizontal: -3 },
        { name: "Positive Margin 1", marginHorizontal: 1 },
      ]
    },
    
    // 4. Text alignment variations
    {
      name: "Text Alignment Variations",
      tests: [
        { name: "Center Align", textAlign: 'center' },
        { name: "Right Align", textAlign: 'right' },
        { name: "Left Align", textAlign: 'left' },
        { name: "Justify", textAlign: 'justify' },
      ]
    },
    
    // 5. Writing direction variations
    {
      name: "Writing Direction Variations",
      tests: [
        { name: "RTL", writingDirection: 'rtl' },
        { name: "LTR", writingDirection: 'ltr' },
        { name: "Auto", writingDirection: 'auto' },
        { name: "No Direction", writingDirection: undefined },
      ]
    },
    
    // 6. Font padding variations
    {
      name: "Font Padding Variations",
      tests: [
        { name: "Include Font Padding", includeFontPadding: true },
        { name: "No Font Padding", includeFontPadding: false },
      ]
    },
    
    // 7. Text alignment vertical variations
    {
      name: "Vertical Alignment Variations",
      tests: [
        { name: "Center Vertical", textAlignVertical: 'center' },
        { name: "Top Vertical", textAlignVertical: 'top' },
        { name: "Bottom Vertical", textAlignVertical: 'bottom' },
        { name: "Auto Vertical", textAlignVertical: 'auto' },
      ]
    },
    
    // 8. Line height variations
    {
      name: "Line Height Variations",
      tests: [
        { name: "Normal Line Height", lineHeight: 48 },
        { name: "Tight Line Height", lineHeight: 40 },
        { name: "Loose Line Height", lineHeight: 56 },
        { name: "No Line Height", lineHeight: undefined },
      ]
    },
    
    // 9. Font size variations
    {
      name: "Font Size Variations",
      tests: [
        { name: "Small Font 32", fontSize: 32 },
        { name: "Medium Font 40", fontSize: 40 },
        { name: "Large Font 48", fontSize: 48 },
        { name: "Extra Large Font 56", fontSize: 56 },
      ]
    },
    
    // 10. Combined approaches
    {
      name: "Combined Approaches",
      tests: [
        { 
          name: "Optimal Combo 1", 
          fontFamily: 'KFGQPC Uthman Taha Naskh',
          letterSpacing: -0.5,
          marginHorizontal: -1,
          includeFontPadding: false,
          textAlignVertical: 'center'
        },
        { 
          name: "Optimal Combo 2", 
          fontFamily: 'KFGQPC KSA Heavy',
          letterSpacing: -1,
          marginHorizontal: -2,
          includeFontPadding: false,
          writingDirection: 'ltr'
        },
        { 
          name: "Optimal Combo 3", 
          fontFamily: 'KFGQPC HAFS Uthmanic Script',
          letterSpacing: 0,
          marginHorizontal: 0,
          includeFontPadding: false,
          textAlign: 'center'
        },
      ]
    }
  ];

  const baseStyle = {
    fontSize: 48,
    fontFamily: 'KFGQPC Uthman Taha Naskh',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 10,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Comprehensive Wasla Test</Text>
      <Text style={styles.subtitle}>Testing ALL possible approaches to fix wasla connections</Text>
      <Text style={styles.subtitle}>Word: {testWord}</Text>
      
      {approaches.map((approach, approachIndex) => (
        <View key={approachIndex} style={styles.approachContainer}>
          <Text style={styles.approachTitle}>{approach.name}</Text>
          
          {approach.tests.map((test, testIndex) => (
            <View key={testIndex} style={styles.testContainer}>
              <Text style={styles.testName}>{test.name}</Text>
              <View style={styles.wordBox}>
                <Text style={[baseStyle, test]}>
                  {testWord}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>What to Look For:</Text>
        <Text style={styles.summaryText}>• Does the wasla (ٱ) connect to the فَ?</Text>
        <Text style={styles.summaryText}>• Does the ب connect to the ص?</Text>
        <Text style={styles.summaryText}>• Overall letter flow and connections</Text>
        <Text style={styles.summaryText}>• Any approach that makes it look better</Text>
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
  approachContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  approachTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center'
  },
  testContainer: {
    marginBottom: 15,
    alignItems: 'center'
  },
  testName: {
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

export default ComprehensiveWaslaTest;
