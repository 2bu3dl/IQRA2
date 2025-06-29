#!/bin/bash

ICON_SRC="src/assets/IQRA2icon.PNG"
IOS_PATH="ios/IQRA2/Images.xcassets/AppIcon.appiconset"
ANDROID_PATH="android/app/src/main/res"

# iOS icons
# Format: filename size
IOS_ICONS=(
  "Icon-App-20x20@2x.png 40"
  "Icon-App-20x20@3x.png 60"
  "Icon-App-29x29@2x.png 58"
  "Icon-App-29x29@3x.png 87"
  "Icon-App-40x40@2x.png 80"
  "Icon-App-40x40@3x.png 120"
  "Icon-App-60x60@2x.png 120"
  "Icon-App-60x60@3x.png 180"
  "Icon-App-1024x1024@1x.png 1024"
)

for entry in "${IOS_ICONS[@]}"; do
  set -- $entry
  name=$1
  size=$2
  echo "Generating iOS icon: $name ($size x $size)"
  convert "$ICON_SRC" -resize ${size}x${size} "$IOS_PATH/$name"
done

# Android icons
# Format: folder/filename size
ANDROID_ICONS=(
  "mipmap-mdpi/ic_launcher.png 48"
  "mipmap-hdpi/ic_launcher.png 72"
  "mipmap-xhdpi/ic_launcher.png 96"
  "mipmap-xxhdpi/ic_launcher.png 144"
  "mipmap-xxxhdpi/ic_launcher.png 192"
)

for entry in "${ANDROID_ICONS[@]}"; do
  set -- $entry
  name=$1
  size=$2
  echo "Generating Android icon: $name ($size x $size)"
  convert "$ICON_SRC" -resize ${size}x${size} "$ANDROID_PATH/$name"
done

echo "All icons generated!" 