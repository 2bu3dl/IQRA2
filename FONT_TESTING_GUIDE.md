# Font Testing Guide: UthmanicHafs1Ver18

## What We've Set Up

### 1. Font Configuration
- ✅ Added `UthmanicHafs1Ver18.ttf` to `/src/assets/fonts/`
- ✅ Updated `fontChecker.js` to recognize the new font
- ✅ Set `UthmanicHafs1Ver18` as the **highest priority** Arabic font
- ✅ Updated font recommendation system

### 2. Test Setup
- ✅ Added temporary test button on HomeScreen: **"Test Font: Surah Ash-Sharh"**
- ✅ Temporarily disabled wasla normalization to test original font behavior
- ✅ Configured app to use new font for all Arabic text

### 3. Test Target
**Surah Ash-Sharh Ayah 7**: `فَإِذَا فَرَغْتَ فَٱنصَبْ`
- This is the specific case where wasla (ٱ) was causing letter separation issues

## How to Test

### Step 1: Build and Run the App
```bash
# The app should already be building in the background
# If not, run:
npx react-native run-ios --simulator="iPhone 15"
```

### Step 2: Navigate to Test
1. Open the app
2. Look for the red **"Test Font: Surah Ash-Sharh"** button on the home screen
3. Tap the button to navigate directly to Surah Ash-Sharh

### Step 3: Check the Results
Navigate to **Ayah 7** in Surah Ash-Sharh and look for:

**Expected Behavior with UthmanicHafs1Ver18:**
- The wasla (ٱ) in `فَٱنصَبْ` should connect properly to the previous letter (فَ)
- No visual separation between فَ and ٱ
- Proper letter spacing throughout the ayah

**What to Compare:**
- **Before**: Wasla appeared separated from previous letter
- **After**: Wasla should connect properly (like regular alif does)

### Step 4: Test All Ayaat
Check all 8 ayaat of Surah Ash-Sharh to ensure consistent rendering:
1. `أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ`
2. `وَوَضَعْنَا عَنكَ وِزْرَكَ`
3. `ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ`
4. `وَرَفَعْنَا لَكَ ذِكْرَكَ`
5. `فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا`
6. `إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا`
7. `فَإِذَا فَرَغْتَ فَٱنصَبْ` ← **Main test case**
8. `وَإِلَىٰ رَبِّكَ فَٱرْغَب`

## Expected Outcomes

### ✅ Success Indicators
- Wasla (ٱ) connects properly to previous letters
- No visual gaps or separations
- Consistent rendering across all ayaat
- Better overall Arabic text appearance

### ❌ If Issues Persist
- Wasla still appears separated
- Inconsistent letter spacing
- Font not loading (fallback to other fonts)

## Next Steps Based on Results

### If Font Works Well:
1. Remove the temporary test button
2. Re-enable wasla normalization (set `fixWasla: true`)
3. Test with other surahs that have wasla
4. Consider making this the permanent font

### If Font Has Issues:
1. Try alternative font versions
2. Adjust font configuration
3. Consider font-specific CSS adjustments
4. Fall back to normalization approach

## Technical Details

### Font Priority Order:
1. **UthmanicHafs1Ver18** (new, highest priority)
2. KFGQPC Uthman Taha Naskh
3. KFGQPC Uthman Taha Naskh Bold
4. UthmanTN_v2-0
5. UthmanTNB_v2-0
6. KSAHeavy

### Current Configuration:
- **Wasla Normalization**: Temporarily disabled (`fixWasla: false`)
- **Font Family**: `UthmanicHafs1Ver18`
- **Text Processing**: Minimal (preserving original text)

## Cleanup After Testing

Once testing is complete, remember to:
1. Remove the temporary test button from HomeScreen
2. Re-enable wasla normalization if needed
3. Update documentation with results
4. Make final font configuration decisions
