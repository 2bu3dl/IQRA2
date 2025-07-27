import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { getTranslationSources, getCurrentTranslation, loadAllTranslations } from '../utils/translations';
import { theme } from '../utils/theme';
import { useLanguage } from '../utils/languageContext';
import HapticFeedback from 'react-native-haptic-feedback';

const ALL_KEYS = ['sahih', 'yusufali', 'maududi', 'hilali'];

const TranslationModal = ({ visible, onClose, currentSurah, currentAyah, onAyahChange, isFirstAyah, isLastAyah }) => {
  const { language, t } = useLanguage();
  const [selectedSource, setSelectedSource] = useState('sahih');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);

  const translationSources = getTranslationSources();

  useEffect(() => {
    if (visible) {
      setSelectedSource('sahih'); // Always start with Sahih
      if (currentAyah) {
        loadTranslations('sahih');
      } else {
        setTranslation('No translation for this card.');
      }
    }
  }, [visible, currentSurah, currentAyah]);

  if (language === 'ar') return null;

  const loadTranslations = async (source) => {
    setLoading(true);
    try {
      if (currentAyah) {
        const currentTranslation = getCurrentTranslation(source, currentSurah, currentAyah);
        setTranslation(currentTranslation);
        console.log('Set translation:', { source, currentSurah, currentAyah, currentTranslation });
      } else {
        setTranslation('No translation for this card.');
      }
    } catch (error) {
      console.error('Error loading translation:', error);
      Alert.alert('Error', 'Failed to load translation');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceChange = (source) => {
    setSelectedSource(source);
    if (currentAyah) {
      loadTranslations(source);
    } else {
      setTranslation('No translation for this card.');
    }
  };

  // The three options at the bottom are all except the selected one
  const bottomOptions = ALL_KEYS.filter(key => key !== selectedSource);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('translation')}</Text>
            <TouchableOpacity onPress={onClose} onPressIn={() => HapticFeedback.trigger('selection', { enableVibrateFallback: true })} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Current translation label at the top */}
          <View style={styles.currentSourceLabelContainer}>
            <Text style={styles.currentSourceLabel}>{translationSources[selectedSource]}</Text>
          </View>

          <View style={styles.translationContainer}>
            <Text style={styles.ayahInfo}>{`Surah ${currentSurah}, Ayah ${currentAyah}`}</Text>
            <ScrollView style={styles.translationScroll}>
              <View style={styles.translationText}>
                {loading ? (
                  <Text style={styles.loadingText}>{t('loading')}</Text>
                ) : (
                  <Text style={{ fontSize: 20, lineHeight: 32, color: '#444', fontWeight: 'bold', textAlign: 'justify' }}>
                    {translation || t('translation_not_available')}
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Prev/Next Buttons */}
          <View style={styles.ayahNavButtons}>
            <TouchableOpacity
              style={[styles.ayahNavButton, isFirstAyah && { opacity: 0.5 }]}
              disabled={isFirstAyah}
              onPress={() => { HapticFeedback.trigger('selection', { enableVibrateFallback: true }); onAyahChange('prev'); }}
              onPressIn={() => HapticFeedback.trigger('selection', { enableVibrateFallback: true })}
            >
              <Text style={styles.ayahNavButtonText}>{t('previous')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ayahNavButton, isLastAyah && { opacity: 0.5 }]}
              disabled={isLastAyah}
              onPress={() => { HapticFeedback.trigger('selection', { enableVibrateFallback: true }); onAyahChange('next'); }}
              onPressIn={() => HapticFeedback.trigger('selection', { enableVibrateFallback: true })}
            >
              <Text style={styles.ayahNavButtonText}>{t('next')}</Text>
            </TouchableOpacity>
          </View>

          {/* Source Buttons at the bottom */}
          <View style={styles.sourceButtonsBottom}>
            {bottomOptions.map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.sourceButton}
                onPress={() => { HapticFeedback.trigger('selection', { enableVibrateFallback: true }); handleSourceChange(key); }}
                onPressIn={() => HapticFeedback.trigger('selection', { enableVibrateFallback: true })}
              >
                <Text style={styles.sourceButtonText}>
                  {translationSources[key]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#F5E6C8',
    borderRadius: 20,
    padding: 20,
    width: '93%',
    height: '78%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#444',
    textAlign: 'center',
    textDecorationLine: 'underline',
    // Softer shadow for title
    textShadowColor: '#A68B2C',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    // Deeper shadow for close button
    shadowColor: '#A68B2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 12,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentSourceLabelContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  currentSourceLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgba(165,115,36,0.8)',
    letterSpacing: 1,
    paddingVertical: 6,
    textAlign: 'center',
  },
  translationContainer: {
    flex: 1,
  },
  ayahInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(51, 105, 78, 0.8)',
    marginBottom: 15,
    textAlign: 'center',
    // Add a bit of shadow
    textShadowColor: '#A68B2C',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  translationScroll: {
    flex: 1,
  },
  translationText: {
    fontSize: 20,
    lineHeight: 32,
    color: '#1a1a1a',
    textAlign: 'justify',
    backgroundColor: '#FAF3E3',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 2,
    borderRadius: 24, // even more rounded
    padding: 16,
    marginVertical: 8,
    fontWeight: 'bold',
    // Deeper shadow
    shadowColor: '#A68B2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingText: {
    fontSize: 18,
    color: '#1a1a1a',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  sourceButtonsBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  sourceButton: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14, // more rounded
    backgroundColor: 'rgba(165,115,36,0.8)',
    borderWidth: 2,
    borderColor: 'rgba(165,115,36,0.8)',
    marginHorizontal: 4,
    // Deeper shadow
    shadowColor: '#A68B2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 12,
  },
  sourceButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  ayahNavButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    gap: 10,
  },
  ayahNavButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    alignItems: 'center',
    // Deeper shadow for nav buttons
    shadowColor: '#A68B2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 12,
  },
  ayahNavButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TranslationModal; 