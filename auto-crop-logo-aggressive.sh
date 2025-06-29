#!/bin/bash

# Aggressive auto-crop logo script
# This script removes ALL white/light areas and ensures content fills the space

SOURCE_IMAGE="src/assets/logo.png"
CROPPED_IMAGE="src/assets/logo-cropped.png"

echo "Aggressively cropping logo to remove ALL white padding..."

# Step 1: Create a version with a unique background color
convert "$SOURCE_IMAGE" -background magenta -alpha background temp_with_bg.png

# Step 2: Find the bounding box of non-magenta content with more aggressive fuzz
bbox=$(convert temp_with_bg.png -fuzz 15% -fill magenta -opaque magenta -trim -format "%wx%h%X%Y" info:)

echo "Detected content bounds: $bbox"

# Step 3: Crop the original image using the detected bounds
convert "$SOURCE_IMAGE" -crop "$bbox" +repage temp_cropped.png

# Step 4: Now remove any remaining white/light areas from the cropped image
# Convert to grayscale, threshold to remove light areas, then apply to original
convert temp_cropped.png -colorspace gray -threshold 50% -negate temp_mask.png
convert temp_cropped.png temp_mask.png -alpha off -compose copy-opacity -composite "$CROPPED_IMAGE"

# Step 5: Clean up temporary files
rm temp_with_bg.png temp_cropped.png temp_mask.png

echo "Logo aggressively cropped successfully!"
echo "Original: $SOURCE_IMAGE"
echo "Cropped: $CROPPED_IMAGE"

# Show the new dimensions
echo "New dimensions:"
identify "$CROPPED_IMAGE" 