#!/usr/bin/env python3
"""
Font Missing Characters Inspector
Based on ChatGPT's recommendation for systematic font analysis
"""

import json
import sys
from fontTools.ttLib import TTFont

def inspect_font(font_path):
    """Inspect font for missing Arabic characters"""
    try:
        font = TTFont(font_path)
        
        # Get cmap table
        cmap = {}
        for table in font['cmap'].tables:
            cmap.update(table.cmap)
        
        # Check specific Arabic characters
        test_chars = {
            0x0627: "ا",  # Alef
            0x0628: "ب",  # Beh
            0x0641: "ف",  # Feh
            0x064E: "َ",  # Fatha
            0x0671: "ٱ",  # Alef with Wasla Above
            0x06E1: "ۡ",  # Small High Dotless Head Of Khah
            0x064B: "ً",  # Fathatan
            0x064C: "ٌ",  # Dammatan
            0x064D: "ٍ",  # Kasratan
            0x064F: "ُ",  # Damma
            0x0650: "ِ",  # Kasra
            0x0651: "ّ",  # Shadda
            0x0652: "ْ",  # Sukun
        }
        
        present = []
        missing = []
        
        for codepoint, char in test_chars.items():
            if codepoint in cmap:
                present.append(f"0x{codepoint:04X}")
            else:
                missing.append(f"0x{codepoint:04X}")
        
        # Get font metadata
        font_family = "Unknown"
        font_name = "Unknown"
        
        if 'name' in font:
            for name_record in font['name'].names:
                if name_record.nameID == 1:  # Font Family
                    try:
                        font_family = name_record.toStr()
                    except:
                        font_family = str(name_record.string)
                elif name_record.nameID == 4:  # Full Font Name
                    try:
                        font_name = name_record.toStr()
                    except:
                        font_name = str(name_record.string)
        
        # Get units per em
        upem = font['head'].unitsPerEm if 'head' in font else 1000
        
        result = {
            "font_path": font_path,
            "font_family": font_family,
            "font_name": font_name,
            "upem": upem,
            "present": present,
            "missing": missing,
            "total_glyphs": len(font.getGlyphSet()),
            "coverage_analysis": {
                "has_alef": 0x0627 in cmap,
                "has_beh": 0x0628 in cmap,
                "has_feh": 0x0641 in cmap,
                "has_fatha": 0x064E in cmap,
                "has_wasla": 0x0671 in cmap,
                "has_sukun": 0x06E1 in cmap,
                "has_diacritics": any(cp in cmap for cp in [0x064B, 0x064C, 0x064D, 0x064F, 0x0650, 0x0651, 0x0652])
            }
        }
        
        return result
        
    except Exception as e:
        return {"error": str(e)}

def main():
    if len(sys.argv) != 2:
        print("Usage: python inspect_font_missing.py <font_path>")
        print("Example: python inspect_font_missing.py src/assets/fonts/UthmanicHafs1Ver18.ttf")
        sys.exit(1)
    
    font_path = sys.argv[1]
    result = inspect_font(font_path)
    
    if "error" in result:
        print(f"Error: {result['error']}")
        sys.exit(1)
    
    # Print detailed analysis
    print("=== FONT ANALYSIS ===")
    print(f"Font: {result['font_name']}")
    print(f"Family: {result['font_family']}")
    print(f"Units per EM: {result['upem']}")
    print(f"Total Glyphs: {result['total_glyphs']}")
    print()
    
    print("=== CHARACTER COVERAGE ===")
    coverage = result['coverage_analysis']
    for char, present in coverage.items():
        status = "✅" if present else "❌"
        print(f"{char}: {status}")
    print()
    
    print("=== PRESENT CHARACTERS ===")
    for cp in result['present']:
        print(f"  {cp}")
    print()
    
    print("=== MISSING CHARACTERS ===")
    for cp in result['missing']:
        print(f"  {cp}")
    print()
    
    # Save JSON for React Native
    json_output = {
        "present": result['present'],
        "missing": result['missing'],
        "font_family": result['font_family'],
        "coverage_analysis": result['coverage_analysis']
    }
    
    with open('missing_chars.json', 'w') as f:
        json.dump(json_output, f, indent=2)
    
    print("=== JSON OUTPUT SAVED ===")
    print("File: missing_chars.json")
    print("This file can be used with the QuranTextFallback component")
    
    # Print specific recommendations
    print("\n=== RECOMMENDATIONS ===")
    if not coverage['has_wasla']:
        print("❌ Font missing wasla (U+0671) - this is the root cause!")
        print("   Solution: Replace wasla with regular alif in source data")
    
    if not coverage['has_diacritics']:
        print("❌ Font missing diacritics - may cause additional issues")
        print("   Solution: Use fallback font for diacritics")
    
    if coverage['has_alef'] and coverage['has_beh'] and coverage['has_feh']:
        print("✅ Font has basic Arabic letters - good for fallback")
    
    if coverage['has_wasla']:
        print("✅ Font has wasla - issue may be elsewhere")

if __name__ == "__main__":
    main()
