import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MultiFontTest = () => {
  const testWord = "فَٱنصَبۡ";
  
  // Split the word into parts for different font treatment
  const splitWord = (word) => {
    const parts = [];
    let currentPart = '';
    let currentFont = 'embedded';
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      
      // Determine if this character should use system font
      const useSystemFont = char === 'ٱ' || char === 'َ' || char === 'ۡ';
      
      if (useSystemFont && currentFont === 'embedded') {
        // Switch to system font
        if (currentPart) {
          parts.push({ text: currentPart, font: 'embedded' });
          currentPart = '';
        }
        currentFont = 'system';
      } else if (!useSystemFont && currentFont === 'system') {
        // Switch back to embedded font
        if (currentPart) {
          parts.push({ text: currentPart, font: 'system' });
          currentPart = '';
        }
        currentFont = 'embedded';
      }
      
      currentPart += char;
    }
    
    // Add the last part
    if (currentPart) {
      parts.push({ text: currentPart, font: currentFont });
    }
    
    return parts;
  };

  const wordParts = splitWord(testWord);
  
  const testCases = [
    {
      name: "Single Embedded Font",
      description: "All characters use embedded font (current approach)",
      render: () => (
        <Text style={[styles.baseText, { fontFamily: 'KFGQPC HAFS Uthmanic Script' }]}>
          {testWord}
        </Text>
      )
    },
    {
      name: "Single System Font",
      description: "All characters use system font",
      render: () => (
        <Text style={[styles.baseText, { fontFamily: undefined }]}>
          {testWord}
        </Text>
      )
    },
    {
      name: "Multi-Font Approach",
      description: "Embedded font for most, system font for wasla and diacritics",
      render: () => (
        <View style={styles.multiFontContainer}>
          {wordParts.map((part, index) => (
            <Text 
              key={index}
              style={[
                styles.baseText, 
                { 
                  fontFamily: part.font === 'embedded' 
                    ? 'KFGQPC HAFS Uthmanic Script' 
                    : undefined,
                  color: part.font === 'system' ? '#ff0000' : '#333333' // Red for system font
                }
              ]}
            >
              {part.text}
            </Text>
          ))}
        </View>
      )
    },
    {
      name: "Multi-Font with Spacing",
      description: "Multi-font with negative spacing to try to connect",
      render: () => (
        <View style={styles.multiFontContainer}>
          {wordParts.map((part, index) => (
            <Text 
              key={index}
              style={[
                styles.baseText, 
                { 
                  fontFamily: part.font === 'embedded' 
                    ? 'KFGQPC HAFS Uthmanic Script' 
                    : undefined,
                  color: part.font === 'system' ? '#ff0000' : '#333333',
                  marginLeft: part.font === 'system' ? -5 : 0,
                  marginRight: part.font === 'system' ? -5 : 0,
                }
              ]}
            >
              {part.text}
            </Text>
          ))}
        </View>
      )
    },
    {
      name: "Character-by-Character",
      description: "Each character with its own font",
      render: () => (
        <View style={styles.multiFontContainer}>
          {testWord.split('').map((char, index) => {
            const useSystemFont = char === 'ٱ' || char === 'َ' || char === 'ۡ';
            return (
              <Text 
                key={index}
                style={[
                  styles.baseText, 
                  { 
                    fontFamily: useSystemFont ? undefined : 'KFGQPC HAFS Uthmanic Script',
                    color: useSystemFont ? '#ff0000' : '#333333',
                    marginLeft: useSystemFont ? -3 : 0,
                    marginRight: useSystemFont ? -3 : 0,
                  }
                ]}
              >
                {char}
              </Text>
            );
          })}
        </View>
      )
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
      <Text style={styles.title}>Multi-Font Approach Test</Text>
      <Text style={styles.subtitle}>Testing if multiple fonts can work together</Text>
      <Text style={styles.subtitle}>Word: {testWord}</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔍 Multi-Font Approach:</Text>
        <Text style={styles.infoText}>• Use embedded font for characters it contains</Text>
        <Text style={styles.infoText}>• Use system font for missing characters (wasla, diacritics)</Text>
        <Text style={styles.infoText}>• Red text = system font, Black text = embedded font</Text>
        <Text style={styles.infoText}>• Test different spacing approaches to connect characters</Text>
      </View>

      <View style={styles.splitInfoContainer}>
        <Text style={styles.splitInfoTitle}>📝 Word Split Analysis:</Text>
        <Text style={styles.splitInfoText}>Original: {testWord}</Text>
        <Text style={styles.splitInfoText}>Split into parts:</Text>
        {wordParts.map((part, index) => (
          <Text key={index} style={styles.splitInfoText}>
            Part {index + 1}: "{part.text}" ({part.font} font)
          </Text>
        ))}
      </View>

      {testCases.map((testCase, caseIndex) => (
        <View key={caseIndex} style={styles.testCaseContainer}>
          <Text style={styles.testCaseName}>{testCase.name}</Text>
          <Text style={styles.testCaseDescription}>{testCase.description}</Text>
          
          {fontsToTest.map((font, fontIndex) => (
            <View key={fontIndex} style={styles.fontTestContainer}>
              <Text style={styles.fontLabel}>Base Font: {font.name}</Text>
              <View style={styles.wordContainer}>
                {testCase.render()}
              </View>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>🔬 Side-by-Side Comparison</Text>
        <Text style={styles.comparisonDescription}>
          Compare all approaches in one view
        </Text>
        
        {fontsToTest.map((font, fontIndex) => (
          <View key={fontIndex} style={styles.fontTestContainer}>
            <Text style={styles.fontLabel}>Base Font: {font.name}</Text>
            <View style={styles.comparisonGrid}>
              {testCases.map((testCase, caseIndex) => (
                <View key={caseIndex} style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>{testCase.name}</Text>
                  <View style={styles.comparisonWordContainer}>
                    {testCase.render()}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>📊 What to Look For:</Text>
        <Text style={styles.analysisText}>• Do characters connect properly across font boundaries?</Text>
        <Text style={styles.analysisText}>• Is there visual consistency between fonts?</Text>
        <Text style={styles.analysisText}>• Do spacing adjustments help with connections?</Text>
        <Text style={styles.analysisText}>• Does the multi-font approach look natural?</Text>
        <Text style={styles.analysisText}>• Are there alignment or baseline issues?</Text>
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Expected Results:</Text>
        <Text style={styles.summaryText}>• Multi-font approach will likely show visual inconsistencies</Text>
        <Text style={styles.summaryText}>• Characters may not connect properly across font boundaries</Text>
        <Text style={styles.summaryText}>• Spacing adjustments may help but won't be perfect</Text>
        <Text style={styles.summaryText}>• Single font approaches will be more consistent</Text>
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
  splitInfoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10
  },
  splitInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8
  },
  splitInfoText: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 3
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
  multiFontContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
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

export default MultiFontTest;
