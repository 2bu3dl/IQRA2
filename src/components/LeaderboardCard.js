import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../utils/authContext';
import { getLeaderboardData, formatLeaderboardData, LEADERBOARD_TYPES } from '../utils/leaderboardService';
import Text from './Text';
import { COLORS, SIZES } from '../utils/theme';

const LeaderboardCard = ({ 
  type = LEADERBOARD_TYPES.MEMORIZATION, 
  title, 
  onPress, 
  limit = 3,
  showLoading = true,
  onPressIn,
  onPressOut,
  isPressed = false
}) => {
  // Determine colors based on type
  const getTitleColor = () => {
    return isPressed ? '#5b7f67' : 'rgba(165,115,36,0.8)'; // Green when pressed, orange by default
  };

  const getBackgroundColor = () => {
    return isPressed ? 'rgba(91,127,103,0.4)' : 'rgba(91,127,103,0.2)'; // Green background for all leaderboards
  };
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboardData();
  }, [type]);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getLeaderboardData(type, limit);
      
      if (result.success) {
        const formattedData = formatLeaderboardData(result.data, type);
        setLeaderboardData(formattedData);
      } else {
        setError(result.error);
        // Fallback to mock data if no real data
        setLeaderboardData(getMockData(type, limit));
      }
    } catch (error) {
      console.error('[LeaderboardCard] Error loading data:', error);
      setError(error.message);
      // Fallback to mock data
      setLeaderboardData(getMockData(type, limit));
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (type, limit) => {
    const mockUsers = [
      { rank: 1, name: 'Ahmad Al-Rashid', value: type === LEADERBOARD_TYPES.STREAK ? 45 : (type === LEADERBOARD_TYPES.HASANAT ? '2.3M' : 2456), label: type === LEADERBOARD_TYPES.STREAK ? 'days' : (type === LEADERBOARD_TYPES.HASANAT ? 'hasanat' : 'ayaat') },
      { rank: 2, name: 'Fatima Zahra', value: type === LEADERBOARD_TYPES.STREAK ? 38 : (type === LEADERBOARD_TYPES.HASANAT ? '1.9M' : 2103), label: type === LEADERBOARD_TYPES.STREAK ? 'days' : (type === LEADERBOARD_TYPES.HASANAT ? 'hasanat' : 'ayaat') },
      { rank: 3, name: 'Omar Khalil', value: type === LEADERBOARD_TYPES.STREAK ? 32 : (type === LEADERBOARD_TYPES.HASANAT ? '1.6M' : 1876), label: type === LEADERBOARD_TYPES.STREAK ? 'days' : (type === LEADERBOARD_TYPES.HASANAT ? 'hasanat' : 'ayaat') },
    ];
    
    return mockUsers.slice(0, limit);
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#F5E6C8';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (loading && showLoading) {
    return (
      <TouchableOpacity
        style={{
          flex: 0.48,
          backgroundColor: getBackgroundColor(),
          borderColor: isPressed ? '#5b7f67' : 'rgba(165,115,36,0.8)',
          borderWidth: 2,
          borderRadius: 20,
          padding: SIZES.small,
          shadowColor: '#000000',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.6,
          shadowRadius: 6,
          elevation: 8,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 160,
        }}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <ActivityIndicator size="small" color="#5b7f67" />
        <Text style={{ marginTop: 8, color: '#CCCCCC', fontSize: 12 }}>
          Loading...
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={{
        flex: 0.48,
        backgroundColor: getBackgroundColor(),
        borderColor: isPressed ? '#5b7f67' : 'rgba(165,115,36,0.8)',
        borderWidth: 2,
        borderRadius: 20,
        padding: SIZES.small,
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 8,
        minHeight: 160,
      }}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <View style={{ borderBottomWidth: 2, borderBottomColor: 'rgba(51,51,51,0.6)', paddingBottom: 4, marginBottom: 8 }}>
        <Text style={{
          textAlign: 'center',
          color: getTitleColor(),
          fontWeight: 'bold',
          fontSize: 16,
          transform: [{ translateY: isPressed ? 3 : 0 }],
          textShadowColor: '#000000',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
        }}>
          {title}
        </Text>
      </View>
      
      {/* Top 3 Preview */}
      <View style={{ marginBottom: SIZES.small }}>
        {leaderboardData.map((user, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
            borderBottomWidth: index < leaderboardData.length - 1 ? 1 : 0,
            borderBottomColor: 'rgba(165,115,36,0.3)',
          }}>
            <View style={{
              width: 20,
              alignItems: 'center',
              marginRight: 8,
            }}>
              <Text style={{ 
                fontSize: 12, 
                color: getRankColor(user.rank), 
                fontWeight: 'bold' 
              }}>
                {getRankIcon(user.rank)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: '#F5E6C8',
                fontWeight: 'bold',
                fontSize: 12,
              }}>
                {user.name}
              </Text>
              <Text style={{
                color: '#CCCCCC',
                fontSize: 10,
              }}>
                {user.value} {user.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
      
      {error && (
        <Text style={{
          color: '#FF6B6B',
          fontSize: 10,
          textAlign: 'center',
          fontStyle: 'italic',
        }}>
          Using demo data
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default LeaderboardCard; 