#!/bin/bash

# Precise auto-crop logo script
# This script removes only outer white padding while preserving inner content

SOURCE_IMAGE="src/assets/logo.png"
CROPPED_IMAGE="src/assets/logo-cropped.png"

echo "Precisely cropping logo to remove only outer white padding..."

# Step 1: Create a version with a unique background color
convert "$SOURCE_IMAGE" -background magenta -alpha background temp_with_bg.png

# Step 2: Find the bounding box of non-magenta content with moderate fuzz
bbox=$(convert temp_with_bg.png -fuzz 8% -fill magenta -opaque magenta -trim -format "%wx%h%X%Y" info:)

echo "Detected content bounds: $bbox"

# Step 3: Crop the original image using the detected bounds
convert "$SOURCE_IMAGE" -crop "$bbox" +repage "$CROPPED_IMAGE"

# Step 4: Clean up temporary file
rm temp_with_bg.png

echo "Logo precisely cropped successfully!"
echo "Original: $SOURCE_IMAGE"
echo "Cropped: $CROPPED_IMAGE"

# Show the new dimensions
echo "New dimensions:"
identify "$CROPPED_IMAGE" 