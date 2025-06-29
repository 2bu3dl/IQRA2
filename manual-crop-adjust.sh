#!/bin/bash

# Manual crop adjustment script
# This script manually adjusts the cropping to remove tiny white areas

SOURCE_IMAGE="src/assets/logo-cropped.png"
ADJUSTED_IMAGE="src/assets/logo-cropped.png"

echo "Manually adjusting crop to remove tiny white areas..."

# Get current dimensions
current_size=$(identify -format "%wx%h" "$SOURCE_IMAGE")
echo "Current size: $current_size"

# More conservative cropping - just remove 2-3 pixels from each side
# We'll crop 3 pixels from the right side and 2 from the left side
convert "$SOURCE_IMAGE" -crop "785x800+2+0" +repage "$ADJUSTED_IMAGE"

echo "Crop adjustment completed!"
echo "New dimensions:"
identify "$ADJUSTED_IMAGE" 