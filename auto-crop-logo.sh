#!/bin/bash

# Auto-crop logo script
# This script automatically detects the actual logo content and crops out padding

SOURCE_IMAGE="src/assets/logo.png"
CROPPED_IMAGE="src/assets/logo-cropped.png"

echo "Auto-cropping logo to remove padding..."

# Step 1: Create a temporary image with a unique background color to detect content
# We'll use a bright magenta color that's unlikely to be in the logo
convert "$SOURCE_IMAGE" -background magenta -alpha background temp_with_bg.png

# Step 2: Find the bounding box of non-magenta content
# This will give us the coordinates of the actual logo content
bbox=$(convert temp_with_bg.png -fuzz 5% -fill magenta -opaque magenta -trim -format "%wx%h%X%Y" info:)

echo "Detected content bounds: $bbox"

# Step 3: Crop the original image using the detected bounds
convert "$SOURCE_IMAGE" -crop "$bbox" +repage "$CROPPED_IMAGE"

# Step 4: Clean up temporary file
rm temp_with_bg.png

echo "Logo cropped successfully!"
echo "Original: $SOURCE_IMAGE"
echo "Cropped: $CROPPED_IMAGE"

# Show the new dimensions
echo "New dimensions:"
identify "$CROPPED_IMAGE" 