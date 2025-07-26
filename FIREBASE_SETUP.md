# Firebase Setup for IQRA2

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `iqra2-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Wait for project creation

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Save changes

## Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for now)
4. Select your region (closest to your users)
5. Click **Done**

## Step 4: Add iOS App

1. Go to **Project settings** (gear icon)
2. Click **Add app** → **iOS**
3. Enter iOS bundle ID: `com.iqra2.app` (or your bundle ID from `ios/IQRA2/Info.plist`)
4. Download `GoogleService-Info.plist`
5. **IMPORTANT**: Place `GoogleService-Info.plist` in `ios/IQRA2/` directory
6. In Xcode:
   - Right-click on IQRA2 folder
   - "Add Files to IQRA2"
   - Select `GoogleService-Info.plist`
   - Make sure "Copy items if needed" is checked
   - Make sure target "IQRA2" is selected

## Step 5: Add Android App

1. In Firebase Console, click **Add app** → **Android**
2. Enter Android package name: `com.iqra2` (from `android/app/src/main/AndroidManifest.xml`)
3. Download `google-services.json`
4. **IMPORTANT**: Place `google-services.json` in `android/app/` directory

## Step 6: Configure iOS

Add to `ios/IQRA2/AppDelegate.swift` (if not already present):

```swift
import Firebase

// In application didFinishLaunchingWithOptions
FirebaseApp.configure()
```

## Step 7: Configure Android

Add to `android/app/build.gradle` (at the bottom):

```gradle
apply plugin: 'com.google.gms.google-services'
```

Add to `android/build.gradle` (in dependencies):

```gradle
classpath 'com.google.gms:google-services:4.3.15'
```

## Step 8: Install iOS Pods

```bash
cd ios && pod install && cd ..
```

## Step 9: Test Configuration

1. Build and run the app
2. Check console for "[Firebase] Configuration successful" or similar
3. Try creating an account in the AuthScreen

## Security Rules (Optional - Set Later)

In Firestore Console, go to **Rules** and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## File Structure After Setup

```
IQRA2/
├── ios/
│   └── IQRA2/
│       └── GoogleService-Info.plist ✅
├── android/
│   └── app/
│       └── google-services.json ✅
└── src/
    ├── utils/
    │   ├── authContext.js ✅
    │   └── cloudStore.js ✅
    └── screens/
        └── AuthScreen.js ✅
```

## Troubleshooting

### Common Issues:

1. **"No Firebase App '[DEFAULT]' has been created"**
   - Make sure `GoogleService-Info.plist` is added to Xcode project
   - Verify `FirebaseApp.configure()` is called in AppDelegate

2. **Android build fails**
   - Check `google-services.json` is in correct location
   - Verify gradle plugin is applied

3. **Auth not working**
   - Ensure Email/Password is enabled in Firebase Console
   - Check network connectivity
   - Verify bundle IDs match

### Debug Commands:

```bash
# Check if Firebase is properly linked
npx react-native info

# Clear cache if needed
npx react-native start --reset-cache

# Rebuild iOS
cd ios && rm -rf Pods && pod install && cd ..
```

## Next Steps After Setup

1. Update App.js to include AuthProvider
2. Add navigation for AuthScreen
3. Test authentication flow
4. Implement cloud sync in existing screens

---

**Note**: Make sure to keep your Firebase configuration files secure and never commit them to public repositories! 