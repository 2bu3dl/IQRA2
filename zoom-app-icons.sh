#!/bin/bash

# Script to zoom in app icons by 10%
# This will make the icons appear larger by scaling them up

echo "Zooming in app icons by 10%..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first:"
    echo "brew install imagemagick"
    exit 1
fi

# iOS App Icons
echo "Processing iOS app icons..."

# Create backup directory
mkdir -p ios/IQRA2/Images.xcassets/AppIcon.appiconset/backup
cp ios/IQRA2/Images.xcassets/AppIcon.appiconset/*.png ios/IQRA2/Images.xcassets/AppIcon.appiconset/backup/

# Process each iOS icon
for icon in ios/IQRA2/Images.xcassets/AppIcon.appiconset/*.png; do
    if [[ $icon != *"backup"* ]]; then
        echo "Processing: $(basename $icon)"
        # Get original dimensions
        dimensions=$(identify -format "%wx%h" "$icon")
        width=$(echo $dimensions | cut -d'x' -f1)
        height=$(echo $dimensions | cut -d'x' -f2)
        
        # Calculate new dimensions (10% larger)
        new_width=$((width * 110 / 100))
        new_height=$((height * 110 / 100))
        
        # Create temporary file with zoomed icon
        convert "$icon" -resize ${new_width}x${new_height} temp_zoomed.png
        
        # Create new icon with original dimensions but zoomed content
        convert temp_zoomed.png -gravity center -extent ${width}x${height} "$icon"
        
        rm temp_zoomed.png
    fi
done

# Android App Icons
echo "Processing Android app icons..."

# Create backup directories
mkdir -p android/app/src/main/res/mipmap-hdpi/backup
mkdir -p android/app/src/main/res/mipmap-mdpi/backup
mkdir -p android/app/src/main/res/mipmap-xhdpi/backup
mkdir -p android/app/src/main/res/mipmap-xxhdpi/backup
mkdir -p android/app/src/main/res/mipmap-xxxhdpi/backup

# Backup Android icons
cp android/app/src/main/res/mipmap-*/ic_launcher*.png android/app/src/main/res/mipmap-*/backup/ 2>/dev/null || true

# Process each Android density directory
for density in hdpi mdpi xhdpi xxhdpi xxxhdpi; do
    if [ -d "android/app/src/main/res/mipmap-$density" ]; then
        echo "Processing mipmap-$density..."
        for icon in android/app/src/main/res/mipmap-$density/ic_launcher*.png; do
            if [ -f "$icon" ] && [[ $icon != *"backup"* ]]; then
                echo "Processing: $(basename $icon)"
                # Get original dimensions
                dimensions=$(identify -format "%wx%h" "$icon")
                width=$(echo $dimensions | cut -d'x' -f1)
                height=$(echo $dimensions | cut -d'x' -f2)
                
                # Calculate new dimensions (10% larger)
                new_width=$((width * 110 / 100))
                new_height=$((height * 110 / 100))
                
                # Create temporary file with zoomed icon
                convert "$icon" -resize ${new_width}x${new_height} temp_zoomed.png
                
                # Create new icon with original dimensions but zoomed content
                convert temp_zoomed.png -gravity center -extent ${width}x${height} "$icon"
                
                rm temp_zoomed.png
            fi
        done
    fi
done

echo "App icons have been zoomed in by 10%!"
echo "Backups are available in the backup directories."
echo ""
echo "To test on simulator:"
echo "1. Clean build: npx react-native clean"
echo "2. Run on iOS: npx react-native run-ios"
echo "3. Run on Android: npx react-native run-android" 