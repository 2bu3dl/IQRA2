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

const ProfileDashboard = ({ navigation, onClose }) => {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
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
    loadUserStats();
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
            .select('username, display_name, created_at')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            setUsername(profile.username || '');
            setDisplayName(profile.display_name || '');
          } else {
            // Profile should be created automatically by trigger, but if it doesn't exist,
            // we'll create it manually as a fallback
            const { error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                email: user.email,
                username: user.email?.split('@')[0] || 'user',
                display_name: user.email?.split('@')[0] || 'User'
              });

            if (!createError) {
              setUsername(user.email?.split('@')[0] || 'user');
              setDisplayName(user.email?.split('@')[0] || 'User');
            } else {
              console.error('[ProfileDashboard] Error creating profile:', createError);
              // Set default values
              setUsername(user.email?.split('@')[0] || 'user');
              setDisplayName(user.email?.split('@')[0] || 'User');
            }
          }
        } catch (error) {
          console.error('[ProfileDashboard] Error loading profile:', error);
          // Set default values even if database fails
          setUsername(user.email?.split('@')[0] || 'user');
          setDisplayName(user.email?.split('@')[0] || 'User');
        }
      }
    } catch (error) {
      console.error('[ProfileDashboard] Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user stats from leaderboard_stats table
        const { data: stats, error } = await supabase
          .from('leaderboard_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (stats) {
          setUserStats({
            totalHasanat: stats.total_hasanat || 0,
            memorizedAyaat: stats.total_ayaat_memorized || 0,
            currentStreak: stats.current_streak || 0,
            bestStreak: stats.best_streak || 0,
            joinDate: stats.last_activity || new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('[ProfileDashboard] Error loading stats:', error);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            email: user.email,
            display_name: displayName.trim()
          });

        if (error) throw error;

        hapticSelection();
        Alert.alert('Success', 'Display name updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('[ProfileDashboard] Error saving display name:', error);
      Alert.alert('Error', 'Failed to update display name');
    } finally {
      setSaving(false);
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
        <Text style={styles.loadingText}>Loading profile...</Text>
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
            Profile
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{displayName}</Text>
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
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={20} color="#5b7f67" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Edit Username */}
          {isEditingUsername && (
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Username:</Text>
              <TextInput
                style={styles.nameInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#999"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  onPress={() => setIsEditingUsername(false)}
                  style={[styles.editBtn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveUsername}
                  style={[styles.editBtn, styles.saveBtn]}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Edit Display Name */}
          {isEditing && (
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Display Name:</Text>
              <TextInput
                style={styles.nameInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter display name"
                placeholderTextColor="#999"
                maxLength={30}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  style={[styles.editBtn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveDisplayName}
                  style={[styles.editBtn, styles.saveBtn]}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Total Hasanat</Text>
            <Text style={styles.statValue}>{formatLargeNumber(userStats.totalHasanat)}</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Ayaat Memorized</Text>
            <Text style={styles.statValue}>{userStats.memorizedAyaat}</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{userStats.currentStreak} days</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Best Streak</Text>
            <Text style={styles.statValue}>{userStats.bestStreak} days</Text>
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
            title="Logout"
            onPress={handleLogout}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
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
  displayName: {
    color: '#F5E6C8',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: '#5b7f67',
    fontSize: 16,
    fontWeight: '500',
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
  editButtons: {
    flexDirection: 'row',
    gap: SIZES.small,
  },
  editBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.small,
    marginBottom: SIZES.large,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SIZES.medium,
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
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileDashboard; 