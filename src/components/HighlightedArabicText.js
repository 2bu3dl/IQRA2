import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';
// Removed debugging imports
// Removed unused imports since we're using exact source text

const HighlightedArabicText = ({ 
  text, 
  metadata, 
  isPlaying, 
  currentTime, 
  fontSize = 40, 
  isBoldFont = false,
  style = {} 
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Removed debugging

  useEffect(() => {
    if (isPlaying && metadata && metadata.words) {
      // Use metadata directly since it's now identical to source text
      const currentWord = metadata.words.find(word => 
        currentTime >= word.startTime && currentTime <= word.endTime
      );
      
      if (currentWord) {
        setHighlightedIndex(currentWord.index);
      }
    } else if (!isPlaying) {
      // Clear all highlights when audio stops
      setHighlightedIndex(-1);
    }
  }, [currentTime, isPlaying, metadata]);

    const wordsToRender = useMemo(() => {
    // Use metadata directly since it's now identical to source text
    const result = metadata && metadata.words ? metadata.words :
      text.split(/\s+/).filter(word => word.length > 0).map((word, index) => ({
        text: word,
        index
      }));

    return result;
  }, [metadata, text]);

  const baseWordStyle = useMemo(() => {
    const style = {
      fontSize: fontSize, 
      fontFamily: 'KFGQPC HAFS Uthmanic Script Regular', // Use the working font for all Arabic text
      lineHeight: fontSize * 1.5,
      marginVertical: fontSize * 0.1,
      textAlign: 'center',
      includeFontPadding: false,
    };
    
    return style;
  }, [fontSize, isBoldFont]);

  const renderWords = () => {
    return wordsToRender.map((word, index) => {
      const wordStyle = [
        styles.arabicWord, 
        baseWordStyle,
        { 
          color: isPlaying 
            ? (highlightedIndex === index ? 'rgba(165,115,36,0.8)' : '#5b7f67') // Orange for highlighted word, green for others when playing
            : '#333333' // Super dark gray when not playing
        }
      ];
      
      return (
        <Text
          key={`word-${index}-${word.text}`}
          style={wordStyle}
          allowFontScaling={false}
          lang="ar"
        >
          {word.text}
        </Text>
      );
    });
  };

  return (
    <View style={[styles.container, style, { 
      paddingVertical: Math.max(20, fontSize * 0.5),
      minHeight: Math.max(200, fontSize * 3),
      width: '100%'
    }]}>
      {renderWords()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    width: '100%',
  },
  arabicText: {
    color: '#5b7f67',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  arabicWord: {
    color: '#5b7f67',
    marginHorizontal: 2,
    marginVertical: 4,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  // Removed highlightedWord style - color is handled inline
});

export default HighlightedArabicText; 