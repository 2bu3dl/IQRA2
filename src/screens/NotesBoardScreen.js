import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SIZES, COLORS } from '../utils/theme';

const NotesBoardScreen = ({ navigation, route }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('General Note');
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [language, setLanguage] = useState('en'); // This should come from your language context

  useEffect(() => {
    loadNotesBoard();
  }, []);

  // Refresh notes when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotesBoard();
    });

    return unsubscribe;
  }, [navigation]);

  const loadNotesBoard = async () => {
    setLoading(true);
    try {
      const notesBoardKey = 'notes_board';
      const existingNotes = await AsyncStorage.getItem(notesBoardKey);
      const notesArray = existingNotes ? JSON.parse(existingNotes) : [];
      
      // Sort notes by timestamp (newest first)
      const sortedNotes = notesArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setNotes(sortedNotes);
      console.log('[NotesBoardScreen] Loaded notes:', sortedNotes.length);
    } catch (error) {
      console.error('[NotesBoardScreen] Error loading notes board:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const addNoteToBoard = async () => {
    if (!newNoteText.trim()) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'لا يمكن إضافة ملاحظة فارغة' : 'Cannot add an empty note'
      );
      return;
    }

    try {
      const notesBoardKey = 'notes_board';
      const existingNotes = await AsyncStorage.getItem(notesBoardKey);
      const notesArray = existingNotes ? JSON.parse(existingNotes) : [];
      
      const newNote = {
        id: Date.now().toString(),
        surahNumber: 0, // General note
        ayahNumber: 0, // General note
        title: noteTitle,
        content: newNoteText.trim(),
        timestamp: new Date().toISOString(),
        author: 'User', // This can be enhanced later with user authentication
        surahName: 'General',
        isFavorited: false
      };
      
      notesArray.unshift(newNote); // Add to beginning
      await AsyncStorage.setItem(notesBoardKey, JSON.stringify(notesArray));
      
      setNotes([newNote, ...notes]);
      setNewNoteText('');
      setNoteTitle('General Note');
      setShowAddNoteModal(false);
      
      Alert.alert(
        language === 'ar' ? 'تم الإضافة' : 'Added!',
        language === 'ar' ? 'تم إضافة ملاحظتك إلى لوحة الملاحظات' : 'Your note has been added to the Notes Board!'
      );
    } catch (error) {
      console.error('[NotesBoardScreen] Error adding note:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في إضافة الملاحظة' : 'Failed to add note'
      );
    }
  };

  const toggleFavorite = async (noteId) => {
    try {
      const notesBoardKey = 'notes_board';
      const existingNotes = await AsyncStorage.getItem(notesBoardKey);
      const notesArray = existingNotes ? JSON.parse(existingNotes) : [];
      
      const updatedNotes = notesArray.map(note => 
        note.id === noteId 
          ? { ...note, isFavorited: !note.isFavorited }
          : note
      );
      
      await AsyncStorage.setItem(notesBoardKey, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('[NotesBoardScreen] Error toggling favorite:', error);
    }
  };

  const deleteNote = async (noteId) => {
    Alert.alert(
      language === 'ar' ? 'حذف الملاحظة' : 'Delete Note',
      language === 'ar' ? 'هل أنت متأكد من أنك تريد حذف هذه الملاحظة؟' : 'Are you sure you want to delete this note?',
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
              const notesBoardKey = 'notes_board';
              const existingNotes = await AsyncStorage.getItem(notesBoardKey);
              const notesArray = existingNotes ? JSON.parse(existingNotes) : [];
              
              const updatedNotes = notesArray.filter(note => note.id !== noteId);
              await AsyncStorage.setItem(notesBoardKey, JSON.stringify(updatedNotes));
              
              setNotes(updatedNotes);
              console.log('[NotesBoardScreen] Note deleted:', noteId);
            } catch (error) {
              console.error('[NotesBoardScreen] Error deleting note:', error);
              Alert.alert(
                language === 'ar' ? 'خطأ' : 'Error',
                language === 'ar' ? 'فشل في حذف الملاحظة' : 'Failed to delete note'
              );
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const renderNote = ({ item }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteInfo}>
          <Text style={styles.noteTitle}>
            {item.title || (item.surahNumber > 0 
              ? `${item.surahName} - ${language === 'ar' ? 'الآية' : 'Ayah'} ${item.ayahNumber}`
              : language === 'ar' ? 'ملاحظة عامة' : 'General Note'
            )}
          </Text>
          <Text style={styles.noteTimestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Text style={styles.favoriteButtonText}>
              {item.isFavorited ? '⬢' : '⬡'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteNote(item.id)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.noteContent}>{item.content}</Text>
      
      <View style={styles.noteFooter}>
        <Text style={styles.noteAuthor}>By: {item.author}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'لوحة الملاحظات' : 'Notes Board'}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.hexagonButton}
            onPress={() => {
              // Toggle favorites filter
              setShowFavoritesOnly(!showFavoritesOnly);
            }}
          >
            <Text style={[
              styles.hexagonButtonText,
              showFavoritesOnly && { color: '#FFD700' } // Gold color when active
            ]}>
              {showFavoritesOnly ? '⬢' : '⬡'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddNoteModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </Text>
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            {language === 'ar' ? 'لا توجد ملاحظات' : 'No Notes Yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {language === 'ar' 
              ? 'كن أول من يشارك ملاحظة على لوحة الملاحظات!'
              : 'Be the first to share a note on the Notes Board!'
            }
          </Text>
          <TouchableOpacity
            style={styles.addFirstNoteButton}
            onPress={() => setShowAddNoteModal(true)}
          >
            <Text style={styles.addFirstNoteButtonText}>
              {language === 'ar' ? 'أضف أول ملاحظة' : 'Add First Note'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={showFavoritesOnly ? notes.filter(note => note.isFavorited) : notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadNotesBoard}
        />
      )}

      {/* Add Note Modal */}
      <Modal
        visible={showAddNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddNoteModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddNoteModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
                          <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  {language === 'ar' ? 'ملاحظة عامة' : 'General Note'}
                </Text>
                <TouchableOpacity
                  style={styles.renameButton}
                  onPress={() => {
                    // Toggle rename mode
                    setShowRenameInput(!showRenameInput);
                  }}
                >
                  <Text style={styles.renameButtonText}>✏️</Text>
                </TouchableOpacity>
                            </View>
              
              {/* Rename Input */}
              {showRenameInput && (
                <View style={styles.renameInputContainer}>
                  <TextInput
                    style={styles.renameInput}
                    placeholder={language === 'ar' ? 'أدخل عنوان جديد' : 'Enter new title'}
                    placeholderTextColor="#999"
                    value={noteTitle}
                    onChangeText={setNoteTitle}
                    maxLength={50}
                  />
                  <TouchableOpacity
                    style={styles.renameSaveButton}
                    onPress={() => {
                      setShowRenameInput(false);
                    }}
                  >
                    <Text style={styles.renameSaveButtonText}>
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <TextInput
              style={styles.noteInput}
              placeholder={language === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
              placeholderTextColor="#999"
              value={newNoteText}
              onChangeText={setNewNoteText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddNoteModal(false);
                  setNewNoteText('');
                }}
              >
                <Text style={styles.cancelButtonText}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addNoteToBoard}
              >
                <Text style={styles.addButtonText}>
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,115,36,0.3)',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hexagonButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexagonButtonText: {
    color: '#F5E6C8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  renameButton: {
    padding: 8,
  },
  renameButtonText: {
    fontSize: 20,
  },
  renameInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  renameInput: {
    flex: 1,
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderColor: 'rgba(165,115,36,0.6)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#F5E6C8',
    fontSize: 16,
  },
  renameSaveButton: {
    backgroundColor: 'rgba(165,115,36,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#F5E6C8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#F5E6C8',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#5b7f67',
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#5b7f67',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addFirstNoteButton: {
    backgroundColor: 'rgba(165,115,36,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFirstNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesList: {
    padding: 16,
  },
  noteCard: {
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderColor: 'rgba(165,115,36,0.6)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    color: '#5b7f67',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noteTimestamp: {
    color: '#999',
    fontSize: 12,
  },
  deleteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: '#FF4444',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  noteContent: {
    color: '#F5E6C8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(165,115,36,0.3)',
    paddingTop: 8,
  },
  noteAuthor: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.6)',
  },
  modalTitle: {
    color: '#F5E6C8',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  noteInput: {
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderColor: 'rgba(165,115,36,0.6)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    color: '#F5E6C8',
    fontSize: 16,
    marginBottom: 24,
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderColor: 'rgba(165,115,36,0.6)',
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#F5E6C8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'rgba(165,115,36,0.8)',
  },
});

export default NotesBoardScreen;
