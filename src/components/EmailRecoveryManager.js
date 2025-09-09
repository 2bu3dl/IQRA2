import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import Button from './Button';
import Text from './Text';
import { COLORS } from '../utils/theme';

const EmailRecoveryManager = ({ userProfile, onUpdate }) => {
  const [email, setEmail] = useState(userProfile?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { addUserRecoveryEmail } = useAuth();
  const { t } = useLanguage();

  const handleSaveEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await addUserRecoveryEmail(email);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          'Email added for account recovery. Please check your email to verify it.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsEditing(false);
                onUpdate && onUpdate();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to add recovery email.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmail = () => {
    Alert.alert(
      'Remove Email',
      'Are you sure you want to remove your recovery email? You won\'t be able to reset your password if you forget it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await addUserRecoveryEmail(''); // Empty string removes email
              
              if (result.success) {
                setEmail('');
                Alert.alert('Success', 'Recovery email removed.');
                onUpdate && onUpdate();
              } else {
                Alert.alert('Error', result.error || 'Failed to remove recovery email.');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>
        Account Recovery
      </Text>
      
      <Text variant="body2" style={styles.description}>
        Add an email address to your account so you can reset your password if you forget it.
      </Text>

      {userProfile?.email ? (
        <View style={styles.emailContainer}>
          <View style={styles.emailInfo}>
            <Text variant="body1" style={styles.emailLabel}>
              Recovery Email:
            </Text>
            <Text variant="body1" style={styles.emailValue}>
              {userProfile.email}
            </Text>
            {userProfile.is_email_verified ? (
              <Text variant="body2" style={styles.verifiedText}>
                ✓ Verified
              </Text>
            ) : (
              <Text variant="body2" style={styles.unverifiedText}>
                ⚠ Not verified
              </Text>
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
              disabled={loading}
            >
              <Text style={styles.editButtonText}>Change Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveEmail}
              disabled={loading}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.noEmailContainer}>
          <Text variant="body2" style={styles.noEmailText}>
            No recovery email set. Add one to secure your account.
          </Text>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsEditing(true)}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>Add Recovery Email</Text>
          </TouchableOpacity>
        </View>
      )}

      {isEditing && (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.emailInput}
            placeholder="Enter email address"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.editButtonContainer}>
            <Button
              title={loading ? 'Saving...' : 'Save Email'}
              onPress={handleSaveEmail}
              style={styles.saveButton}
              disabled={loading}
            />
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                setEmail(userProfile?.email || '');
              }}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    color: '#F5E6C8',
    marginBottom: 8,
    fontFamily: 'Montserrat-Bold',
  },
  description: {
    color: '#CCCCCC',
    marginBottom: 16,
    fontFamily: 'Montserrat-Regular',
  },
  emailContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
  },
  emailInfo: {
    marginBottom: 12,
  },
  emailLabel: {
    color: '#CCCCCC',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 4,
  },
  emailValue: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  verifiedText: {
    color: '#4CAF50',
    fontFamily: 'Montserrat-Regular',
  },
  unverifiedText: {
    color: '#FF9800',
    fontFamily: 'Montserrat-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#33694e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  removeButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  removeButtonText: {
    color: '#FF6B6B',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  noEmailContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noEmailText: {
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Montserrat-Regular',
  },
  addButton: {
    backgroundColor: '#33694e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
  },
  editContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
  },
  editButtonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#33694e',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonText: {
    color: '#CCCCCC',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
  },
});

export default EmailRecoveryManager;
