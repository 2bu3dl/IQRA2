import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useLanguage } from '../utils/languageContext';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { hapticSuccess } from '../utils/hapticFeedback';
import {
  getCustomLists,
  addCustomList,
  removeCustomList,
  addAyahToList,
  removeAyahFromList,
  isAyahInList,
} from '../utils/store';

const BookmarkModal = ({ 
  visible, 
  onClose, 
  surahName, 
  surahNumber, 
  ayahNumber,
  onBookmarkChange 
}) => {
  const { language, t } = useLanguage();
  const [customLists, setCustomLists] = useState(['Favorites']);
  const [selectedLists, setSelectedLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClosePressed, setIsClosePressed] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCustomLists();
      loadSelectedLists();
    }
  }, [visible, surahName, ayahNumber]);

  const loadCustomLists = async () => {
    try {
      const lists = await getCustomLists();
      console.log('[BookmarkModal] Loaded custom lists:', lists);
      setCustomLists(lists);
      if (lists.length === 0) {
        console.log('[BookmarkModal] No custom lists found, defaulting to Favorites');
        setCustomLists(['Favorites']);
      }
    } catch (error) {
      console.error('Error loading custom lists:', error);
      console.log('[BookmarkModal] Setting default Favorites list due to error');
      setCustomLists(['Favorites']);
    }
  };

  const loadSelectedLists = async () => {
    try {
      const selected = [];
      const lists = await getCustomLists();
      console.log('[BookmarkModal] Checking ayah in lists:', { surahName, ayahNumber, lists });
      for (const listName of lists) {
        const isSelected = await isAyahInList(listName, surahName, ayahNumber);
        console.log('[BookmarkModal] List:', listName, 'isSelected:', isSelected);
        if (isSelected) {
          selected.push(listName);
        }
      }
      console.log('[BookmarkModal] Selected lists:', selected);
      setSelectedLists(selected);
    } catch (error) {
      console.error('Error loading selected lists:', error);
    }
  };

  const handleListToggle = async (listName) => {
    try {
      setLoading(true);
      const isSelected = selectedLists.includes(listName);
      
      if (isSelected) {
        // Remove from list
        await removeAyahFromList(listName, surahName, ayahNumber);
        setSelectedLists(prev => prev.filter(name => name !== listName));
      } else {
        // Add to list
        await addAyahToList(listName, surahName, surahNumber, ayahNumber);
        setSelectedLists(prev => [...prev, listName]);
      }
      
      hapticSuccess();
      
      if (onBookmarkChange) {
        onBookmarkChange();
      }
    } catch (error) {
      console.error('Error toggling list:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'حدث خطأ أثناء حفظ الآية' : 'Error saving ayah'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return;
    
    try {
      setLoading(true);
      await addCustomList(newListName.trim());
      await loadCustomLists();
      setNewListName('');
      setShowAddList(false);
      hapticSuccess();
    } catch (error) {
      console.error('Error adding list:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'حدث خطأ أثناء إضافة القائمة' : 'Error adding list'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveList = async (listName) => {
    if (listName === 'Favorites') {
      Alert.alert(
        language === 'ar' ? 'لا يمكن حذف المفضلة' : 'Cannot Delete Favorites',
        language === 'ar' ? 'لا يمكن حذف قائمة المفضلة' : 'The Favorites list cannot be deleted'
      );
      return;
    }

    Alert.alert(
      language === 'ar' ? 'حذف القائمة' : 'Delete List',
      language === 'ar' 
        ? `هل أنت متأكد من حذف "${listName}"؟ سيتم حذف جميع الآيات المحفوظة في هذه القائمة.`
        : `Are you sure you want to delete "${listName}"? All saved ayahs in this list will be removed.`,
      [
        {
          text: language === 'ar' ? 'إلغاء' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await removeCustomList(listName);
              await loadCustomLists();
              setSelectedLists(prev => prev.filter(name => name !== listName));
              hapticSuccess();
            } catch (error) {
              console.error('Error removing list:', error);
              Alert.alert(
                language === 'ar' ? 'خطأ' : 'Error',
                language === 'ar' ? 'حدث خطأ أثناء حذف القائمة' : 'Error removing list'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderList = ({ item: listName }) => {
    const isSelected = selectedLists.includes(listName);
    const isFavorites = listName === 'Favorites';
    
    return (
      <View style={styles.listItem}>
        <TouchableOpacity
          style={[styles.listButton, isSelected && styles.selectedListButton]}
          onPress={() => handleListToggle(listName)}
          disabled={loading}
        >
          <View style={styles.listContent}>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isSelected ? '#5b7f67' : '#999'}
            />
            <Text style={[styles.listName, isSelected && styles.selectedListName]}>
              {listName}
            </Text>
          </View>
        </TouchableOpacity>
        
        {!isFavorites && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleRemoveList(listName)}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity 
            style={[
              styles.modalContent,
              showAddList && styles.modalContentExtended
            ]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {language === 'ar' ? 'حفظ الآية' : 'Save Ayah'}
            </Text>
            <TouchableOpacity 
              onPress={onClose} 
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

          {/* Ayah Info */}
          <View style={styles.ayahInfo}>
            <Text style={styles.ayahText}>
              {language === 'ar' ? 'الآية' : 'Ayah'} {ayahNumber} - {surahName}
            </Text>
          </View>

          {/* Lists Dropdown */}
          <View style={styles.listsContainer}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'اختر القائمة' : 'Choose List'}
            </Text>
            
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDropdown(!showDropdown)}
              disabled={loading}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedLists.length > 0 
                  ? `${selectedLists.length} ${language === 'ar' ? 'قائمة محددة' : 'lists selected'}`
                  : language === 'ar' ? 'اختر القوائم' : 'Select Lists'
                }
              </Text>
            </TouchableOpacity>

            {showDropdown && (
              <ScrollView 
                style={styles.dropdownList}
                showsVerticalScrollIndicator={customLists.length > 4}
                nestedScrollEnabled={true}
                indicatorStyle="white"
              >
                {customLists.map((listName) => {
                  const isSelected = selectedLists.includes(listName);
                  const isFavorites = listName === 'Favorites';
                  
                  return (
                    <TouchableOpacity
                      key={listName}
                      style={[styles.dropdownItem, isSelected && styles.selectedDropdownItem]}
                      onPress={() => handleListToggle(listName)}
                      disabled={loading}
                    >
                      <Text style={[styles.dropdownItemText, isSelected && styles.selectedDropdownItemText]}>
                        {listName}
                      </Text>
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Add New List */}
          {showAddList ? (
            <View style={styles.addListContainer}>
              <TextInput
                style={styles.newListInput}
                placeholder={language === 'ar' ? 'اسم القائمة الجديدة' : 'New list name'}
                placeholderTextColor="#999"
                value={newListName}
                onChangeText={setNewListName}
                autoFocus={true}
              />
              <View style={styles.addListButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddList(false);
                    setNewListName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addButton, !newListName.trim() && styles.addButtonDisabled]}
                  onPress={handleAddList}
                  disabled={!newListName.trim() || loading}
                >
                  <Text style={styles.addButtonText}>
                    {language === 'ar' ? 'إضافة' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addListButton}
              onPress={() => setShowAddList(true)}
            >
              <Text style={styles.addListButtonText}>
                {language === 'ar' ? 'إضافة قائمة جديدة' : 'Add New List'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {language === 'ar' ? 'حفظ' : 'Save'}
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
    backgroundColor: '#1a1a1a',
    borderRadius: SIZES.medium,
    padding: SIZES.large,
    width: '100%',
    maxWidth: 500,
    maxHeight: '95%',
    minHeight: 475,
  },
  modalContentExtended: {
    minHeight: 600,
    maxHeight: '98%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.large,
  },
  title: {
    fontFamily: 'KFGQPC Uthman Taha Naskh Bold',
    fontSize: 20,
    color: '#F5E6C8',
  },
  closeButton: {
    padding: 0,
    backgroundColor: 'rgba(165,115,36,0.3)',
    borderRadius: 16,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(165,115,36,0.8)',
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(255,107,107,0.3)',
  },
  closeButtonTextPressed: {
    color: '#FF6B6B',
  },
  ayahInfo: {
    backgroundColor: 'rgba(165,115,36,0.2)',
    padding: SIZES.small,
    borderRadius: SIZES.small,
    marginBottom: SIZES.large,
  },
  ayahText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#F5E6C8',
    textAlign: 'center',
  },
  listsContainer: {
    flex: 1,
    minHeight: 200,
    marginBottom: SIZES.small,
  },
  dropdownButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: SIZES.small,
    padding: SIZES.small,
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 200, 0.3)',
    marginBottom: SIZES.small,
  },
  dropdownButtonText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#F5E6C8',
    textAlign: 'center',
  },
  dropdownList: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: SIZES.small,
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 200, 0.3)',
    maxHeight: 240,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 230, 200, 0.1)',
    minHeight: 40,
  },
  selectedDropdownItem: {
    backgroundColor: 'rgba(91, 127, 103, 0.3)',
  },
  dropdownItemText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#F5E6C8',
  },
  selectedDropdownItemText: {
    color: '#5b7f67',
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#5b7f67',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#F5E6C8',
    marginBottom: SIZES.medium,
  },

  addListContainer: {
    marginTop: SIZES.large,
  },
  newListInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    color: '#F5E6C8',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    marginBottom: SIZES.medium,
  },
  addListButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginRight: SIZES.small,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FF6B6B',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#5b7f67',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginLeft: SIZES.small,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(91, 127, 103, 0.5)',
  },
  addButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#F5E6C8',
  },
  addListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(91, 127, 103, 0.2)',
    borderRadius: SIZES.small,
    padding: SIZES.small,
    marginTop: SIZES.small,
    borderColor: '#5b7f67',
    borderWidth: 1,
  },
  addListButtonText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#5b7f67',
    marginLeft: SIZES.small,
  },
  saveButton: {
    backgroundColor: '#5b7f67',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginTop: SIZES.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#F5E6C8',
  },
  debugText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#FFA500',
    textAlign: 'center',
    marginBottom: SIZES.small,
  },
});

export default BookmarkModal; 