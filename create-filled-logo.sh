#!/bin/bash

# Create filled logo script
# This script creates a version that fills the entire square

SOURCE_IMAGE="src/assets/logo.png"
FILLED_IMAGE="src/assets/logo-cropped.png"

echo "Creating filled logo that eliminates white lines..."

# Get the dominant color from the logo to use as background
# We'll use a dark green color that should match your logo theme
BACKGROUND_COLOR="#2d5016"

# Scale the logo to fill the entire 1024x1024 square with the background color
convert "$SOURCE_IMAGE" \
    -background "$BACKGROUND_COLOR" \
    -gravity center \
    -resize "1024x1024" \
    -extent "1024x1024" \
    "$FILLED_IMAGE"

echo "Filled logo created successfully!"
echo "Original: $SOURCE_IMAGE"
echo "Filled: $FILLED_IMAGE"

# Show the new dimensions
echo "New dimensions:"
identify "$FILLED_IMAGE" 