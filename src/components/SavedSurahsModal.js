import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useLanguage } from '../utils/languageContext';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const SavedSurahsModal = ({ 
  visible, 
  onClose, 
  surahName,
  onComplete
}) => {
  const { language, t } = useLanguage();
  const [savedSurahs, setSavedSurahs] = useState([]);
  const [isClosePressed, setIsClosePressed] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSavedSurahs();
    }
  }, [visible]);

  const loadSavedSurahs = async () => {
    try {
      // TODO: Load saved surahs from storage
      // For now, simulate some data
      const surahs = [
        { name: 'Al-Fatihah', date: '2024-01-15' },
        { name: 'Al-Baqarah', date: '2024-01-20' },
        { name: 'Ali-Imran', date: '2024-01-25' },
      ];
      
      // Add current surah if not already in list
      if (surahName && !surahs.find(s => s.name === surahName)) {
        surahs.push({ name: surahName, date: new Date().toISOString().split('T')[0] });
      }
      
      setSavedSurahs(surahs);
    } catch (error) {
      console.error('Error loading saved surahs:', error);
    }
  };

  const handleClose = () => {
    onClose();
    if (onComplete) {
      // Add delay to show the modal briefly before triggering completion
      setTimeout(() => {
        onComplete();
      }, 300);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {language === 'ar' ? 'السور المحفوظة' : 'Saved Surahs'}
            </Text>
            <TouchableOpacity 
              onPress={handleClose} 
              style={[
                styles.closeButton,
                isClosePressed && styles.closeButtonPressed
              ]}
              activeOpacity={0.7}
              onPressIn={() => setIsClosePressed(true)}
              onPressOut={() => setIsClosePressed(false)}
            >
              <Text style={[
                styles.closeButtonText,
                isClosePressed && styles.closeButtonTextPressed
              ]}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Success Message */}
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={48} color="#5b7f67" />
            <Text style={styles.successText}>
              {language === 'ar' 
                ? `تم حفظ تسجيل ${surahName} بنجاح!` 
                : `${surahName} recording saved successfully!`
              }
            </Text>
          </View>

          {/* Saved Surahs List */}
          <View style={styles.surahsContainer}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'السور المسجلة' : 'Recorded Surahs'}
            </Text>
            
            <ScrollView 
              style={styles.surahsList}
              showsVerticalScrollIndicator={savedSurahs.length > 4}
              nestedScrollEnabled={true}
              indicatorStyle="white"
            >
              {savedSurahs.map((surah, index) => (
                <View key={index} style={styles.surahItem}>
                  <View style={styles.surahContent}>
                    <Ionicons
                      name="musical-notes"
                      size={24}
                      color="#5b7f67"
                    />
                    <View style={styles.surahInfo}>
                      <Text style={styles.surahName}>
                        {surah.name}
                      </Text>
                      <Text style={styles.surahDate}>
                        {language === 'ar' ? 'تاريخ التسجيل: ' : 'Recorded: '}{surah.date}
                      </Text>
                    </View>
                  </View>
                  {surah.name === surahName && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>
                        {language === 'ar' ? 'جديد' : 'NEW'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleClose}
          >
            <Text style={styles.continueButtonText}>
              {language === 'ar' ? 'متابعة' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.large,
    paddingVertical: SIZES.extraLarge,
  },
  modalContent: {
    backgroundColor: '#2d4a32', // Green background as requested
    borderRadius: SIZES.medium,
    padding: SIZES.large,
    width: '100%',
    maxWidth: 500,
    maxHeight: '95%',
    minHeight: 450,
    borderWidth: 2,
    borderColor: '#5b7f67',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.large,
  },
  title: {
    fontFamily: 'KFGQPC HAFS Uthmanic Script Regular',
    fontSize: 20,
    color: '#F5E6C8',
  },
  closeButton: {
    padding: 0,
    backgroundColor: 'rgba(91,127,103,0.3)',
    borderRadius: 16,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(91,127,103,0.8)',
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(255,107,107,0.3)',
  },
  closeButtonTextPressed: {
    color: '#FF6B6B',
  },
  successMessage: {
    alignItems: 'center',
    marginBottom: SIZES.extraLarge,
    backgroundColor: 'rgba(91,127,103,0.2)',
    padding: SIZES.large,
    borderRadius: SIZES.medium,
  },
  successText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#F5E6C8',
    textAlign: 'center',
    marginTop: SIZES.medium,
  },
  surahsContainer: {
    flex: 1,
    minHeight: 200,
    marginBottom: SIZES.large,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#F5E6C8',
    marginBottom: SIZES.medium,
  },
  surahsList: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: SIZES.small,
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 200, 0.3)',
    maxHeight: 240,
    padding: SIZES.small,
  },
  surahItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 230, 200, 0.1)',
    minHeight: 60,
  },
  surahContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  surahInfo: {
    marginLeft: SIZES.medium,
    flex: 1,
  },
  surahName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#F5E6C8',
  },
  surahDate: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: '#5b7f67',
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#F5E6C8',
  },
  continueButton: {
    backgroundColor: '#5b7f67',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#F5E6C8',
  },
});

export default SavedSurahsModal;
