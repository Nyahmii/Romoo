@echo off
REM ROMO Android APK Build Script for Windows
REM Usage: build-apk.bat [--release]

echo 🦦 ROMO Android APK Builder
echo ===========================
echo.

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18+ first.
    pause
    exit /b 1
)

REM Check for Java
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Java is not installed. Please install Java JDK 17+ first.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo ✅ Java found
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Build web app
echo 📦 Building web app...
call npm run build
echo ✅ Web app built successfully
echo.

REM Check if android platform exists
if not exist "android" (
    echo 📱 Adding Android platform...
    call npx cap add android
    echo.
)

REM Sync web assets
echo 🔄 Syncing web assets to Android...
call npx cap sync android
echo ✅ Sync complete
echo.

REM Build APK
if "%1"=="--release" (
    echo 🔨 Building RELEASE APK...
    echo ⚠️  Note: For a proper release build, you need to sign the APK.
    echo    Use Android Studio for signed builds: Build ^> Generate Signed Bundle/APK
    echo.
    cd android
    call gradlew.bat assembleRelease
    cd ..
    set APK_PATH=android\app\build\outputs\apk\release\app-release-unsigned.apk
) else (
    echo 🔨 Building DEBUG APK...
    cd android
    call gradlew.bat assembleDebug
    cd ..
    set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk
)

echo.
echo ✅ Build complete!
echo 📱 APK Location: %APK_PATH%
echo.

echo 📲 Installation Options:
echo    1. USB: Copy APK to phone and install
echo    2. ADB: adb install %APK_PATH%
echo    3. Email/Cloud: Send APK to yourself
echo.
echo 🦦 Done! Enjoy ROMO!
pause
