import React, { useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Animated, Image } from 'react-native';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { addHasanat, updateMemorizedAyahs } from '../utils/store';
// import Svg, { Circle } from 'react-native-svg'; // Uncomment if using react-native-svg

const ayahs = [
  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
  'الرَّحْمَٰنِ الرَّحِيمِ',
  'مَالِكِ يَوْمِ الدِّينِ',
  'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
  'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
  'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
];

// Pre-defined letter counts for Hasanat calculation
const ayahLetterCounts = [19, 17, 12, 11, 19, 18, 43];

const MemorizationScreen = ({ route, navigation }) => {
  const { surah } = route.params;
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isTextHidden, setIsTextHidden] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const sessionHasanat = useRef(0);
  const rewardTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateFlashcard = (toValue) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: toValue === 1 ? 1 : 0.95,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRevealToggle = () => {
    animateFlashcard(isTextHidden ? 1 : 0.5);
    setTimeout(() => {
      setIsTextHidden((prev) => !prev);
      animateFlashcard(isTextHidden ? 1 : 0.5);
    }, 200);
  };

  const handleNext = async () => {
    // Calculate Hasanat for this Ayah
    const hasanat = ayahLetterCounts[currentAyahIndex] * 10;
    sessionHasanat.current += hasanat;
    setRewardAmount(hasanat);
    setShowReward(true);
    await updateMemorizedAyahs(surah.name, currentAyahIndex);

    // Show reward popup for 2 seconds, then move to next Ayah or Home
    rewardTimeout.current = setTimeout(() => {
      setShowReward(false);
      if (currentAyahIndex < ayahs.length - 1) {
        setCurrentAyahIndex(currentAyahIndex + 1);
        setIsTextHidden(true);
      } else {
        // Add session Hasanat to totals and go Home
        addHasanat(sessionHasanat.current);
        sessionHasanat.current = 0;
        navigation.navigate('Home');
      }
    }, 2000);
  };

  const handlePrevious = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(currentAyahIndex - 1);
      setIsTextHidden(true);
    }
  };

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (rewardTimeout.current) clearTimeout(rewardTimeout.current);
    };
  }, []);

  // Reward modal animation
  const rewardScale = useRef(new Animated.Value(0.8)).current;
  React.useEffect(() => {
    if (showReward) {
      Animated.spring(rewardScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      rewardScale.setValue(0.8);
    }
  }, [showReward]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWithHome}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => {
            if (sessionHasanat.current > 0) {
              addHasanat(sessionHasanat.current);
              sessionHasanat.current = 0;
            }
            navigation.navigate('Home');
          }}
        >
          <Image source={require('../assets/logo.png')} style={styles.homeIcon} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text variant="h2" color="primary">{surah.name}</Text>
          <Text variant="body1">Ayah {currentAyahIndex + 1}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.flashcard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }] }>
          <Card variant="elevated" style={styles.card}>
            <Text
              variant="h2"
              style={[FONTS.arabic, styles.arabicText]}
              align="center">
              {isTextHidden ? '••••••••••••••••••••••••••••••••••••••••' : ayahs[currentAyahIndex]}
            </Text>
          </Card>
        </Animated.View>
        <Button
          title={isTextHidden ? 'Tap to Reveal' : 'Tap to Hide'}
          onPress={handleRevealToggle}
          style={styles.revealButton}
        />
        <View style={styles.navigation}>
          <Button
            title="Previous"
            onPress={handlePrevious}
            disabled={currentAyahIndex === 0 || showReward}
            style={styles.navButton}
          />
          <Button
            title={currentAyahIndex === ayahs.length - 1 ? 'Finish' : 'Next'}
            onPress={handleNext}
            disabled={showReward}
            style={styles.navButton}
          />
        </View>
      </View>

      {/* Reward Modal */}
      <Modal
        visible={showReward}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReward(false)}
      >
        <View style={styles.rewardModalOverlay}>
          <Animated.View style={[styles.rewardModalContent, { transform: [{ scale: rewardScale }] }] }>
            <Text variant="h2" color="primary">Masha'Allah</Text>
            <Text variant="body1">
              You've earned <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{rewardAmount}</Text> 7asanaat for this Ayah!
            </Text>
            <Button
              title={currentAyahIndex === ayahs.length - 1 ? 'Next Surah' : 'Next Ayah'}
              onPress={() => {
                setShowReward(false);
                if (currentAyahIndex < ayahs.length - 1) {
                  setCurrentAyahIndex(currentAyahIndex + 1);
                  setIsTextHidden(true);
                } else {
                  addHasanat(sessionHasanat.current);
                  sessionHasanat.current = 0;
                  navigation.navigate('Home');
                }
              }}
              style={{ marginTop: SIZES.large }}
            />
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerWithHome: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.large,
  },
  homeButton: {
    marginRight: SIZES.medium,
  },
  homeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: SIZES.medium,
    justifyContent: 'center',
  },
  flashcard: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: SIZES.extraLarge,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.accent,
    borderWidth: 1,
  },
  arabicText: {
    fontFamily: 'System',
    lineHeight: 40,
  },
  revealButton: {
    marginVertical: SIZES.medium,
    backgroundColor: COLORS.primary,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.large,
  },
  navButton: {
    flex: 1,
    marginHorizontal: SIZES.small,
  },
  rewardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.base,
    padding: SIZES.large,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default MemorizationScreen; 