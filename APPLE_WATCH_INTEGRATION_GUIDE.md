# Apple Watch Integration Guide for IQRA2

## Overview

This guide provides a comprehensive approach to making IQRA2 compatible with Apple Watch. The implementation uses a native watchOS companion app that communicates with the main React Native iOS app through WatchConnectivity.

## Architecture

### 1. **Native watchOS App Approach**
- **Primary App**: React Native iOS app (existing)
- **Companion App**: Native watchOS app (new)
- **Communication**: WatchConnectivity framework
- **Data Sync**: Shared App Groups

### 2. **Key Components**

#### iOS App (React Native)
- `WatchConnectivityModule.swift` - Native module for watch communication
- `AppDelegate.swift` - Watch connectivity setup
- `src/utils/watchConnectivity.js` - JavaScript interface

#### Apple Watch App
- `InterfaceController.swift` - Main watch interface
- `ExtensionDelegate.swift` - App lifecycle management
- `ComplicationController.swift` - Watch complications
- `NotificationController.swift` - Notification handling

## Features Implemented

### 1. **Core Features**
- **Daily Progress Display**: Show today's hasanat count and streak
- **Quick Memorization Sessions**: 5-10 minute focused sessions
- **Progress Tracking**: Real-time sync with iPhone app
- **Daily Verse Display**: Rotating verses based on day of year
- **Watch Complications**: Multiple complication types showing progress

### 2. **Communication Features**
- **Bidirectional Sync**: Data flows between iPhone and Apple Watch
- **Real-time Updates**: Progress updates sync immediately
- **Offline Support**: Watch app works independently when iPhone unavailable
- **Background Updates**: Complications update automatically

### 3. **User Experience**
- **Glanceable Interface**: Quick access to key information
- **Haptic Feedback**: Tactile responses for interactions
- **Voice Commands**: Siri integration for hands-free operation
- **Customizable**: User can choose which complications to display

## Setup Instructions

### Phase 1: Xcode Project Setup

1. **Open Xcode Project**
   ```bash
   npm run ios-workspace
   ```

2. **Add Watch App Target**
   - In Xcode, go to File → New → Target
   - Select "watchOS" → "Watch App"
   - Name it "IQRA2Watch Extension"
   - Ensure "Include Notification Scene" is checked
   - Ensure "Include Complication" is checked

3. **Configure App Groups**
   - Select your project in Xcode
   - Go to "Signing & Capabilities"
   - Add "App Groups" capability
   - Create group: `group.com.iqra2.app`
   - Add this group to both iOS and watchOS targets

### Phase 2: Code Implementation

1. **Add Native Files**
   - Copy the provided Swift files to their respective locations
   - Ensure all files are added to the correct targets

2. **Update Info.plist**
   - Add necessary permissions and configurations
   - Configure background modes for watch app

3. **Install Dependencies**
   ```bash
   npm install
   cd ios && pod install
   ```

### Phase 3: Testing

1. **Simulator Testing**
   ```bash
   npm run watch-simulator
   ```

2. **Device Testing**
   - Connect iPhone and Apple Watch
   - Build and run on both devices
   - Test communication between devices

## Development Workflow

### 1. **Daily Development**
```bash
# Start Metro bundler
npm start

# Run on iOS simulator with watch
npm run watch

# Run on connected devices
npm run ios
```

### 2. **Watch-Specific Development**
```bash
# Open Xcode workspace
npm run ios-workspace

# Build watch app specifically
xcodebuild -workspace ios/IQRA2.xcworkspace -scheme IQRA2Watch Extension -destination 'platform=watchOS Simulator,name=Apple Watch Series 9 (45mm)' build
```

### 3. **Testing Communication**
```javascript
// In your React Native code
import watchConnectivity from './src/utils/watchConnectivity';

// Check if watch is available
const isReachable = await watchConnectivity.isWatchReachable();

// Sync data with watch
await watchConnectivity.syncUserProgress(userData);
```

## Key Features Breakdown

