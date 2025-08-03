# Recording Feature Documentation

## Overview
The recording feature allows users to record their Quran recitation for each ayah during memorization. This helps users practice and review their recitation.

## Features

### Recording Functionality
- **Start Recording**: Tap the microphone button to start recording
- **Stop Recording**: Tap the stop button to stop and save the recording
- **Visual Feedback**: Button pulses red while recording
- **Reset Recording**: Long press while recording to reset (discard) the current recording

### Playback Functionality
- **Play Saved Recordings**: Tap the play button (when recordings exist) to play saved recordings
- **Recordings Modal**: Long press when not recording to open recordings management modal

### Recordings Management
- **View All Recordings**: See all recordings for the current ayah
- **Play Recordings**: Play any saved recording
- **Rename Recordings**: Edit recording names for better organization
- **Delete Recordings**: Remove unwanted recordings
- **Recording Metadata**: View recording date, time, and duration

## Technical Implementation

### Files Created/Modified
1. **`src/utils/audioRecorder.js`** - Audio recording utility using expo-av
2. **`src/components/RecordingsModal.js`** - Modal for managing recordings
3. **`src/screens/MemorizationScreen.js`** - Integration of recording functionality
4. **`android/app/src/main/AndroidManifest.xml`** - Added microphone permissions
5. **`src/utils/languageContext.js`** - Added recording-related translations

### Dependencies
- `expo-av` - Audio recording and playback
- `expo-file-system` - File management for recordings
- `@react-native-async-storage/async-storage` - Metadata storage

### Permissions
- **Android**: `RECORD_AUDIO`, `WRITE_EXTERNAL_STORAGE`, `READ_EXTERNAL_STORAGE`
- **iOS**: `NSMicrophoneUsageDescription` (already configured)

## Usage Instructions

### Recording an Ayah
1. Navigate to any ayah in the memorization screen
2. Tap the microphone button to start recording
3. Recite the ayah
4. Tap the stop button to save the recording

### Managing Recordings
1. Long press the microphone button when not recording
2. This opens the recordings modal
3. View, play, rename, or delete recordings as needed

### Visual Indicators
- **Gray microphone**: No recordings for this ayah
- **Yellow play button**: Recordings exist for this ayah
- **Red stop button**: Currently recording
- **Pulsing animation**: Recording in progress

## File Storage
Recordings are stored in the app's document directory:
- **Path**: `{app_documents}/recordings/`
- **Format**: `recording_{surahName}_{ayahNumber}_{timestamp}.m4a`
- **Metadata**: Stored in AsyncStorage with recording details

## Error Handling
- Permission denied: Shows error message with guidance
- Recording failed: Displays error with retry option
- Playback failed: Shows error message
- File system errors: Graceful degradation with user feedback

## Future Enhancements
- Cloud sync for recordings
- Recording quality settings
- Background recording support
- Recording sharing functionality
- Advanced audio processing features 