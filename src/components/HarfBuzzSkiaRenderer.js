import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Canvas, Path, useFont, Skia } from '@shopify/react-native-skia';

// Font asset - using the same font as the server
const FONT_ASSET = require('../assets/fonts/UthmanicHafs1Ver18.ttf');

// Server configuration
const SHAPING_SERVER = 'http://localhost:8000';

// Simple fetch helper for shaping
async function shapeOnServer(text, size = 48) {
  try {
    const response = await fetch(`${SHAPING_SERVER}/shape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        script: 'arab', 
        lang: 'ar', 
        size 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Shaping failed:', error);
    throw error;
  }
}

// HarfBuzz Skia Renderer Component
const HarfBuzzSkiaRenderer = ({ text, fontSize = 48, width = 400, height = 160 }) => {
  // Load the font for Skia
  const fontData = useFont(FONT_ASSET, fontSize);
  const [shaped, setShaped] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!text) return;
    
    setLoading(true);
    setError(null);
    
    shapeOnServer(text, fontSize)
      .then(data => {
        setShaped(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [text, fontSize]);

  const paths = useMemo(() => {
    if (!fontData || !shaped || !shaped.success) return [];
    
    const scale = fontData.getSize() / shaped.upem; // convert font units → pixels
    const glyphPaths = [];

    // Starting position (adjust as needed)
    let penX = 20; // Left margin
    let penY = height - 20; // Bottom margin (Arabic baseline)

    for (const glyph of shaped.glyphs) {
      // Get glyph outline as Path from the current font
      const path = fontData.getGlyphPath(glyph.gid);
      if (path) {
        // Position = pen + offsets (convert font units to px via "scale")
        const gx = penX + glyph.xOffset * scale;
        const gy = penY - glyph.yOffset * scale; // minus: HB y_offset is up in font units

        // Transform the path to the correct position
        const transform = Skia.Matrix();
        transform.translate(gx, gy);
        const transformedPath = path.copy();
        transformedPath.transform(transform);

        glyphPaths.push({ 
          path: transformedPath, 
          x: gx, 
          y: gy,
          gid: glyph.gid 
        });
      }

      // Advance the pen
      penX += glyph.xAdvance * scale;
      penY += glyph.yAdvance * scale;
    }
    
    return glyphPaths;
  }, [fontData, shaped, height]);

  if (loading) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.loadingText}>Shaping text...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorSubtext}>Make sure the shaping server is running</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Canvas style={styles.canvas}>
        {paths.map((glyph, index) => (
          <Path 
            key={`${glyph.gid}-${index}`} 
            path={glyph.path}
            color="#333333"
          />
        ))}
      </Canvas>
    </View>
  );
};

// Test component to demonstrate the HarfBuzz approach
const HarfBuzzTest = () => {
  const testTexts = [
    {
      name: "Original Problematic Text",
      text: "فَٱنصَبۡ",
      description: "Text with wasla that doesn't connect properly"
    },
    {
      name: "Simple Arabic Text",
      text: "السلام عليكم",
      description: "Basic Arabic text for comparison"
    },
    {
      name: "Complex Arabic Text",
      text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      description: "Bismillah with complex diacritics"
    },
    {
      name: "Wasla Test",
      text: "ٱللَّهِ",
      description: "Text starting with wasla"
    }
  ];

  const [selectedText, setSelectedText] = useState(testTexts[0]);

  return (
    <ScrollView style={styles.testContainer}>
      <Text style={styles.title}>HarfBuzz + Skia Arabic Rendering</Text>
      <Text style={styles.subtitle}>Professional Arabic text shaping solution</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🎯 How This Works:</Text>
        <Text style={styles.infoText}>• HarfBuzz shapes Arabic text on the server</Text>
        <Text style={styles.infoText}>• Returns precise glyph positions and IDs</Text>
        <Text style={styles.infoText}>• Skia renders glyphs with exact positioning</Text>
        <Text style={styles.infoText}>• No font fallback issues - uses actual font file</Text>
        <Text style={styles.infoText}>• Guarantees proper Arabic connections and ligatures</Text>
      </View>

      <View style={styles.serverInfoContainer}>
        <Text style={styles.serverInfoTitle}>🖥️ Server Status:</Text>
        <Text style={styles.serverInfoText}>Make sure the shaping server is running:</Text>
        <Text style={styles.serverInfoCode}>cd harfBuzz-server && python shape.py</Text>
        <Text style={styles.serverInfoText}>Server: {SHAPING_SERVER}</Text>
      </View>

      <View style={styles.textSelectorContainer}>
        <Text style={styles.selectorTitle}>Select Test Text:</Text>
        {testTexts.map((testText, index) => (
          <View key={index} style={styles.textOption}>
            <Text 
              style={[
                styles.textOptionButton,
                selectedText.name === testText.name && styles.textOptionButtonSelected
              ]}
              onPress={() => setSelectedText(testText)}
            >
              {testText.name}
            </Text>
            <Text style={styles.textOptionDescription}>{testText.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.rendererContainer}>
        <Text style={styles.rendererTitle}>HarfBuzz + Skia Rendering:</Text>
        <Text style={styles.rendererDescription}>{selectedText.description}</Text>
        <Text style={styles.rendererText}>Text: {selectedText.text}</Text>
        
        <HarfBuzzSkiaRenderer 
          text={selectedText.text}
          fontSize={48}
          width={350}
          height={120}
        />
      </View>

      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>🔬 Comparison with Standard Rendering:</Text>
        <Text style={styles.comparisonDescription}>
          Standard React Native Text (left) vs HarfBuzz + Skia (right)
        </Text>
        
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Standard Text</Text>
            <Text style={[styles.standardText, { fontFamily: 'KFGQPC HAFS Uthmanic Script' }]}>
              {selectedText.text}
            </Text>
          </View>
          
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>HarfBuzz + Skia</Text>
            <HarfBuzzSkiaRenderer 
              text={selectedText.text}
              fontSize={32}
              width={150}
              height={80}
            />
          </View>
        </View>
      </View>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>✅ Benefits of This Approach:</Text>
        <Text style={styles.benefitsText}>• Perfect Arabic text shaping with HarfBuzz</Text>
        <Text style={styles.benefitsText}>• Precise glyph positioning with Skia</Text>
        <Text style={styles.benefitsText}>• No font fallback issues</Text>
        <Text style={styles.benefitsText}>• Works with any Arabic font</Text>
        <Text style={styles.benefitsText}>• Professional quality rendering</Text>
        <Text style={styles.benefitsText}>• Preserves original Quran text</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  testContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666666',
    textAlign: 'center'
  },
  infoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 10
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 3
  },
  serverInfoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10
  },
  serverInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8
  },
  serverInfoText: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 3
  },
  serverInfoCode: {
    fontSize: 12,
    color: '#d84315',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 5,
    borderRadius: 3,
    marginVertical: 5
  },
  textSelectorContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10
  },
  textOption: {
    marginBottom: 10
  },
  textOptionButton: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 5,
    textAlign: 'center'
  },
  textOptionButtonSelected: {
    backgroundColor: '#1976d2',
    color: '#ffffff'
  },
  textOptionDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 3
  },
  rendererContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center'
  },
  rendererTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  rendererDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5
  },
  rendererText: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 10,
    fontFamily: 'monospace'
  },
  container: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center'
  },
  canvas: {
    flex: 1
  },
  loadingText: {
    fontSize: 16,
    color: '#666666'
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center'
  },
  errorSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 5
  },
  comparisonContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5
  },
  comparisonDescription: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 15
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  comparisonItem: {
    alignItems: 'center',
    flex: 1
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5
  },
  standardText: {
    fontSize: 32,
    textAlign: 'center',
    includeFontPadding: false,
    color: '#333333',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    minWidth: 120,
    minHeight: 60
  },
  benefitsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f3e5f5',
    borderRadius: 10
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 8
  },
  benefitsText: {
    fontSize: 14,
    color: '#8e24aa',
    marginBottom: 3
  }
});

export default HarfBuzzTest;
