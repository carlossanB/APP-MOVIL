# APP-GM Task Dashboard — Deployment Guide

> Build target: **Android only** (APK + AAB)

---

## Step 1 — Generate the Release Keystore

Run this **once** from any terminal. Store the `.jks` file safely — **never commit it to Git**.

```bash
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore android/app/taskdashboard-release.jks \
  -alias taskdashboard \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=TaskDashboard, OU=Mobile, O=YourCompany, L=City, ST=State, C=US"
```

> ⚠️ Replace `YOUR_STORE_PASSWORD` and `YOUR_KEY_PASSWORD` with strong secrets.

---

## Step 2 — Store Credentials Securely in `gradle.properties`

Open (or create) `android/gradle.properties` and append:

```properties
# Release signing credentials — DO NOT commit these to version control
MYAPP_STORE_FILE=taskdashboard-release.jks
MYAPP_STORE_PASSWORD=YOUR_STORE_PASSWORD
MYAPP_KEY_ALIAS=taskdashboard
MYAPP_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

Add `android/gradle.properties` to `.gitignore` if it isn't already.

---

## Step 3 — Configure Signing in `android/app/build.gradle`

Inside the `android { ... }` block, add the `signingConfigs` and update `buildTypes`:

```gradle
android {
    ...

    signingConfigs {
        release {
            storeFile     file(MYAPP_STORE_FILE)
            storePassword MYAPP_STORE_PASSWORD
            keyAlias      MYAPP_KEY_ALIAS
            keyPassword   MYAPP_KEY_PASSWORD
        }
    }

    buildTypes {
        release {
            signingConfig          signingConfigs.release
            minifyEnabled          true
            shrinkResources        true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                          'proguard-rules.pro'
        }
    }
}
```

---

## Step 4 — Build the Release APK

```bash
# From project root (TaskDashboard/)
cd android
./gradlew assembleRelease
```

**Output file:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Step 5 — Build the AAB (Google Play Store)

```bash
cd android
./gradlew bundleRelease
```

**Output file:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

Upload the `.aab` file to the **Google Play Console** → Production track.

---

## Step 6 — Verify the APK Signature

```bash
# Confirm the APK is signed correctly before distributing
apksigner verify --print-certs \
  android/app/build/outputs/apk/release/app-release.apk
```

---

## Step 7 — (Optional) Run on Device for Final QA

```bash
# Install the release APK directly on a connected device
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## Security Checklist

- [ ] Keystore file **not** committed to Git
- [ ] `gradle.properties` added to `.gitignore`
- [ ] ProGuard enabled (`minifyEnabled true`)
- [ ] Resources shrunk (`shrinkResources true`)
- [ ] APK signature verified with `apksigner`
