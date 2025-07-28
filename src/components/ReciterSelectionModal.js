import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Text from './Text';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { useLanguage } from '../utils/languageContext';

const ReciterSelectionModal = ({ 
  visible, 
  onClose, 
  availableReciters, 
  currentReciter, 
  onReciterSelect 
}) => {
  const { language, t } = useLanguage();

  const handleReciterSelect = (reciter) => {
    onReciterSelect(reciter);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text variant="h3" style={styles.title}>
              {language === 'ar' ? 'اختر القارئ' : 'Choose Reciter'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.reciterList} showsVerticalScrollIndicator={false}>
            {availableReciters.map((reciter, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.reciterItem,
                  currentReciter === reciter && styles.selectedReciter
                ]}
                onPress={() => handleReciterSelect(reciter)}
              >
                <View style={styles.reciterInfo}>
                  <Text 
                    variant="body1" 
                    style={[
                      styles.reciterName,
                      currentReciter === reciter && styles.selectedReciterText
                    ]}
                  >
                    {reciter}
                  </Text>
                  {currentReciter === reciter && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#5b7f67',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#F5E6C8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#F5E6C8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reciterList: {
    padding: 10,
  },
  reciterItem: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedReciter: {
    backgroundColor: '#5b7f67',
    borderColor: '#F5E6C8',
  },
  reciterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reciterName: {
    color: '#F5E6C8',
    fontSize: 16,
    flex: 1,
  },
  selectedReciterText: {
    color: '#F5E6C8',
    fontWeight: 'bold',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5E6C8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#5b7f67',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReciterSelectionModal; 