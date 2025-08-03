# IQRA2 Recording Sharing Feature

## Overview

The IQRA2 app now supports sharing Quran recitation recordings via various methods including AirDrop, Messages, WhatsApp, Mail, and other apps available on the device.

## How to Use

### 1. Access Recordings
- Open the Recordings Modal for any surah/ayah
- View your recorded recitations

### 2. Select Recordings to Share
- Tap the "Select" button to enter multi-select mode
- Tap on recordings to select them (selected recordings will be highlighted)
- You can select multiple recordings at once

### 3. Share Recordings
- Tap the "Share" button in the bottom toolbar
- Choose from available sharing options:
  - **Share** - Opens the general share sheet with all available apps
  - **AirDrop** - Share directly via AirDrop (iOS only)
  - **Messages** - Share via Apple Messages (iOS only)
  - **WhatsApp** - Share via WhatsApp (if installed)
  - **Mail** - Share via Mail app
  - **Files App** - Save to Files app

### 4. Sharing Options for Multiple Recordings
When multiple recordings are selected, you'll see two options:
- **Share All** - Share all selected recordings at once
- **Share Individually** - Share each recording separately

## Technical Implementation

### Dependencies
- `react-native-share` - Handles the actual sharing functionality
- `react-native-fs` - File system operations

### File Structure
```
src/
├── utils/
│   ├── sharingService.js    # Main sharing logic
│   └── audioRecorder.js     # Audio recording utilities
└── components/
    └── RecordingsModal.js   # UI for recordings management
```

### Platform Support

#### iOS
- Full support for AirDrop, Messages, Mail, Files app
- Native share sheet integration
- File provider configuration in Info.plist

#### Android
- Support for WhatsApp, Mail, and other sharing apps
- File provider configuration for secure file sharing
- Custom file paths configuration

### File Provider Configuration

#### Android
- Added FileProvider in AndroidManifest.xml
- Created file_paths.xml for defining accessible directories
- Custom FileProviderModule for URI conversion

#### iOS
- Added file sharing capabilities in Info.plist
- Enabled document opening in place
- Configured file sharing permissions

## Troubleshooting

### Common Issues

1. **"Recording file not found"**
   - Ensure the recording file exists in the app's storage
   - Check file permissions

2. **"Failed to share recording"**
   - Verify the target app is installed
   - Check if the file format is supported
   - Ensure proper file URI format

3. **Sharing not working on Android**
   - Verify FileProvider configuration
   - Check file_paths.xml configuration
   - Ensure proper file permissions

### Debug Information
The sharing service includes console logging to help debug issues:
- File existence checks
- URI conversion details
- Share options configuration
- Error messages with details

## Future Enhancements

1. **Batch Sharing**: Create zip files for multiple recordings
2. **Cloud Storage**: Direct sharing to iCloud, Google Drive, etc.
3. **Social Media**: Direct sharing to Instagram, TikTok, etc.
4. **Custom Formats**: Support for different audio formats
5. **Metadata**: Include recitation metadata in shared files

## Security Considerations

- Files are shared using secure file providers
- Proper URI handling prevents unauthorized access
- File permissions are properly configured
- No sensitive data is exposed in shared files 