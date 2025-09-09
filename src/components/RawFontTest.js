import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const RawFontTest = () => {
  const testText = "فا";
  const waslaText = "فَٱنصَبۡ";
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Raw Font Loading Test</Text>
      <Text style={styles.subtitle}>Testing basic font loading without any processing</Text>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>1. System Font (No fontFamily specified)</Text>
        <Text style={styles.testText}>{testText}</Text>
        <Text style={styles.testText}>{waslaText}</Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>2. KFGQPC HAFS Uthmanic Script (Exact name from font analysis)</Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC HAFS Uthmanic Script' }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC HAFS Uthmanic Script' }]}>
          {waslaText}
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>3. KFGQPC Uthman Taha Naskh (Alternative name)</Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC Uthman Taha Naskh' }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC Uthman Taha Naskh' }]}>
          {waslaText}
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>4. KFGQPC KSA Heavy (Another alternative)</Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC KSA Heavy' }]}>
          {testText}
        </Text>
        <Text style={[styles.testText, { fontFamily: 'KFGQPC KSA Heavy' }]}>
          {waslaText}
        </Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>5. Font Loading Status Check</Text>
        <Text style={styles.statusText}>
          If any of the above show different fonts, the font is loading.
        </Text>
        <Text style={styles.statusText}>
          If they all look the same, the font is NOT loading.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  testSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007bff',
  },
  testText: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default RawFontTest;
