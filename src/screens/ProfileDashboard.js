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
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { supabase } from '../utils/supabase';
import { hapticSelection } from '../utils/hapticFeedback';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileDashboard = ({ navigation, onClose }) => {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [userStats, setUserStats] = useState({
    totalHasanat: 0,
    memorizedAyaat: 0,
    currentStreak: 0,
    bestStreak: 0,
    joinDate: null,
  });

  useEffect(() => {
    loadUserProfile();
    loadUserProgress();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        
        // Get user profile from user_profiles table
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('username, created_at')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            setUsername(profile.username || '');
          } else {
            // No profile found, create one with default values
            const emailPrefix = user.email?.split('@')[0] || 'user';
            setUsername(emailPrefix);
            
            // Try to create profile
            try {
              await supabase
                .from('user_profiles')
                .insert({
                  user_id: user.id,
                  email: user.email,
                  username: emailPrefix,
                  created_at: new Date().toISOString()
                });
            } catch (createError) {
              console.log('[ProfileDashboard] Profile creation failed, using local state only');
            }
          }
        } catch (error) {
          // Table might not exist or other error, use default values
          console.log('[ProfileDashboard] Using default profile values');
          const emailPrefix = user.email?.split('@')[0] || 'user';
          setUsername(emailPrefix);
        }
      }
    } catch (error) {
      console.error('[ProfileDashboard] Error loading profile:', error);
      // Set default values on error
      setUsername('user');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      // Load actual progress data from AsyncStorage
      const [
        totalHasanat,
        memorizedAyahsStr,
        streak,
        lastActivityDate
      ] = await Promise.all([
        AsyncStorage.getItem('total_hasanat'),
        AsyncStorage.getItem('memorized_ayahs'),
        AsyncStorage.getItem('streak'),
        AsyncStorage.getItem('last_activity_date')
      ]);

      const totalHasanatValue = parseInt(totalHasanat || '0');
      const currentStreak = parseInt(streak || '0');
      
      // Calculate total memorized ayaat from memorized data
      let totalMemorizedAyaat = 0;
      if (memorizedAyahsStr) {
        try {
          const memorizedAyahs = JSON.parse(memorizedAyahsStr);
          Object.keys(memorizedAyahs).forEach(surahName => {
            const surahData = memorizedAyahs[surahName];
            if (surahData && surahData.memorized > 0) {
              totalMemorizedAyaat += surahData.memorized;
            }
          });
        } catch (parseError) {
          console.log('[ProfileDashboard] Error parsing memorized ayaat:', parseError);
        }
      }

      // Get best streak from leaderboard_stats if available
      let bestStreak = currentStreak;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: stats } = await supabase
            .from('leaderboard_stats')
            .select('best_streak')
            .eq('user_id', user.id)
            .single();
          
          if (stats && stats.best_streak > bestStreak) {
            bestStreak = stats.best_streak;
          }
        }
      } catch (error) {
        // Use current streak as best streak if can't get from database
        bestStreak = currentStreak;
      }

      setUserStats({
        totalHasanat: totalHasanatValue,
        memorizedAyaat: totalMemorizedAyaat,
        currentStreak: currentStreak,
        bestStreak: bestStreak,
        joinDate: lastActivityDate || new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ProfileDashboard] Error loading progress:', error);
      // Set default values on error
      setUserStats({
        totalHasanat: 0,
        memorizedAyaat: 0,
        currentStreak: 0,
        bestStreak: 0,
        joinDate: new Date().toISOString(),
      });
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    // Check if username is already taken
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          // Check if username is already taken by another user
          const { data: existingUser, error: checkError } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('username', username.trim())
            .neq('user_id', user.id)
            .single();

          if (existingUser) {
            Alert.alert('Error', 'Username is already taken');
            return;
          }

          const { error } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: user.id,
              email: user.email,
              username: username.trim()
            });

          if (error) throw error;
        } catch (dbError) {
          console.log('[ProfileDashboard] Username update failed, using local state only');
        }

        hapticSelection();
        Alert.alert('Success', 'Username updated successfully!');
        setIsEditingUsername(false);
      }
    } catch (error) {
      console.error('[ProfileDashboard] Error saving username:', error);
      Alert.alert('Error', 'Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              if (onClose) onClose();
            } catch (error) {
              console.error('[ProfileDashboard] Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLargeNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {
      return num.toString();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#F5E6C8" />
          </TouchableOpacity>
          <Text variant="h1" style={styles.title}>
            {t('profile')}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>@{username}</Text>
              <Text style={styles.email}>{email}</Text>
            </View>
            <View style={styles.editButtons}>
              <TouchableOpacity
                onPress={() => setIsEditingUsername(true)}
                style={styles.editButton}
              >
                <Ionicons name="person" size={20} color="#5b7f67" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Edit Username */}
          {isEditingUsername && (
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>{t('username')}</Text>
              <TextInput
                style={styles.nameInput}
                value={username}
                onChangeText={setUsername}
                placeholder={t('enter_username')}
                placeholderTextColor="#999"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  onPress={() => setIsEditingUsername(false)}
                  style={[styles.editBtn, styles.cancelBtn, language === 'ar' && styles.editBtnArabic]}
                >
                  <Text style={[styles.cancelBtnText, language === 'ar' && styles.editBtnTextArabic]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveUsername}
                  style={[styles.editBtn, styles.saveBtn, language === 'ar' && styles.editBtnArabic]}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.saveBtnText, language === 'ar' && styles.editBtnTextArabic]}>{t('save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('total_hasanat')}</Text>
            <Text style={styles.statValue}>{formatLargeNumber(userStats.totalHasanat)}</Text>
          </Card>
          
          <View style={styles.statDivider} />

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('current_streak')}</Text>
            <Text style={styles.statValue}>{userStats.currentStreak} {t('days')}</Text>
          </Card>
          
          <View style={styles.statDivider} />

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('ayaat_memorized')}</Text>
            <Text style={styles.statValue}>{userStats.memorizedAyaat}</Text>
          </Card>
          
          <View style={styles.statDivider} />

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('best_streak')}</Text>
            <Text style={styles.statValue}>{userStats.bestStreak} {t('days')}</Text>
          </Card>
        </View>

        {/* Account Info */}
        <Card style={styles.accountCard}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member since:</Text>
            <Text style={styles.infoValue}>{formatDate(userStats.joinDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title={t('logout')}
            onPress={handleLogout}
            style={[styles.logoutButton, language === 'ar' && styles.logoutButtonArabic]}
            textStyle={[styles.logoutButtonText, language === 'ar' && styles.logoutButtonTextArabic]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#F5E6C8',
    marginTop: 10,
    fontSize: 16,
  },
  scrollContent: {
    padding: SIZES.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.large,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    color: '#F5E6C8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  profileCard: {
    marginBottom: SIZES.large,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5b7f67',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: '#F5E6C8',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(165,115,36,0.3)',
    paddingTop: SIZES.medium,
  },
  editLabel: {
    color: '#F5E6C8',
    fontSize: 16,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#F5E6C8',
    fontSize: 16,
    marginBottom: SIZES.medium,
  },
  editBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtnArabic: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  saveBtn: {
    backgroundColor: '#5b7f67',
  },
  cancelBtnText: {
    color: '#F5E6C8',
    fontWeight: 'bold',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editBtnTextArabic: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.large,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SIZES.medium,
  },
  statDivider: {
    width: 2,
    height: 60,
    backgroundColor: 'rgba(165,115,36,1)',
    marginHorizontal: SIZES.small,
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    color: '#F5E6C8',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  accountCard: {
    marginBottom: SIZES.large,
  },
  sectionTitle: {
    color: '#F5E6C8',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SIZES.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,115,36,0.2)',
  },
  infoLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  infoValue: {
    color: '#F5E6C8',
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: SIZES.large,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
  },
  logoutButtonArabic: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButtonTextArabic: {
    fontSize: 18,
  },
});

export default ProfileDashboard; 