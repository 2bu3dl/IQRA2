#!/bin/bash

# iOS App Icon Generator
# This script generates all required iOS app icon sizes from the source image

SOURCE_IMAGE="src/assets/IQRA2logo.png"
OUTPUT_DIR="ios/IQRA2/Images.xcassets/AppIcon.appiconset"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Generating iOS app icons from $SOURCE_IMAGE..."

echo "Generating Icon-App-20x20@2x.png (40x40)..."
convert "$SOURCE_IMAGE" -resize "40x40" -gravity center -extent "40x40" "$OUTPUT_DIR/Icon-App-20x20@2x.png"

echo "Generating Icon-App-20x20@3x.png (60x60)..."
convert "$SOURCE_IMAGE" -resize "60x60" -gravity center -extent "60x60" "$OUTPUT_DIR/Icon-App-20x20@3x.png"

echo "Generating Icon-App-29x29@2x.png (58x58)..."
convert "$SOURCE_IMAGE" -resize "58x58" -gravity center -extent "58x58" "$OUTPUT_DIR/Icon-App-29x29@2x.png"

echo "Generating Icon-App-29x29@3x.png (87x87)..."
convert "$SOURCE_IMAGE" -resize "87x87" -gravity center -extent "87x87" "$OUTPUT_DIR/Icon-App-29x29@3x.png"

echo "Generating Icon-App-40x40@2x.png (80x80)..."
convert "$SOURCE_IMAGE" -resize "80x80" -gravity center -extent "80x80" "$OUTPUT_DIR/Icon-App-40x40@2x.png"

echo "Generating Icon-App-40x40@3x.png (120x120)..."
convert "$SOURCE_IMAGE" -resize "120x120" -gravity center -extent "120x120" "$OUTPUT_DIR/Icon-App-40x40@3x.png"

echo "Generating Icon-App-60x60@2x.png (120x120)..."
convert "$SOURCE_IMAGE" -resize "120x120" -gravity center -extent "120x120" "$OUTPUT_DIR/Icon-App-60x60@2x.png"

echo "Generating Icon-App-60x60@3x.png (180x180)..."
convert "$SOURCE_IMAGE" -resize "180x180" -gravity center -extent "180x180" "$OUTPUT_DIR/Icon-App-60x60@3x.png"

echo "Generating Icon-App-1024x1024@1x.png (1024x1024)..."
convert "$SOURCE_IMAGE" -resize "1024x1024" -gravity center -extent "1024x1024" "$OUTPUT_DIR/Icon-App-1024x1024@1x.png"

echo "iOS app icons generated successfully!"
echo "Icons saved to: $OUTPUT_DIR" 