import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, SafeAreaView, Image, Alert, ScrollView } from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Rect, Defs, Mask, Circle, G } from 'react-native-svg';
import { hapticSelection } from '../utils/hapticFeedback';

// Static index that returns the required image for a given page number
const getPageImage = require('../assets/mushaf_pages/index.js').default;
const getCoords = require('../assets/quran-ayah-coords-main/glyph_coords/index.js').default;

export default function MushafScreen({ navigation, route }) {
  const initialPage = route?.params?.pageNumber || 1;
  const [page, setPage] = useState(Math.min(604, Math.max(1, initialPage)));
  const [isHideMode, setIsHideMode] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hiddenLines, setHiddenLines] = useState(new Set());
  const [isHolding, setIsHolding] = useState(false);
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);

  // Surah data for dropdown
  const surahs = [
    { number: 1, name: 'Al-Fatiha', nameAr: 'الفاتحة', startPage: 1 },
    { number: 2, name: 'Al-Baqarah', nameAr: 'البقرة', startPage: 2 },
    { number: 3, name: 'Ali Imran', nameAr: 'آل عمران', startPage: 50 },
    { number: 4, name: 'An-Nisa', nameAr: 'النساء', startPage: 77 },
    { number: 5, name: 'Al-Maidah', nameAr: 'المائدة', startPage: 106 },
    { number: 6, name: 'Al-Anam', nameAr: 'الأنعام', startPage: 128 },
    { number: 7, name: 'Al-Araf', nameAr: 'الأعراف', startPage: 151 },
    { number: 8, name: 'Al-Anfal', nameAr: 'الأنفال', startPage: 177 },
    { number: 9, name: 'At-Tawbah', nameAr: 'التوبة', startPage: 187 },
    { number: 10, name: 'Yunus', nameAr: 'يونس', startPage: 208 },
    { number: 11, name: 'Hud', nameAr: 'هود', startPage: 221 },
    { number: 12, name: 'Yusuf', nameAr: 'يوسف', startPage: 235 },
    { number: 13, name: 'Ar-Rad', nameAr: 'الرعد', startPage: 249 },
    { number: 14, name: 'Ibrahim', nameAr: 'إبراهيم', startPage: 255 },
    { number: 15, name: 'Al-Hijr', nameAr: 'الحجر', startPage: 262 },
    { number: 16, name: 'An-Nahl', nameAr: 'النحل', startPage: 267 },
    { number: 17, name: 'Al-Isra', nameAr: 'الإسراء', startPage: 282 },
    { number: 18, name: 'Al-Kahf', nameAr: 'الكهف', startPage: 293 },
    { number: 19, name: 'Maryam', nameAr: 'مريم', startPage: 305 },
    { number: 20, name: 'Taha', nameAr: 'طه', startPage: 312 },
    { number: 21, name: 'Al-Anbiya', nameAr: 'الأنبياء', startPage: 322 },
    { number: 22, name: 'Al-Hajj', nameAr: 'الحج', startPage: 332 },
    { number: 23, name: 'Al-Muminun', nameAr: 'المؤمنون', startPage: 342 },
    { number: 24, name: 'An-Nur', nameAr: 'النور', startPage: 350 },
    { number: 25, name: 'Al-Furqan', nameAr: 'الفرقان', startPage: 359 },
    { number: 26, name: 'Ash-Shuara', nameAr: 'الشعراء', startPage: 367 },
    { number: 27, name: 'An-Naml', nameAr: 'النمل', startPage: 377 },
    { number: 28, name: 'Al-Qasas', nameAr: 'القصص', startPage: 385 },
    { number: 29, name: 'Al-Ankabut', nameAr: 'العنكبوت', startPage: 396 },
    { number: 30, name: 'Ar-Rum', nameAr: 'الروم', startPage: 404 },
    { number: 31, name: 'Luqman', nameAr: 'لقمان', startPage: 411 },
    { number: 32, name: 'As-Sajdah', nameAr: 'السجدة', startPage: 415 },
    { number: 33, name: 'Al-Ahzab', nameAr: 'الأحزاب', startPage: 418 },
    { number: 34, name: 'Saba', nameAr: 'سبأ', startPage: 428 },
    { number: 35, name: 'Fatir', nameAr: 'فاطر', startPage: 434 },
    { number: 36, name: 'Ya-Sin', nameAr: 'يس', startPage: 440 },
    { number: 37, name: 'As-Saffat', nameAr: 'الصافات', startPage: 446 },
    { number: 38, name: 'Sad', nameAr: 'ص', startPage: 453 },
    { number: 39, name: 'Az-Zumar', nameAr: 'الزمر', startPage: 458 },
    { number: 40, name: 'Ghafir', nameAr: 'غافر', startPage: 467 },
    { number: 41, name: 'Fussilat', nameAr: 'فصلت', startPage: 477 },
    { number: 42, name: 'Ash-Shura', nameAr: 'الشورى', startPage: 483 },
    { number: 43, name: 'Az-Zukhruf', nameAr: 'الزخرف', startPage: 489 },
    { number: 44, name: 'Ad-Dukhan', nameAr: 'الدخان', startPage: 496 },
    { number: 45, name: 'Al-Jathiyah', nameAr: 'الجاثية', startPage: 499 },
    { number: 46, name: 'Al-Ahqaf', nameAr: 'الأحقاف', startPage: 502 },
    { number: 47, name: 'Muhammad', nameAr: 'محمد', startPage: 507 },
    { number: 48, name: 'Al-Fath', nameAr: 'الفتح', startPage: 511 },
    { number: 49, name: 'Al-Hujurat', nameAr: 'الحجرات', startPage: 515 },
    { number: 50, name: 'Qaf', nameAr: 'ق', startPage: 518 },
    { number: 51, name: 'Adh-Dhariyat', nameAr: 'الذاريات', startPage: 520 },
    { number: 52, name: 'At-Tur', nameAr: 'الطور', startPage: 523 },
    { number: 53, name: 'An-Najm', nameAr: 'النجم', startPage: 526 },
    { number: 54, name: 'Al-Qamar', nameAr: 'القمر', startPage: 528 },
    { number: 55, name: 'Ar-Rahman', nameAr: 'الرحمن', startPage: 531 },
    { number: 56, name: 'Al-Waqiah', nameAr: 'الواقعة', startPage: 534 },
    { number: 57, name: 'Al-Hadid', nameAr: 'الحديد', startPage: 537 },
    { number: 58, name: 'Al-Mujadila', nameAr: 'المجادلة', startPage: 542 },
    { number: 59, name: 'Al-Hashr', nameAr: 'الحشر', startPage: 545 },
    { number: 60, name: 'Al-Mumtahanah', nameAr: 'الممتحنة', startPage: 549 },
    { number: 61, name: 'As-Saff', nameAr: 'الصف', startPage: 551 },
    { number: 62, name: 'Al-Jumuah', nameAr: 'الجمعة', startPage: 553 },
    { number: 63, name: 'Al-Munafiqun', nameAr: 'المنافقون', startPage: 554 },
    { number: 64, name: 'At-Taghabun', nameAr: 'التغابن', startPage: 556 },
    { number: 65, name: 'At-Talaq', nameAr: 'الطلاق', startPage: 558 },
    { number: 66, name: 'At-Tahrim', nameAr: 'التحريم', startPage: 560 },
    { number: 67, name: 'Al-Mulk', nameAr: 'الملك', startPage: 562 },
    { number: 68, name: 'Al-Qalam', nameAr: 'القلم', startPage: 564 },
    { number: 69, name: 'Al-Haqqah', nameAr: 'الحاقة', startPage: 566 },
    { number: 70, name: 'Al-Maarij', nameAr: 'المعارج', startPage: 568 },
    { number: 71, name: 'Nuh', nameAr: 'نوح', startPage: 570 },
    { number: 72, name: 'Al-Jinn', nameAr: 'الجن', startPage: 571 },
    { number: 73, name: 'Al-Muzzammil', nameAr: 'المزمل', startPage: 573 },
    { number: 74, name: 'Al-Muddaththir', nameAr: 'المدثر', startPage: 574 },
    { number: 75, name: 'Al-Qiyamah', nameAr: 'القيامة', startPage: 575 },
    { number: 76, name: 'Al-Insan', nameAr: 'الإنسان', startPage: 577 },
    { number: 77, name: 'Al-Mursalat', nameAr: 'المرسلات', startPage: 578 },
    { number: 78, name: 'An-Naba', nameAr: 'النبأ', startPage: 580 },
    { number: 79, name: 'An-Naziat', nameAr: 'النازعات', startPage: 582 },
    { number: 80, name: 'Abasa', nameAr: 'عبس', startPage: 583 },
    { number: 81, name: 'At-Takwir', nameAr: 'التكوير', startPage: 585 },
    { number: 82, name: 'Al-Infitar', nameAr: 'الانفطار', startPage: 586 },
    { number: 83, name: 'Al-Mutaffifin', nameAr: 'المطففين', startPage: 587 },
    { number: 84, name: 'Al-Inshiqaq', nameAr: 'الانشقاق', startPage: 587 },
    { number: 85, name: 'Al-Buruj', nameAr: 'البروج', startPage: 589 },
    { number: 86, name: 'At-Tariq', nameAr: 'الطارق', startPage: 590 },
    { number: 87, name: 'Al-Ala', nameAr: 'الأعلى', startPage: 591 },
    { number: 88, name: 'Al-Ghashiyah', nameAr: 'الغاشية', startPage: 591 },
    { number: 89, name: 'Al-Fajr', nameAr: 'الفجر', startPage: 592 },
    { number: 90, name: 'Al-Balad', nameAr: 'البلد', startPage: 593 },
    { number: 91, name: 'Ash-Shams', nameAr: 'الشمس', startPage: 594 },
    { number: 92, name: 'Al-Layl', nameAr: 'الليل', startPage: 594 },
    { number: 93, name: 'Ad-Duha', nameAr: 'الضحى', startPage: 595 },
    { number: 94, name: 'Ash-Sharh', nameAr: 'الشرح', startPage: 595 },
    { number: 95, name: 'At-Tin', nameAr: 'التين', startPage: 596 },
    { number: 96, name: 'Al-Alaq', nameAr: 'العلق', startPage: 596 },
    { number: 97, name: 'Al-Qadr', nameAr: 'القدر', startPage: 597 },
    { number: 98, name: 'Al-Bayyinah', nameAr: 'البينة', startPage: 597 },
    { number: 99, name: 'Az-Zalzalah', nameAr: 'الزلزلة', startPage: 598 },
    { number: 100, name: 'Al-Adiyat', nameAr: 'العاديات', startPage: 598 },
    { number: 101, name: 'Al-Qariah', nameAr: 'القارعة', startPage: 599 },
    { number: 102, name: 'At-Takathur', nameAr: 'التكاثر', startPage: 599 },
    { number: 103, name: 'Al-Asr', nameAr: 'العصر', startPage: 600 },
    { number: 104, name: 'Al-Humazah', nameAr: 'الهمزة', startPage: 600 },
    { number: 105, name: 'Al-Fil', nameAr: 'الفيل', startPage: 600 },
    { number: 106, name: 'Quraysh', nameAr: 'قريش', startPage: 601 },
    { number: 107, name: 'Al-Maun', nameAr: 'الماعون', startPage: 601 },
    { number: 108, name: 'Al-Kawthar', nameAr: 'الكوثر', startPage: 601 },
    { number: 109, name: 'Al-Kafirun', nameAr: 'الكافرون', startPage: 602 },
    { number: 110, name: 'An-Nasr', nameAr: 'النصر', startPage: 602 },
    { number: 111, name: 'Al-Masad', nameAr: 'المسد', startPage: 602 },
    { number: 112, name: 'Al-Ikhlas', nameAr: 'الإخلاص', startPage: 603 },
    { number: 113, name: 'Al-Falaq', nameAr: 'الفلق', startPage: 603 },
    { number: 114, name: 'An-Nas', nameAr: 'الناس', startPage: 603 }
  ];

  // Some PDFs include a cover page. Shift images by +1 to align coords (page 1) with image 2.
  const imageSource = useMemo(() => getPageImage(Math.min(604, page + 1)), [page]);
  const coords = useMemo(() => getCoords(page) || [], [page]);
  const bounds = useMemo(() => {
    if (!coords || coords.length === 0) return null;
    
    // Enhanced analysis for better accuracy
    const lineGroups = new Map();
    const surahNumbers = new Set();
    
    // Group coordinates by line and analyze patterns
    for (const c of coords) {
      if (!lineGroups.has(c.line_number)) {
        lineGroups.set(c.line_number, []);
      }
      lineGroups.get(c.line_number).push(c);
      surahNumbers.add(c.surah_number);
    }
    
    const lines = Array.from(lineGroups.keys()).sort((a, b) => a - b);
    
    // Enhanced header detection with multiple criteria
    let contentStartLine = 1;
    if (lines.length > 3) {
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const lineNum = lines[i];
        const lineCoords = lineGroups.get(lineNum);
        
        // Multiple criteria for header detection
        const segmentCount = lineCoords.length;
        const hasMultipleAyahs = lineCoords.some(c => c.position > 1);
        const hasTypicalAyahPattern = segmentCount > 2;
        const avgSegmentWidth = lineCoords.reduce((sum, c) => sum + (c.max_x - c.min_x), 0) / segmentCount;
        const lineWidth = Math.max(...lineCoords.map(c => c.max_x)) - Math.min(...lineCoords.map(c => c.min_x));
        
        // Header indicators: few segments, no multiple ayahs, narrow segments
        const isLikelyHeader = segmentCount <= 2 && 
                              !hasMultipleAyahs && 
                              avgSegmentWidth < lineWidth * 0.3;
        
        if (!isLikelyHeader) {
          contentStartLine = lineNum;
          break;
        }
      }
    }
    
    // Calculate bounds with enhanced precision
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let includedLines = 0;
    
    for (const c of coords) {
      if (c.line_number >= contentStartLine) {
        if (c.min_x < minX) minX = c.min_x;
        if (c.min_y < minY) minY = c.min_y;
        if (c.max_x > maxX) maxX = c.max_x;
        if (c.max_y > maxY) maxY = c.max_y;
        includedLines++;
      }
    }
    
    // Enhanced fallback with better detection
    if (includedLines < 3 && lines.length > 3) {
      console.log(`Page ${page}: Too few lines included (${includedLines}), expanding to include more lines`);
      contentStartLine = Math.max(1, contentStartLine - 1);
      minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
      for (const c of coords) {
        if (c.line_number >= contentStartLine) {
          if (c.min_x < minX) minX = c.min_x;
          if (c.min_y < minY) minY = c.min_y;
          if (c.max_x > maxX) maxX = c.max_x;
          if (c.max_y > maxY) maxY = c.max_y;
        }
      }
    }
    
    // Precise padding calculation
    const contentHeight = maxY - minY;
    const padding = Math.round(contentHeight * 0.01); // 1% padding for precision
    const adjustedMinY = Math.max(0, minY - padding);
    const adjustedMaxY = maxY + padding;
    
    // Enhanced debug logging
    console.log(`Page ${page}: contentStartLine=${contentStartLine}, totalLines=${lines.length}, includedLines=${includedLines}`);
    console.log(`Bounds: (${minX},${adjustedMinY}) to (${maxX},${adjustedMaxY}), size=${maxX-minX}x${adjustedMaxY-adjustedMinY}`);
    
    return { 
      minX, 
      minY: adjustedMinY, 
      maxX, 
      maxY: adjustedMaxY, 
      width: maxX - minX, 
      height: adjustedMaxY - adjustedMinY,
      contentStartLine
    };
  }, [coords]);

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(604, p + 1));

  const handlePageNumberPress = () => {
    setShowSurahDropdown(!showSurahDropdown);
  };

  const handleSurahSelect = (surah) => {
    setPage(surah.startPage);
    setShowSurahDropdown(false);
  };

  const getCurrentSurah = () => {
    return surahs.find(surah => page >= surah.startPage && page < (surahs.find(s => s.number === surah.number + 1)?.startPage || 605)) || surahs[0];
  };

  const handleHideToggle = () => {
    setIsHideMode(!isHideMode);
  };

  const handleAudioToggle = () => {
    if (isRecording) {
      Alert.alert('Cannot Play Audio', 'Please stop the recording before playing audio recitation.');
      return;
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  const handleRecordToggle = () => {
    if (isAudioPlaying) {
      Alert.alert('Cannot Record', 'Please stop the audio recitation before starting a recording.');
      return;
    }
    setIsRecording(!isRecording);
  };

  const handleLineTap = useCallback((lineNumber) => {
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineNumber)) {
        newSet.delete(lineNumber);
      } else {
        newSet.add(lineNumber);
      }
      return newSet;
    });
  }, []);

  const handleLineSwipe = useCallback((lineNumber) => {
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      newSet.add(lineNumber);
      return newSet;
    });
  }, []);

  const handleLineHold = useCallback((lineNumber) => {
    setIsHolding(true);
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      newSet.delete(lineNumber);
      return newSet;
    });
  }, []);

  const handleLineRelease = useCallback(() => {
    setIsHolding(false);
  }, []);

  const onLayoutPage = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  const scaleAndOffsets = useMemo(() => {
    if (!bounds || !containerSize.width || !containerSize.height) return null;
    
    // Enhanced scaling with better precision
    const marginX = containerSize.width * 0.005; // 0.5% margin for precision
    const marginY = containerSize.height * 0.005; // 0.5% margin for precision
    const usableWidth = containerSize.width - (marginX * 2);
    const usableHeight = containerSize.height - (marginY * 2);
    
    // Calculate scale factors
    const scaleX = usableWidth / bounds.width;
    const scaleY = usableHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY); // maintain aspect ratio
    
    // Center the content with precise positioning
    const displayWidth = bounds.width * scale;
    const displayHeight = bounds.height * scale;
    const offsetX = marginX + (usableWidth - displayWidth) / 2;
    const offsetY = marginY + (usableHeight - displayHeight) / 2;
    
    // Enhanced debug logging
    console.log(`Scaling: scale=${scale.toFixed(4)}, offsetX=${offsetX.toFixed(1)}, offsetY=${offsetY.toFixed(1)}`);
    console.log(`Bounds: width=${bounds.width}, height=${bounds.height}, minX=${bounds.minX}, minY=${bounds.minY}`);
    console.log(`Container: width=${containerSize.width}, height=${containerSize.height}`);
    console.log(`Display: width=${displayWidth.toFixed(1)}, height=${displayHeight.toFixed(1)}`);
    
    return { scale, offsetX, offsetY };
  }, [bounds, containerSize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.7}>
          <Text style={styles.headerButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mushaf</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Page image - edge to edge with ayah overlays */}
      <View style={styles.pageContainer} onLayout={onLayoutPage}>
        <ImageBackground source={imageSource} style={styles.pageImage} resizeMode="contain">
          {isHideMode && coords && bounds && scaleAndOffsets && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {(() => {
                // Group by line and render a single masked rounded bar per line
                const lines = new Map();
                for (const seg of coords) {
                  // Only include lines that are part of the main content area
                  if (seg.line_number >= bounds.contentStartLine) {
                    const list = lines.get(seg.line_number) || [];
                    list.push(seg);
                    lines.set(seg.line_number, list);
                  }
                }
                const views = [];
                let i = 0;
                for (const [lineNum, segs] of Array.from(lines.entries()).sort((a,b)=>a[0]-b[0])) {
                  // Line bounds in source coords
                  let lineMinX = Infinity, lineMaxX = -Infinity, lineMinY = Infinity, lineMaxY = -Infinity;
                  for (const s of segs) {
                    if (s.min_x < lineMinX) lineMinX = s.min_x;
                    if (s.max_x > lineMaxX) lineMaxX = s.max_x;
                    if (s.min_y < lineMinY) lineMinY = s.min_y;
                    if (s.max_y > lineMaxY) lineMaxY = s.max_y;
                  }
                  // Scale into container
                  const L = Math.round(scaleAndOffsets.offsetX + (lineMinX - bounds.minX) * scaleAndOffsets.scale);
                  const T = Math.round(scaleAndOffsets.offsetY + (lineMinY - bounds.minY) * scaleAndOffsets.scale);
                  const W = Math.max(2, Math.round((lineMaxX - lineMinX) * scaleAndOffsets.scale));
                  const H = Math.max(2, Math.round((lineMaxY - lineMinY) * scaleAndOffsets.scale));
                  
                  // Debug logging for first few lines
                  if (lineNum <= 3) {
                    console.log(`Line ${lineNum}: L=${L}, T=${T}, W=${W}, H=${H}`);
                    console.log(`  Source: minX=${lineMinX}, maxX=${lineMaxX}, minY=${lineMinY}, maxY=${lineMaxY}`);
                    console.log(`  Bounds: minX=${bounds.minX}, minY=${bounds.minY}`);
                  }

                  // Thicker bars with minimal gaps between lines
                  const heightFactor = (page === 1 || page === 2) ? 1.07 : 1.010; // very thick bars, very thin gaps
                  let L2 = L;
                  let W2 = W;
                  let H2 = Math.max(1, Math.round(H * heightFactor));
                  let T2 = T + Math.round((H - H2) / 2);

                  // Check if line is hidden
                  const isLineHidden = hiddenLines.has(lineNum);
                  const shouldShow = isHolding || !isLineHidden;

                  if (shouldShow) {
                    // COMMENTED OUT: Gap logic for now
                    // const byAyah = new Map();
                    // for (const s of segs) {
                    //   const key = `${s.surah_number}:${s.ayah_number}`;
                    //   const curr = byAyah.get(key);
                    //   if (!curr || (s.position | 0) > (curr.position | 0)) byAyah.set(key, s);
                    // }
                    // const holes = Array.from(byAyah.values()).map(s => {
                    //   // ... hole calculation logic ...
                    // });

                    // Simple solid bar without holes for now
                    views.push(
                        <PanGestureHandler
                          key={`gesture-line-${lineNum}-${i++}`}
                          onHandlerStateChange={({ nativeEvent }) => {
                            if (nativeEvent.state === State.END) {
                              handleLineSwipe(lineNum);
                            }
                          }}
                          onGestureEvent={() => {}}
                        >
                          <TouchableOpacity
                            style={{
                              position: 'absolute',
                              left: L2,
                              top: T2,
                              width: W2,
                              height: H2,
                              backgroundColor: '#5b7f67',
                              borderRadius: Math.max(2, Math.round(H2 * 0.15)),
                            }}
                            onPress={() => handleLineTap(lineNum)}
                            onTouchStart={() => handleLineHold(lineNum)}
                            onTouchEnd={handleLineRelease}
                            activeOpacity={0.7}
                          />
                        </PanGestureHandler>
                    );
                  }
                }
                return views;
              })()}
            </View>
          )}
        </ImageBackground>
      </View>

      {/* Action buttons - hide, audio, record */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isHideMode && styles.actionButtonActive
          ]}
          onPress={() => {
            hapticSelection();
            handleHideToggle();
          }}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../assets/app_icons/display-frame.png')} 
            style={[
              styles.actionButtonIcon,
              { tintColor: isHideMode ? '#F5E6C8' : '#5b7f67' }
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            isAudioPlaying && styles.actionButtonActive
          ]}
          onPress={() => {
            hapticSelection();
            handleAudioToggle();
          }}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../assets/app_icons/audio.png')} 
            style={[
              styles.actionButtonIcon,
              { tintColor: isAudioPlaying ? '#F5E6C8' : '#5b7f67' }
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            isRecording && styles.actionButtonActive
          ]}
          onPress={() => {
            hapticSelection();
            handleRecordToggle();
          }}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../assets/app_icons/mic-off.png')} 
            style={[
              styles.actionButtonIcon,
              { tintColor: isRecording ? '#F5E6C8' : '#5b7f67' }
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

        {/* Page controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => { hapticSelection(); goPrev(); }} disabled={page <= 1} style={[styles.navBtn, page <= 1 && styles.navBtnDisabled]} activeOpacity={0.7}>
            <Text style={styles.navBtnText}>Prev</Text>
          </TouchableOpacity>
          
          <View style={styles.pageLabelContainer}>
            <TouchableOpacity onPress={() => { hapticSelection(); handlePageNumberPress(); }} style={styles.pageLabelButton} activeOpacity={0.7}>
              <Text style={styles.pageLabel}>Page {String(page)}</Text>
              <Text style={styles.surahLabel}>{getCurrentSurah().name}</Text>
            </TouchableOpacity>
            
            {showSurahDropdown && (
              <View style={styles.dropdownContainer}>
                <View style={styles.dropdown}>
                  <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={true}>
                    {surahs.map((surah) => (
                      <TouchableOpacity
                        key={surah.number}
                        style={[
                          styles.dropdownItem,
                          page >= surah.startPage && page < (surahs.find(s => s.number === surah.number + 1)?.startPage || 605) && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          hapticSelection();
                          handleSurahSelect(surah);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemNumber}>{surah.number}</Text>
                        <View style={styles.dropdownItemText}>
                          <Text style={styles.dropdownItemName}>{surah.name}</Text>
                          <Text style={styles.dropdownItemNameAr}>{surah.nameAr}</Text>
                        </View>
                        <Text style={styles.dropdownItemPage}>Page {surah.startPage}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
          
          <TouchableOpacity onPress={() => { hapticSelection(); goNext(); }} disabled={page >= 604} style={[styles.navBtn, page >= 604 && styles.navBtnDisabled]} activeOpacity={0.7}>
            <Text style={styles.navBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5F0' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    backgroundColor: '#F8F5F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0'
  },
  headerButton: { paddingHorizontal: 12, paddingVertical: 4 },
  headerButtonText: { fontSize: 28, color: '#5b7f67' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#5b7f67' },
  headerSpacer: { width: 44 },
  
  // Edge-to-edge page container
  pageContainer: { 
    flex: 1, 
    marginHorizontal: 0, // Remove horizontal margins for edge-to-edge
    marginVertical: 0
  },
  pageImage: { 
    flex: 1, 
    width: '100%',
    height: '100%'
  },
  
  // Action buttons container
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F8F5F0',
    borderTopWidth: 1,
    borderTopColor: '#E8DCC0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0'
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(91,127,103,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15
  },
  actionButtonActive: {
    backgroundColor: 'rgba(91,127,103,0.2)',
  },
  actionButtonIcon: {
    width: 24,
    height: 24,
  },
  
  // Page controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F5F0'
  },
  navBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(91,127,103,0.15)',
    borderRadius: 8
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: '#5b7f67', fontWeight: '600' },
  
  // Page label and dropdown
  pageLabelContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative'
  },
  pageLabelButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(91,127,103,0.1)',
    borderRadius: 8,
    minWidth: 120
  },
  pageLabel: { 
    color: '#8B7355', 
    fontWeight: '700', 
    fontSize: 16 
  },
  surahLabel: {
    color: '#5b7f67',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 2
  },
  
  // Dropdown styles
  dropdownContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginBottom: 8
  },
  dropdown: {
    backgroundColor: '#F8F5F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8DCC0',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  dropdownScrollView: {
    maxHeight: 280,
    paddingVertical: 8
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0'
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(91,127,103,0.1)'
  },
  dropdownItemNumber: {
    color: '#5b7f67',
    fontWeight: '700',
    fontSize: 14,
    width: 30,
    textAlign: 'center'
  },
  dropdownItemText: {
    flex: 1,
    marginLeft: 8
  },
  dropdownItemName: {
    color: '#8B7355',
    fontWeight: '600',
    fontSize: 14
  },
  dropdownItemNameAr: {
    color: '#5b7f67',
    fontSize: 12,
    marginTop: 1
  },
  dropdownItemPage: {
    color: '#8B7355',
    fontSize: 12,
    fontWeight: '500'
  },
});



