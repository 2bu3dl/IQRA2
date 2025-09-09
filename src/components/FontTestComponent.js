import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRecommendedArabicFont } from '../utils/fontChecker';

const FontTestComponent = () => {
  const currentFont = getRecommendedArabicFont();
  
  // Surah Ash-Sharh ayah 7 - the problematic case
  const surah94Ayah7 = 'فَإِذَا فَرَغْتَ فَٱنصَبْ';
  
  // All Surah Ash-Sharh ayaat for comprehensive testing
  const surah94Ayaat = [
    { ayah: 1, text: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ' },
    { ayah: 2, text: 'وَوَضَعْنَا عَنكَ وِزْرَكَ' },
    { ayah: 3, text: 'ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ' },
    { ayah: 4, text: 'وَرَفَعْنَا لَكَ ذِكْرَكَ' },
    { ayah: 5, text: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا' },
    { ayah: 6, text: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا' },
    { ayah: 7, text: 'فَإِذَا فَرَغْتَ فَٱنصَبْ' }, // The problematic one
    { ayah: 8, text: 'وَإِلَىٰ رَبِّكَ فَٱرْغَب' }
  ];

  const fontStyles = {
    fontSize: 24,
    lineHeight: 36,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    color: '#333333'
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Font Test: UthmanicHafs1Ver18</Text>
      <Text style={styles.subtitle}>Current Font: {currentFont}</Text>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Surah Ash-Sharh Ayah 7 (Problematic Case)</Text>
        <Text style={[fontStyles, { fontFamily: currentFont }]}>
          {surah94Ayah7}
        </Text>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>All Surah Ash-Sharh Ayaat</Text>
        {surah94Ayaat.map((ayah, index) => (
          <View key={index} style={styles.ayahContainer}>
            <Text style={styles.ayahNumber}>Ayah {ayah.ayah}:</Text>
            <Text style={[fontStyles, { fontFamily: currentFont }]}>
              {ayah.text}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Font Comparison</Text>
        <View style={styles.comparisonContainer}>
          <Text style={styles.comparisonLabel}>UthmanicHafs1Ver18:</Text>
          <Text style={[fontStyles, { fontFamily: 'UthmanicHafs1Ver18' }]}>
            {surah94Ayah7}
          </Text>
          
          <Text style={styles.comparisonLabel}>KFGQPC Uthman Taha Naskh:</Text>
          <Text style={[fontStyles, { fontFamily: 'KFGQPC Uthman Taha Naskh' }]}>
            {surah94Ayah7}
          </Text>
          
          <Text style={styles.comparisonLabel}>UthmanTN_v2-0:</Text>
          <Text style={[fontStyles, { fontFamily: 'UthmanTN_v2-0' }]}>
            {surah94Ayah7}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 20,
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
  testSection: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
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
  comparisonContainer: {
    gap: 15
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333333'
  }
});

export default FontTestComponent;
