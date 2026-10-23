#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo "StockPilot Nigeria — Android Release APK Packager"
echo "=================================================="

# Determine Version from package.json
PKG_VERSION=$(node -p "require('./package.json').version")
echo "Building StockPilot Nigeria APK version: v${PKG_VERSION}"

# Check Java Runtime
if ! command -v javac &> /dev/null; then
  echo "ERROR: Java Development Kit (JDK 17+) is required to compile native Android APKs."
  echo "Please install OpenJDK 17 or run this within GitHub Actions."
  exit 1
fi

# 1. Clean Prebuild Native Android Project
echo "Step 1: Running Expo Continuous Native Generation (CNG)..."
EXPO_NO_TELEMETRY=1 npx expo prebuild --platform android --clean --no-install

# 2. Build Release APK via Gradle
echo "Step 2: Compiling Release APK with Gradle..."
cd android
chmod +x gradlew
./gradlew assembleRelease --no-daemon -Dorg.gradle.jvmargs="-Xmx4096m -XX:MaxMetaspaceSize=1024m"

# 3. Handle APK signing if unsigned
UNSIGNED_APK=$(find app/build/outputs/apk -type f -name "*unsigned.apk" | head -n 1 || true)
if [ -n "$UNSIGNED_APK" ]; then
  echo "Step 3: Signing unsigned APK with debug keystore..."
  KEYSTORE="app/debug.keystore"
  if [ ! -f "$KEYSTORE" ]; then
    KEYSTORE="$HOME/.android/debug.keystore"
    if [ ! -f "$KEYSTORE" ]; then
      mkdir -p "$HOME/.android"
      keytool -genkey -v -keystore "$KEYSTORE" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=StockPilot, OU=App, O=StockPilot, L=Lagos, S=Lagos, C=NG"
    fi
  fi
  TARGET_APK="${UNSIGNED_APK/-unsigned/}"
  cp "$UNSIGNED_APK" "$TARGET_APK"
  jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$KEYSTORE" -storepass android -keypass android "$TARGET_APK" androiddebugkey
fi

cd ..

# 4. Copy to build artifacts
mkdir -p build-artifacts
APK_PATH=$(find android/app/build/outputs/apk -type f -name "*release*.apk" ! -name "*unsigned*.apk" | head -n 1)
if [ -z "$APK_PATH" ]; then
  APK_PATH=$(find android/app/build/outputs/apk -type f -name "*.apk" | head -n 1)
fi

cp "$APK_PATH" "build-artifacts/StockPilot-Nigeria-v${PKG_VERSION}.apk"
cp "$APK_PATH" "build-artifacts/StockPilot-Nigeria.apk"

echo "=================================================="
echo "Successfully built and signed Android APK!"
echo "Output: build-artifacts/StockPilot-Nigeria-v${PKG_VERSION}.apk"
echo "=================================================="
ls -lh build-artifacts/
