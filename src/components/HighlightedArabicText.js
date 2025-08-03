import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';

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

  useEffect(() => {
    if (isPlaying && metadata && metadata.words) {
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
    return metadata && metadata.words ? metadata.words : 
      text.split(/\s+/).filter(word => word.length > 0).map((word, index) => ({ text: word, index }));
  }, [metadata, text]);

  const baseWordStyle = useMemo(() => ({
    fontSize: fontSize, 
    fontFamily: isBoldFont ? 'KFGQPC Uthman Taha Naskh Bold' : 'KFGQPC Uthman Taha Naskh',
    lineHeight: fontSize * 1.5,
    marginVertical: fontSize * 0.1,
    textAlign: 'center',
    includeFontPadding: false,
  }), [fontSize, isBoldFont]);

  const renderWords = () => {
    return wordsToRender.map((word, index) => (
      <Text
        key={`word-${index}-${word.text}`}
        style={[
          styles.arabicWord, 
          baseWordStyle,
          { color: highlightedIndex === index ? '#FFA500' : '#5b7f67' }
        ]}
        allowFontScaling={false}
        lang="ar"
      >
        {word.text}
      </Text>
    ));
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