# Mobile Frontend

This is the mobile frontend of our project, built with **React Native**.

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

* [Node.js](https://nodejs.org/) (LTS version is recommended)
* [React Native CLI](https://reactnative.dev/docs/environment-setup)
* [Android Studio](https://developer.android.com/studio) with the Android SDK
* An Android emulator configured in Android Studio, **or** a physical Android device

---

## Setup & Running Instructions

Follow these steps to get the application running on your Android emulator or device.

### 1. Navigate and install dependencies

Open a terminal, navigate to the project's mobile frontend directory, and install dependencies:

```bash
# Navigate to the correct folder
cd mobile_frontend

# Install all required packages
npm install
```

---

### 2. Run the application

You will need two separate terminals, both pointed at the `mobile_frontend` directory.

#### Terminal 1 — Start the Metro bundler

This terminal watches for file changes and serves the JavaScript bundle:

```bash
# From mobile_frontend directory
npx react-native start
```

Leave this terminal running.

#### Terminal 2 — Build and launch on Android

In the second terminal (also in `mobile_frontend`), run:

```bash
# From mobile_frontend directory
npx react-native run-android
```
## Troubleshooting

This builds the app and installs it on the connected device or running emulator. If the build succeeds, the app should launch automatically.

---

## Troubleshooting

### Metro bundler not starting

Ensure port `8081` is not already in use.

* **Windows**

```bash
netstat -ano | findstr :8081
```

* **macOS / Linux**

```bash
lsof -i :8081
```

If another process is using the port, stop that process or restart your machine.

---

### Build failures

Try cleaning the Android build cache:

```bash
cd android && ./gradlew clean && cd ..
```

Then re-run `npx react-native run-android`.

---

### Emulator not detected

Make sure the emulator is fully booted before running the build. Check connected devices:

```bash
adb devices
```

If no device is listed, start or reboot the emulator (or connect a physical device with USB debugging enabled).

---

## Additional tips

* Use `nvm` (or `nvm-windows`) to manage Node versions and avoid permission issues.
* If you use Android Studio, ensure the Android SDK platform versions required by the project are installed.
* If you run into Gradle or Java version issues, confirm your `JAVA_HOME` and Android SDK paths are set correctly.
* If you fail to run it in user mode, you may try to run the terminals in administrator mode, but it is generally not needed.
