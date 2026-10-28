# 📱 ROMO Android APK Release Guide

This guide explains how to create and distribute ROMO APK releases.

## Quick Start

### For Users (Installing the APK)

1. **Download the APK** from the [Releases page](https://github.com/YOUR_USERNAME/ROMO/releases)
2. **Transfer to your Android phone**:
   - USB cable
   - Email it to yourself
   - Upload to Google Drive/Dropbox
3. **Install the APK**:
   - Open the file manager on your phone
   - Tap the APK file
   - Allow "Install from unknown sources" if prompted
   - Tap "Install"
4. **Open ROMO** and enjoy! 🦦

### For Developers (Building the APK)

#### Prerequisites
- Node.js 18+
- Java JDK 17+
- Android Studio (optional, for advanced builds)

#### Build Steps

**Option 1: Using Build Script (Recommended)**

```bash
# Linux/Mac
chmod +x build-apk.sh
./build-apk.sh

# Windows
build-apk.bat
```

**Option 2: Manual Build**

```bash
# 1. Install dependencies
npm install

# 2. Build web app
npm run build

# 3. Add Android platform (first time only)
npx cap add android

# 4. Sync web assets
npx cap sync android

# 5. Build APK
cd android
./gradlew assembleDebug  # Linux/Mac
# or
gradlew.bat assembleDebug  # Windows

# 6. Find your APK
# Location: android/app/build/outputs/apk/debug/app-debug.apk
```

**Option 3: Using Android Studio**

```bash
# 1. Build web app
npm run build

# 2. Sync with Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. In Android Studio:
#    - Wait for Gradle sync
#    - Build > Build Bundle(s) / APK(s) > Build APK(s)
#    - Click "locate" to find the APK
```

## Creating a GitHub Release

### Automated Release (Recommended)

1. **Update version in package.json**:
   ```json
   {
     "version": "2.0.1"
   }
   ```

2. **Create and push a tag**:
   ```bash
   git tag v2.0.1
   git push origin v2.0.1
   ```

3. **GitHub Actions will automatically**:
   - Build the APK
   - Create a GitHub Release
   - Attach the APK file
   - Generate release notes

### Manual Release

1. **Build the APK** (see steps above)

2. **Go to GitHub Releases**:
   - Navigate to your repo
   - Click "Releases" > "Create a new release"

3. **Fill in release details**:
   - **Tag**: `v2.0.1` (or your version)
   - **Title**: `ROMO v2.0.1`
   - **Description**: Use the template below
   - **Attach the APK file**

4. **Publish the release**

### Release Notes Template

```markdown
## 🦦 ROMO v2.0.1

### What's New
- [List new features]
- [List improvements]
- [List bug fixes]

### Installation
1. Download the APK file below
2. Transfer to your Android device
3. Open the APK file to install
4. Enable "Install from unknown sources" if prompted

### APK Info
- **Size**: [X MB]
- **Type**: Debug build (unsigned)
- **Min Android**: 5.0 (API 21)
- **Target Android**: 14 (API 34)

### Full Changelog
See [CHANGELOG.md](CHANGELOG.md) for detailed changes.
```

## Signed Release Builds

For production distribution, you should create signed APKs:

### Creating a Keystore

```bash
keytool -genkey -v -keystore romo-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias romo
```

### Building Signed APK in Android Studio

1. Open project in Android Studio
2. Build > Generate Signed Bundle / APK
3. Select "APK"
4. Choose your keystore file
5. Enter passwords
6. Select "release" build variant
7. Click "Finish"

### Building Signed APK via Command Line

1. Create `android/key.properties`:
   ```properties
   storePassword=your_password
   keyPassword=your_password
   keyAlias=romo
   storeFile=../romo-release-key.jks
   ```

2. Update `android/app/build.gradle`:
   ```gradle
   def keystorePropertiesFile = rootProject.file("key.properties")
   def keystoreProperties = new Properties()
   keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

   android {
       signingConfigs {
           release {
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
               storeFile file(keystoreProperties['storeFile'])
               storePassword keystoreProperties['storePassword']
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

3. Build:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## Distributing the APK

### Google Play Store

1. **Create Google Play Developer account** ($25 one-time fee)
2. **Create app listing** with:
   - App name and description
   - Screenshots (phone and tablet)
   - Feature graphic
   - App icon
   - Privacy policy
3. **Upload AAB** (Android App Bundle) instead of APK:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
4. **Submit for review** (1-3 days typically)

### Alternative Stores

- **APKPure**: https://apkpure.com/submit/app
- **Amazon Appstore**: https://developer.amazon.com/appsandservices
- **F-Droid**: https://f-droid.org/en/docs/Submitting_to_F-Droid_Quick_Start_Guide/
- **Samsung Galaxy Store**: https://seller.samsungapps.com/

### Direct Distribution

- Host on your website
- Share via email/messaging
- Upload to file sharing services
- QR code for easy download

## Troubleshooting

### Build Fails

**Error: "SDK location not found"**
```bash
# Set ANDROID_HOME
export ANDROID_HOME=/path/to/android/sdk

# Or create android/local.properties
echo "sdk.dir=/path/to/android/sdk" > android/local.properties
```

**Error: "Gradle sync failed"**
- Ensure Java JDK 17 is installed
- Run `java -version` to verify
- In Android Studio: File > Invalidate Caches / Restart

**Error: "Execution failed for task ':app:mergeDebugResources'"**
- Clean the project: `cd android && ./gradlew clean`
- Delete `android/.gradle` folder
- Try building again

### APK Won't Install

**"App not installed" error**
- Uninstall previous version first
- Check if APK is corrupted (re-download)
- Ensure "Install from unknown sources" is enabled

**"Parse error"**
- APK may be corrupted
- Rebuild the APK
- Check Android version compatibility

### App Crashes on Launch

- Check Android Studio logcat for errors
- Ensure web build completed successfully
- Run `npx cap sync android` again
- Check browser console for JavaScript errors

## APK Size Optimization

Current APK size: ~7MB (debug build)

To reduce size:

1. **Enable ProGuard/R8** (already enabled in release builds)
2. **Remove unused resources**:
   ```gradle
   android {
       buildTypes {
           release {
               minifyEnabled true
               shrinkResources true
           }
       }
   }
   ```

3. **Use App Bundles** instead of APKs for Play Store
4. **Split by ABI** for native code:
   ```gradle
   splits {
       abi {
           enable true
           reset()
           include 'armeabi-v7a', 'arm64-v8a'
           universalApk false
       }
   }
   ```

## Testing on Devices

### Physical Devices

1. Enable Developer Options on phone
2. Enable USB Debugging
3. Connect via USB
4. Run: `adb install path/to/app.apk`

### Emulators

1. Open Android Studio
2. Tools > Device Manager
3. Create Virtual Device
4. Start emulator
5. Drag and drop APK onto emulator

### Remote Testing

- Use Firebase Test Lab
- Use BrowserStack
- Use Samsung Remote Test Lab

## Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/ROMO/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/ROMO/discussions)

---

**Happy Building! 🦦**
