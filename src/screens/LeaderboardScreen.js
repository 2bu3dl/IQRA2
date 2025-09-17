import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import { COLORS as BASE_COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Card from '../components/Card';
import { 
  getLeaderboardData, 
  formatLeaderboardData, 
  getUserRank,
  LEADERBOARD_TYPES,
  subscribeToLeaderboardUpdates
} from '../utils/leaderboardService';
import { supabase } from '../utils/supabase';
import { hapticSelection } from '../utils/hapticFeedback';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = { ...BASE_COLORS, primary: '#6BA368', accent: '#FFD700' };

const LeaderboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('memorization');
  const [activeSubtab, setActiveSubtab] = useState('total');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [error, setError] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [rankBannerPressed, setRankBannerPressed] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hasScrolledFromTop, setHasScrolledFromTop] = useState(false);
  const [showSpacing, setShowSpacing] = useState(true);
  const subscriptionRef = useRef(null);
  const flatListRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const tabs = [
    { id: 'memorization', title: language === 'ar' ? 'الحفظ' : 'Memorized' },
    { id: 'streak', title: language === 'ar' ? 'السلسلة' : 'Streak' },
    { id: 'hasanat', title: language === 'ar' ? 'الحسنات' : '7asanat' },
  ];



  const hasanatSubtabs = [
    { id: 'total', title: language === 'ar' ? 'المجموع' : 'Total' },
    { id: 'daily', title: language === 'ar' ? 'يومي' : 'Daily' },
    { id: 'weekly', title: language === 'ar' ? 'أسبوعي' : 'Weekly' },
    { id: 'monthly', title: language === 'ar' ? 'شهري' : 'Monthly' },
  ];

  const streakSubtabs = [
    { id: 'current', title: language === 'ar' ? 'الحالي' : 'Current' },
    { id: 'best', title: language === 'ar' ? 'الأفضل' : 'Best' },
  ];

  useEffect(() => {
    loadLeaderboardData();
    setupSubscription();
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [activeTab]);

  const loadLeaderboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      // Load leaderboard data and user rank in parallel
      const [leaderboardResult, rankResult] = await Promise.all([
        getLeaderboardData(activeTab, 50),
        user ? getUserRank(user.id, activeTab) : { success: false }
      ]);
      
      if (leaderboardResult.success) {
        const formattedData = formatLeaderboardData(leaderboardResult.data, activeTab);
        setLeaderboardData(formattedData);
      } else {
        setError(leaderboardResult.error);
        setLeaderboardData([]);
      }
      
      if (rankResult.success) {
        setUserRank(rankResult.rank);
      } else {
        setUserRank(null);
      }
    } catch (error) {
      console.error('[LeaderboardScreen] Error loading data:', error);
      setError(error.message);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };



  const setupSubscription = () => {
    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
    }
    
    // Set up new subscription for real-time updates
    subscriptionRef.current = subscribeToLeaderboardUpdates(activeTab, (newData) => {
      const formattedData = formatLeaderboardData(newData, activeTab);
      setLeaderboardData(formattedData);
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboardData(false);
  };

  const handleTabPress = (tabId) => {
    hapticSelection();
    setActiveTab(tabId);
    if (tabId === 'hasanat') {
      setActiveSubtab('total');
    } else if (tabId === 'streak') {
      setActiveSubtab('current');
    } else {
      setActiveSubtab('total');
    }
  };

  const handleSubtabPress = (subtabId) => {
    hapticSelection();
    setActiveSubtab(subtabId);
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return 'rgba(165,115,36,0.8)'; // App theme orange
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const renderTabButton = (tab, index) => {
    const isActive = activeTab === tab.id;
    const isFirst = index === 0;
    const isLast = index === tabs.length - 1;
    
    let wrapperStyle = styles.tabButtonWrapper;
    if (isFirst) wrapperStyle = styles.tabButtonWrapperFirst;
    if (isLast) wrapperStyle = styles.tabButtonWrapperLast;
    
    return (
      <View key={tab.id} style={wrapperStyle}>
        <TouchableOpacity
          style={[styles.tabButton, isActive && styles.activeTabButton]}
          onPress={() => handleTabPress(tab.id)}
        >
          <Text style={[styles.tabText, isActive && styles.activeTabText]}>
            {tab.title}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const isCurrentUser = user && item.userId === user.id;
    const isTopThree = item.rank <= 3;
    
    return (
      <View style={[
        styles.leaderboardItem,
        isCurrentUser && styles.currentUserItem,
        isTopThree && styles.topThreeItem
      ]}>
        <View style={styles.rankContainer}>
          {getRankIcon(item.rank) ? (
            <Text style={styles.rankEmoji}>{getRankIcon(item.rank)}</Text>
          ) : (
            <Text style={[styles.rankText, { color: getRankColor(item.rank) }]}>
              #{item.rank}
            </Text>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
              {item.name}
              {isCurrentUser && (
                <Text style={styles.youLabel}>
                  {' '}({language === 'ar' ? 'أنت' : 'You'})
                </Text>
              )}
            </Text>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile', { userId: item.userId })}
            >
              <View style={[styles.profilePic, { backgroundColor: item.backgroundColor }]}>
                <Text style={[styles.profilePicLetter, { color: item.letterColor }]}>
                  {item.profileLetter}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.userStats}>
            {typeof item.value === 'string' ? item.value : item.value.toLocaleString()} {item.label}
          </Text>
        </View>
        

      </View>
    );
  };

  const scrollToUserPosition = () => {
    if (!user || !userRank || !flatListRef.current) return;
    
    // Find user's position in the leaderboard data
    const userIndex = leaderboardData.findIndex(item => item.userId === user.id);
    if (userIndex >= 0) {
      flatListRef.current.scrollToIndex({
        index: userIndex,
        animated: true,
        viewPosition: 0.5, // Center the user's item
      });
    }
  };

  const renderUserRankBanner = () => {
    if (!user || !userRank) return null;
    
    return (
      <View style={styles.userRankBannerContainer}>
        <TouchableOpacity 
          style={[
            styles.userRankBanner,
            rankBannerPressed && styles.userRankBannerPressed
          ]}
          onPress={() => {
            hapticSelection();
            scrollToUserPosition();
          }}
          onPressIn={() => setRankBannerPressed(true)}
          onPressOut={() => setRankBannerPressed(false)}
          activeOpacity={1}
        >
          <View style={styles.userRankContent}>
            <Text style={styles.userRankTitle}>
              {language === 'ar' ? 'الترتيب العالمي:' : 'Global Rank:'}
            </Text>
            <Text style={styles.userRankValue}>
              #{userRank}
            </Text>
          </View>
        </TouchableOpacity>
        {showSpacing && <View style={styles.userRankBannerSpacing} />}
      </View>
    );
  };

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
              {language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboards'}
            </Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowInfoModal(true)}
            >
              <Image 
                source={require('../assets/app_icons/information.png')} 
                style={styles.infoIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Information Modal */}
          {showInfoModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {language === 'ar' ? 'معلومات لوحة المتصدرين' : 'Leaderboard Information'}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowInfoModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalText}>
                    {language === 'ar' 
                      ? 'لوحة المتصدرين تعرض إنجازات المستخدمين في تطبيق IQRA2. يمكنك تصفح أفضل المستخدمين في الحفظ، السلسلة، الحسنات، والإحصائيات الأسبوعية والشهرية.'
                      : 'The leaderboard displays user achievements in the IQRA2 app. You can browse the top users in memorization, streaks, hasanat, and weekly/monthly statistics.'
                    }
                  </Text>
                  <Text style={styles.modalText}>
                    {language === 'ar'
                      ? '• الحفظ: عدد الآيات المحفوظة\n• السلسلة: أيام المتابعة المتتالية\n• الحسنات: مجموع الحسنات المكتسبة\n• الأسبوعي/الشهري: الإحصائيات الزمنية'
                      : '• Memorization: Number of memorized verses\n• Streak: Consecutive days of practice\n• Hasanat: Total hasanat earned\n• Weekly/Monthly: Time-based statistics'
                    }
                  </Text>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Tab Bar */}
          <View style={styles.tabBarContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tabBar}
              contentContainerStyle={styles.tabBarContent}
            >
              {tabs.map(renderTabButton)}
            </ScrollView>
          </View>

          {/* Hasanat Subtabs */}
          {activeTab === 'hasanat' && (
            <View style={styles.subtabBarContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.subtabBar}
                contentContainerStyle={styles.subtabBarContent}
              >
                {hasanatSubtabs.map((subtab, index) => (
                  <TouchableOpacity
                    key={subtab.id}
                    style={[
                      styles.subtabButton,
                      activeSubtab === subtab.id && styles.activeSubtabButton
                    ]}
                    onPress={() => handleSubtabPress(subtab.id)}
                  >
                    <Text style={[
                      styles.subtabText,
                      activeSubtab === subtab.id && styles.activeSubtabText
                    ]}>
                      {subtab.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Streak Subtabs */}
          {activeTab === 'streak' && (
            <View style={styles.subtabBarContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.subtabBar}
                contentContainerStyle={styles.subtabBarContent}
              >
                {streakSubtabs.map((subtab, index) => (
                  <TouchableOpacity
                    key={subtab.id}
                    style={[
                      styles.subtabButton,
                      activeSubtab === subtab.id && styles.activeSubtabButton
                    ]}
                    onPress={() => handleSubtabPress(subtab.id)}
                  >
                    <Text style={[
                      styles.subtabText,
                      activeSubtab === subtab.id && styles.activeSubtabText
                    ]}>
                      {subtab.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* User Rank Banner */}
          {renderUserRankBanner()}

          {/* Leaderboard Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>
                {language === 'ar' ? 'جاري التحميل...' : 'Loading leaderboard...'}
              </Text>
            </View>
          ) : error ? (
            <Card style={styles.errorContainer}>
              <Ionicons name="warning" size={48} color="#FF6B6B" />
              <Text style={styles.errorTitle}>
                {language === 'ar' ? 'خطأ في التحميل' : 'Loading Error'}
              </Text>
              <Text style={styles.errorText}>
                {language === 'ar' ? 'لا يمكن تحميل البيانات حالياً' : 'Cannot load leaderboard data'}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadLeaderboardData()}>
                <Text style={styles.retryText}>
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <FlatList
              ref={flatListRef}
              data={leaderboardData}
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.userId}
              style={styles.leaderboardList}
              contentContainerStyle={styles.leaderboardContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                />
              }
              showsVerticalScrollIndicator={false}
              onScroll={(event) => {
                const offsetY = event.nativeEvent.contentOffset.y;
                
                // Clear any existing timeout
                if (scrollTimeoutRef.current) {
                  clearTimeout(scrollTimeoutRef.current);
                }
                
                // Immediately hide spacing when scrolling down
                if (offsetY > 0) {
                  setHasScrolledFromTop(true);
                  setShowSpacing(false);
                } else {
                  setHasScrolledFromTop(false);
                  // Debounce showing spacing when returning to top
                  scrollTimeoutRef.current = setTimeout(() => {
                    setShowSpacing(true);
                  }, 150);
                }
              }}
              onScrollBeginDrag={() => {
                setIsScrolling(true);
                setShowSpacing(false);
              }}
              onScrollEndDrag={() => setIsScrolling(false)}
              onMomentumScrollBegin={() => setIsScrolling(true)}
              onMomentumScrollEnd={() => {
                setIsScrolling(false);
                // Additional check when momentum ends
                if (!hasScrolledFromTop) {
                  scrollTimeoutRef.current = setTimeout(() => {
                    setShowSpacing(true);
                  }, 100);
                }
              }}
              onScrollToIndexFailed={(info) => {
                // Handle scroll to index failure gracefully
                console.log('Scroll to index failed:', info);
              }}
            />
          )}
          
          {/* Bottom Bar */}
          <View style={styles.bottomBar} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  backButtonIcon: {
    width: 48,
    height: 48,
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  infoIcon: {
    width: 24,
    height: 24,
    tintColor: 'rgba(165,115,36,0.8)', // App theme orange
  },

  headerTitle: {
    color: '#F5E6C8',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 32,
    flex: 1,
  },

  tabBarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tabBar: {
    paddingHorizontal: 0,
    marginBottom: 20,
    maxHeight: 80,
  },
  tabBarContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  subtabBarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  subtabBar: {
    paddingHorizontal: 0,
    marginBottom: 0,
    maxHeight: 50,
  },
  subtabBarContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  tabButtonWrapper: {
    height: 64,
    marginRight: 8,
  },
  tabButtonWrapperFirst: {
    height: 64,
    marginRight: 8,
  },
  tabButtonWrapperLast: {
    height: 64,
    marginRight: 8,
  },
  tabButton: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(91, 127, 103, 0.3)',
    height: 64,
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: '#F5E6C8',
  },
  tabText: {
    color: '#F5E6C8',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  activeTabText: {
    color: '#3E2723',
  },
  subtabButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(91, 127, 103, 0.2)',
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  activeSubtabButton: {
    backgroundColor: 'rgba(245, 230, 200, 0.8)',
  },
  subtabText: {
    color: '#F5E6C8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeSubtabText: {
    color: '#3E2723',
  },
  userRankBannerContainer: {
    marginHorizontal: 15,
    marginBottom: 0,
  },
  userRankBanner: {
    backgroundColor: 'rgba(165,115,36,0.8)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  userRankBannerPressed: {
    backgroundColor: '#5b7f67',
  },
  userRankBannerSpacing: {
    height: 0,
    backgroundColor: 'transparent',
  },
  userRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRankTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userRankValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#F5E6C8',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: 'rgba(245, 230, 200, 0.95)',
  },
  errorTitle: {
    color: '#3E2723',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardList: {
    flex: 1,
  },
  leaderboardContent: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 6,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 230, 200, 0.9)',
    borderRadius: 30,
    padding: 8,
    marginBottom: 8,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(165,115,36,0.3)',
  },
  currentUserItem: {
    backgroundColor: 'rgba(91, 127, 103, 0.2)',
    borderColor: '#5b7f67',
    borderWidth: 2,
  },
  topThreeItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    width: 50,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    paddingTop: 4,
  },
  rankEmoji: {
    fontSize: 32,
  },
  rankText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },

  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    color: '#3E2723',
    fontSize: 24,
    fontWeight: '600',
    flex: 1,
  },

  currentUserText: {
    color: '#5b7f67',
    fontWeight: 'bold',
  },
  youLabel: {
    color: '#5b7f67',
    fontWeight: 'normal',
    fontStyle: 'italic',
  },

  profileButton: {
    padding: 4,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profilePicLetter: {
    fontSize: 19,
    fontWeight: 'bold',
    fontFamily: 'KSAHeavy',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 19,
  },
  userStats: {
    color: '#666',
    fontSize: 18,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#F5E6C8',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E2723',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 300,
  },
  modalText: {
    fontSize: 16,
    color: '#3E2723',
    lineHeight: 24,
    marginBottom: 16,
  },
  crownContainer: {
    marginLeft: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 34,
    backgroundColor: 'rgba(91, 127, 103, 0.6)',
    borderRadius: 16,
    zIndex: 10,
  },
});

export default LeaderboardScreen;
