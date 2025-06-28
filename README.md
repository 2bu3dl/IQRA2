This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# IQRA2 - Quran Memorization App

IQRA2 is a React Native application designed to help users memorize the Quran. The app features a beautiful, intuitive interface with progress tracking for each surah and audio recording capabilities.

## Features

### Progress Tracking
- **Green Progress Bars**: Each surah displays a green progress bar that fills up as you memorize ayahs
- **Real-time Updates**: Progress bars update automatically after each ayah is completed
- **Visual Feedback**: Smooth animations provide satisfying visual feedback for memorization progress
- **Dual Progress Display**: 
  - Progress bars in the surah list show overall completion for each surah
  - Progress bar in the memorization screen shows current progress within the active surah

### Audio Recording
- **Individual Ayah Recording**: Record yourself reciting each ayah as you memorize
- **Complete Surah Recording**: Record the entire surah when you finish memorizing
- **Personal Quran Collection**: Build your own complete recorded Quran over time
- **Playback Functionality**: Listen to your recordings to review and improve
- **Recording Management**: View and manage all your recordings in a dedicated screen

### Memorization Features
- **Flashcard System**: Interactive flashcards for ayah memorization
- **Hasanat Tracking**: Earn hasanat (rewards) for each completed ayah
- **Navigation**: Easy navigation between ayahs and surahs
- **Search Functionality**: Quick search to jump to specific ayahs

## Audio Recording Implementation

The audio recording feature includes:

1. **AudioRecorder Component** (`src/components/AudioRecorder.js`):
   - Intuitive recording interface with play/stop controls
   - Visual feedback for recording and playback states
   - Duration tracking and display
   - Support for both ayah and surah recordings

2. **Audio Recording Utility** (`src/utils/audioRecorder.js`):
   - Permission handling for microphone access
   - File management and storage
   - Recording metadata storage
   - Cross-platform compatibility (iOS/Android)

3. **Memorization Screen Integration** (`src/screens/MemorizationScreen.js`):
   - Individual ayah recording during memorization
   - Complete surah recording prompt at the end
   - Automatic saving and playback of recordings

4. **Recordings Management Screen** (`src/screens/RecordingsScreen.js`):
   - Overview of all recorded surahs and ayahs
   - Playback functionality for all recordings
   - Recording statistics and progress tracking
   - Easy navigation to continue memorization

## Progress Bar Implementation

The progress bar feature includes:

1. **ProgressBar Component** (`src/components/ProgressBar.js`):
   - Smooth animated progress updates
   - Customizable height and animation settings
   - Green color scheme matching the app's theme
   - Responsive design that works across different screen sizes

2. **Surah List Integration** (`src/screens/SurahListScreen.js`):
   - Progress bars displayed for each surah card
   - Shows memorized ayahs vs total ayahs
   - Updates automatically when returning from memorization screen

3. **Memorization Screen Integration** (`src/screens/MemorizationScreen.js`):
   - Progress bar in the header showing current surah progress
   - Real-time updates as you progress through ayahs
   - Visual motivation to continue memorization

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
