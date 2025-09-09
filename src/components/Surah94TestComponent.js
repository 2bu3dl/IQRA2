import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { hardcodedSurah94, testVariationsAyah7 } from '../utils/hardcodedSurah94';

const Surah94TestComponent = () => {
  const baseStyle = {
    fontSize: 28,
    fontFamily: 'UthmanicHafs1Ver18', // Use the new font
    lineHeight: 42,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    color: '#333333',
    marginVertical: 10,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Surah Ash-Sharh Test (Hard-coded)</Text>
      <Text style={styles.subtitle}>Font: UthmanicHafs1Ver18</Text>
      
      {/* All ayaat */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Ayaat:</Text>
        {hardcodedSurah94.ayaat.map((ayah, index) => (
          <View key={index} style={styles.ayahContainer}>
            <Text style={styles.ayahNumber}>Ayah {ayah.ayah}:</Text>
            <Text style={baseStyle}>{ayah.text}</Text>
          </View>
        ))}
      </View>

      {/* Ayah 7 variations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ayah 7 Variations (The Problematic One):</Text>
        
        <View style={styles.variationContainer}>
          <Text style={styles.variationLabel}>Original (with wasla):</Text>
          <Text style={baseStyle}>{testVariationsAyah7.original}</Text>
        </View>

        <View style={styles.variationContainer}>
          <Text style={styles.variationLabel}>With Regular Alif:</Text>
          <Text style={baseStyle}>{testVariationsAyah7.withRegularAlif}</Text>
        </View>

        <View style={styles.variationContainer}>
          <Text style={styles.variationLabel}>With Spaces:</Text>
          <Text style={baseStyle}>{testVariationsAyah7.withSpaces}</Text>
        </View>

        <View style={styles.variationContainer}>
          <Text style={styles.variationLabel}>With Joiner:</Text>
          <Text style={baseStyle}>{testVariationsAyah7.withJoiner}</Text>
        </View>

        <View style={styles.variationContainer}>
          <Text style={styles.variationLabel}>Original (with wasla):</Text>
          <Text style={baseStyle}>{testVariationsAyah7.original}</Text>
        </View>
      </View>

      {/* Font comparison */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Font Comparison (Ayah 7):</Text>
        
        <View style={styles.variationContainer}>
          <Text style={styles.variationLabel}>UthmanicHafs1Ver18:</Text>
          <Text style={[baseStyle, { fontFamily: 'UthmanicHafs1Ver18' }]}>
            {testVariationsAyah7.original}
          </Text>
        </View>

        <View style={styles.variationContainer}>
          <Text style={styles.variationLabel}>KFGQPC Uthman Taha Naskh:</Text>
          <Text style={[baseStyle, { fontFamily: 'KFGQPC Uthman Taha Naskh' }]}>
            {testVariationsAyah7.original}
          </Text>
        </View>

        <View style={styles.variationContainer}>
          <Text style={styles.variationLabel}>UthmanTN_v2-0:</Text>
          <Text style={[baseStyle, { fontFamily: 'UthmanTN_v2-0' }]}>
            {testVariationsAyah7.original}
          </Text>
        </View>
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
    textAlign: 'center',
    marginBottom: 10,
    color: '#333333'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666666'
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333'
  },
  ayahContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5
  },
  ayahNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666666'
  },
  variationContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5
  },
  variationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333333'
  }
});

export default Surah94TestComponent;
