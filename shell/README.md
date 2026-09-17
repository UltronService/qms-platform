# shell/

Android Kiosk loads a brand static pack (`file:///android_asset/...` or local path).

## Checklist (Phase 1)
- BOOT_COMPLETED + fullscreen / Keep screen on
- WebView: JS, HW accel, mediaPlaybackRequiresUserGesture=false
- Audio unlock on start; TTS fail → page badge only
- USB HID focus; no soft keyboard steal
- Optional inject `deviceId` into page state reserve field
- Do not hardcode brand colors in the shell

Empty Android project skeleton (`com.ultron.qms.shell`) to be added by Android via Cursor when capacity allows.
