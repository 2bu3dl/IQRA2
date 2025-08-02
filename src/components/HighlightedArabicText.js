import React, { useState, useEffect } from 'react';
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
  const [highlightedWords, setHighlightedWords] = useState(new Set());

  useEffect(() => {
    if (isPlaying && metadata && metadata.words) {
      const currentWord = metadata.words.find(word => 
        currentTime >= word.startTime && currentTime <= word.endTime
      );
      
      if (currentWord) {
        setHighlightedWords(prev => new Set([...prev, currentWord.index]));
      }
    } else if (!isPlaying) {
      // Clear all highlights when audio stops
      setHighlightedWords(new Set());
    }
  }, [currentTime, isPlaying, metadata]);

  const renderWords = () => {
    if (!metadata || !metadata.words) {
      // Fallback to regular text if no metadata - split into words for consistent layout
      const words = text.split(/\s+/).filter(word => word.length > 0);
      return words.map((word, index) => (
        <Text
          key={index}
          style={[
            styles.arabicWord,
            { 
              fontSize, 
              fontFamily: isBoldFont ? 'KFGQPC Uthman Taha Naskh Bold' : 'KFGQPC Uthman Taha Naskh',
              lineHeight: fontSize * 1.5,
              marginVertical: fontSize * 0.1
            }
          ]}
          allowFontScaling={false}
          lang="ar"
        >
          {word}
        </Text>
      ));
    }

    // For metadata text, also ensure consistent word-by-word layout
    return metadata.words.map((word, index) => (
      <Text
        key={index}
        style={[
          styles.arabicWord,
          { 
            fontSize, 
            fontFamily: isBoldFont ? 'KFGQPC Uthman Taha Naskh Bold' : 'KFGQPC Uthman Taha Naskh',
            lineHeight: fontSize * 1.5,
            marginVertical: fontSize * 0.1
          },
          highlightedWords.has(index) && styles.highlightedWord
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
      minHeight: Math.max(200, fontSize * 3)
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
    lineHeight: undefined,
  },
  highlightedWord: {
    color: '#FFA500',
    fontWeight: 'bold',
  },
});

export default HighlightedArabicText; 