#!/bin/bash

# Fix Watch App Bundle Identifiers
echo "Fixing Watch App bundle identifiers..."

# Navigate to the iOS project directory
cd ios

# Update the project.pbxproj file to fix bundle identifiers
# This script will replace the invalid bundle identifiers with proper ones

# Backup the original file
cp IQRA2.xcodeproj/project.pbxproj IQRA2.xcodeproj/project.pbxproj.backup

# Replace the invalid bundle identifiers
sed -i '' 's/PRODUCT_BUNDLE_IDENTIFIER = "\.watchkitapp";/PRODUCT_BUNDLE_IDENTIFIER = "org.reactjs.native.example.IQRA2.watchkitapp";/g' IQRA2.xcodeproj/project.pbxproj
sed -i '' 's/PRODUCT_BUNDLE_IDENTIFIER = "\.watchkitapp\.extension";/PRODUCT_BUNDLE_IDENTIFIER = "org.reactjs.native.example.IQRA2.watchkitapp.extension";/g' IQRA2.xcodeproj/project.pbxproj

echo "Bundle identifiers updated successfully!"
echo "Please open Xcode and verify the changes:"
echo "1. Watch App: org.reactjs.native.example.IQRA2.watchkitapp"
echo "2. Watch Extension: org.reactjs.native.example.IQRA2.watchkitapp.extension"
echo ""
echo "Then set the Team and Signing Certificate for both targets." 