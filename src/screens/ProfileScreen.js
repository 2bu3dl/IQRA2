import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { supabase } from '../utils/supabase';
import { hapticSelection } from '../utils/hapticFeedback';
import { validateUsername, validateDisplayName, logValidationAttempt } from '../utils/validation';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
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

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      if (user) {
        setEmail(user.email || '');

        // Get user profile from user_profiles table
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            setUsername(profile.username || '');
            setDisplayName(profile.display_name || '');
          } else {
            // Profile should be created automatically by trigger, but if it doesn't exist,
            // create it now
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                username: '',
                display_name: '',
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (createError) {
              console.error('[ProfileScreen] Error creating profile:', createError);
            } else {
              console.log('[ProfileScreen] Created new profile:', newProfile);
            }
          }

          if (error) {
            console.error('[ProfileScreen] Error loading profile:', error);
          }
        } catch (profileError) {
          console.error('[ProfileScreen] Profile query error:', profileError);
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
        // Get user stats from user_stats table
        const { data: userStats, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (userStats && !error) {
          setStats({
            totalHasanat: userStats.total_hasanat || 0,
            streak: userStats.current_streak || 0,
            totalAyaat: userStats.total_ayaat || 0,
            memorizedAyaat: userStats.memorized_ayaat || 0
          });
        }
      }
    } catch (error) {
      console.error('[ProfileScreen] Error loading stats:', error);
    }
  };

  const saveDisplayName = async () => {
    if (!user) return;

    // Validate display name
    const displayNameValidation = validateDisplayName(displayName);
    logValidationAttempt('displayName', displayName, displayNameValidation.isValid, 'profile');
    if (!displayNameValidation.isValid) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        displayNameValidation.error
      );
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          display_name: displayNameValidation.value,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
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
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('username', usernameValidation.value)
        .neq('user_id', user.id)
        .single();

      if (existingUser) {
        Alert.alert(
          language === 'ar' ? 'اسم المستخدم مأخوذ' : 'Username Taken',
          language === 'ar' ? 'اسم المستخدم هذا مأخوذ بالفعل' : 'This username is already taken'
        );
        return;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          username: usernameValidation.value,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
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
            <Text style={styles.loadingText}>Loading profile...</Text>
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
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color="#F5E6C8" 
              />
            </TouchableOpacity>
            <Text variant="h2" style={styles.headerTitle}>
              {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Profile Card */}
            <Card style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color={COLORS.primary} />
                  </View>
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
                    {stats.streak}
                  </Text>
                  <Text variant="body2" style={styles.statLabel}>
                    {language === 'ar' ? 'السلسلة' : 'Streak'}
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
              </View>
            </Card>

            {/* Edit Profile Card */}
            <Card style={styles.editCard}>
              <Text variant="h3" style={styles.sectionTitle}>
                {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </Text>

              {/* Display Name */}
              <View style={styles.inputGroup}>
                <Text variant="body1" style={styles.inputLabel}>
                  {language === 'ar' ? 'اسم العرض' : 'Display Name'}
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder={language === 'ar' ? 'أدخل اسم العرض' : 'Enter display name'}
                    placeholderTextColor="#999"
                    editable={!saving}
                  />
                  <Button
                    title={language === 'ar' ? 'حفظ' : 'Save'}
                    onPress={saveDisplayName}
                    disabled={saving}
                    style={styles.saveButton}
                    size="small"
                  />
                </View>
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text variant="body1" style={styles.inputLabel}>
                  {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
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

              <Button
                title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                onPress={handleLogout}
                variant="outline"
                style={styles.logoutButton}
              />
            </Card>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
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
    borderRadius: 20,
    backgroundColor: 'rgba(91, 127, 103, 0.3)',
  },
  headerTitle: {
    color: '#F5E6C8',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same as back button to center the title
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(245, 230, 200, 0.95)',
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
    borderTopColor: '#E0E0E0',
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
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  editCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(245, 230, 200, 0.95)',
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3E2723',
    marginRight: 12,
  },
  saveButton: {
    minWidth: 80,
  },
  actionsCard: {
    marginBottom: 40,
    backgroundColor: 'rgba(245, 230, 200, 0.95)',
  },
  logoutButton: {
    borderColor: '#E53E3E',
    borderWidth: 2,
  },
});

export default ProfileScreen;
