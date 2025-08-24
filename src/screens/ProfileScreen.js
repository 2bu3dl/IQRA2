import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  ImageBackground,
  Image,
  Modal,
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { makeSupabaseRequest } from '../utils/supabase';
import { hapticSelection } from '../utils/hapticFeedback';
import { validateUsername, validateDisplayName, logValidationAttempt } from '../utils/validation';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  // Arabic alphabet letters for profile picture selection
  const arabicLetters = [
    'ء', 'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض',
    'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
  ];
  
  // Color options for letter and background
  const colorOptions = [
    '#6BA368', '#FF8C00', '#E53E3E', '#9B59B6', '#3498DB', '#F39C12', '#1ABC9C', '#E74C3C',
    '#F5E6C8', '#FFFFFF', '#E8F5E8', '#FFF3E0', '#FFEBEE', '#F3E5F5', '#E3F2FD', '#E0F2F1'
  ];
  
  // Generate earth tone color palette with app theme colors
  const generateColorSpectrum = () => {
    // Earth tones and app theme colors
    const earthTones = [
      // App theme colors
      '#6BA368', // App green
      'rgba(165,115,36,0.8)', // App orange
      '#F5E6C8', // App cream
      
      // Earth tones
      '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3',
      '#D2B48C', '#BC8F8F', '#F4A460', '#DAA520', '#B8860B',
      '#D2691E', '#CD5C5C', '#DC143C', '#B22222', '#8B0000',
      '#556B2F', '#6B8E23', '#9ACD32', '#32CD32', '#228B22',
      '#006400', '#2E8B57', '#20B2AA', '#48D1CC', '#40E0D0',
      '#4682B4', '#5F9EA0', '#708090', '#778899', '#B0C4DE',
      '#E6E6FA', '#DDA0DD', '#D8BFD8', '#FFE4E1', '#F0F8FF'
    ];
    
    return earthTones;
  };
  

  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLogoutPressed, setIsLogoutPressed] = useState(false);
  const [profileLetter, setProfileLetter] = useState('ء');
  const [showLetterPicker, setShowLetterPicker] = useState(false);
  const [letterColor, setLetterColor] = useState('#6BA368');
  const [backgroundColor, setBackgroundColor] = useState('#F5E6C8');
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const letterScrollRef = useRef(null);
  const [stats, setStats] = useState({
    totalHasanat: 0,
    streak: 0,
    totalAyaat: 0,
    memorizedAyaat: 0
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserStats();
    }
  }, [user]);

  // Scroll to selected letter when modal opens
  useEffect(() => {
    if (showLetterPicker && letterScrollRef.current) {
      // Reset scroll progress
      setScrollProgress(0);
      
      const selectedIndex = arabicLetters.indexOf(profileLetter);
      if (selectedIndex > 0) {
        setTimeout(() => {
          letterScrollRef.current.scrollTo({
            x: selectedIndex * 60, // Approximate width of each letter option
            animated: true
          });
        }, 100);
      }
    }
  }, [showLetterPicker, profileLetter]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      if (user) {
        setEmail(user.email || '');

        // Get user profile from user_profiles table
        try {
          const result = await makeSupabaseRequest(`user_profiles?select=*&user_id=eq.${user.id}`);
          
          if (result.success && result.data && result.data.length > 0) {
            const profile = result.data[0];
            setUsername(profile.username || '');
            setDisplayName(profile.display_name || '');
            setProfileLetter(profile.profile_letter || 'ء');
            setLetterColor(profile.letter_color || '#6BA368');
            setBackgroundColor(profile.background_color || '#F5E6C8');
          } else {
            // Profile should be created automatically by trigger, but if it doesn't exist,
            // create it now
            const createResult = await makeSupabaseRequest('user_profiles', {
              method: 'POST',
              body: {
                user_id: user.id,
                username: '',
                display_name: '',
                profile_letter: 'ء',
                letter_color: '#6BA368',
                background_color: '#F5E6C8',
                created_at: new Date().toISOString()
              }
            });

            if (createResult.success) {
              console.log('[ProfileScreen] Created new profile:', createResult.data);
            } else {
              console.error('[ProfileScreen] Error creating profile:', createResult.error);
            }
          }
        } catch (profileError) {
          console.error('[ProfileScreen] Profile query error:', profileError);
          // Set default values on error
          setUsername('');
          setDisplayName('');
          setProfileLetter('ء');
          setLetterColor('#6BA368');
          setBackgroundColor('#F5E6C8');
        }
      }
    } catch (error) {
      console.error('[ProfileScreen] Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      if (user) {
        // Get user progress from user_progress table (this has the real data)
        const result = await makeSupabaseRequest(`user_progress?select=progress_data&user_id=eq.${user.id}&order=updated_at.desc&limit=1`);
        
        if (result.success && result.data && result.data.length > 0) {
          const progressData = result.data[0].progress_data;
          
          // Extract stats from the JSON progress data
          setStats({
            totalHasanat: progressData.totalHasanat || 0,
            streak: progressData.streak || 0,
            totalAyaat: progressData.totalAyaat || 0,
            memorizedAyaat: progressData.memorizedAyaat || 0
          });
          
          console.log('[ProfileScreen] Loaded stats from progress:', {
            totalHasanat: progressData.totalHasanat,
            streak: progressData.streak,
            totalAyaat: progressData.totalAyaat,
            memorizedAyaat: progressData.memorizedAyaat
          });
        } else {
          // Set default stats if no progress data found
          setStats({
            totalHasanat: 0,
            streak: 0,
            totalAyaat: 0,
            memorizedAyaat: 0
          });
          console.log('[ProfileScreen] No progress data found, using defaults');
        }
      }
    } catch (error) {
      console.error('[ProfileScreen] Error loading stats:', error);
      // Set default stats on error
      setStats({
        totalHasanat: 0,
        streak: 0,
        totalAyaat: 0,
        memorizedAyaat: 0
      });
    }
  };

  const saveDisplayName = async (newDisplayName = null) => {
    if (!user) return;

    // Use newDisplayName if provided, otherwise use current displayName
    const nameToSave = newDisplayName || displayName;
    
    // Validate display name
    const displayNameValidation = validateDisplayName(nameToSave);
    logValidationAttempt('displayName', nameToSave, displayNameValidation.isValid, 'profile');
    if (!displayNameValidation.isValid) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        displayNameValidation.error
      );
      return;
    }

    try {
      setSaving(true);
      const result = await makeSupabaseRequest(`user_profiles?user_id=eq.${user.id}`, {
        method: 'PATCH',
        body: { 
          display_name: displayNameValidation.value,
          updated_at: new Date().toISOString()
        }
      });

      // Update local state if we're saving a new name
      if (newDisplayName) {
        setDisplayName(displayNameValidation.value);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to update display name');
      }

      Alert.alert(
        language === 'ar' ? 'تم الحفظ' : 'Saved',
        language === 'ar' ? 'تم حفظ اسم العرض بنجاح' : 'Display name saved successfully'
      );
      setIsEditing(false);
    } catch (error) {
      console.error('[ProfileScreen] Error saving display name:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في حفظ اسم العرض' : 'Failed to save display name'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveProfileLetter = async (letter) => {
    if (!user) return;

    try {
      setSaving(true);
      const result = await makeSupabaseRequest(`user_profiles?user_id=eq.${user.id}`, {
        method: 'PATCH',
        body: { 
          profile_letter: letter,
          updated_at: new Date().toISOString()
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile letter');
      }

      console.log('[ProfileScreen] Profile letter updated successfully:', letter);
    } catch (error) {
      console.error('[ProfileScreen] Error saving profile letter:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في حفظ حرف الملف الشخصي' : 'Failed to save profile letter'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveProfileColors = async (newLetterColor, newBackgroundColor) => {
    if (!user) return;

    try {
      setSaving(true);
      const result = await makeSupabaseRequest(`user_profiles?user_id=eq.${user.id}`, {
        method: 'PATCH',
        body: { 
          letter_color: newLetterColor,
          background_color: newBackgroundColor,
          updated_at: new Date().toISOString()
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile colors');
      }

      console.log('[ProfileScreen] Profile colors updated successfully:', { newLetterColor, newBackgroundColor });
    } catch (error) {
      console.error('[ProfileScreen] Error saving profile colors:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في حفظ ألوان الملف الشخصي' : 'Failed to save profile colors'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveUsername = async () => {
    if (!user) return;

    // Validate username
    const usernameValidation = validateUsername(username);
    logValidationAttempt('username', username, usernameValidation.isValid, 'profile');
    if (!usernameValidation.isValid) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        usernameValidation.error
      );
      return;
    }

    try {
      setSaving(true);
      
      // Check if username is already taken
      const checkResult = await makeSupabaseRequest(`user_profiles?select=user_id&username=eq.${usernameValidation.value}&user_id=neq.${user.id}`);
      
      if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
        Alert.alert(
          language === 'ar' ? 'اسم المستخدم مأخوذ' : 'Username Taken',
          language === 'ar' ? 'اسم المستخدم هذا مأخوذ بالفعل' : 'This username is already taken'
        );
        return;
      }

      const result = await makeSupabaseRequest(`user_profiles?user_id=eq.${user.id}`, {
        method: 'PATCH',
        body: { 
          username: usernameValidation.value,
          updated_at: new Date().toISOString()
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update username');
      }

      Alert.alert(
        language === 'ar' ? 'تم الحفظ' : 'Saved',
        language === 'ar' ? 'تم حفظ اسم المستخدم بنجاح' : 'Username saved successfully'
      );
    } catch (error) {
      console.error('[ProfileScreen] Error saving username:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في حفظ اسم المستخدم' : 'Failed to save username'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      Alert.alert(
        language === 'ar' ? 'تسجيل الخروج' : 'Logout',
        language === 'ar' ? 'هل أنت متأكد من أنك تريد تسجيل الخروج؟' : 'Are you sure you want to logout?',
        [
          {
            text: language === 'ar' ? 'إلغاء' : 'Cancel',
            style: 'cancel',
          },
          {
            text: language === 'ar' ? 'تسجيل الخروج' : 'Logout',
            style: 'destructive',
            onPress: async () => {
              const { error } = await logout();
              if (error) {
                console.error('[ProfileScreen] Logout error:', error);
                Alert.alert(
                  language === 'ar' ? 'خطأ' : 'Error',
                  language === 'ar' ? 'فشل في تسجيل الخروج' : 'Failed to logout'
                );
              } else {
                navigation.navigate('Home');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('[ProfileScreen] Logout error:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ImageBackground 
          source={require('../assets/IQRA2background.png')} 
          style={styles.backgroundImage}
          imageStyle={{ opacity: 0.2 }}
        >
          <SafeAreaView style={styles.container}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground 
        source={require('../assets/IQRA2background.png')} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                hapticSelection();
                navigation.goBack();
              }}
            >
              <Image 
                source={language === 'ar' ? require('../assets/IQRA2iconArabicoctagon.png') : require('../assets/IQRA2iconoctagon.png')} 
                style={styles.backButtonIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text variant="h2" style={styles.headerTitle}>
              {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
            </Text>
            <TouchableOpacity
              style={styles.renameButton}
              onPress={() => {
                hapticSelection();
                // Show input dialog for display name
                Alert.prompt(
                  language === 'ar' ? 'تغيير اسم العرض' : 'Change Display Name',
                  language === 'ar' ? 'أدخل اسم العرض الجديد' : 'Enter new display name',
                  [
                    {
                      text: language === 'ar' ? 'إلغاء' : 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: language === 'ar' ? 'حفظ' : 'Save',
                      onPress: (newDisplayName) => {
                        if (newDisplayName && newDisplayName.trim()) {
                          setDisplayName(newDisplayName.trim());
                          saveDisplayName(newDisplayName.trim());
                        }
                      },
                    },
                  ],
                  'plain-text',
                  displayName || ''
                );
              }}
            >
              <Image 
                source={require('../assets/app_icons/rename.png')} 
                style={styles.renameIcon}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Profile Card */}
            <Card style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <TouchableOpacity 
                    style={[styles.avatar, { backgroundColor: backgroundColor }]}
                    onPress={() => {
                      hapticSelection();
                      setShowLetterPicker(true);
                    }}
                  >
                    <Text style={[styles.avatarLetter, { color: letterColor }]}>{profileLetter}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.profileInfo}>
                  <Text variant="h3" style={styles.profileName}>
                    {displayName || username || (language === 'ar' ? 'مستخدم' : 'User')}
                  </Text>
                  <Text variant="body2" style={styles.profileEmail}>
                    {email}
                  </Text>
                </View>
              </View>

              {/* Profile Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text variant="h3" style={styles.statNumber}>
                    {stats.totalHasanat.toLocaleString()}
                  </Text>
                  <Text variant="body2" style={styles.statLabel}>
                    {language === 'ar' ? 'إجمالي الحسنات' : 'Total Hasanat'}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text variant="h3" style={styles.statNumber}>
                    {stats.memorizedAyaat}
                  </Text>
                  <Text variant="body2" style={styles.statLabel}>
                    {language === 'ar' ? 'الآيات المحفوظة' : 'Memorized Ayaat'}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text variant="h3" style={styles.statNumber}>
                    {stats.streak}
                  </Text>
                  <Text variant="body2" style={styles.statLabel}>
                    {language === 'ar' ? 'السلسلة' : 'Streak'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Edit Profile Card */}
            <Card style={styles.editCard}>
              <Text variant="h3" style={styles.sectionTitle}>
                {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </Text>



              {/* Username */}
              <View style={styles.inputGroup}>
                <Text variant="body1" style={styles.inputLabel}>
                  {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, textAlign: 'center' }]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                    placeholderTextColor="#999"
                    editable={!saving}
                    autoCapitalize="none"
                  />
                  <Button
                    title={language === 'ar' ? 'حفظ' : 'Save'}
                    onPress={saveUsername}
                    disabled={saving}
                    style={styles.saveButton}
                    size="small"
                  />
                </View>
              </View>
            </Card>

            {/* Account Actions */}
            <Card style={styles.actionsCard}>
              <Text variant="h3" style={styles.sectionTitle}>
                {language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.logoutButton,
                  isLogoutPressed && styles.logoutButtonPressed
                ]}
                onPress={handleLogout}
                onPressIn={() => {
                  hapticSelection();
                  setIsLogoutPressed(true);
                }}
                onPressOut={() => setIsLogoutPressed(false)}
              >
                <Text style={[
                  styles.logoutButtonText,
                  isLogoutPressed && { color: '#000000', fontWeight: 'bold' }
                ]}>
                  {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </Card>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
      
      {/* Letter Picker Modal */}
      <Modal
        visible={showLetterPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLetterPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
        >
          <View style={styles.letterPickerContainer}>
            <View style={styles.letterPickerHeader}>
              <Text style={styles.letterPickerTitle}>
                {language === 'ar' ? 'تخصيص صورة الملف الشخصي' : 'Customize Profile Pic'}
              </Text>
              <View style={styles.titleUnderline} />
            </View>
            
            {/* Preview Box */}
            <View style={styles.previewContainer}>
              <View style={[styles.previewAvatar, { backgroundColor: backgroundColor }]}>
                <Text style={[styles.previewLetter, { color: letterColor }]}>{profileLetter}</Text>
              </View>
            </View>
            
            {/* Divider */}
            <View style={styles.sectionDivider} />
            
            {/* Letter Selection - Horizontal Scrollable Strip */}
            <View style={styles.letterSectionContainer}>
              <Text style={styles.sectionLabel}>
                {language === 'ar' ? 'اختر الحرف' : 'Choose Letter'}
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.lettersScrollContainer}
                ref={letterScrollRef}
                onScroll={(event) => {
                  const scrollX = event.nativeEvent.contentOffset.x;
                  const maxScrollX = event.nativeEvent.contentSize.width - event.nativeEvent.layoutMeasurement.width;
                  const scrollProgress = maxScrollX > 0 ? scrollX / maxScrollX : 0;
                  setScrollProgress(scrollProgress);
                }}
                scrollEventThrottle={16}
              >
                {arabicLetters.map((letter, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.letterOption,
                      profileLetter === letter && styles.letterOptionSelected
                    ]}
                    onPress={() => {
                      hapticSelection();
                      setProfileLetter(letter);
                    }}
                  >
                    <Text style={[
                      styles.letterOptionText,
                      profileLetter === letter && styles.letterOptionSelected
                    ]}>
                      {letter}
                    </Text>
                  </TouchableOpacity>
                ))}
                              </ScrollView>
                
                {/* Scroll Indicator - Now underneath the letters */}
                <View style={styles.scrollIndicatorContainer}>
                  <View style={[styles.scrollIndicator, { 
                    left: `${scrollProgress * 70}%`
                  }]} />
                </View>
              </View>
              
              {/* Divider */}
            <View style={styles.sectionDivider} />
            
            {/* Choose Color Label */}
            <Text style={styles.sectionLabel}>
              {language === 'ar' ? 'اختر اللون' : 'Choose Color'}
            </Text>
            
            {/* Toggle Button for Letter/Background Colors */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  styles.toggleLeft,
                  !isBackgroundMode && styles.toggleActive
                ]}
                onPress={() => setIsBackgroundMode(false)}
              >
                <Text style={[
                  styles.toggleText,
                  !isBackgroundMode && styles.toggleTextActive
                ]}>
                  {language === 'ar' ? 'الحرف' : 'Letter'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  styles.toggleRight,
                  isBackgroundMode && styles.toggleActive
                ]}
                onPress={() => setIsBackgroundMode(true)}
              >
                <Text style={[
                  styles.toggleText,
                  isBackgroundMode && styles.toggleTextActive
                ]}>
                  {language === 'ar' ? 'الخلفية' : 'Background'}
                </Text>
              </TouchableOpacity>
            </View>
            

            <View style={styles.colorGridContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorGridScrollContainer}
              >
                {generateColorSpectrum().map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorGridOption,
                      { backgroundColor: color },
                      (isBackgroundMode ? backgroundColor : letterColor) === color && styles.colorGridOptionSelected
                    ]}
                    onPress={() => {
                      hapticSelection();
                      if (isBackgroundMode) {
                        setBackgroundColor(color);
                      } else {
                        setLetterColor(color);
                      }
                    }}
                  />
                ))}
              </ScrollView>
            </View>
            


            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLetterPicker(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  saveProfileColors(letterColor, backgroundColor);
                  setShowLetterPicker(false);
                }}
              >
                <Text style={styles.saveButtonText}>
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#F5E6C8',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  backButtonIcon: {
    width: 48,
    height: 48,
  },
  headerTitle: {
    color: '#F5E6C8',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same as back button to center the title
  },
  renameButton: {
    padding: 8,
    borderRadius: 25,
    backgroundColor: 'rgba(165,115,36,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(245, 230, 200, 0.95)',
    borderRadius: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5E6C8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    padding: 8,
  },
  avatarLetter: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'KSAHeavy',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 42,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#3E2723',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(165,115,36,0.8)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(165,115,36,0.8)',
    marginHorizontal: 16,
  },
  editCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(245, 230, 200, 0.95)',
    borderRadius: 20,
  },
  sectionTitle: {
    color: '#3E2723',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#3E2723',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3E2723',
    marginRight: 12,
  },
  saveButton: {
    minWidth: 80,
    borderRadius: 20,
  },
  actionsCard: {
    marginBottom: 40,
    backgroundColor: 'rgba(245, 230, 200, 0.95)',
    borderRadius: 20,
  },
  logoutButton: {
    borderColor: '#E53E3E',
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonPressed: {
    backgroundColor: '#E53E3E',
    opacity: 1,
  },
  logoutButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterPickerContainer: {
    backgroundColor: 'rgba(245, 230, 200, 0.95)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
  },
  letterPickerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  letterPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E2723',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleUnderline: {
    width: '60%',
    height: 2,
    backgroundColor: '#999999',
    borderRadius: 1,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(165,115,36,0.8)',
  },
  previewLetter: {
    fontSize: 52,
    fontWeight: 'bold',
    fontFamily: 'KSAHeavy',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 52,
  },
  lettersScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  lettersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  letterOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(165,115,36,0.8)',
    marginHorizontal: 6,
  },
  letterOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  letterOptionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(165,115,36,0.8)',
    fontFamily: 'KSAHeavy',
  },
  letterOptionTextSelected: {
    color: '#FFFFFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    padding: 2,
    marginBottom: 20,
    alignSelf: 'center',
    width: '75%',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  toggleRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  toggleActive: {
    backgroundColor: 'rgba(165,115,36,0.8)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(165,115,36,0.3)',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  letterSectionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scrollIndicatorContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(165,115,36,0.2)',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  scrollIndicator: {
    height: '100%',
    width: '30%',
    backgroundColor: 'rgba(165,115,36,0.6)',
    borderRadius: 2,
    position: 'absolute',
    top: 0,
  },
  colorGridContainer: {
    marginBottom: 20,
    marginHorizontal: 20,
    height: 60, // Same height as section label + toggle container
  },
  colorGridScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  colorGridOption: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(165,115,36,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexShrink: 0, // Prevent shrinking in scroll view
  },
  colorGridOptionSelected: {
    borderWidth: 3,
    borderColor: 'rgba(165,115,36,0.8)',
    transform: [{ scale: 1.1 }],
  },
  colorSliderSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(165,115,36,0.8)',
  },
  colorOptionSelected: {
    borderColor: '#000000',
    borderWidth: 4,
  },

  doneButton: {
    backgroundColor: 'rgba(165,115,36,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 20,
    alignSelf: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