### 1. **Main Watch Interface**
- **Progress Display**: Shows daily hasanat count and streak
- **Quick Actions**: Start memorization session, view progress
- **Daily Verse**: Displays rotating verses
- **Settings Access**: Quick access to app settings

### 2. **Memorization Sessions**
- **5-Minute Sessions**: Quick focused memorization
- **Progress Tracking**: Real-time progress updates
- **Audio Controls**: Play/pause/next verse controls
- **Session Summary**: End-of-session statistics

### 3. **Watch Complications**
- **Modular Small**: Shows hasanat count
- **Modular Large**: Shows progress and streak
- **Utilitarian**: Shows app name and progress
- **Circular**: Compact progress display
- **Graphic**: Rich visual complications

### 4. **Notifications**
- **Daily Reminders**: Prayer time notifications with verses
- **Progress Alerts**: Streak milestones and achievements
- **Session Reminders**: Gentle nudges to practice

## Data Flow

### 1. **iPhone to Watch**
```javascript
// User completes memorization session
const sessionData = {
  hasanat: 10,
  verses: 5,
  duration: 300
};

// Sync with watch
await watchConnectivity.sendMemorizationSession(sessionData);
```

### 2. **Watch to iPhone**
```swift
// Watch user completes quick session
let progress = [
    "todayHasanat": 15,
    "streak": 7
];

// Send to iPhone
WCSession.default.sendMessage([
    "type": "progressUpdate",
    "data": progress
], replyHandler: nil, errorHandler: nil)
```

### 3. **Shared Data Container**
```swift
// Both apps access shared data
let sharedDefaults = UserDefaults(suiteName: "group.com.iqra2.app")
sharedDefaults?.set(todayHasanat, forKey: "todayHasanat")
sharedDefaults?.synchronize()
```

## Performance Considerations

### 1. **Battery Optimization**
- **Minimal Background Activity**: Only essential updates
- **Efficient Data Transfer**: Compressed data formats
- **Smart Sync**: Only sync when necessary

### 2. **Memory Management**
- **Lightweight UI**: Minimal memory footprint
- **Efficient Data Structures**: Optimized for watch constraints
- **Proper Cleanup**: Remove observers and listeners

### 3. **Network Efficiency**
- **Batch Updates**: Group multiple updates together
- **Compression**: Reduce data transfer size
- **Fallback Mechanisms**: Handle connectivity issues gracefully

## Troubleshooting

### Common Issues

1. **Watch Not Connecting**
   - Check device pairing
   - Verify app installation on both devices
   - Restart both devices

2. **Data Not Syncing**
   - Check App Groups configuration
   - Verify WatchConnectivity setup
   - Check network connectivity

3. **Complications Not Updating**
   - Verify complication data source
   - Check timeline entries
   - Force refresh complications

### Debug Commands
```bash
# Check watch connectivity
xcrun simctl spawn booted log stream --predicate 'process == "WatchConnectivity"'

# View watch logs
xcrun simctl spawn booted log stream --predicate 'process == "IQRA2Watch Extension"'
```

## Future Enhancements

### 1. **Advanced Features**
- **Voice Recognition**: Speak verses for memorization
- **Gesture Controls**: Swipe and tap gestures
- **Custom Complications**: User-defined complication types

### 2. **Integration Features**
- **HealthKit Integration**: Track spiritual wellness
- **Siri Shortcuts**: Voice commands for app actions
- **Family Sharing**: Share progress with family members

### 3. **Analytics & Insights**
- **Progress Analytics**: Detailed memorization insights
- **Streak Analysis**: Pattern recognition for motivation
- **Personalized Recommendations**: AI-powered suggestions

## Conclusion

This Apple Watch integration provides a seamless extension of the IQRA2 experience, allowing users to maintain their Quran memorization practice throughout the day with quick, glanceable access to their progress and daily verses. The native watchOS approach ensures optimal performance and battery life while providing a rich, engaging user experience.

The implementation follows Apple's design guidelines and best practices, ensuring compatibility with current and future watchOS versions while maintaining the core values and functionality of the IQRA2 app. 