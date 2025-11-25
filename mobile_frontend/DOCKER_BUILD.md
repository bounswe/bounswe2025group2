# Docker Build Instructions for React Native Android APK

This guide explains how to build a release APK for the React Native mobile app using Docker.

## Prerequisites

- Docker installed and running
- Sufficient disk space (Android SDK and build tools require several GB)

## Building the APK

### Step 1: Build the Docker Image

From the `mobile_frontend` directory, run:

```bash
docker build -t mobile-app-builder .
```

This will:
- Install Android SDK and build tools
- Install Node.js dependencies
- Bundle React Native JavaScript
- Build the release APK

### Step 2: Extract the APK

After the build completes, extract the APK from the Docker container:

```bash
# Create a container from the image (without running it)
docker create --name apk-extractor mobile-app-builder

# Copy the APK to your local machine
docker cp apk-extractor:/app/android/app/build/outputs/apk/release/app-release.apk ./app-release.apk

# Clean up the container
docker rm apk-extractor
```

Alternatively, you can run the container and copy the file:

```bash
docker run --name temp-builder mobile-app-builder
docker cp temp-builder:/app/android/app/build/outputs/apk/release/app-release.apk ./app-release.apk
docker rm temp-builder
```

## One-Line Command

You can combine everything into a single command:

```bash
docker build -t mobile-app-builder . && docker create --name apk-extractor mobile-app-builder && docker cp apk-extractor:/app/android/app/build/outputs/apk/release/app-release.apk ./app-release.apk && docker rm apk-extractor
```

## Notes

- **Signing**: The current build configuration uses the debug keystore for release builds. For production, you should:
  1. Generate a proper release keystore
  2. Configure it in `android/app/build.gradle`
  3. Provide the keystore file and credentials securely (via environment variables or Docker secrets)

- **Build Time**: The first build will take longer as it downloads Android SDK components (~10-15 minutes). Subsequent builds will be faster.

- **APK Location**: The built APK will be at:
  - Inside container: `/app/android/app/build/outputs/apk/release/app-release.apk`
  - After extraction: `./app-release.apk` (in the mobile_frontend directory)

## Troubleshooting

- If the build fails due to license acceptance, the Dockerfile includes automatic license acceptance, but you may need to manually accept licenses on first run
- If you encounter memory issues, increase Docker's memory allocation in Docker Desktop settings
- For faster builds, consider using Docker BuildKit: `DOCKER_BUILDKIT=1 docker build -t mobile-app-builder .`
