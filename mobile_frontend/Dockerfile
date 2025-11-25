# React Native Android Release APK Builder
FROM eclipse-temurin:17-jdk

# Install required packages
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    git \
    curl \
    python3 \
    make \
    g++ \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Set environment variables for Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=${ANDROID_HOME}
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/tools

# Install Android SDK Command Line Tools
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    cd ${ANDROID_HOME}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip commandlinetools-linux-11076708_latest.zip && \
    rm commandlinetools-linux-11076708_latest.zip && \
    mv cmdline-tools latest

# Accept Android SDK licenses and install required components
RUN yes | sdkmanager --licenses || true
RUN sdkmanager \
    "platform-tools" \
    "platforms;android-35" \
    "build-tools;35.0.0" \
    "ndk;27.1.12297006" \
    "cmake;3.22.1"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy project files
COPY . .

# Create assets directory for bundle
RUN mkdir -p android/app/src/main/assets

# Bundle React Native JavaScript and assets
RUN npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res/

# Build release APK
WORKDIR /app/android
# Verify gradlew exists and fix line endings (Windows to Unix), then make executable
RUN ls -la && \
    test -f gradlew || (echo "gradlew not found!" && exit 1) && \
    sed -i 's/\r$//' gradlew && \
    chmod +x gradlew
RUN bash gradlew clean assembleRelease

# The APK will be available at:
# /app/android/app/build/outputs/apk/release/app-release.apk
