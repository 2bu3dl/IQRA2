import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Image, ImageBackground, Modal, TouchableOpacity, Dimensions, Alert, TextInput, Animated, ScrollView, FlatList, Platform, PanResponder } from 'react-native';
import { useAuth } from '../utils/authContext';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import { 
  SCREEN_SIZES, 
  getResponsiveFontSize, 
  getResponsiveSpacing, 
  getResponsiveDimension, 
  getScreenMultiplier,
  RESPONSIVE_FONT_SIZES,
  RESPONSIVE_SPACING,
  RESPONSIVE_ICON_SIZES,
  getResponsivePosition
} from '../utils/responsive';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { loadData, resetProgress, checkStreakBroken, getCustomLists, getListSurahs } from '../utils/store';
import { syncProgressData } from '../utils/cloudStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../utils/languageContext';
import telemetryService from '../utils/telemetry';
import { hapticSelection } from '../utils/hapticFeedback';
import audioRecorder from '../utils/audioRecorder';
import audioPlayer from '../utils/audioPlayer';
import logger from '../utils/logger';

import AuthScreen from './AuthScreen';
import StreakAnimation from '../components/StreakAnimation';
import StreakBrokenAnimation from '../components/StreakBrokenAnimation';
import LeaderboardCard from '../components/LeaderboardCard';
import ProfileDashboard from './ProfileDashboard';
import { LEADERBOARD_TYPES, syncUserStatsToLeaderboard, testLeaderboardConnection } from '../utils/leaderboardService';

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const formatLargeNumber = (num) => {
  if (num >= 1000000000) {
    return {
      text: (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B',
      fontSize: getResponsiveFontSize(18)
    };
  } else if (num >= 10000000) {
    return {
      text: (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M',
      fontSize: getResponsiveFontSize(20)
    };
  } else if (num >= 1000000) {
    return {
      text: (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M',
      fontSize: getResponsiveFontSize(22)
    };
  } else if (num >= 100000) {
    return {
      text: num.toLocaleString(),
      fontSize: getResponsiveFontSize(24)
    };
  } else if (num >= 10000) {
    return {
      text: num.toLocaleString(),
      fontSize: getResponsiveFontSize(26)
    };
  } else {
    return {
      text: num.toLocaleString(),
      fontSize: getResponsiveFontSize(28)
    };
  }
};

const formatStreakNumber = (num) => {
  if (num >= 1000) {
    return {
      text: num.toLocaleString(),
      fontSize: getResponsiveFontSize(28)
    };
  } else if (num >= 100) {
    return {
      text: num.toString(),
      fontSize: getResponsiveFontSize(32)
    };
  } else {
    return {
      text: num.toString(),
      fontSize: getResponsiveFontSize(36)
    };
  }
};



const HomeScreen = ({ navigation, route }) => {
  const { language, changeLanguage, t } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  
  // Get screen dimensions for responsive layout
  const { width, height } = Dimensions.get('window');
  const isSmallScreen = SCREEN_SIZES.SMALL;
  const isMediumScreen = SCREEN_SIZES.MEDIUM;
  
  const toArabicNumber = (num) => {
    if (language !== 'ar') return num.toString();
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };
  const [data, setData] = useState({
    totalHasanat: 0,
    todayHasanat: 0,
    streak: 0,
    memorizedAyahs: {
      'Al-Fatihah': {
        total: 7,
        memorized: 0,
      },
    },
    totalAyaat: 0,
    memorizedAyaat: 0,
  });
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoActiveTab, setInfoActiveTab] = useState('numerals'); // 'numerals' or 'tajweed'
  const [duaVisible, setDuaVisible] = useState(false);
  const [duaExpanded, setDuaExpanded] = useState(false);
  const [duaButtonPressed, setDuaButtonPressed] = useState(false);
  const [currentDuaIndex, setCurrentDuaIndex] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);
  const [resetType, setResetType] = useState('all'); // 'all' or 'today'
  const [includeRecordings, setIncludeRecordings] = useState(false);
  const [memorizeButtonHeld, setMemorizeButtonHeld] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [hasanatModalVisible, setHasanatModalVisible] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [recordingsModalVisible, setRecordingsModalVisible] = useState(false);
  const [showSavedNotesModal, setShowSavedNotesModal] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesDropdownOpen, setNotesDropdownOpen] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [showSavedAyaatModal, setShowSavedAyaatModal] = useState(false);
  const [customLists, setCustomLists] = useState([]);
  const [selectedCustomList, setSelectedCustomList] = useState('');
  const [listAyahs, setListAyahs] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsDropdownOpen, setListsDropdownOpen] = useState(false);
  const [pressedStatBox, setPressedStatBox] = useState(null); // 'progress', 'hasanat', 'streak'
  const [pressedSavedAyaat, setPressedSavedAyaat] = useState(false);
  const [pressedRecordings, setPressedRecordings] = useState(false);
  const [pressedSavedNotes, setPressedSavedNotes] = useState(false);
  const [pressedMemorizationLeaderboard, setPressedMemorizationLeaderboard] = useState(false);
  const [pressedStreakLeaderboard, setPressedStreakLeaderboard] = useState(false);
  
  // Helper functions for notes
  const getSurahName = (surahNumber) => {
    const surahNames = {
      1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Aal-Imran', 4: 'An-Nisa', 5: 'Al-Maidah',
      6: 'Al-Anam', 7: 'Al-Araf', 8: 'Al-Anfal', 9: 'At-Tawbah', 10: 'Yunus',
      11: 'Hud', 12: 'Yusuf', 13: 'Ar-Rad', 14: 'Ibrahim', 15: 'Al-Hijr',
      16: 'An-Nahl', 17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
      21: 'Al-Anbiya', 22: 'Al-Hajj', 23: 'Al-Muminun', 24: 'An-Nur', 25: 'Al-Furqan',
      26: 'Ash-Shuara', 27: 'An-Naml', 28: 'Al-Qasas', 29: 'Al-Ankabut', 30: 'Ar-Rum',
      31: 'Luqman', 32: 'As-Sajdah', 33: 'Al-Ahzab', 34: 'Saba', 35: 'Fatir',
      36: 'Ya-Sin', 37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir',
      41: 'Fussilat', 42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan', 45: 'Al-Jathiyah',
      46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath', 49: 'Al-Hujurat', 50: 'Qaf',
      51: 'Adh-Dhariyat', 52: 'At-Tur', 53: 'An-Najm', 54: 'Al-Qamar', 55: 'Ar-Rahman',
      56: 'Al-Waqiah', 57: 'Al-Hadid', 58: 'Al-Mujadilah', 59: 'Al-Hashr', 60: 'Al-Mumtahanah',
      61: 'As-Saff', 62: 'Al-Jumuah', 63: 'Al-Munafiqun', 64: 'At-Taghabun', 65: 'At-Talaq',
      66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam', 69: 'Al-Haqqah', 70: 'Al-Maarij',
      71: 'Nuh', 72: 'Al-Jinn', 73: 'Al-Muzzammil', 74: 'Al-Muddathir', 75: 'Al-Qiyamah',
      76: 'Al-Insan', 77: 'Al-Mursalat', 78: 'An-Naba', 79: 'An-Naziat', 80: 'Abasa',
      81: 'At-Takwir', 82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq', 85: 'Al-Buruj',
      86: 'At-Tariq', 87: 'Al-Ala', 88: 'Al-Ghashiyah', 89: 'Al-Fajr', 90: 'Al-Balad',
      91: 'Ash-Shams', 92: 'Al-Layl', 93: 'Ad-Duha', 94: 'Ash-Sharh', 95: 'At-Tin',
      96: 'Al-Alaq', 97: 'Al-Qadr', 98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: 'Al-Adiyat',
      101: 'Al-Qariah', 102: 'At-Takathur', 103: 'Al-Asr', 104: 'Al-Humazah', 105: 'Al-Fil',
      106: 'Al-Quraish', 107: 'Al-Maun', 108: 'Al-Kawthar', 109: 'Al-Kafirun', 110: 'An-Nasr',
      111: 'Al-Masad', 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas'
    };
    return surahNames[surahNumber] || `Surah ${surahNumber}`;
  };

  const loadSurahNotes = async (surahNumber) => {
    try {
      const notes = [];
      const noteKey = `note_${surahNumber}_`;
      
      // Get all keys for this surah
      const allKeys = await AsyncStorage.getAllKeys();
      const surahNoteKeys = allKeys.filter(key => key.startsWith(noteKey));
      
      if (surahNoteKeys.length > 0) {
        console.log(`[HomeScreen] Found ${surahNoteKeys.length} note keys for surah ${surahNumber}:`, surahNoteKeys);
      }
      
      for (const key of surahNoteKeys) {
        const noteContent = await AsyncStorage.getItem(key);
        if (noteContent) {
          const ayahNumber = key.replace(noteKey, '');
          const note = {
            id: key,
            surahNumber: surahNumber,
            ayahNumber: parseInt(ayahNumber),
            content: noteContent,
            surahName: getSurahName(surahNumber)
          };
          notes.push(note);
          console.log(`[HomeScreen] Loaded note for surah ${surahNumber}, ayah ${ayahNumber}:`, note);
        }
      }
      
      return notes;
    } catch (error) {
      console.error(`[HomeScreen] Error loading notes for surah ${surahNumber}:`, error);
      return [];
    }
  };

  const loadSavedNotes = async () => {
    setNotesLoading(true);
    try {
      console.log('[HomeScreen] Starting to load saved notes...');
      const notes = [];
      
      // Load all surah notes
      const allSurahs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
      
      for (const surahNumber of allSurahs) {
        // Load notes for each surah
        const surahNotes = await loadSurahNotes(surahNumber);
        if (surahNotes.length > 0) {
          console.log(`[HomeScreen] Found ${surahNotes.length} notes for surah ${surahNumber}`);
        }
        notes.push(...surahNotes);
      }
      
      console.log('[HomeScreen] Total notes found:', notes.length);
      console.log('[HomeScreen] Notes data:', notes);
      setSavedNotes(notes);
    } catch (error) {
      console.error('[HomeScreen] Error loading saved notes:', error);
      setSavedNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const renderNotesBySurah = (notes) => {
    console.log('[HomeScreen] renderNotesBySurah called with notes:', notes);
    
    if (!notes || notes.length === 0) {
      console.log('[HomeScreen] No notes to render');
      return null;
    }

    // Group notes by surah
    const notesBySurah = {};
    notes.forEach(note => {
      console.log('[HomeScreen] Processing note:', note);
      if (!notesBySurah[note.surahNumber]) {
        notesBySurah[note.surahNumber] = [];
      }
      notesBySurah[note.surahNumber].push(note);
    });

    console.log('[HomeScreen] Notes grouped by surah:', notesBySurah);

    // Sort surahs by number
    const sortedSurahs = Object.keys(notesBySurah).sort((a, b) => parseInt(a) - parseInt(b));
    console.log('[HomeScreen] Sorted surahs:', sortedSurahs);

    return sortedSurahs.map(surahNumber => (
      <View key={surahNumber} style={styles.surahSection}>
        <Text style={styles.surahSectionTitle}>
          {getSurahName(parseInt(surahNumber))}
        </Text>
        {notesBySurah[surahNumber].map((note, index) => (
          <View key={note.id} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>
                {language === 'ar' ? 'الآية' : 'Ayah'} {note.ayahNumber}
              </Text>
            </View>
            
            <Text style={styles.noteContent}>{note.content}</Text>
            
            {/* Social Features */}
            <View style={styles.socialFeatures}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleFavorite(note.id)}
              >
                <Text style={styles.socialButtonText}>
                  {note.isFavorited ? '❤️' : '🤍'} {language === 'ar' ? 'مفضل' : 'Favorite'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleLike(note.id)}
              >
                <Text style={styles.socialButtonText}>
                  {note.isLiked ? '👍' : '👍'} {note.likes || 0}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleComment(note.id)}
              >
                <Text style={styles.socialButtonText}>
                  💬 {note.comments || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    ));
  };

  const handleFavorite = (noteId) => {
    setSavedNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, isFavorited: !note.isFavorited }
        : note
    ));
  };

  const handleLike = (noteId) => {
    setSavedNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, isLiked: !note.isLiked, likes: (note.likes || 0) + (note.isLiked ? -1 : 1) }
        : note
    ));
  };

  const handleComment = (noteId) => {
    // This would open a comment modal or input
    Alert.alert(
      language === 'ar' ? 'إضافة تعليق' : 'Add Comment',
      language === 'ar' ? 'سيتم إضافة ميزة التعليقات قريباً' : 'Comment feature will be added soon'
    );
  };

  // Functions for Saved Ayaat modal
  const loadCustomLists = async () => {
    try {
      const lists = await getCustomLists();
      setCustomLists(lists);
      if (lists.length > 0) {
        setSelectedCustomList(lists[0]);
      }
    } catch (error) {
      console.error('[HomeScreen] Error loading custom lists:', error);
      setCustomLists([]);
    }
  };

  const loadListAyahs = async (listName) => {
    if (!listName) return;
    
    setListsLoading(true);
    try {
      const surahs = await getListSurahs(listName);
      // Flatten surahs into individual ayahs
      const allAyahs = [];
      surahs.forEach(surah => {
        surah.bookmarkedAyaat.forEach(ayahNumber => {
          allAyahs.push({
            surahName: surah.surahName,
            surahNumber: surah.surahNumber,
            ayahNumber: ayahNumber,
            id: `${surah.surahNumber}_${ayahNumber}`
          });
        });
      });
      setListAyahs(allAyahs);
    } catch (error) {
      console.error('[HomeScreen] Error loading list ayahs:', error);
      setListAyahs([]);
    } finally {
      setListsLoading(false);
    }
  };

  // Load custom lists when Saved Ayaat modal opens
  useEffect(() => {
    if (showSavedAyaatModal) {
      loadCustomLists();
    }
  }, [showSavedAyaatModal]);

  // Load list ayahs when selected list changes
  useEffect(() => {
    if (selectedCustomList) {
      loadListAyahs(selectedCustomList);
    }
  }, [selectedCustomList]);
  
  // Page indicator swipe functionality
  const dotsSwipeResponder = useRef(null);
  const dotsLayout = useRef({ width: 0, x: 0 });
  
  // Streak animation state
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [newStreak, setNewStreak] = useState(0);
  
  // Streak broken animation state
  const [showStreakBrokenAnimation, setShowStreakBrokenAnimation] = useState(false);
  const [brokenStreakData, setBrokenStreakData] = useState({ previousStreak: 0, missedDays: [] });
  
  // Pre-calculated glow animation values for caching
  const GLOW_CONFIG = {
    // Icon container glow
    iconContainer: {
      shadowRadius: {
        android: { normal: 8, pressed: 12 },
        ios: { normal: 35, pressed: 40 }
      },
      shadowOpacity: {
        android: { normal: 1.0, pressed: 2.0 },
        ios: { normal: 5.0, pressed: 8.5 }
      },
      elevation: {
        android: { normal: 5, pressed: 8 },
        ios: { normal: 15, pressed: 25 }
      },
    },
    // Text button glow
    textButton: {
      shadowOpacity: {
        android: { normal: 0.2, pressed: 0.4 },
        ios: { normal: 0.6, pressed: 1.0 }
      },
      shadowRadius: {
        android: { normal: 4, pressed: 8 },
        ios: { normal: 10, pressed: 24 }
      },
      elevation: {
        android: { normal: 3, pressed: 6 },
        ios: { normal: 8, pressed: 20 }
      },
    },
    // Text glow
    text: {
      shadowRadius: 4,
      shadowOpacity: 1.0,
    },
  };
  
  // Goal setting state
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalCompletionDate, setGoalCompletionDate] = useState(null);
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalStartDate, setGoalStartDate] = useState(null);
  const flatListRef = useRef(null);

  // Streak animation handler
  const handleStreakAnimationComplete = () => {
    setShowStreakAnimation(false);
  };

  // Streak broken animation handler
  const handleStreakBrokenAnimationComplete = () => {
    setShowStreakBrokenAnimation(false);
  };

  // Sync user stats to leaderboard when data changes
  useEffect(() => {
    if (data.totalHasanat > 0 || data.streak > 0) {
      syncUserStatsToLeaderboard().catch(error => {
        logger.error('HomeScreen', 'Error syncing to leaderboard', error);
      });
    }
  }, [data.totalHasanat, data.streak, data.memorizedAyaat]);

  // Test leaderboard connection (for debugging)
  const testLeaderboard = async () => {
    try {
      const result = await testLeaderboardConnection();
      if (result.success) {
        Alert.alert('Success', 'Leaderboard database connection is working!');
      } else {
        Alert.alert('Error', `Leaderboard test failed: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Error', `Test failed: ${error.message}`);
    }
  };

  // Goal calculation helpers
  const calculateGoalCompletionDate = (ayaatPerDay) => {
    const totalAyaat = 6236; // Total Quran ayaat
    const daysNeeded = Math.ceil(totalAyaat / ayaatPerDay);
    const startDate = new Date();
    const completionDate = new Date(startDate);
    completionDate.setDate(startDate.getDate() + daysNeeded);
    return completionDate;
  };

  const calculateGoalProgress = (ayaatPerDay, missedDays = 0) => {
    if (!goalStartDate) return 0;
    const totalAyaat = 6236;
    const daysNeeded = Math.ceil(totalAyaat / ayaatPerDay);
    const daysElapsed = Math.floor((new Date() - goalStartDate) / (1000 * 60 * 60 * 24));
    const adjustedDaysNeeded = daysNeeded + missedDays;
    return Math.min(Math.max((daysElapsed / adjustedDaysNeeded) * 100, 0), 100);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const saveGoalData = async (goal, startDate, completionDate) => {
    try {
      if (goal) {
        await AsyncStorage.setItem('selectedGoal', JSON.stringify(goal));
      } else {
        await AsyncStorage.removeItem('selectedGoal');
      }
      if (startDate) {
        await AsyncStorage.setItem('goalStartDate', startDate.toISOString());
      } else {
        await AsyncStorage.removeItem('goalStartDate');
      }
      if (completionDate) {
        await AsyncStorage.setItem('goalCompletionDate', completionDate.toISOString());
      } else {
        await AsyncStorage.removeItem('goalCompletionDate');
      }
    } catch (error) {
      logger.error('HomeScreen', 'Error saving goal data', error);
    }
  };

  // Scroll to default page on mount
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({
          index: 1,
          animated: false
        });
      }, 100);
    }
  }, []);

  // Load saved notes when modal opens
  useEffect(() => {
    if (showSavedNotesModal) {
      loadSavedNotes();
    }
  }, [showSavedNotesModal]);

  const loadScreenData = async () => {
      const loadedData = await loadData();
      setData(loadedData);
      
      // Load goal data
      try {
        const savedGoal = await AsyncStorage.getItem('selectedGoal');
        const savedGoalStartDate = await AsyncStorage.getItem('goalStartDate');
        const savedGoalCompletionDate = await AsyncStorage.getItem('goalCompletionDate');
        
        if (savedGoal) {
          setSelectedGoal(JSON.parse(savedGoal));
        }
        if (savedGoalStartDate) {
          setGoalStartDate(new Date(savedGoalStartDate));
        }
        if (savedGoalCompletionDate) {
          setGoalCompletionDate(new Date(savedGoalCompletionDate));
        }
      } catch (error) {
        logger.error('HomeScreen', 'Error loading goal data', error);
      }
    };

  useEffect(() => {
    loadScreenData();

    // Track app usage
    telemetryService.trackAppUsage('screen_view', { screen: 'Home' });

    // Check for broken streak when app loads
    checkForBrokenStreak();

    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadScreenData();
      setMemorizeButtonHeld(false); // Reset button state when returning to home
      
      // Reset all modal states when returning to home screen
      setProgressModalVisible(false);
      setHasanatModalVisible(false);
      setStreakModalVisible(false);
      setRecordingsModalVisible(false);
      setShowStreakAnimation(false);
      
      // Check for broken streak when returning to home
      checkForBrokenStreak();
      
      telemetryService.trackAppUsage('screen_focus', { screen: 'Home' });
    });
    return unsubscribe;
  }, [navigation]);

  const checkForBrokenStreak = async () => {
    try {
      const brokenStreakInfo = await checkStreakBroken();
      if (brokenStreakInfo) {
        setBrokenStreakData({
          previousStreak: brokenStreakInfo.previousStreak,
          missedDays: brokenStreakInfo.missedDays || []
        });
        setShowStreakBrokenAnimation(true);
      }
    } catch (error) {
      logger.error('HomeScreen', 'Error checking broken streak', error);
    }
  };

  // Handle refresh parameter from navigation
  useEffect(() => {
    if (route.params?.refresh) {
      loadScreenData();
    }
  }, [route.params?.refresh]);

  // Auto-sync when user logs in/out
  useEffect(() => {
    if (isAuthenticated) {
      logger.log('HomeScreen', 'User logged in, syncing progress');
      syncProgressData().then(result => {
        if (result.success) {
          logger.log('HomeScreen', 'Auto-sync successful');
          loadScreenData(); // Reload data after sync
        }
      }).catch(error => {
        logger.error('HomeScreen', 'Auto-sync failed', error);
      });
    }
  }, [isAuthenticated]);

  // Update goal progress when data changes
  useEffect(() => {
    if (selectedGoal && goalStartDate) {
      const missedDays = Math.max(0, Math.floor((new Date() - goalStartDate) / (1000 * 60 * 60 * 24)) - data.streak);
      const progress = calculateGoalProgress(selectedGoal.ayaat, missedDays);
      setGoalProgress(progress);
      
      // Recalculate completion date based on missed days
      if (missedDays > 0) {
        const totalAyaat = 6236;
        const daysNeeded = Math.ceil(totalAyaat / selectedGoal.ayaat);
        const adjustedCompletionDate = new Date(goalStartDate);
        adjustedCompletionDate.setDate(goalStartDate.getDate() + daysNeeded + missedDays);
        setGoalCompletionDate(adjustedCompletionDate);
      }
    }
  }, [selectedGoal, goalStartDate, data.streak]);

  // Monitor streak changes and trigger animation
  useEffect(() => {
    // Only trigger animation if we have a previous streak value and the new streak is higher
    if (data.streak > 0 && newStreak > 0 && data.streak > newStreak && !showStreakAnimation) {
      setNewStreak(data.streak);
      setShowStreakAnimation(true);
    } else if (data.streak > 0 && newStreak === 0) {
      // Initial load - just set the streak without animation
      setNewStreak(data.streak);
    }
  }, [data.streak, newStreak, showStreakAnimation]);

  // Check for streak animation trigger from navigation params
  useEffect(() => {
    if (route.params?.showStreakAnimation && data.streak > 0) {
      setNewStreak(data.streak);
      setShowStreakAnimation(true);
      // Clear the parameter so it doesn't trigger again
      navigation.setParams({ showStreakAnimation: undefined });
    }
  }, [route.params?.showStreakAnimation, data.streak]);

  // Calculate percentage
  const progressPercentage = data.totalAyaat > 0 ? Math.round((data.memorizedAyaat / data.totalAyaat) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
    <ImageBackground
        source={require('../assets/IQRA2background.png')}
      style={styles.background}
        imageStyle={{ opacity: 0.2 }}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <TouchableOpacity style={styles.introButton} onPress={() => setInfoVisible(true)} onPressIn={() => hapticSelection()}>
              <View style={{
                borderWidth: 2,
                borderColor: '#5b7f67',
                borderRadius: 12,
                padding: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Image 
                  source={require('../assets/app_icons/information.png')} 
                  style={{ width: 28, height: 28, tintColor: '#F5E6C8' }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            {(() => {
              const [logoPressed, setLogoPressed] = useState(false);
              
              return (
                <Animated.View style={[styles.logoTextContainer, {
              shadowColor: '#fae29f',
              shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: logoPressed ? 0.6 : 0.3,
                  shadowRadius: logoPressed ? 16 : 8,
                  elevation: logoPressed ? 12 : 6,
                }]}>
                  <TouchableOpacity
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 10,
                    }}
                    onPress={() => {
                      telemetryService.trackUserInteraction('button_click', { 
                        button: 'Logo - Intro Modal',
                        screen: 'Home'
                      });
                      hapticSelection();
                      // Toggle the modal - if it's open, close it; if it's closed, open it
                      setIntroVisible(!introVisible);
                    }}
                    onPressIn={() => setLogoPressed(true)}
                    onPressOut={() => setLogoPressed(false)}
                    activeOpacity={0.8}
                  >
              <Image 
                source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')} 
                style={[styles.logo]} 
              />
                  </TouchableOpacity>
                </Animated.View>
              );
            })()}
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => {
                setSettingsVisible(true);
              }} 
              onPressIn={() => hapticSelection()}
            >
              <View style={{
                borderWidth: 2,
                borderColor: 'rgba(165,115,36,0.8)',
                borderRadius: 12,
                padding: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Image 
                  source={require('../assets/app_icons/settings.png')} 
                  style={{ width: 28, height: 28, tintColor: '#F5E6C8' }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.customDivider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerGap}>
              {(() => {
                const [duaTextPressed, setDuaTextPressed] = useState(false);
                
                return (
                  <Animated.View style={{
                    shadowColor: '#fae29f',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: duaTextPressed ? 0.6 : 0.3,
                    shadowRadius: duaTextPressed ? 16 : 8,
                    elevation: duaTextPressed ? 12 : 6,
                  }}>
                    <TouchableOpacity
                      style={{
                        padding: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => {
                        telemetryService.trackUserInteraction('button_click', { 
                          button: 'Dua Text - Duas Modal',
                          screen: 'Home'
                        });
                        hapticSelection();
                        setDuaVisible(true);
                      }}
                      onPressIn={() => setDuaTextPressed(true)}
                      onPressOut={() => setDuaTextPressed(false)}
                      activeOpacity={0.8}
                    >
              <Text style={[styles.arabicText, {
                color: '#F0D8A0',
                textShadowColor: '#fae29f',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 3,
                        width: 240,
              }]} allowFontScaling={false} lang="ar">اللَّهُمَّ اجْعَلْنَا مِنْ أَهْلِ الْقُرْآن</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })()}
            </View>
            <View style={styles.dividerLine} />
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            marginTop: Platform.OS === 'android' ? -40 : -20, // Moved up more for Android
            marginBottom: 20,
            position: 'relative',
            zIndex: 1,
            height: Platform.OS === 'android' ? 180 : 120 // Fixed height
          }}>
            {(() => {
              const [pressed, setPressed] = useState(false);
              const glowAnimation = useRef(new Animated.Value(0)).current;
              
              // Glow animation for iOS only
              useEffect(() => {
                if (Platform.OS === 'ios') {
                  const animateGlow = () => {
                    const duration = 2000;
                    const fadeDuration = 1500;
                    
                    Animated.sequence([
                      Animated.timing(glowAnimation, {
                        toValue: 1,
                        duration: duration,
                        useNativeDriver: false,
                      }),
                      Animated.timing(glowAnimation, {
                        toValue: 0.2,
                        duration: fadeDuration,
                        useNativeDriver: false,
                      })
                    ]).start(() => animateGlow());
                  };
                  
                  animateGlow();
                  
                  return () => {
                    glowAnimation.stopAnimation();
                  };
                }
              }, []);

              // Initialize dots swipe responder
              useEffect(() => {
                dotsSwipeResponder.current = PanResponder.create({
                  onStartShouldSetPanResponder: () => true,
                  onMoveShouldSetPanResponder: (evt, gestureState) => {
                    // Only respond to horizontal swipes
                    return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
                  },
                  onPanResponderGrant: (evt) => {
                    // Don't change page on initial touch
                  },
                  onPanResponderMove: (evt, gestureState) => {
                    // Calculate which page the finger is currently over
                    const touchX = evt.nativeEvent.pageX;
                    const dotsWidth = dotsLayout.current.width;
                    const dotsX = dotsLayout.current.x;
                    
                    if (dotsWidth > 0) {
                      // Calculate relative position within the dots container
                      const relativeX = touchX - dotsX;
                      const dotWidth = dotsWidth / 3; // 3 pages
                      
                      // Calculate which page the touch is over
                      const pageIndex = Math.floor(relativeX / dotWidth);
                      const clampedPageIndex = Math.max(0, Math.min(2, pageIndex));
                      
                      // Switch to the page under the finger
                      if (clampedPageIndex !== currentPage) {
                        setCurrentPage(clampedPageIndex);
                        // Scroll FlatList to the corresponding page
                        if (flatListRef.current) {
                          flatListRef.current.scrollToIndex({
                            index: clampedPageIndex,
                            animated: true
                          });
                        }
                      }
                    }
                  },
                  onPanResponderRelease: (evt, gestureState) => {
                    // No need to do anything on release since we're switching during move
                  },
                });
              }, [currentPage]);
              
              return (
                <Animated.View
                  style={{
                    flex: 1,
                    marginHorizontal: SIZES.small,
                    padding: Platform.OS === 'android' ? SIZES.extraLarge : SIZES.medium,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    borderRadius: SIZES.base,
                    shadowColor: '#fae29f',
                    shadowOffset: { width: 0, height: 0 },
                    ...(Platform.OS === 'ios' && {
                      shadowOpacity: glowAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 0.9],
                      }),
                      shadowRadius: glowAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 24],
                      }),
                      elevation: glowAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [6, 18],
                      }),
                    }),
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 2,
                    height: Platform.OS === 'android' ? 180 : 120
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent',
                      borderRadius: SIZES.base,
                      flexDirection: 'column',
                      width: '100%',
                      height: '100%',
                      marginTop: 20 // Added margin to bring button down
                    }}
                  onPress={() => {
                    telemetryService.trackUserInteraction('button_click', { 
                      button: 'Start Memorization',
                      screen: 'Home'
                    });
                    navigation.navigate('SurahList');
                  }}
                  onPressIn={() => { 
                    setPressed(true); 
                    setMemorizeButtonHeld(true);
                    hapticSelection(); 
                  }}
                  onPressOut={() => { 
                    setPressed(false); 
                    // Reset the text change if the press wasn't completed
                    // We'll use a small delay to check if navigation happened
                    setTimeout(() => {
                      // If we're still on the home screen, the press wasn't completed
                      if (navigation.isFocused()) {
                        setMemorizeButtonHeld(false);
                      }
                    }, 50);
                  }}
                  activeOpacity={1}
                >
                  <View style={[styles.buttonIconContainer, {
                    shadowRadius: memorizeButtonHeld ? GLOW_CONFIG.iconContainer.shadowRadius[Platform.OS].pressed : GLOW_CONFIG.iconContainer.shadowRadius[Platform.OS].normal,
                    shadowOpacity: memorizeButtonHeld ? GLOW_CONFIG.iconContainer.shadowOpacity[Platform.OS].pressed : GLOW_CONFIG.iconContainer.shadowOpacity[Platform.OS].normal,
                    elevation: memorizeButtonHeld ? GLOW_CONFIG.iconContainer.elevation[Platform.OS].pressed : GLOW_CONFIG.iconContainer.elevation[Platform.OS].normal,
                  }]}>
                    <Image source={require('../assets/openQuran.png')} style={[styles.buttonIcon, { width: RESPONSIVE_ICON_SIZES.button, height: RESPONSIVE_ICON_SIZES.button }]} resizeMode="contain" />
                  </View>
                  <View style={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    borderRadius: 8, 
                    paddingHorizontal: 20, 
                    paddingTop: language === 'ar' ? 12 : 16,
                    paddingBottom: language === 'ar' ? 16 : 12,
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    shadowColor: '#fae29f', 
                    shadowOffset: { width: 0, height: 0 }, 
                    shadowOpacity: pressed ? GLOW_CONFIG.textButton.shadowOpacity[Platform.OS].pressed : GLOW_CONFIG.textButton.shadowOpacity[Platform.OS].normal, 
                    shadowRadius: pressed ? GLOW_CONFIG.textButton.shadowRadius[Platform.OS].pressed : GLOW_CONFIG.textButton.shadowRadius[Platform.OS].normal, 
                    elevation: pressed ? GLOW_CONFIG.textButton.elevation[Platform.OS].pressed : GLOW_CONFIG.textButton.elevation[Platform.OS].normal,
                    minHeight: language === 'ar' ? 100 : 80
                  }}>
                    <Text style={[{
                      marginTop: language === 'ar' ? 4 : 0,
                      textAlign: 'center',
                      color: '#fae29f', 
                      width: '100%', 
                      fontWeight: 'bold', 
                      fontSize: memorizeButtonHeld ? getResponsiveFontSize(26) : getResponsiveFontSize(22), 
                      textShadowColor: '#fae29f', 
                      textShadowOffset: { width: 0, height: 0 }, 
                      textShadowRadius: GLOW_CONFIG.text.shadowRadius,
                      lineHeight: memorizeButtonHeld ? (language === 'ar' ? 40 : 30) : (language === 'ar' ? 36 : 26),
                      fontFamily: 'Montserrat-Bold'
                    }]}>{memorizeButtonHeld ? t('b2ithnAllah') : t('quran_memorize')}</Text>
                  </View>
                </TouchableOpacity>
                </Animated.View>
              );
            })()}
          </View>



          <FlatList
            ref={flatListRef}
            data={[
              {
                id: 'saved_content',
                content: (
                  <View style={{
                    marginTop: getResponsiveSpacing(isSmallScreen ? 40 : (isMediumScreen ? 45 : 50)),
                    marginBottom: RESPONSIVE_SPACING.md,
                    flex: 1,
                    alignItems: 'center',
                    width: '100%',
                  }}>
                    {/* Saved Content Header */}
                    <View style={{
                      alignItems: 'center',
                      marginBottom: RESPONSIVE_SPACING.sm,
                    }}>
                      <Text variant="h2" style={{
                        textAlign: 'center',
                        color: '#5b7f67',
                        fontWeight: 'bold',
                        fontSize: getResponsiveFontSize(20),
                        marginBottom: getResponsiveSpacing(6),
                        textShadowColor: '#000000',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}>
                        Saved Content
                      </Text>

                    </View>

                    {/* Two Column Layout */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      gap: 8,
                      width: '90%',
                      alignSelf: 'center',
                    }}>
                      {/* Saved Ayaat */}
                      <TouchableOpacity
                        style={{
                          flex: 0.48,
                          backgroundColor: pressedSavedAyaat ? 'rgba(91,127,103,0.4)' : 'rgba(91,127,103,0.2)',
                          borderColor: pressedSavedAyaat ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                          borderWidth: 2,
                          borderRadius: SIZES.base,
                          padding: SIZES.small,
                          shadowColor: '#000000',
                          shadowOffset: { width: 4, height: 4 },
                          shadowOpacity: 0.6,
                          shadowRadius: 6,
                          elevation: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 120,
                        }}
                        onPress={() => {
                          hapticSelection();
                          setShowSavedAyaatModal(true);
                        }}
                        onPressIn={() => setPressedSavedAyaat(true)}
                        onPressOut={() => setPressedSavedAyaat(false)}
                        activeOpacity={0.9}
                      >
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 8 }}>
                            <Text style={{
                              textAlign: 'center',
                              color: pressedSavedAyaat ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                              fontWeight: 'bold',
                              fontSize: getResponsiveFontSize(16),
                              textShadowColor: '#000000',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 3,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.3,
                              shadowRadius: 3,
                              transform: [{ translateY: pressedSavedAyaat ? 3 : 0 }],
                            }}>
                              Saved Ayaat
                            </Text>
                          </View>
                          <Text style={{
                            textAlign: 'center',
                            color: '#F5E6C8',
                            fontSize: getResponsiveFontSize(14),
                            marginBottom: getResponsiveSpacing(4),
                          }}>
                            12 saved
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Saved Notes */}
                      <TouchableOpacity
                        style={{
                          flex: 0.48,
                          backgroundColor: pressedSavedNotes ? 'rgba(91,127,103,0.4)' : 'rgba(91,127,103,0.2)',
                          borderColor: pressedSavedNotes ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                          borderWidth: 2,
                          borderRadius: SIZES.base,
                          padding: SIZES.small,
                          shadowColor: '#000000',
                          shadowOffset: { width: 4, height: 4 },
                          shadowOpacity: 0.6,
                          shadowRadius: 6,
                          elevation: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 120,
                        }}
                        onPress={() => {
                          hapticSelection();
                          setShowSavedNotesModal(true);
                        }}
                        onPressIn={() => setPressedSavedNotes(true)}
                        onPressOut={() => setPressedSavedNotes(false)}
                        activeOpacity={0.9}
                      >
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 8 }}>
                            <Text style={{
                              textAlign: 'center',
                              color: pressedSavedNotes ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                              fontWeight: 'bold',
                              fontSize: getResponsiveFontSize(16),
                              textShadowColor: '#000000',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 3,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.3,
                              shadowRadius: 3,
                              transform: [{ translateY: pressedSavedNotes ? 3 : 0 }],
                            }}>
                              Saved Notes
                            </Text>
                          </View>
                          <Text style={{
                            textAlign: 'center',
                            color: '#F5E6C8',
                            fontSize: getResponsiveFontSize(14),
                            marginBottom: getResponsiveSpacing(4),
                          }}>
                            {savedNotes.length} notes
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Recitation Recordings Section */}
                    <View style={{
                      marginTop: 16,
                      width: '90%',
                      alignSelf: 'center',
                    }}>
                      <TouchableOpacity
                        style={{
                          flex: 0.48,
                          backgroundColor: pressedRecordings ? 'rgba(91,127,103,0.4)' : 'rgba(91,127,103,0.2)',
                          borderColor: pressedRecordings ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                          borderWidth: 2,
                          borderRadius: SIZES.base,
                          padding: SIZES.small,
                          shadowColor: '#000000',
                          shadowOffset: { width: 4, height: 4 },
                          shadowOpacity: 0.6,
                          shadowRadius: 6,
                          elevation: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 120,
                        }}
                        onPress={() => {
                          hapticSelection();
                          setRecordingsModalVisible(true);
                        }}
                        onPressIn={() => setPressedRecordings(true)}
                        onPressOut={() => setPressedRecordings(false)}
                        activeOpacity={0.9}
                      >
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 8 }}>
                            <Text style={{
                              textAlign: 'center',
                              color: pressedRecordings ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                              fontWeight: 'bold',
                              fontSize: getResponsiveFontSize(16),
                              textShadowColor: '#000000',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 3,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.3,
                              shadowRadius: 3,
                              transform: [{ translateY: pressedRecordings ? 3 : 0 }],
                            }}>
                              Recitation Recordings
                            </Text>
                          </View>
                          <Text style={{
                            textAlign: 'center',
                            color: '#F5E6C8',
                            fontSize: getResponsiveFontSize(14),
                            marginBottom: getResponsiveSpacing(4),
                          }}>
                            8 recordings
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              },
              {
                id: 'stats',
                content: (
                  <View style={{
                    marginTop: isSmallScreen ? 85 : (isMediumScreen ? 90 : 95),
                    marginBottom: 40,
                    alignItems: 'center',
                    width: '100%',
                  }}>
                    {/* Progress Card */}
                    <TouchableOpacity
                      style={{ width: '100%', alignItems: 'center' }}
                      onPress={() => {
                        hapticSelection();
                        setProgressModalVisible(true);
                      }}
                      onPressIn={() => setPressedStatBox('progress')}
                      onPressOut={() => setPressedStatBox(null)}
                      activeOpacity={0.9}
                    >
                      <Card variant="elevated" style={{
                        marginBottom: 0,
                        backgroundColor: pressedStatBox === 'progress' ? 'rgba(91,127,103,0.4)' : 'rgba(91,127,103,0.2)',
                        borderColor: pressedStatBox === 'progress' ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                        borderWidth: 2,
                        padding: SIZES.small,
                        shadowColor: '#000000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 0.6,
                        shadowRadius: 6,
                        elevation: 8,
                        height: isSmallScreen ? 145 : 165,
                        alignSelf: 'center',
                        width: '80%'
                      }}>
                        <View style={{ alignItems: 'center' }}>
                          <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 12 }}>
                                                                                      <Text variant="h2" style={[FONTS.h2.getFont(language), {
                                textAlign: 'center',
                                color: pressedStatBox === 'progress' ? 'rgba(165,115,36,0.8)' : '#5b7f67',
                                fontWeight: 'bold',
                                fontSize: 22,
                                textShadowColor: '#000000',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 3,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.3,
                                shadowRadius: 3,
                                transform: [{ translateY: pressedStatBox === 'progress' ? 3 : 0 }],
                              }]}>{t('memorization_progress')}</Text>
                          </View>
                        </View>
                        <Text variant="body1" style={{ marginBottom: SIZES.small, textAlign: 'center' }}>
                          <Text style={{ 
                            color: '#f5c860', 
                            fontWeight: 'bold',
                            textShadowColor: '#fae29f',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 2,
                          }}>{toArabicNumber(data.memorizedAyaat)}</Text> <Text style={{ color: '#CCCCCC' }}>{t('out_of_ayaat')}</Text> <Text style={{ color: '#F5E6C8', fontWeight: 'bold' }}>{toArabicNumber(data.totalAyaat)}</Text> <Text style={{ color: '#CCCCCC' }}>{t('ayaat_memorized')}</Text>
                        </Text>
                        <View style={styles.progressBar}>
                          {/* Shadow layer underneath */}
                          <View style={[
                            styles.progressShadow, 
                            { 
                              width: `${progressPercentage}%`,
                              backgroundColor: 'transparent',
                              // Enhanced inner shadow effect for better visibility
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 3 },
                              shadowOpacity: 0.8,
                              shadowRadius: 6,
                              elevation: 6,
                            }
                          ]} />
                          {/* Progress fill layer on top */}
                          <View style={[
                            styles.progressFill, 
                            { 
                              width: `${progressPercentage}%`,
                              backgroundColor: progressPercentage === 100 ? '#fae29f' : '#33694e',
                              ...(progressPercentage === 100 && {
                                // Special styling for completed progress (gold)
                                shadowColor: '#fae29f',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 1.0,
                                shadowRadius: 15,
                                elevation: 12,
                              })
                            }
                          ]} />
                        </View>
                                                  <Text variant="body2" color="textSecondary" style={{
                            marginTop: 4,
                            textAlign: 'center',
                            color: '#F5E6C8',
                            fontSize: progressPercentage === 100 ? 18 : 16,
                            ...(progressPercentage === 100 && {
                              textShadowColor: '#fae29f',
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 8,
                              fontWeight: 'bold',
                            })
                          }}>
                          {progressPercentage === 100 ? (
                            <>
                              <Text style={{ 
                                fontWeight: 'bold',
                                color: '#fae29f',
                                textShadowColor: '#fae29f',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 8,
                              }}>100%</Text> {t('completed')}
                            </>
                          ) : (
                            <>
                              <Text style={{ 
                                fontWeight: 'bold',
                                color: '#fae29f',
                                textShadowColor: '#fae29f',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 2,
                              }}>{toArabicNumber(progressPercentage)}%</Text> {t('complete')}
                            </>
                          )}
                        </Text>
                      </Card>
                    </TouchableOpacity>

                    {/* Stats Grid */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 1,
                      width: '80%',
                      marginTop: Platform.OS === 'android' ? SIZES.extraSmall : 0
                    }}>
                      <Card style={{
                        flex: 0.50,
                        padding: SIZES.small,
                        backgroundColor: pressedStatBox === 'hasanat' ? 'rgba(91,127,103,0.4)' : 'rgba(91,127,103,0.2)',
                        borderColor: pressedStatBox === 'hasanat' ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                        borderWidth: 2,
                        borderRadius: SIZES.base,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 0.6,
                        shadowRadius: 6,
                        elevation: 8,
                        height: isSmallScreen ? 160 : 180,
                        marginHorizontal: 0
                      }}>
                        <TouchableOpacity
                          onPress={() => {
                            hapticSelection();
                            setHasanatModalVisible(true);
                          }}
                          onPressIn={() => setPressedStatBox('hasanat')}
                          onPressOut={() => setPressedStatBox(null)}
                          activeOpacity={0.9}
                          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <View style={{ alignItems: 'center' }}>
                            <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 8 }}>
                              <Text variant="h2" style={[FONTS.h2.getFont(language), {
                                textAlign: 'center',
                                color: pressedStatBox === 'hasanat' ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                                fontWeight: 'bold',
                                fontSize: 18,
                                textShadowColor: '#000000',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 3,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.3,
                                shadowRadius: 3,
                                transform: [{ translateY: pressedStatBox === 'hasanat' ? 3 : 0 }],
                              }]}>{t('hasanat_gains')}</Text>
                            </View>
                          <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', marginVertical: 8 }}>
                            <Text variant="h1" style={{ 
                              color: 'rgba(245,200,96,0.8)', 
                              fontWeight: 'bold', 
                              textAlign: 'center', 
                              fontSize: formatLargeNumber(data.totalHasanat).fontSize,
                              textShadowColor: '#fae29f',
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 2,
                            }} numberOfLines={1} ellipsizeMode="tail">{toArabicNumber(formatLargeNumber(data.totalHasanat).text)}</Text>
                          </View>
                          <Text variant="body2" color="textSecondary" style={{ textAlign: 'center' }}>+{toArabicNumber(formatLargeNumber(data.todayHasanat).text)} {t('today_hasanat')}</Text>
                          <Text variant="body2" style={{ textAlign: 'center', color: '#F5E6C8', marginTop: 4, marginBottom: 2 }}>{t('insha2allah')}</Text>
                          </View>
                        </TouchableOpacity>
                      </Card>
                      <Card style={{
                        flex: 0.50,
                        padding: SIZES.small,
                        backgroundColor: pressedStatBox === 'streak' ? 'rgba(91,127,103,0.4)' : 'rgba(91,127,103,0.2)',
                        borderColor: pressedStatBox === 'streak' ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                        borderWidth: 2,
                        borderRadius: SIZES.base,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 0.6,
                        shadowRadius: 6,
                        elevation: 8,
                        height: isSmallScreen ? 160 : 180,
                        marginHorizontal: 0
                      }}>
                        <TouchableOpacity
                          onPress={() => {
                            hapticSelection();
                            setStreakModalVisible(true);
                          }}
                          onPressIn={() => setPressedStatBox('streak')}
                          onPressOut={() => setPressedStatBox(null)}
                          activeOpacity={0.9}
                          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <View style={{ alignItems: 'center' }}>
                            <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 8 }}>
                              <Text variant="h2" style={[FONTS.h2.getFont(language), {
                                textAlign: 'center',
                                color: pressedStatBox === 'streak' ? '#5b7f67' : 'rgba(165,115,36,0.8)',
                                fontWeight: 'bold',
                                fontSize: 18,
                                textShadowColor: '#000000',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 3,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.3,
                                shadowRadius: 3,
                                marginTop: pressedStatBox === 'streak' ? 8 : 4,
                              }]}>{t('streak')}</Text>
                            </View>
                              <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', marginVertical: 8, alignItems: 'center', justifyContent: 'center' }}>
                                <Text variant="h1" style={{ color: '#5b7f67', textAlign: 'center', fontWeight: 'bold', fontSize: formatStreakNumber(data.streak).fontSize, lineHeight: formatStreakNumber(data.streak).fontSize * 1.2 }} numberOfLines={1} ellipsizeMode="tail">{toArabicNumber(formatStreakNumber(data.streak).text)}</Text>
                              </View>
                                                              <Text variant="body2" color="textSecondary" style={{ textAlign: 'center', marginTop: -4 }}>{t('days')}</Text>
                                                             <Text variant="body2" style={{ textAlign: 'center', color: '#F5E6C8', marginTop: 1, marginBottom: 10 }}>{t('masha2allah')}</Text>
                          </View>
                        </TouchableOpacity>
                      </Card>
                    </View>
                  </View>
                )
              },
              {
                id: 'leaderboard',
                content: (
                  <View style={{
                    marginTop: getResponsiveSpacing(isSmallScreen ? 40 : (isMediumScreen ? 45 : 50)),
                    marginBottom: RESPONSIVE_SPACING.md,
                    flex: 1,
                    alignItems: 'center',
                    width: '100%',
                  }}>
                                                             {/* Leaderboards Header */}
                     <View style={{
                       alignItems: 'center',
                       marginBottom: RESPONSIVE_SPACING.sm,
                     }}>
                       <Text variant="h2" style={{
                         textAlign: 'center',
                         color: '#5b7f67',
                         fontWeight: 'bold',
                         fontSize: getResponsiveFontSize(20),
                         marginBottom: getResponsiveSpacing(6),
                         textShadowColor: '#000000',
                         textShadowOffset: { width: 0, height: 1 },
                         textShadowRadius: 2,
                       }}>
                         Leaderboards
                       </Text>

                     </View>

                     {/* Two Column Leaderboards */}
                     <View style={{
                       flexDirection: 'row',
                       justifyContent: 'space-between',
                       gap: 8,
                       width: '90%',
                       alignSelf: 'center',
                     }}>
                       {/* Memorization Leaderboard */}
                       <LeaderboardCard
                         type={LEADERBOARD_TYPES.MEMORIZATION}
                         title="Top Memorizers"
                         onPress={() => {
                           hapticSelection();
                           navigation.navigate('Leaderboard');
                         }}
                         onPressIn={() => setPressedMemorizationLeaderboard(true)}
                         onPressOut={() => setPressedMemorizationLeaderboard(false)}
                         isPressed={pressedMemorizationLeaderboard}
                         limit={3}
                       />

                       {/* Streak Leaderboard */}
                       <LeaderboardCard
                         type={LEADERBOARD_TYPES.STREAK}
                         title="Daily Streaks"
                         onPress={() => {
                           hapticSelection();
                           navigation.navigate('Leaderboard');
                         }}
                         onPressIn={() => setPressedStreakLeaderboard(true)}
                         onPressOut={() => setPressedStreakLeaderboard(false)}
                         isPressed={pressedStreakLeaderboard}
                         limit={3}
                       />
                     </View>
                  </View>
                )
              }
            ]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            snapToInterval={Dimensions.get('window').width}
            snapToAlignment="center"
            onMomentumScrollEnd={(event) => {
              const pageIndex = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setCurrentPage(pageIndex);
            }}
            renderItem={({ item }) => (
              <View style={{ 
                width: Dimensions.get('window').width,
                overflow: 'hidden',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.content}
              </View>
            )}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
            getItemLayout={(data, index) => ({
              length: Dimensions.get('window').width,
              offset: Dimensions.get('window').width * index,
              index,
            })}
           />
           
           {/* Page Indicators */}
           <View 
             style={{
             flexDirection: 'row',
             justifyContent: 'center',
             alignItems: 'center',
             marginTop: -8,
             marginBottom: 10
             }}
             {...(dotsSwipeResponder.current?.panHandlers || {})}
             onLayout={(e) => {
               const { width, x } = e.nativeEvent.layout;
               dotsLayout.current = { width, x };
             }}
           >
             <TouchableOpacity
               style={{
               width: 8,
               height: 8,
               borderRadius: 4,
               backgroundColor: currentPage === 0 ? '#5b7f67' : 'rgba(165,115,36,0.8)',
               marginHorizontal: 4
               }}
               onPress={() => {
                 setCurrentPage(0);
                 if (flatListRef.current) {
                   flatListRef.current.scrollToIndex({
                     index: 0,
                     animated: true
                   });
                 }
               }}
             />
             <TouchableOpacity
               style={{
               width: 8,
               height: 8,
               borderRadius: 4,
               backgroundColor: currentPage === 1 ? '#5b7f67' : 'rgba(165,115,36,0.8)',
               marginHorizontal: 4
               }}
               onPress={() => {
                 setCurrentPage(1);
                 if (flatListRef.current) {
                   flatListRef.current.scrollToIndex({
                     index: 1,
                     animated: true
                   });
                 }
               }}
             />
             <TouchableOpacity
               style={{
               width: 8,
               height: 8,
               borderRadius: 4,
               backgroundColor: currentPage === 2 ? '#5b7f67' : 'rgba(165,115,36,0.8)',
               marginHorizontal: 4
               }}
               onPress={() => {
                 setCurrentPage(2);
                 if (flatListRef.current) {
                   flatListRef.current.scrollToIndex({
                     index: 2,
                     animated: true
                   });
                 }
               }}
             />
           </View>
        </View>

          <Modal
            visible={introVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIntroVisible(false)}
          >
            <View style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: 50 }]}>
              <View style={[styles.modalContent, { 
                minHeight: 500,
                justifyContent: 'center',
                paddingVertical: 40,
                marginTop: 17,
                backgroundColor: 'rgba(192,192,192,0.95)',
              }]}>
                <View style={[styles.logoTextContainer, {
                  shadowColor: '#fae29f',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                  marginBottom: 20,
                  position: 'absolute',
                  top: 10,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                }]}>
                  <TouchableOpacity
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 140,
                      height: 140,
                    }}
                    onPress={() => setIntroVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')} 
                      style={styles.logo} 
                      resizeMode="contain" 
                    />
                  </TouchableOpacity>
                </View>
                {/* Spacer to push content down and align with main screen icon */}
                <View style={{ height: 120, width: '100%', zIndex: 1 }} />
                <Text style={{ 
                  fontSize: 28, 
                  fontWeight: 'bold', 
                  color: 'rgba(165,115,36,0.8)', 
                  marginBottom: 20, 
                  marginTop: 10,
                  textAlign: 'center',
                  lineHeight: 40,
                  textShadowColor: 'rgba(165,115,36,0.8)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 2,
                }}>
                  {t('intro_title')}
                </Text>
                {(() => {
                  const [bismillahPressed, setBismillahPressed] = useState(false);
                  
                  return (
                    <Animated.View style={{
                      shadowColor: '#fae29f',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: bismillahPressed ? 0.8 : 0.3,
                      shadowRadius: bismillahPressed ? 20 : 8,
                      elevation: bismillahPressed ? 15 : 6,
                      marginBottom: 30,
                    }}>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#33694e',
                          paddingVertical: 16,
                          paddingHorizontal: 32,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 2,
                          borderColor: bismillahPressed ? '#fae29f' : 'rgba(165,115,36,0.6)',
                        }}
                  onPress={() => setIntroVisible(false)}
                        onPressIn={() => { 
                          setBismillahPressed(true); 
                          hapticSelection(); 
                        }}
                        onPressOut={() => setBismillahPressed(false)}
                        activeOpacity={0.8}
                      >
                        <Text style={{
                          color: '#F5E6C8',
                          fontSize: 18,
                          fontWeight: 'bold',
                          textShadowColor: '#000',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}>
                          {t('bismillah')}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })()}
                <Text variant="h2" style={{ 
                  marginBottom: 30, 
                  fontSize: 24, 
                  color: '#33694e', 
                  fontWeight: 'bold',
                  textAlign: 'center',
                  lineHeight: 32
                }}>
                  {isAuthenticated ? `Welcome ${user?.email?.split('@')[0] || 'User'}!` : t('welcome_to_iqra2')}
                </Text>
                <Text variant="body1" style={{ 
                  marginBottom: 30, 
                  textAlign: 'center', 
                  fontSize: 18, 
                  color: '#555', 
                  fontWeight: '500',
                  lineHeight: 26,
                  paddingHorizontal: 10
                }}>
                  {t('intro_description')}
                </Text>
              </View>
            </View>
          </Modal>

        <Modal
          visible={infoVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'flex-end', paddingBottom: 20 }]}
            activeOpacity={1}
            onPress={() => setInfoVisible(false)}
          >
              <View style={[styles.modalContent, { 
                minHeight: 550,
                maxHeight: '75%',
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
              }]}>
              <Text variant="h2" style={{ 
                marginBottom: 24, 
                marginTop: -30, 
                color: '#F5E6C8',
                fontSize: 28,
                fontWeight: 'bold',
                textShadowColor: '#000',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>Info</Text>
              
              {/* Tab Buttons */}
              <View style={{ flexDirection: 'row', marginBottom: 24, gap: 8 }}>
                <Button
                  title="Translit"
                  onPress={() => { 
                    hapticSelection(); 
                    setInfoActiveTab('numerals'); 
                  }}
                  style={{ 
                    backgroundColor: infoActiveTab === 'numerals' ? '#33694e' : 'rgba(128,128,128,0.6)', 
                    flex: 1,
                    marginRight: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                />
                <Button
                  title="Tajweed"
                  onPress={() => { 
                    hapticSelection(); 
                    setInfoActiveTab('tajweed'); 
                  }}
                  style={{ 
                    backgroundColor: infoActiveTab === 'tajweed' ? '#33694e' : 'rgba(128,128,128,0.6)', 
                    flex: 1,
                    marginLeft: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                />
              </View>
              
              {/* Scrollable Tab Content */}
              <ScrollView 
                style={{ flex: 1 }} 
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {infoActiveTab === 'numerals' ? (
                  <View style={{ flex: 1 }}>
                    <Text variant="h3" style={{ 
                      marginBottom: 16, 
                      color: 'rgba(165,115,36,0.8)', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      textShadowColor: '#000',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    }}>Transliteration Guide</Text>
                    <View style={{ backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 16, lineHeight: 24, marginBottom: 12 }}>
                        Arabic letters are represented using English characters and numbers. Here's the complete guide:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
                        {[
                          { arabic: 'ع', english: '3', description: 'Ayn' },
                          { arabic: 'ح', english: '7', description: 'Haa' },
                          { arabic: 'خ', english: '5', description: 'Khaa' },
                          { arabic: 'غ', english: '8', description: 'Ghayn' },
                          { arabic: 'ط', english: '6', description: 'Taa' },
                          { arabic: 'ص', english: '9', description: 'Saad' },
                          { arabic: 'ض', english: '4', description: 'Daad' },
                          { arabic: 'ث', english: 'th', description: 'Thaa' },
                          { arabic: 'ذ', english: 'dh', description: 'Dhaal' },
                          { arabic: 'ظ', english: 'th', description: 'Thaa' },
                          { arabic: 'ش', english: 'sh', description: 'Sheen' },
                          { arabic: 'ج', english: 'j', description: 'Jeem' },
                          { arabic: 'ق', english: 'q', description: 'Qaaf' },
                          { arabic: 'ك', english: 'k', description: 'Kaaf' },
                          { arabic: 'ل', english: 'l', description: 'Laam' },
                          { arabic: 'م', english: 'm', description: 'Meem' },
                          { arabic: 'ن', english: 'n', description: 'Noon' },
                          { arabic: 'ه', english: 'h', description: 'Haa' },
                          { arabic: 'و', english: 'w', description: 'Waw' },
                          { arabic: 'ي', english: 'y', description: 'Yaa' },
                          { arabic: 'ب', english: 'b', description: 'Baa' },
                          { arabic: 'ت', english: 't', description: 'Taa' },
                          { arabic: 'د', english: 'd', description: 'Daal' },
                          { arabic: 'ر', english: 'r', description: 'Raa' },
                          { arabic: 'ز', english: 'z', description: 'Zay' },
                          { arabic: 'س', english: 's', description: 'Seen' },
                          { arabic: 'ف', english: 'f', description: 'Faa' },
                          { arabic: 'ق', english: 'q', description: 'Qaaf' },
                          { arabic: 'ك', english: 'k', description: 'Kaaf' },
                          { arabic: 'ل', english: 'l', description: 'Laam' },
                          { arabic: 'م', english: 'm', description: 'Meem' },
                          { arabic: 'ن', english: 'n', description: 'Noon' },
                          { arabic: 'ه', english: 'h', description: 'Haa' },
                          { arabic: 'و', english: 'w', description: 'Waw' },
                          { arabic: 'ي', english: 'y', description: 'Yaa' },
                          { arabic: 'أ', english: 'a', description: 'Alif' },
                          { arabic: 'إ', english: 'i', description: 'Alif' },
                          { arabic: 'آ', english: 'aa', description: 'Alif' },
                          { arabic: 'ا', english: 'a', description: 'Alif' },
                          { arabic: 'ة', english: 'ah', description: 'Taa Marbouta' },
                          { arabic: 'ى', english: 'a', description: 'Alif Maqsura' },
                        ].map((letter, index) => (
                          <View key={index} style={{ 
                            backgroundColor: 'rgba(51,105,78,0.2)', 
                            borderRadius: 8, 
                            padding: 12, 
                            alignItems: 'center',
                            minWidth: 80,
                            marginBottom: 8,
                            borderColor: 'rgba(165,115,36,0.3)',
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 4,
                          }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fae29f', marginBottom: 4, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }}>
                              {letter.arabic}
                            </Text>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#5b7f67', marginBottom: 2 }}>
                              {letter.english}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#CCCCCC', textAlign: 'center' }}>
                              {letter.description}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text variant="h3" style={{ 
                      marginBottom: 16, 
                      color: 'rgba(165,115,36,0.8)', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      textShadowColor: '#000',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    }}>Tajweed Guide</Text>
                    <View style={{ backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 12, padding: 16 }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 16, lineHeight: 24, marginBottom: 16 }}>
                        Tajweed rules help ensure proper pronunciation when reciting the Quran. Here are the key rules:
                      </Text>
                      <View style={{ gap: 12 }}>
                        {[
                          { term: 'Ghunnah', description: 'Nasalization - holding the sound in the nose for 2 counts when ن or م has sukoon', symbol: 'ن' },
                          { term: 'Idghaam', description: 'Merging - when ن has sukoon and is followed by ي ر م ل و ن, the ن is merged into the next letter', symbol: 'د' },
                          { term: 'Ikhfaa', description: 'Hiding - when ن has sukoon and is followed by ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك, the ن is hidden', symbol: 'خ' },
                          { term: 'Qalqalah', description: 'Bouncing - ق ط ب ج د letters are pronounced with a bouncing sound when they have sukoon', symbol: 'ق' },
                          { term: 'Madd', description: 'Elongation - vowels are held for their proper duration (2, 4, or 6 counts)', symbol: 'م' },
                        ].map((rule, index) => (
                          <View key={index} style={{ 
                            backgroundColor: 'rgba(51,105,78,0.2)', 
                            borderRadius: 8, 
                            padding: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderColor: 'rgba(165,115,36,0.3)',
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 4,
                          }}>
                            <View style={{ 
                              backgroundColor: '#33694e', 
                              borderRadius: 20, 
                              width: 40, 
                              height: 40, 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              marginRight: 12,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4,
                              elevation: 4,
                            }}>
                              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
                                {rule.symbol}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fae29f', marginBottom: 4, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }}>
                                {rule.term}
                              </Text>
                              <Text style={{ fontSize: 14, color: '#CCCCCC', lineHeight: 20 }}>
                                {rule.description}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
              
              <Button
                title={t('close')}
                onPress={() => setInfoVisible(false)}
                style={{ backgroundColor: '#33694e', marginTop: 15 }}
                />
              </View>
            </TouchableOpacity>
          </Modal>

        <Modal
          visible={duaVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDuaVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'flex-end', paddingBottom: 50 }]}
            activeOpacity={1}
            onPress={() => { 
              logger.debug('HomeScreen', 'Modal overlay pressed');
              setDuaVisible(false); 
              setDuaExpanded(false); 
              setDuaButtonPressed(false); 
              setCurrentDuaIndex(0); 
            }}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                minHeight: 700,
                maxHeight: '95%',
                justifyContent: 'flex-start',
                paddingVertical: 40,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
              }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Text variant="h2" style={{ 
                marginBottom: 24, 
                marginTop: -10, 
                color: '#F5E6C8',
                fontSize: 28,
                fontWeight: 'bold',
                textShadowColor: '#000',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>Da3awaat</Text>
              
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  {(() => {
                    const duas = [
                      { 
                        title: 'Before Reading Qur2an',
                        arabic: 'اللَّهُمَّ اجْعَلْنَا مِنْ أَهْلِ الْقُرْآن',
                        transliteration: 'Allahumma-j\'alna min ahlil-Quran',
                        translation: 'O Allah, make us among the people of the Quran',
                        category: 'Qur2an'
                      },
                      { 
                        title: 'Before Starting',
                        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                        transliteration: 'Bismillahir-Rahmanir-Raheem',
                        translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
                        category: 'Beginning'
                      },
                      { 
                        title: 'For Knowledge',
                        arabic: 'رَبِّ زِدْنِي عِلْمًا',
                        transliteration: 'Rabbi zidni ilma',
                        translation: 'My Lord, increase me in knowledge',
                        category: 'Knowledge'
                      },
                      { 
                        title: 'For Guidance',
                        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
                        transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhaban-nar',
                        translation: 'Our Lord, grant us good in this world and good in the Hereafter and protect us from the punishment of the Fire',
                        category: 'Guidance'
                      },
                      { 
                        title: 'For Forgiveness',
                        arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
                        transliteration: 'Rabbi-ghfir li wa tub \'alayya innaka antat-tawwabur-raheem',
                        translation: 'My Lord, forgive me and accept my repentance, for You are the Ever-Accepting of repentance, the Most Merciful',
                        category: 'Forgiveness'
                      },
                      { 
                        title: 'For Success',
                        arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
                        transliteration: 'Hasbiyallahu la ilaha illa huwa \'alayhi tawakkaltu wa huwa rabbul-\'arshil-\'adheem',
                        translation: 'Sufficient for me is Allah; there is no deity except Him. On Him I have relied, and He is the Lord of the Great Throne',
                        category: 'Trust'
                      }
                    ];
                    
                    const currentDua = duas[currentDuaIndex];
                    
                    return (
                      <View key={currentDuaIndex} style={{ 
                        backgroundColor: 'rgba(51,105,78,0.2)', 
                        borderRadius: 12, 
                        padding: 20,
                        marginBottom: 10,
                        borderColor: 'rgba(165,115,36,0.3)',
                        borderWidth: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 4,
                      }}>
                        <View style={{ 
                          backgroundColor: '#33694e', 
                          borderRadius: 8, 
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          alignSelf: 'center',
                          marginBottom: 12,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 4,
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>
                            {currentDua.category}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fae29f', marginBottom: 8, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1, textAlign: 'center' }}>
                          {currentDua.title}
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#7a9c82', marginBottom: 8, textAlign: 'center', lineHeight: 32, fontFamily: 'UthmanTN_v2-0' }}>
                          {currentDua.arabic}
                        </Text>
                                                  <Text style={{ fontSize: 14, color: '#999999', marginBottom: 6, fontStyle: 'italic' }}>
                            {currentDua.transliteration}
                          </Text>
                        <Text style={{ fontSize: 14, color: '#CCCCCC', lineHeight: 20, marginBottom: 10 }}>
                          {currentDua.translation}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
              </View>
              
              {/* Fixed Bottom Navigation */}
              <View style={{ 
                position: 'absolute', 
                bottom: 80, 
                left: 0, 
                right: 0, 
                paddingHorizontal: 40,
                zIndex: 1,
              }}>
                {/* Pagination Dots */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginBottom: 30,
                }}>
                  {Array.from({ length: 6 }, (_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        logger.debug('HomeScreen', 'Pagination dot pressed', { index });
                        setCurrentDuaIndex(index);
                      }}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: currentDuaIndex === index ? '#33694e' : 'rgba(165,115,36,0.3)',
                        marginHorizontal: 6,
                      }}
                    />
                  ))}
                </View>
              </View>
              
              
              
              <View style={{ 
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 20,
                paddingHorizontal: 0,
                height: 50,
              }}>
                {/* Left side - Back button or empty space */}
                <View style={{ width: 80, alignItems: 'flex-start' }}>
                  {currentDuaIndex > 0 && (
                    <TouchableOpacity
                      onPress={() => { 
                        hapticSelection();
                        setCurrentDuwhaIndex(currentDuaIndex - 1);
                      }}
                      onPressIn={() => hapticSelection()}
                      style={{
                        paddingHorizontal: 15,
                        paddingVertical: 9,
                        backgroundColor: 'rgba(165,115,36,0.3)',
                        borderRadius: 8,
                        minWidth: 76,
                        alignItems: 'center',
                        zIndex: 1000,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#fae29f', fontSize: 14, fontWeight: 'bold' }}>Back</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Center - Ameen button always here */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => { 
                      logger.debug('HomeScreen', 'Ameen button pressed');
                      hapticSelection();
                      setDuaVisible(false); 
                      setDuaExpanded(false); 
                      setDuaButtonPressed(false); 
                      setCurrentDuaIndex(0); 
                    }}
                    onPressIn={() => {
                      logger.debug('HomeScreen', 'Ameen button press in');
                      hapticSelection();
                    }}
                    style={{
                      paddingHorizontal: 19,
                      paddingVertical: 11,
                      backgroundColor: '#33694e',
                      borderRadius: 8,
                      width: 114,
                      height: 47,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#fae29f', fontSize: 16, fontWeight: 'bold' }}>
                      Ameen
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Right side - Next button or empty space */}
                <View style={{ width: 80, alignItems: 'flex-end' }}>
                  {currentDuaIndex < 5 && (
                    <TouchableOpacity
                      onPress={() => { 
                        hapticSelection();
                        setCurrentDuaIndex(currentDuaIndex + 1);
                      }}
                      onPressIn={() => hapticSelection()}
                      style={{
                        paddingHorizontal: 15,
                        paddingVertical: 9,
                        backgroundColor: 'rgba(165,115,36,0.3)',
                        borderRadius: 8,
                        minWidth: 76,
                        alignItems: 'center',
                        zIndex: 1000,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#fae29f', fontSize: 14, fontWeight: 'bold' }}>Next</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
          </Modal>

        <Modal
          visible={settingsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'flex-end', paddingBottom: 20 }]}
            activeOpacity={1}
            onPress={() => setSettingsVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                backgroundColor: 'rgba(64,64,64,0.95)',
                paddingTop: SIZES.large * 1.35, // Reduced by 7%
              }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Text variant="h2" style={{ 
                marginBottom: 24, 
                textDecorationLine: 'underline', 
                textDecorationColor: '#33694e', 
                marginTop: -20, 
                color: '#000000',
                fontSize: 28,
                fontWeight: 'bold'
              }}>{t('settings')}</Text>
              
              {/* Language Selection */}
              <Text variant="h3" style={{ 
                marginBottom: 8, 
                color: 'rgba(200,150,50,0.7)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 1,
                textShadowColor: '#000',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
              }}>{t('language')}</Text>
              <View style={{ flexDirection: 'row', marginBottom: 32, gap: 8 }}>
                <Button
                  title={t('english_button')}
                  onPress={() => { hapticSelection(); changeLanguage('en'); }}
                  style={{ 
                    backgroundColor: language === 'en' ? '#33694e' : 'rgba(128,128,128,0.6)', 
                    flex: 1,
                    marginRight: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                />
                <Button
                  title={t('arabic_button')}
                  onPress={() => { hapticSelection(); changeLanguage('ar'); }}
                  style={{ 
                    backgroundColor: language === 'ar' ? '#33694e' : 'rgba(128,128,128,0.6)', 
                    flex: 1,
                    marginLeft: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                />
              </View>
              
              {/* Account Section */}
              {isAuthenticated ? (
                <View style={{ marginBottom: 16 }}>
                  <Text variant="body2" style={{ 
                    color: '#CCCCCC', 
                    marginBottom: 12,
                    textAlign: 'center'
                  }}>
                    {t('logged_in_as')} {user?.email}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                    <Button
                      title={t('logout')}
                      onPress={async () => {
                        hapticSelection();
                        const result = await logout();
                          if (result.success) {
                          Alert.alert(t('success'), t('logout') + ' ' + t('success').toLowerCase());
                        }
                      }}
                      style={{ 
                        backgroundColor: 'rgba(220,20,60,0.7)', 
                        flex: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        elevation: 8,
                      }}
                    />
                    
                    <Button
                      title="Profile"
                      onPress={() => {
                        hapticSelection();
                        navigation.navigate('Profile');
                      }}
                      style={{ 
                        backgroundColor: '#33694e', 
                        flex: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        elevation: 8,
                      }}
                    />
                  </View>
                </View>
              ) : (
                <Button
                  title={t('account')}
                  onPress={() => {
                    hapticSelection();
                    setSettingsVisible(false);
                    navigation.navigate('Auth');
                  }}
                  style={{ 
                    backgroundColor: '#D3D3D3',
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                  textStyle={{
                    color: '#2F2F2F',
                    fontWeight: 'bold',
                  }}
                  onPressIn={() => hapticSelection()}
                />
              )}
              
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  setSettingsVisible(false);
                  setConfirmResetVisible(true);
                }}
                style={{ 
                  backgroundColor: 'rgba(165,115,36,0.8)', 
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={resetting}
                onPressIn={() => hapticSelection()}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                  {resetting ? t('resetting') : t('reset_today')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                    setResetType('all');
                  setSettingsVisible(false);
                  setConfirmResetVisible(true);
                }}
                style={{ 
                  backgroundColor: 'rgba(220,20,60,0.9)', 
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={resetting}
                onPressIn={() => hapticSelection()}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                  {resetting ? t('resetting') : (
                    language === 'en' ? (
                      <>
                        Reset <Text style={{ fontWeight: 'bold' }}>ALL</Text> Progress
                      </>
                    ) : t('reset_all')
                  )}
                </Text>
              </TouchableOpacity>
              {/* Temporary Test Button */}
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  setSettingsVisible(false);
                  // Test the missed daily streak animation
                  setBrokenStreakData({ previousStreak: 5, missedDays: ['2024-01-15', '2024-01-16'] });
                  setShowStreakBrokenAnimation(true);
                }}
                style={{ 
                  backgroundColor: '#FF6B35', // Orange color for test button
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPressIn={() => hapticSelection()}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                  🔥 Test Missed Streak
                </Text>
              </TouchableOpacity>
              
              {/* Test Regular Streak Animation */}
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  setSettingsVisible(false);
                  // Test the regular streak animation
                  setNewStreak(7);
                  setShowStreakAnimation(true);
                }}
                style={{ 
                  backgroundColor: '#5b7f67', // Green color for regular streak test
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPressIn={() => hapticSelection()}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                  ⭐ Test Regular Streak
                </Text>
              </TouchableOpacity>
              
              <View style={{ marginTop: 16 }}>
              <Button
                  title={t('close')}
                onPress={() => { hapticSelection(); setSettingsVisible(false); }}
                  style={{ 
                    backgroundColor: '#5b7f67',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
              />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Reset Confirmation Modal */}
        <Modal
          visible={confirmResetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmResetVisible(false)}
        >
          <TouchableOpacity 
            style={styles.confirmModalOverlay}
            activeOpacity={1}
            onPress={() => setConfirmResetVisible(false)}
          >
            <View style={styles.confirmModalBackdrop} />
            <TouchableOpacity 
              style={styles.confirmModalContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.confirmModalContent}>
                <View style={styles.confirmModalHeader}>
                  <Text style={styles.confirmModalTitle}>
                    {resetType === 'today' ? 'Reset Today\'s Progress' : t('confirm_reset_title')}
                  </Text>
                  <Text style={styles.confirmModalSubtitle}>
                    {resetType === 'today' 
                      ? 'This will reset only today\'s hasanat and progress. Your streak and total progress will remain intact.'
                      : t('confirm_reset_message')
                    }
                  </Text>
                </View>

                {/* Recordings Checkbox - only show for ALL reset */}
                {resetType === 'all' && (
                <View style={styles.confirmModalCheckbox}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => {
                      hapticSelection();
                      setIncludeRecordings(!includeRecordings);
                    }}
                  >
                    <View style={[
                      styles.checkbox,
                      includeRecordings && styles.checkboxChecked
                    ]}>
                      {includeRecordings && (
                        <Text style={styles.checkboxText}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      ALL recordings included
                    </Text>
                  </TouchableOpacity>
                </View>
                )}

                <View style={styles.confirmModalButtons}>
                  <TouchableOpacity
                    style={styles.confirmModalCancelButton}
                    onPress={() => {
                      hapticSelection();
                      setConfirmResetVisible(false);
                    }}
                  >
                    <Text style={styles.confirmModalCancelText}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmModalConfirmButton}
                    onPress={async () => {
                      hapticSelection();
                      setResetting(true);
                      setConfirmResetVisible(false);
                      
                      if (resetType === 'today') {
                        // Reset only today's hasanat
                        const today = new Date().toISOString().split('T')[0];
                        const currentTodayHasanat = await AsyncStorage.getItem('today_hasanat');
                        const currentTotalHasanat = await AsyncStorage.getItem('total_hasanat');
                        
                        // Subtract today's hasanat from total
                        const todayAmount = parseInt(currentTodayHasanat || '0');
                        const totalAmount = parseInt(currentTotalHasanat || '0');
                        const newTotal = Math.max(0, totalAmount - todayAmount);
                        
                        await AsyncStorage.setItem('today_hasanat', '0');
                        await AsyncStorage.setItem('total_hasanat', newTotal.toString());
                        // Don't reset last_activity_date when only resetting today's hasanat
                        // This preserves streak calculation
                        // Also reset streak_updated_today to allow streak recalculation
                        await AsyncStorage.removeItem('streak_updated_today');
                      } else {
                        // Reset all progress
                      await resetProgress(includeRecordings);
                        setIncludeRecordings(false); // Reset checkbox state
                      }
                      
                      setResetting(false);
                      const loadedData = await loadData();
                      setData(loadedData);
                    }}
                    disabled={resetting}
                  >
                    <Text style={styles.confirmModalConfirmText}>
                      {resetting ? t('resetting') : (resetType === 'today' ? 'Reset Today' : t('confirm_reset'))}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Progress History Modal */}
        <Modal
          visible={progressModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setProgressModalVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'center', paddingVertical: 20 }]}
            activeOpacity={1}
            onPress={() => setProgressModalVisible(false)}
          >
            <View 
              style={[styles.modalContent, { 
                minHeight: 700,
                maxHeight: '95%',
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
                width: '95%',
                maxWidth: 500,
              }]}
            >
              <ScrollView 
                style={{ flex: 1 }} 
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
                nestedScrollEnabled={true}
                bounces={false}
              >
                <Text variant="h2" style={{ 
                  marginBottom: 24, 
                  marginTop: 0, 
                  color: '#F5E6C8',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                  textAlign: 'center',
                }}>Memorization Progress</Text>
                
                {/* Calendar View */}
                <View style={{ marginBottom: 24, flex: 0 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Progress Calendar
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                  flex: 0,
                }}>
                  {/* Calendar Grid */}
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}>
                    {Array.from({ length: 30 }, (_, i) => {
                      const isCompleted = i < data.streak;
                      const isGoalDay = selectedGoal && i < Math.ceil(6236 / selectedGoal.ayaat);
                      const isMissed = selectedGoal && i >= data.streak && i < Math.ceil(6236 / selectedGoal.ayaat);
                      
                      let backgroundColor = 'rgba(128,128,128,0.5)';
                      if (isCompleted) {
                        backgroundColor = '#5b7f67';
                      } else if (isMissed) {
                        backgroundColor = 'rgba(255,0,0,0.6)';
                      } else if (isGoalDay) {
                        backgroundColor = 'rgba(165,115,36,0.3)';
                      }
                      
                      return (
                        <View key={i} style={{
                          width: 20,
                          height: 20,
                          margin: 2,
                          borderRadius: 10,
                          backgroundColor: backgroundColor,
                          borderWidth: 1,
                          borderColor: 'rgba(165,115,36,0.8)',
                        }} />
                      );
                    })}
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    marginTop: 8,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#5b7f67',
                        marginRight: 4,
                      }} />
                      <Text style={{ color: '#CCCCCC', fontSize: 10 }}>Completed</Text>
                    </View>
                    {selectedGoal && (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: 'rgba(165,115,36,0.3)',
                            marginRight: 4,
                          }} />
                          <Text style={{ color: '#CCCCCC', fontSize: 10 }}>Goal Days</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: 'rgba(255,0,0,0.6)',
                            marginRight: 4,
                          }} />
                          <Text style={{ color: '#CCCCCC', fontSize: 10 }}>Missed</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Goal Setting */}
              <View style={{ marginBottom: 24, flex: 0 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Set Daily Goals
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                  flex: 0,
                }}>
                  {!selectedGoal ? (
                    <>
                      <Text style={{
                        color: '#F5E6C8',
                        fontSize: 14,
                        fontWeight: 'bold',
                        marginBottom: 8,
                        textAlign: 'center'
                      }}>
                        Select your daily goal:
                      </Text>
                      <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                        {[
                          { ayaat: 1, days: 6236 },
                          { ayaat: 2, days: 3118 },
                          { ayaat: 3, days: 2079 },
                          { ayaat: 4, days: 1559 },
                          { ayaat: 5, days: 1248 },
                          { ayaat: 6, days: 1040 },
                          { ayaat: 7, days: 891 },
                          { ayaat: 8, days: 780 },
                          { ayaat: 9, days: 693 },
                          { ayaat: 10, days: 624 },
                          { ayaat: 20, days: 312 }
                        ].map((goal, index) => (
                          <TouchableOpacity
                            key={index}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderBottomWidth: index < 10 ? 1 : 0,
                              borderBottomColor: 'rgba(165,115,36,0.3)',
                              backgroundColor: 'rgba(165,115,36,0.1)',
                              borderRadius: 4,
                              marginBottom: 2,
                            }}
                            onPress={() => {
                              hapticSelection();
                              const startDate = new Date();
                              const completionDate = calculateGoalCompletionDate(goal.ayaat);
                              setSelectedGoal(goal);
                              setGoalStartDate(startDate);
                              setGoalCompletionDate(completionDate);
                              setGoalProgress(0);
                              saveGoalData(goal, startDate, completionDate);
                            }}
                          >
                            <Text style={{
                              color: '#F5E6C8',
                              fontSize: 14,
                              fontWeight: 'bold',
                            }}>
                              {goal.ayaat} ayaat/day
                            </Text>
                            <Text style={{
                              color: '#CCCCCC',
                              fontSize: 14,
                            }}>
                              {goal.days.toLocaleString()} days
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  ) : (
                    <>
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}>
                        <Text style={{
                          color: '#F5E6C8',
                          fontSize: 16,
                          fontWeight: 'bold',
                        }}>
                          Current Goal: {selectedGoal.ayaat} ayaat/day
                        </Text>
                        <TouchableOpacity
                          style={{
                            backgroundColor: 'rgba(165,115,36,0.3)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                          }}
                          onPress={() => {
                            hapticSelection();
                            setSelectedGoal(null);
                            setGoalCompletionDate(null);
                            setGoalProgress(0);
                            setGoalStartDate(null);
                            saveGoalData(null, null, null);
                          }}
                        >
                          <Text style={{ color: '#F5E6C8', fontSize: 12 }}>Change</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{
                          color: '#CCCCCC',
                          fontSize: 14,
                          marginBottom: 4,
                        }}>
                          Start Date: {goalStartDate ? formatDate(goalStartDate) : 'Not set'}
                        </Text>
                        <Text style={{
                          color: '#CCCCCC',
                          fontSize: 14,
                          marginBottom: 4,
                        }}>
                          Target Completion: {goalCompletionDate ? formatDate(goalCompletionDate) : 'Calculating...'}
                        </Text>
                        <Text style={{
                          color: '#CCCCCC',
                          fontSize: 14,
                        }}>
                          Progress: {Math.round(goalProgress)}%
                        </Text>
                      </View>
                      
                      {/* Progress Bar */}
                      <View style={{
                        height: 8,
                        backgroundColor: 'rgba(128,128,128,0.3)',
                        borderRadius: 4,
                        marginBottom: 8,
                      }}>
                        <View style={{
                          height: '100%',
                          width: `${goalProgress}%`,
                          backgroundColor: '#5b7f67',
                          borderRadius: 4,
                        }} />
                      </View>
                      
                      <Text style={{
                        color: '#CCCCCC',
                        fontSize: 12,
                        textAlign: 'center',
                        fontStyle: 'italic',
                      }}>
                        Progress updates based on your daily streak. Missing days will extend your completion date.
                      </Text>
                    </>
                  )}
                </View>
              </View>
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#5b7f67',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                  marginTop: 20,
                }}
                onPress={() => {
                  hapticSelection();
                  setProgressModalVisible(false);
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Hasanat Gains Modal */}
        <Modal
          visible={hasanatModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setHasanatModalVisible(false)}
        >
          {(() => {
            const [modalData, setModalData] = useState(data);
            
            // Load fresh data when modal opens
            useEffect(() => {
              if (hasanatModalVisible) {
                loadData().then(setModalData);
              }
            }, [hasanatModalVisible]);
            
            return (
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'center', paddingVertical: 20 }]}
            activeOpacity={1}
            onPress={() => setHasanatModalVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                maxHeight: '95%',
                minHeight: 700,
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
                width: '90%',
                maxWidth: 400,
              }]}
              activeOpacity={1}
              onPress={() => {}}
            >
                            <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <Text variant="h2" style={{ 
                  marginBottom: 20, 
                  marginTop: 0, 
                  color: '#F5E6C8',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                  textAlign: 'center',
                }}>Hasanat Gains</Text>
              
              {/* Real-time stats */}
              <View style={{ 
                backgroundColor: 'rgba(128,128,128,0.3)', 
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 16,
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 1,
              }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  Current Stats
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Total Hasanat</Text>
                    <Text style={{ 
                      color: 'rgba(245,200,96,0.8)', 
                      fontSize: 16, 
                      fontWeight: 'bold',
                      textShadowColor: '#fae29f',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 2,
                    }}>{toArabicNumber(formatLargeNumber(modalData.totalHasanat).text)}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Today's Hasanat</Text>
                    <Text style={{ 
                      color: '#5b7f67', 
                      fontSize: 16, 
                      fontWeight: 'bold',
                      textShadowColor: '#fae29f',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 2,
                    }}>{toArabicNumber(formatLargeNumber(modalData.todayHasanat).text)}</Text>
                  </View>
                </View>
                <View style={{ 
                  marginTop: 12, 
                  paddingTop: 12, 
                  borderTopWidth: 1, 
                  borderTopColor: 'rgba(165,115,36,0.3)' 
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Memorized Ayaat</Text>
                      <Text style={{ 
                        color: '#5b7f67', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                      }}>{toArabicNumber(modalData.memorizedAyaat || 0)}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Total Ayaat</Text>
                      <Text style={{ 
                        color: '#5b7f67', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                      }}>{toArabicNumber(modalData.totalAyaat || 0)}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Weekly Chart */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to previous week
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Weekly Progress
                  </Text>
                  <Text style={{
                    color: '#CCCCCC',
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 2
                  }}>
                    Dec 9-15, 2024
                  </Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to next week
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>→</Text>
                  </TouchableOpacity>
                </View>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                  height: 150,
                  justifyContent: 'center',
                }}>
                  {/* Weekly Hasanat Chart */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: 100,
                    paddingHorizontal: 10,
                  }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      // Calculate hasanat based on memorized ayaat (10 hasanat per ayah)
                      const weeklyHasanat = Math.floor((modalData.memorizedAyaat || 0) / 7) + Math.floor(Math.random() * 50);
                      const maxHeight = 80;
                      const height = Math.min((weeklyHasanat / 100) * maxHeight, maxHeight);
                      
                      return (
                        <View key={day} style={{ alignItems: 'center' }}>
                          <View style={{
                            width: 20,
                            height: Math.max(height, 4),
                            backgroundColor: '#5b7f67',
                            borderRadius: 4,
                            marginBottom: 8,
                          }} />
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 10,
                          }}>
                            {weeklyHasanat}
                          </Text>
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 10,
                          }}>
                            {day}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Monthly Chart */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to previous month
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Monthly Overview
                  </Text>
                  <Text style={{
                    color: '#CCCCCC',
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 2
                  }}>
                    December 2024
                  </Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to next month
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>→</Text>
                  </TouchableOpacity>
                </View>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 12,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                  height: 120,
                  justifyContent: 'center',
                }}>
                  {/* Monthly Hasanat Chart */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: 80,
                    paddingHorizontal: 10,
                  }}>
                    {['W1', 'W2', 'W3', 'W4'].map((week, index) => {
                      // Calculate monthly hasanat based on memorized ayaat
                      const monthlyHasanat = Math.floor((modalData.memorizedAyaat || 0) / 4) + Math.floor(Math.random() * 100);
                      const maxHeight = 60;
                      const height = Math.min((monthlyHasanat / 200) * maxHeight, maxHeight);
                      
                      return (
                        <View key={week} style={{ alignItems: 'center' }}>
                          <View style={{
                            width: 25,
                            height: Math.max(height, 4),
                            backgroundColor: 'rgba(245,200,96,0.8)',
                            borderRadius: 4,
                            marginBottom: 8,
                          }} />
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 10,
                          }}>
                            {monthlyHasanat}
                          </Text>
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 10,
                          }}>
                            {week}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Achievement Section */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  Recent Achievements
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 12,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>First Ayah Memorized</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>You memorized your first ayah! Masha'Allah!</Text>
                  </View>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>7-Day Streak</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>You maintained a 7-day memorization streak!</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>100 Hasanat</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 12 }}>You earned your first 100 hasanat!</Text>
                  </View>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#5b7f67',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                }}
                onPress={() => {
                  hapticSelection();
                  setHasanatModalVisible(false);
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                  Close
                </Text>
              </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
            );
          })()}
        </Modal>

        {/* Streak Modal */}
        <Modal
          visible={streakModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStreakModalVisible(false)}
        >
          {(() => {
            const [modalData, setModalData] = useState(data);
            
            // Load fresh data when modal opens
            useEffect(() => {
              if (streakModalVisible) {
                loadData().then(setModalData);
              }
            }, [streakModalVisible]);
            
            return (
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'center', paddingVertical: 20 }]}
            activeOpacity={1}
            onPress={() => setStreakModalVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                maxHeight: '95%',
                minHeight: 700,
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
                width: '90%',
                maxWidth: 400,
              }]}
              activeOpacity={1}
              onPress={() => {}}
            >
                            <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <Text variant="h2" style={{ 
                  marginBottom: 20, 
                  marginTop: 0, 
                  color: '#F5E6C8',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                  textAlign: 'center',
                }}>Daily Streaks</Text>
              
              {/* Real-time stats */}
              <View style={{ 
                backgroundColor: 'rgba(128,128,128,0.3)', 
                borderRadius: 12, 
                padding: 20, 
                marginBottom: 16,
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 1,
              }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Current Streak
                </Text>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ 
                    color: '#5b7f67', 
                    fontSize: 32, 
                    fontWeight: 'bold',
                    textShadowColor: '#fae29f',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 4,
                  }}>{toArabicNumber(formatStreakNumber(modalData.streak).text)}</Text>
                  <Text style={{ color: '#CCCCCC', fontSize: 16, marginTop: 4 }}>Days</Text>
                </View>
                <View style={{ 
                  marginTop: 12, 
                  paddingTop: 12, 
                  borderTopWidth: 1, 
                  borderTopColor: 'rgba(165,115,36,0.3)' 
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Best Streak</Text>
                      <Text style={{ 
                        color: '#5b7f67', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                      }}>{toArabicNumber(Math.max(modalData.streak || 0, 15))}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#CCCCCC', fontSize: 12 }}>Avg/Day</Text>
                      <Text style={{ 
                        color: '#5b7f67', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                      }}>{toArabicNumber(Math.floor((modalData.memorizedAyaat || 0) / Math.max(modalData.streak || 1, 1)))}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Weekly Streak */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to previous week
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 18,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Weekly Streak
                  </Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to next week
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>→</Text>
                  </TouchableOpacity>
                </View>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      // Calculate if day was completed based on streak
                      const isCompleted = index < (modalData.streak || 0) % 7;
                      const isToday = index === new Date().getDay() - 1; // Adjust for Monday start
                      
                      let backgroundColor = 'rgba(128,128,128,0.5)';
                      if (isCompleted) {
                        backgroundColor = '#5b7f67';
                      } else if (isToday) {
                        backgroundColor = 'rgba(165,115,36,0.6)';
                      }
                      
                      return (
                        <View key={day} style={{ alignItems: 'center' }}>
                          <View style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: backgroundColor,
                            borderWidth: 2,
                            borderColor: 'rgba(165,115,36,0.8)',
                            marginBottom: 8,
                          }} />
                          <Text style={{
                            color: '#CCCCCC',
                            fontSize: 12,
                          }}>
                            {day}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Monthly Streak */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to previous month
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 18,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Monthly Progress
                  </Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(165,115,36,0.3)',
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      hapticSelection();
                      // Navigate to next month
                    }}
                  >
                    <Text style={{ color: '#F5E6C8', fontSize: 14, fontWeight: 'bold' }}>→</Text>
                  </TouchableOpacity>
                </View>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  {/* Calendar Grid */}
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}>
                    {Array.from({ length: 30 }, (_, i) => (
                      <View key={i} style={{
                        width: 18,
                        height: 18,
                        margin: 1,
                        borderRadius: 9,
                        backgroundColor: Math.random() > 0.3 ? '#5b7f67' : 'rgba(128,128,128,0.5)',
                        borderWidth: 1,
                        borderColor: 'rgba(165,115,36,0.8)',
                      }} />
                    ))}
                  </View>
                  <Text style={{
                    color: '#CCCCCC',
                    fontSize: 12,
                    textAlign: 'center',
                    marginTop: 8
                  }}>
                    Green dots = Days with activity
                  </Text>
                </View>
              </View>

              {/* Yearly Stats */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Yearly Overview
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14 }}>Current Streak:</Text>
                    <Text style={{ color: '#5b7f67', fontSize: 16, fontWeight: 'bold' }}>{toArabicNumber(modalData.streak || 0)} days</Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14 }}>Longest Streak:</Text>
                    <Text style={{ color: '#5b7f67', fontSize: 16, fontWeight: 'bold' }}>{toArabicNumber(Math.max(modalData.streak || 0, 15))} days</Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 14 }}>Total Active Days:</Text>
                    <Text style={{ color: '#5b7f67', fontSize: 16, fontWeight: 'bold' }}>{toArabicNumber(Math.floor((modalData.streak || 0) * 1.2))} days</Text>
                  </View>
                </View>
              </View>

              {/* Streak Milestones */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: '#5b7f67',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Streak Milestones
                </Text>
                <View style={{
                  backgroundColor: 'rgba(128,128,128,0.3)',
                  borderRadius: 12,
                  padding: 16,
                  borderColor: 'rgba(165,115,36,0.8)',
                  borderWidth: 1,
                }}>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 16, fontWeight: 'bold' }}>7 Days</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 14 }}>
                      {modalData.streak >= 7 ? '✅ Completed' : 'Complete a week of memorization'}
                    </Text>
                  </View>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 16, fontWeight: 'bold' }}>30 Days</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 14 }}>
                      {modalData.streak >= 30 ? '✅ Completed' : 'Maintain a month-long streak'}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: '#F5E6C8', fontSize: 16, fontWeight: 'bold' }}>100 Days</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 14 }}>
                      {modalData.streak >= 100 ? '✅ Completed' : 'Achieve a century of memorization days'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#5b7f67',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  elevation: 8,
                }}
                onPress={() => {
                  hapticSelection();
                  setStreakModalVisible(false);
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                  Close
                </Text>
              </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
            );
          })()}
        </Modal>

        {/* Recordings Modal */}
        <Modal
          visible={recordingsModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRecordingsModalVisible(false)}
        >
          {(() => {
            const [selectedSurah, setSelectedSurah] = useState('Al-Fatihah');
            const [selectedAyah, setSelectedAyah] = useState('full-surah');
            const [recordings, setRecordings] = useState([]);
            const [loading, setLoading] = useState(false);
            const [surahDropdownOpen, setSurahDropdownOpen] = useState(false);
            const [ayahDropdownOpen, setAyahDropdownOpen] = useState(false);
            const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
            
            // Load recordings when modal opens or when route params indicate refresh
            useEffect(() => {
              if (recordingsModalVisible) {
                loadRecordings();
              } else {
                // Stop playback when modal closes
                if (currentlyPlaying) {
                  audioRecorder.stopPlayback();
                  setCurrentlyPlaying(null);
                }
              }
            }, [recordingsModalVisible, selectedSurah, selectedAyah, route.params?.refreshRecordings]);

            // Clear refreshRecordings parameter after use
            useEffect(() => {
              if (route.params?.refreshRecordings) {
                navigation.setParams({ refreshRecordings: undefined });
              }
            }, [route.params?.refreshRecordings]);
            
            const loadRecordings = async () => {
              setLoading(true);
              try {
                logger.debug('HomeScreen', 'Loading recordings', { surah: selectedSurah, ayah: selectedAyah });
                const allRecordings = await audioRecorder.loadRecordings(selectedSurah, selectedAyah);
                logger.debug('HomeScreen', 'Found recordings', { count: allRecordings.length });
                
                // Load highlighted recordings for this surah/ayah
                const highlightedKey = `highlighted_${selectedSurah}_${selectedAyah}`;
                const highlightedRecordingsStr = await AsyncStorage.getItem(highlightedKey);
                const highlightedRecordings = highlightedRecordingsStr ? JSON.parse(highlightedRecordingsStr) : [];
                logger.debug('HomeScreen', 'Highlighted recordings', { count: highlightedRecordings.length });
                
                // Mark recordings as highlighted
                const recordingsWithHighlight = allRecordings.map(recording => ({
                  ...recording,
                  isHighlighted: highlightedRecordings.includes(recording.uri)
                }));
                
                setRecordings(recordingsWithHighlight);
              } catch (error) {
                logger.error('HomeScreen', 'Error loading recordings', error);
                setRecordings([]);
              }
              setLoading(false);
            };
            
            const getAllSurahs = () => {
              return [
                'Al-Fatihah', 'Al-Baqarah', 'Aal-Imran', 'An-Nisa', 'Al-Maidah',
                'Al-Anam', 'Al-Araf', 'Al-Anfal', 'At-Tawbah', 'Yunus',
                'Hud', 'Yusuf', 'Ar-Rad', 'Ibrahim', 'Al-Hijr',
                'An-Nahl', 'Al-Isra', 'Al-Kahf', 'Maryam', 'Ta-Ha',
                'Al-Anbiya', 'Al-Hajj', 'Al-Muminun', 'An-Nur', 'Al-Furqan',
                'Ash-Shuara', 'An-Naml', 'Al-Qasas', 'Al-Ankabut', 'Ar-Rum',
                'Luqman', 'As-Sajdah', 'Al-Ahzab', 'Saba', 'Fatir',
                'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar', 'Ghafir',
                'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah',
                'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf',
                'Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman',
                'Al-Waqiah', 'Al-Hadid', 'Al-Mujadilah', 'Al-Hashr', 'Al-Mumtahanah',
                'As-Saff', 'Al-Jumuah', 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq',
                'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqah', 'Al-Maarij',
                'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddathir', 'Al-Qiyamah',
                'Al-Insan', 'Al-Mursalat', 'An-Naba', 'An-Naziat', 'Abasa',
                'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj',
                'At-Tariq', 'Al-Ala', 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad',
                'Ash-Shams', 'Al-Layl', 'Ad-Duha', 'Ash-Sharh', 'At-Tin',
                'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-Adiyat',
                'Al-Qariah', 'At-Takathur', 'Al-Asr', 'Al-Humazah', 'Al-Fil',
                'Al-Quraish', 'Al-Maun', 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr',
                'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'
              ];
            };
            
            const getAyahOptions = (surah) => {
              const options = [{ label: 'Full Surah', value: 'full-surah' }];
              
              // Get the correct number of ayahs for this surah
              const surahAyahCounts = {
                'Al-Fatihah': 7, 'Al-Baqarah': 286, 'Aal-Imran': 200, 'An-Nisa': 176, 'Al-Maidah': 120,
                'Al-Anam': 165, 'Al-Araf': 206, 'Al-Anfal': 75, 'At-Tawbah': 129, 'Yunus': 109,
                'Hud': 123, 'Yusuf': 111, 'Ar-Rad': 43, 'Ibrahim': 52, 'Al-Hijr': 99,
                'An-Nahl': 128, 'Al-Isra': 111, 'Al-Kahf': 110, 'Maryam': 98, 'Ta-Ha': 135,
                'Al-Anbiya': 112, 'Al-Hajj': 78, 'Al-Muminun': 118, 'An-Nur': 64, 'Al-Furqan': 77,
                'Ash-Shuara': 227, 'An-Naml': 93, 'Al-Qasas': 88, 'Al-Ankabut': 69, 'Ar-Rum': 60,
                'Luqman': 34, 'As-Sajdah': 30, 'Al-Ahzab': 73, 'Saba': 54, 'Fatir': 45,
                'Ya-Sin': 83, 'As-Saffat': 182, 'Sad': 88, 'Az-Zumar': 75, 'Ghafir': 85,
                'Fussilat': 54, 'Ash-Shura': 53, 'Az-Zukhruf': 89, 'Ad-Dukhan': 59, 'Al-Jathiyah': 37,
                'Al-Ahqaf': 35, 'Muhammad': 38, 'Al-Fath': 29, 'Al-Hujurat': 18, 'Qaf': 45,
                'Adh-Dhariyat': 60, 'At-Tur': 49, 'An-Najm': 62, 'Al-Qamar': 55, 'Ar-Rahman': 78,
                'Al-Waqiah': 96, 'Al-Hadid': 29, 'Al-Mujadilah': 22, 'Al-Hashr': 24, 'Al-Mumtahanah': 13,
                'As-Saff': 14, 'Al-Jumuah': 11, 'Al-Munafiqun': 11, 'At-Taghabun': 18, 'At-Talaq': 12,
                'At-Tahrim': 12, 'Al-Mulk': 30, 'Al-Qalam': 52, 'Al-Haqqah': 52, 'Al-Maarij': 44,
                'Nuh': 28, 'Al-Jinn': 28, 'Al-Muzzammil': 20, 'Al-Muddathir': 56, 'Al-Qiyamah': 40,
                'Al-Insan': 31, 'Al-Mursalat': 50, 'An-Naba': 40, 'An-Naziat': 46, 'Abasa': 42,
                'At-Takwir': 29, 'Al-Infitar': 19, 'Al-Mutaffifin': 36, 'Al-Inshiqaq': 25, 'Al-Buruj': 22,
                'At-Tariq': 17, 'Al-Ala': 19, 'Al-Ghashiyah': 26, 'Al-Fajr': 30, 'Al-Balad': 20,
                'Ash-Shams': 15, 'Al-Layl': 21, 'Ad-Duha': 11, 'Ash-Sharh': 8, 'At-Tin': 8,
                'Al-Alaq': 19, 'Al-Qadr': 5, 'Al-Bayyinah': 8, 'Az-Zalzalah': 8, 'Al-Adiyat': 11,
                'Al-Qariah': 11, 'At-Takathur': 8, 'Al-Asr': 3, 'Al-Humazah': 9, 'Al-Fil': 5,
                'Al-Quraish': 4, 'Al-Maun': 7, 'Al-Kawthar': 3, 'Al-Kafirun': 6, 'An-Nasr': 3,
                'Al-Masad': 5, 'Al-Ikhlas': 4, 'Al-Falaq': 5, 'An-Nas': 6
              };
              
              const ayahCount = surahAyahCounts[surah] || 286; // Default to 286 if not found
              
              // Add ayah numbers 1 to the actual count for this surah
              for (let i = 1; i <= ayahCount; i++) {
                options.push({ label: `Ayah ${i}`, value: i.toString() });
              }
              return options;
            };
            
            return (
          <TouchableOpacity 
            style={[styles.modalOverlay, { justifyContent: 'center', paddingVertical: 20 }]}
            activeOpacity={1}
            onPress={() => setRecordingsModalVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { 
                maxHeight: '95%',
                minHeight: 600,
                justifyContent: 'flex-start',
                paddingVertical: 30,
                marginTop: 17,
                backgroundColor: 'rgba(64,64,64,0.95)',
                borderColor: 'rgba(165,115,36,0.8)',
                borderWidth: 2,
                width: '90%',
                maxWidth: 400,
              }]}
              activeOpacity={1}
              onPress={() => {}}
            >
              <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <Text variant="h2" style={{ 
                  marginBottom: 20, 
                  marginTop: 0, 
                  color: '#F5E6C8',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                  textAlign: 'center',
                }}>Recordings Library</Text>
                
                {/* Surah Selection */}
                <View style={{ marginBottom: 20 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: 'rgba(128,128,128,0.3)',
                      borderRadius: 12,
                      borderColor: 'rgba(165,115,36,0.8)',
                      borderWidth: 1,
                    }}
                    onPress={() => {
                      hapticSelection();
                      setSurahDropdownOpen(!surahDropdownOpen);
                      setAyahDropdownOpen(false); // Close ayah dropdown when opening surah
                    }}
                  >
                    <Text style={{
                      color: '#5b7f67',
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}>
                      {selectedSurah}
                    </Text>
                    <Text style={{
                      color: '#5b7f67',
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}>
                      {surahDropdownOpen ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  
                  {surahDropdownOpen && (
                    <View style={{
                      backgroundColor: 'rgba(128,128,128,0.3)',
                      borderRadius: 12,
                      marginTop: 4,
                      borderColor: 'rgba(165,115,36,0.8)',
                      borderWidth: 1,
                      maxHeight: 150,
                    }}>
                      <ScrollView style={{ maxHeight: 150 }}>
                        {getAllSurahs().map((surah, index) => (
                          <TouchableOpacity
                            key={surah}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderBottomWidth: index < getAllSurahs().length - 1 ? 1 : 0,
                              borderBottomColor: 'rgba(165,115,36,0.3)',
                              backgroundColor: selectedSurah === surah ? 'rgba(165,115,36,0.3)' : 'transparent',
                              borderRadius: 4,
                            }}
                            onPress={() => {
                              hapticSelection();
                              setSelectedSurah(surah);
                              setSelectedAyah('full-surah');
                              setSurahDropdownOpen(false);
                            }}
                          >
                            <Text style={{
                              color: selectedSurah === surah ? '#F5E6C8' : '#CCCCCC',
                              fontSize: 14,
                              fontWeight: selectedSurah === surah ? 'bold' : 'normal',
                            }}>
                              {surah}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                {/* Ayah Selection */}
                <View style={{ marginBottom: 20 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: 'rgba(128,128,128,0.3)',
                      borderRadius: 12,
                      borderColor: 'rgba(165,115,36,0.8)',
                      borderWidth: 1,
                    }}
                    onPress={() => {
                      hapticSelection();
                      setAyahDropdownOpen(!ayahDropdownOpen);
                      setSurahDropdownOpen(false); // Close surah dropdown when opening ayah
                    }}
                  >
                    <Text style={{
                      color: '#5b7f67',
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}>
                      {selectedAyah === 'full-surah' ? 'Full Surah' : `Ayah ${selectedAyah}`}
                    </Text>
                    <Text style={{
                      color: '#5b7f67',
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}>
                      {ayahDropdownOpen ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  
                  {ayahDropdownOpen && (
                    <View style={{
                      backgroundColor: 'rgba(128,128,128,0.3)',
                      borderRadius: 12,
                      marginTop: 4,
                      borderColor: 'rgba(165,115,36,0.8)',
                      borderWidth: 1,
                      maxHeight: 150,
                    }}>
                      <ScrollView style={{ maxHeight: 150 }}>
                        {getAyahOptions(selectedSurah).map((option, index) => (
                          <TouchableOpacity
                            key={option.value}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderBottomWidth: index < getAyahOptions(selectedSurah).length - 1 ? 1 : 0,
                              borderBottomColor: 'rgba(165,115,36,0.3)',
                              backgroundColor: selectedAyah === option.value ? 'rgba(165,115,36,0.3)' : 'transparent',
                              borderRadius: 4,
                            }}
                            onPress={() => {
                              hapticSelection();
                              setSelectedAyah(option.value);
                              setAyahDropdownOpen(false);
                            }}
                          >
                            <Text style={{
                              color: selectedAyah === option.value ? '#F5E6C8' : '#CCCCCC',
                              fontSize: 14,
                              fontWeight: selectedAyah === option.value ? 'bold' : 'normal',
                            }}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                {/* Recordings List */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    color: '#5b7f67',
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 8,
                    textAlign: 'center'
                  }}>
                    Recordings ({recordings.length})
                  </Text>
                  <View style={{
                    backgroundColor: 'rgba(128,128,128,0.3)',
                    borderRadius: 12,
                    padding: 16,
                    borderColor: 'rgba(165,115,36,0.8)',
                    borderWidth: 1,
                    minHeight: 300,
                  }}>
                    {loading ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ color: '#CCCCCC', fontSize: 14 }}>Loading recordings...</Text>
                      </View>
                    ) : recordings.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ color: '#CCCCCC', fontSize: 14 }}>No recordings found</Text>
                        <Text style={{ color: '#CCCCCC', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                          Recordings will appear here once you start recording
                        </Text>
                      </View>
                    ) : (
                      <ScrollView style={{ maxHeight: 400 }}>
                        {recordings.map((recording, index) => (
                          <View key={index} style={{
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomWidth: index < recordings.length - 1 ? 1 : 0,
                            borderBottomColor: 'rgba(165,115,36,0.3)',
                            backgroundColor: recording.isHighlighted ? 'rgba(165,115,36,0.3)' : 'rgba(165,115,36,0.1)',
                            borderRadius: 8,
                            marginBottom: 8,
                            borderWidth: recording.isHighlighted ? 2 : 0,
                            borderColor: recording.isHighlighted ? 'rgba(165,115,36,0.8)' : 'transparent',
                          }}>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8,
                            }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{
                                  color: '#F5E6C8',
                                  fontSize: 14,
                                  fontWeight: 'bold',
                                }}>
                                  {recording.name || `Recording ${index + 1}`}
                                </Text>
                                {recording.isHighlighted && (
                                  <Text style={{
                                    color: '#fae29f',
                                    fontSize: 12,
                                    fontStyle: 'italic',
                                    marginTop: 2,
                                  }}>
                                    ⭐ Highlighted
                                  </Text>
                                )}
                              </View>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: 'rgba(165,115,36,0.8)',
                                  paddingHorizontal: 12,
                                  paddingVertical: 6,
                                  borderRadius: 6,
                                  marginLeft: 8,
                                }}
                                onPress={async () => {
                                  hapticSelection();
                                  try {
                                    if (currentlyPlaying === recording.uri) {
                                      // Stop current playback
                                      await audioRecorder.stopPlayback();
                                      setCurrentlyPlaying(null);
                                    } else {
                                      // Stop any currently playing recording
                                      if (currentlyPlaying) {
                                        await audioRecorder.stopPlayback();
                                      }
                                      // Play this recording
                                      await audioRecorder.playRecording(recording.uri);
                                      setCurrentlyPlaying(recording.uri);
                                    }
                                                } catch (error) {
                logger.error('HomeScreen', 'Error playing recording', error);
              }
                                }}
                              >
                                <Text style={{
                                  color: '#FFFFFF',
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                }}>
                                  {currentlyPlaying === recording.uri ? '⏹ Stop' : '▶ Play'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={{
                              color: '#CCCCCC',
                              fontSize: 12,
                            }}>
                              Duration: {recording.duration ? `${recording.duration.toFixed(1)}s` : 'Unknown'}
                            </Text>
                            <Text style={{
                              color: '#CCCCCC',
                              fontSize: 12,
                            }}>
                              Date: {recording.timestamp ? new Date(recording.timestamp).toLocaleDateString() : 'Unknown'}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>
                
                {/* Close Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#5b7f67',
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 8,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                  onPress={() => {
                    hapticSelection();
                    setRecordingsModalVisible(false);
                  }}
                >
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
            );
          })()}
        </Modal>

        {/* Auth Modal */}
        <Modal
          visible={authVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAuthVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBackdrop} />
            <View style={styles.modalContainer}>
              <AuthScreen 
                navigation={navigation} 
                onClose={() => setAuthVisible(false)}
                isModal={true}
              />
            </View>
          </View>
        </Modal>

        {/* Profile Dashboard Modal */}
        <Modal
          visible={settingsVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBackdrop} />
            <View style={styles.modalContainer}>
              <ProfileDashboard 
                navigation={navigation} 
                onClose={() => setSettingsVisible(false)}
              />
            </View>
          </View>
        </Modal>

        {/* Streak Animation */}
        <StreakAnimation
          visible={showStreakAnimation}
          newStreak={newStreak}
          onAnimationComplete={handleStreakAnimationComplete}
        />

        {/* Streak Broken Animation */}
        <StreakBrokenAnimation
          visible={showStreakBrokenAnimation}
          previousStreak={brokenStreakData.previousStreak}
          missedDays={brokenStreakData.missedDays}
          onAnimationComplete={handleStreakBrokenAnimationComplete}
        />

        {/* Saved Notes Modal */}
        <Modal
          visible={showSavedNotesModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSavedNotesModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSavedNotesModal(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { backgroundColor: '#5b7f67' }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Close X button at top right */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: '#666666',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => setShowSavedNotesModal(false)}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: 20, 
                  fontWeight: 'bold',
                  lineHeight: 20,
                }}>
                  ×
                </Text>
              </TouchableOpacity>

              <Text variant="h2" style={{ marginBottom: 16, marginTop: 0, color: '#F5E6C8', textAlign: 'center' }}>
                {language === 'ar' ? 'الملاحظات المحفوظة' : 'Saved Notes'}
              </Text>
              
              {/* Notes Dropdown Box */}
              <View style={styles.notesDropdownContainer}>
                <TouchableOpacity
                  style={styles.notesDropdownHeader}
                  onPress={() => {
                    // Toggle dropdown
                    setNotesDropdownOpen(!notesDropdownOpen);
                  }}
                >
                  <Text style={styles.notesDropdownTitle}>
                    {language === 'ar' ? 'اختر السورة' : 'Select Surah'}
                  </Text>
                  <Text style={styles.notesDropdownArrow}>
                    {notesDropdownOpen ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
                
                {notesDropdownOpen && (
                  <View style={styles.notesDropdownContent}>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {savedNotes.length > 0 ? (
                        // Group notes by surah
                        Object.entries(
                          savedNotes.reduce((acc, note) => {
                            if (!acc[note.surahNumber]) {
                              acc[note.surahNumber] = [];
                            }
                            acc[note.surahNumber].push(note);
                            return acc;
                          }, {})
                        ).map(([surahNumber, notes]) => (
                          <TouchableOpacity
                            key={surahNumber}
                            style={styles.notesDropdownItem}
                            onPress={() => {
                              setSelectedSurah(parseInt(surahNumber));
                              setNotesDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.notesDropdownItemText}>
                              {getSurahName(parseInt(surahNumber))} ({notes.length} {language === 'ar' ? 'ملاحظة' : 'notes'})
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.notesDropdownEmptyText}>
                          {language === 'ar' ? 'لا توجد ملاحظات' : 'No notes available'}
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <ScrollView style={{ flex: 1, width: '100%' }}>
                {notesLoading ? (
                  <View style={{ alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 16 }}>
                      {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </Text>
                  </View>
                ) : savedNotes.length === 0 ? (
                  <View style={{ alignItems: 'center', padding: 20 }}>
                    <Text style={{ 
                      color: '#F5E6C8', 
                      fontSize: 16, 
                      textAlign: 'center',
                      marginBottom: 16,
                      fontStyle: 'italic'
                    }}>
                      {language === 'ar' ? 'لا توجد ملاحظات محفوظة' : 'No saved notes yet'}
                    </Text>
                    <Text style={{ 
                      color: '#CCCCCC', 
                      fontSize: 14, 
                      textAlign: 'center',
                      lineHeight: 20
                    }}>
                      {language === 'ar' ? 'ابدأ بكتابة ملاحظات أثناء حفظ القرآن' : 'Start writing notes while memorizing the Quran'}
                    </Text>
                  </View>
                ) : (
                  <View style={{ width: '100%' }}>
                    {selectedSurah ? (
                      // Show notes for selected surah only
                      <View style={styles.surahSection}>
                        <Text style={styles.surahSectionTitle}>
                          {getSurahName(selectedSurah)}
                        </Text>
                        {savedNotes
                          .filter(note => note.surahNumber === selectedSurah)
                          .map((note, index) => (
                            <View key={note.id} style={styles.noteCard}>
                              <View style={styles.noteHeader}>
                                <Text style={styles.noteTitle}>
                                  {language === 'ar' ? 'الآية' : 'Ayah'} {note.ayahNumber}
                                </Text>
                              </View>
                              
                              <Text style={styles.noteContent}>{note.content}</Text>
                              
                              {/* Social Features */}
                              <View style={styles.socialFeatures}>
                                <TouchableOpacity
                                  style={styles.socialButton}
                                  onPress={() => handleFavorite(note.id)}
                                >
                                  <Text style={styles.socialButtonText}>
                                    {note.isFavorited ? '❤️' : '🤍'} {language === 'ar' ? 'مفضل' : 'Favorite'}
                                  </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                  style={styles.socialButton}
                                  onPress={() => handleLike(note.id)}
                                >
                                  <Text style={styles.socialButtonText}>
                                    {note.isLiked ? '👍' : '👍'} {note.likes || 0}
                                  </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                  style={styles.socialButton}
                                  onPress={() => handleComment(note.id)}
                                >
                                  <Text style={styles.socialButtonText}>
                                    💬 {note.comments || 0}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                      </View>
                    ) : (
                      // Show all notes grouped by surah
                      renderNotesBySurah(savedNotes)
                    )}
                  </View>
                )}
              </ScrollView>

              {/* Notes Board Button */}
              <TouchableOpacity
                style={styles.notesBoardButton}
                onPress={async () => {
                  // Add a test note to Notes Board first
                  try {
                    const notesBoardKey = 'notes_board';
                    const existingNotes = await AsyncStorage.getItem(notesBoardKey);
                    const notesArray = existingNotes ? JSON.parse(existingNotes) : [];
                    
                    const testNote = {
                      id: Date.now().toString(),
                      surahNumber: 1,
                      ayahNumber: 1,
                      content: 'This is a test note to verify the Notes Board is working!',
                      timestamp: new Date().toISOString(),
                      author: 'Test User',
                      surahName: 'Al-Fatihah'
                    };
                    
                    notesArray.unshift(testNote);
                    await AsyncStorage.setItem(notesBoardKey, JSON.stringify(notesArray));
                    console.log('[HomeScreen] Added test note to Notes Board');
                  } catch (error) {
                    console.error('[HomeScreen] Error adding test note:', error);
                  }
                  
                  // Close the Saved Notes modal first
                  setShowSavedNotesModal(false);
                  
                  // Then navigate to Notes Board screen after a short delay
                  setTimeout(() => {
                    navigation.navigate('NotesBoard');
                  }, 300);
                }}
              >
                <Text style={styles.notesBoardButtonText}>
                  {language === 'ar' ? 'لوحة الملاحظات' : 'Notes Board'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Saved Ayaat Modal */}
        <Modal
          visible={showSavedAyaatModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSavedAyaatModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSavedAyaatModal(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { backgroundColor: '#5b7f67' }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Close X button at top right */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: '#666666',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => setShowSavedAyaatModal(false)}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: 20, 
                  fontWeight: 'bold',
                  lineHeight: 20,
                }}>
                  ×
                </Text>
              </TouchableOpacity>

              <Text variant="h2" style={{ marginBottom: 16, marginTop: 0, color: '#F5E6C8', textAlign: 'center' }}>
                {language === 'ar' ? 'الآيات المحفوظة' : 'Saved Ayaat'}
              </Text>
              
              {/* Lists Dropdown */}
              <View style={styles.listsDropdownContainer}>
                <TouchableOpacity
                  style={styles.listsDropdownHeader}
                  onPress={() => {
                    setListsDropdownOpen(!listsDropdownOpen);
                  }}
                >
                  <Text style={styles.listsDropdownTitle}>
                    {selectedCustomList || (language === 'ar' ? 'اختر القائمة' : 'Select List')}
                  </Text>
                  <Text style={styles.listsDropdownArrow}>
                    {listsDropdownOpen ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
                
                {listsDropdownOpen && (
                  <View style={styles.listsDropdownContent}>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {customLists.length > 0 ? (
                        customLists.map((listName) => (
                          <TouchableOpacity
                            key={listName}
                            style={[
                              styles.listsDropdownItem,
                              selectedCustomList === listName && styles.selectedListsDropdownItem
                            ]}
                            onPress={() => {
                              setSelectedCustomList(listName);
                              setListsDropdownOpen(false);
                            }}
                          >
                            <Text style={[
                              styles.listsDropdownItemText,
                              selectedCustomList === listName && styles.selectedListsDropdownItemText
                            ]}>
                              {listName}
                            </Text>
                            {selectedCustomList === listName && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.listsDropdownEmptyText}>
                          {language === 'ar' ? 'لا توجد قوائم مخصصة' : 'No custom lists available'}
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              {/* Ayaat List */}
              <ScrollView style={{ flex: 1, width: '100%' }}>
                {listsLoading ? (
                  <View style={{ alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: '#F5E6C8', fontSize: 16 }}>
                      {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </Text>
                  </View>
                ) : listAyahs.length === 0 ? (
                  <View style={{ alignItems: 'center', padding: 20 }}>
                    <Text style={{ 
                      color: '#F5E6C8', 
                      fontSize: 16, 
                      textAlign: 'center',
                      marginBottom: 16,
                      fontStyle: 'italic'
                    }}>
                      {language === 'ar' ? 'لا توجد آيات محفوظة في هذه القائمة' : 'No saved ayahs in this list'}
                    </Text>
                    <Text style={{ 
                      color: '#CCCCCC', 
                      fontSize: 14, 
                      textAlign: 'center',
                      lineHeight: 20
                    }}>
                      {language === 'ar' ? 'اضغط على أيقونة الإشارة المرجعية في شاشة الحفظ لحفظ الآيات' : 'Tap the bookmark icon in memorization screen to save ayahs'}
                    </Text>
                  </View>
                ) : (
                  <View style={{ width: '100%' }}>
                    {listAyahs.map((ayah, index) => (
                      <TouchableOpacity
                        key={ayah.id}
                        style={styles.ayahCard}
                        onPress={() => {
                          // Navigate to specific ayah
                          setShowSavedAyaatModal(false);
                          setTimeout(() => {
                            navigation.navigate('Memorization', {
                              surah: { id: ayah.surahNumber, name: ayah.surahName },
                              resumeFromIndex: 0,
                              targetAyah: ayah.ayahNumber
                            });
                          }, 300);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.ayahInfo}>
                          <View style={[
                            styles.ayahHeader,
                            language === 'ar' && { flexDirection: 'row-reverse' }
                          ]}>
                            <Text style={styles.surahNumber}>
                              {ayah.surahNumber}
                            </Text>
                            <Text style={styles.surahName}>
                              {ayah.surahName}
                            </Text>
                          </View>
                          
                          <View style={styles.ayahDetails}>
                            <Text style={styles.ayahNumber}>
                              {language === 'ar' ? 
                                `الآية ${ayah.ayahNumber}` : 
                                `Ayah ${ayah.ayahNumber}`
                              }
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>



              </SafeAreaView>
      </ImageBackground>
      

    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: SIZES.large,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logoTextContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 80,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#fae29f',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
    }),
  },
  introButton: {
    padding: SIZES.small,
  },
  settingsButton: {
    padding: SIZES.small,
  },
  mainContent: {
    flex: 1,
  },
  progressCard: {
    marginBottom: SIZES.medium,
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    padding: SIZES.medium,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  progressBar: {
    height: 10, // Made even thinner in height
    backgroundColor: 'rgba(100,100,100,0.7)', // Darker gray background (not too light)
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressShadow: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#33694e',
    zIndex: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.medium,
  },
  statCard: {
    flex: 1,
    padding: SIZES.medium,
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderColor: 'rgba(165,115,36,0.8)',
    borderWidth: 1,
    borderRadius: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -8,
  },
  gridButton: {
    flex: 1,
    marginHorizontal: SIZES.small,
    padding: SIZES.large,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: SIZES.base,
  },
  gridButtonText: {
    marginTop: SIZES.small,
    textAlign: 'center',
  },
  buttonIconContainer: {
    padding: Platform.OS === 'android' ? SIZES.small : SIZES.small,
    marginTop: 5,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#fae29f',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1.0,
      shadowRadius: 15,
      elevation: 12,
    }),
  },
  buttonIcon: {
    width: 35,
    height: 35,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 80,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.medium,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: SIZES.large,
    paddingTop: 60,
    borderRadius: 35,
    width: '80%',
    alignItems: 'center',
  },


  arabicText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 0,
    textAlign: 'center',
    fontFamily: 'UthmanTN_v2-0',
    writingDirection: 'rtl',
    lineHeight: 32,
  },
  customDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: -20, // Reduced from SIZES.small to move up
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerGap: {
    width: 200,
    alignItems: 'center',
  },
  introLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  // Confirmation Modal Styles
  confirmModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Move to bottom
    alignItems: 'center',
    paddingBottom: 50, // Add some padding from bottom
  },
  confirmModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  confirmModalContainer: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    padding: 30,
    borderWidth: 3,
    borderColor: 'rgba(255,165,0,0.6)',
  },
  confirmModalContent: {
    alignItems: 'center',
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  confirmModalTitle: {
    color: '#FFA500',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  confirmModalSubtitle: {
    color: '#CCCCCC',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  confirmModalCheckbox: {
    marginBottom: 25,
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFA500',
    backgroundColor: 'transparent',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFA500',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  confirmModalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(128,128,128,0.3)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  confirmModalCancelText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  confirmModalConfirmButton: {
    flex: 1,
    backgroundColor: 'rgba(220,20,60,0.9)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  confirmModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  surahSection: {
    marginBottom: 20,
  },
  surahSectionTitle: {
    color: '#F5E6C8',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(165,115,36,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  noteCard: {
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderColor: 'rgba(165,115,36,0.6)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    marginBottom: 8,
  },
  noteTitle: {
    color: '#5b7f67',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteContent: {
    color: '#F5E6C8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  socialFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(165,115,36,0.3)',
    paddingTop: 8,
  },
  socialButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  socialButtonText: {
    color: '#F5E6C8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesDropdownContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.6)',
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  notesDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  notesDropdownTitle: {
    color: '#F5E6C8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesDropdownArrow: {
    color: '#F5E6C8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesDropdownContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(165,115,36,0.3)',
    backgroundColor: 'rgba(64,64,64,0.3)',
  },
  notesDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,115,36,0.2)',
  },
  notesDropdownItemText: {
    color: '#F5E6C8',
    fontSize: 14,
  },
  notesDropdownEmptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  // Saved Ayaat Modal Styles
  listsDropdownContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.6)',
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  listsDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  listsDropdownTitle: {
    color: '#F5E6C8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listsDropdownArrow: {
    color: '#F5E6C8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listsDropdownContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(165,115,36,0.3)',
    backgroundColor: 'rgba(64,64,64,0.3)',
  },
  listsDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,115,36,0.2)',
  },
  listsDropdownItemText: {
    color: '#F5E6C8',
    fontSize: 14,
  },
  selectedListsDropdownItem: {
    backgroundColor: 'rgba(165,115,36,0.3)',
  },
  selectedListsDropdownItemText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  listsDropdownEmptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  checkmark: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ayahCard: {
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderColor: 'rgba(165,115,36,0.6)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ayahInfo: {
    flex: 1,
  },
  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  surahNumber: {
    color: '#5b7f67',
    fontSize: 18,
    fontWeight: 'bold',
  },
  surahName: {
    color: '#F5E6C8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ayahDetails: {
    marginTop: 4,
  },
  ayahNumber: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  notesBoardButton: {
    backgroundColor: 'rgba(165,115,36,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  notesBoardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 