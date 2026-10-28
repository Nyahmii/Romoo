#!/bin/bash

# ROMO Android APK Build Script
# Usage: ./build-apk.sh [--release]

set -e

echo "🦦 ROMO Android APK Builder"
echo "==========================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

# Check for Java
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java JDK 17+ first."
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ Java: $(java -version 2>&1 | head -1)"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Build web app
echo "📦 Building web app..."
npm run build
echo "✅ Web app built successfully"
echo ""

# Check if android platform exists
if [ ! -d "android" ]; then
    echo "📱 Adding Android platform..."
    npx cap add android
    echo ""
fi

# Sync web assets
echo "🔄 Syncing web assets to Android..."
npx cap sync android
echo "✅ Sync complete"
echo ""

# Build APK
if [ "$1" = "--release" ]; then
    echo "🔨 Building RELEASE APK..."
    echo "⚠️  Note: For a proper release build, you need to sign the APK."
    echo "   Use Android Studio for signed builds: Build > Generate Signed Bundle/APK"
    echo ""
    cd android
    ./gradlew assembleRelease
    cd ..
    APK_PATH="android/app/build/outputs/apk/release/app-release-unsigned.apk"
else
    echo "🔨 Building DEBUG APK..."
    cd android
    ./gradlew assembleDebug
    cd ..
    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
fi

echo ""
echo "✅ Build complete!"
echo "📱 APK Location: $APK_PATH"
echo ""

# Show APK size
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "📊 APK Size: $APK_SIZE"
    echo ""
fi

echo "📲 Installation Options:"
echo "   1. USB: Copy APK to phone and install"
echo "   2. ADB: adb install $APK_PATH"
echo "   3. Email/Cloud: Send APK to yourself"
echo ""
echo "🦦 Done! Enjoy ROMO!"
