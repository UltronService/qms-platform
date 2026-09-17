# shell/

Android Kiosk loads a brand static pack (`file:///android_asset/...` or a local path).  
This tree is the **minimal WebView shell** (`com.ultron.qms.shell`). UltronPlayer / shared player, Firebase, and brand assets are **out of scope**.

Do not hardcode brand colors in the shell.

## Embed a brand static pack

Copy a built brand static pack (HTML/JS/CSS + `brand.json` + media) into **one** of these locations before assembling the APK.

### A. Single-brand APK — `assets/www/`

```
shell/android/app/src/main/assets/www/
  index.html
  brand.json
  ...
```

Load URL:

```
file:///android_asset/www/index.html
```

### B. Multi-brand APK — `assets/brands/<id>/`

```
shell/android/app/src/main/assets/brands/guiji/
  index.html
  brand.json
  ...
```

Load URL:

```
file:///android_asset/brands/guiji/index.html
```

`<id>` must match `brandId` (see below). This skeleton ships **no** brand files; missing pack shows a native error, not a blank WebView.

### C. Field override — `/sdcard/qms/<brand>/`

If present, this wins over embedded assets (hot-swap without rebuilding the APK):

```
/sdcard/qms/<brandId>/index.html
```

Example: `/sdcard/qms/guiji/index.html`.  
Android 11+ may need `MANAGE_EXTERNAL_STORAGE` (see Manifest TODOs). Until that is granted, keep the pack inside `assets/`.

### Resolve order

1. `/sdcard/qms/<brandId>/index.html` if the file exists  
2. `assets/brands/<brandId>/index.html`  
3. `assets/www/index.html`  
4. Else: **missing-pack** full-screen error listing every path tried

## brandId (flavor or setting)

1. **Build flavor / Gradle property** (baked into `BuildConfig.BRAND_ID`):

   ```bash
   cd shell/android
   ./gradlew :app:assembleGenericDebug -Pqms.brandId=guiji
   ```

   Default property: `qms.brandId=www` in `gradle.properties`.  
   Add a real product flavor per brand when you need a distinct `applicationIdSuffix` — see the example in `app/build.gradle.kts`.

2. **Runtime setting** (optional override, does not rebuild): SharedPreferences file `qms_shell`, key `brand_id`. If unset, the flavor/`BuildConfig` value is used.

## Inject `deviceId` — do not overwrite `brand.json`

`brand.json` may reserve `deviceId` / `storeId`. The shell **never writes** pack files.

After `index.html` loads, the activity injects:

```js
window.__QMS_SHELL__ = { brandId: "<id>", deviceId: "<id>" };
```

If the page already exposed runtime state (`window.__QMS_STATE__`), the shell copies `deviceId` into the reserve field **only when it is missing/empty**. A non-empty value is left untouched.

`deviceId` source: SharedPreferences `qms_shell` / `device_id`, else `Settings.Secure.ANDROID_ID`.

Frontend owns TTS failure UX (page badge only). The shell does not implement TTS.

## Kiosk checklist (Phase 1)

| Item | Skeleton |
| --- | --- |
| `BOOT_COMPLETED` auto-start | Receiver stub in Manifest; may need device-owner / launcher to start an Activity on Android 10+ |
| Fullscreen + keep screen on | Theme + `FLAG_KEEP_SCREEN_ON` + immersive sticky |
| WebView: JS, HW accel, `mediaPlaybackRequiresUserGesture=false` | Set in `KioskActivity` |
| Force audio resume on start | Audio focus + JS `audio/video.play()` |
| USB HID focus; no soft keyboard steal | `stateAlwaysHidden`; activity keeps window focus. Barcode HID input field is a later TODO |
| Missing-pack clear error | Native `TextView`, not a blank WebView |
| Audio unlock on start; TTS fail → page badge only | Unlock = shell; TTS badge = brand page |
| Optional inject `deviceId` into page state reserve | JS inject; **never** rewrite `brand.json` |
| Do not hardcode brand colors | Neutral black/white error chrome only |

## Layout

```
shell/
  README.md                 ← this file
  android/                  ← Gradle app (`com.ultron.qms.shell`)
    app/src/main/java/com/ultron/qms/shell/
      KioskActivity.kt
      BrandPackLocator.kt
      BootReceiver.kt
      ShellSettings.kt
    app/src/main/AndroidManifest.xml
```

## Build

Requires Android SDK / JDK 17+. This repo does not vendor an SDK.

```bash
cd shell/android
./gradlew :app:assembleGenericDebug
```

## Out of scope

- UltronPlayer shared player  
- Firebase  
- Brand static packs (`brands/guiji/` stays in the platform repo, not inside this APK until you copy it)
