# Mobile Frontend

This is the mobile frontend of our project, built with React Native.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [React Native CLI](https://reactnative.dev/docs/environment-setup)
- [Android Studio](https://developer.android.com/studio) with Android SDK
- An Android emulator configured in Android Studio, or a physical Android device

## Setup Instructions

1. **Navigate to the mobile frontend directory:**
```bash
   cd mobile-frontend
```
2. **Install dependencies**
```bash
      npm install
```
3. **Running the Application
⚠️ Important: You need to run the following commands in two separate terminal windows, both opened in Administrator mode.
Step 1: Start Metro Bundler
Open your first terminal (as Administrator) and run:**
```bash
      npx react-native start
```
**Keep this terminal running. Metro Bundler must remain active while the app is running.
Step 2: Launch the App
Open a second terminal (as Administrator) and run:**
```bash
      npx react-native run-android
```
## Troubleshooting

**Metro Bundler not starting: Ensure port 8081 is not in use by another application
Build failures: Try cleaning the build with cd android && ./gradlew clean && cd ..
Emulator not detected: Verify your emulator is running before executing run-android**
