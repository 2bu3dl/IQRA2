import React, { useMemo } from 'react';
import { Text } from 'react-native';

// Font configuration
const MAIN_FONT = 'KFGQPC HAFS Uthmanic Script';
const FALLBACK_FONT = undefined; // System fallback

// Missing characters set (will be populated from missing_chars.json)
// For now, we'll use the known missing characters
const missingSet = new Set([
  '\u0671', // Alef with Wasla Above
  '\u064E', // Fatha
  '\u06E1', // Small High Dotless Head Of Khah
  '\u064B', // Fathatan
  '\u064C', // Dammatan
  '\u064D', // Kasratan
  '\u064F', // Damma
  '\u0650', // Kasra
  '\u0651', // Shadda
  '\u0652', // Sukun
]);

// Check if a character is a combining mark
function isCombining(cp) {
  return (cp >= 0x0610 && cp <= 0x061A)  // Arabic combining marks
      || (cp >= 0x064B && cp <= 0x065F)  // Arabic diacritics
      || cp === 0x0670                   // Arabic letter superscript alef
      || (cp >= 0x06D6 && cp <= 0x06ED); // Arabic small marks
}

// Split text into graphemes (base + combining marks)
function splitGraphemes(text) {
  const chars = Array.from(text);
  const runs = [];
  let cur = chars[0] || '';
  
  for (let i = 1; i < chars.length; i++) {
    const cp = chars[i].codePointAt(0);
    if (isCombining(cp)) {
      cur += chars[i]; // attach diacritic to previous base
    } else {
      runs.push(cur);
      cur = chars[i];
    }
  }
  if (cur) runs.push(cur);
  return runs;
}

// Build runs with fallback information
function buildRunsWithFallback(text) {
  const bases = splitGraphemes(text); // each element is base+diacritics
  const runs = [];
  let buf = bases[0] || '';
  let bufFallback = [...buf].some(ch => missingSet.has(ch));
  
  for (let i = 1; i < bases.length; i++) {
    const item = bases[i];
    const needsFallback = [...item].some(ch => missingSet.has(ch));
    
    if (needsFallback === bufFallback) {
      buf += item;
    } else {
      runs.push({ text: buf, fallback: bufFallback });
      buf = item;
      bufFallback = needsFallback;
    }
  }
  if (buf) runs.push({ text: buf, fallback: bufFallback });
  return runs;
}

// Main component
export default function QuranTextFallback({ 
  text, 
  style, 
  fontSize = 36,
  mainFont = MAIN_FONT,
  fallbackFont = FALLBACK_FONT 
}) {
  const runs = useMemo(() => buildRunsWithFallback(text), [text]);
  
  return (
    <Text style={[{ fontFamily: mainFont, fontSize }, style]}>
      {runs.map((r, idx) => {
        if (!r.fallback) {
          return <Text key={idx}>{r.text}</Text>;
        }
        return (
          <Text key={idx} style={{ fontFamily: fallbackFont }}>
            {r.text}
          </Text>
        );
      })}
    </Text>
  );
}

// Utility function to check if text needs fallback
export function needsFallback(text) {
  return [...text].some(ch => missingSet.has(ch));
}

// Utility function to get missing characters in text
export function getMissingCharacters(text) {
  return [...text].filter(ch => missingSet.has(ch));
}
