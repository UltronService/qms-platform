# qms-platform

叫號機公版框架（core + brand packs + multi-brand URLs）

- Owner: **UltronService**（private）
- Phase 1: `core/` loads `brands/<brandId>/brand.json` and renders `portrait-menu` / `landscape-queue`
- Runtime state key: `qms_state_v1`（spirit of `guiji_qms_state_v1`）
- Android Kiosk WebView skeleton: `shell/android/` (merged from PR #1)

## Run (Web / static smoke)

```bash
python3 -m http.server 4173
```

Open http://localhost:4173/ — demo entry loads **brands/guiji** (`portrait-menu`, 1080×1920).

- Missing / unknown brand: `http://localhost:4173/?brand=does-not-exist` shows an error (no silent fallback).
- Production pack: `window.__QMS_PRODUCTION__ = true` in `index.html` — **T / double-click / Demo are off**. Long-press the logo for store mute.
- Android shell: `QMS.setDeviceId('...')` writes the reserved state field only (does not change theme).

## Portrait vs landscape

Switch via **`brand.layout`** in the brand pack (not a core fork):

- `"portrait-menu"` — 1080×1920, ~18% banner + menu, historyMax default 3 horizontal
- `"landscape-queue"` — 1920×1080, left ad / right queue wall

Example: set `brands/guiji/brand.json` `"layout"` to `landscape-queue`, reload.

## Test

```bash
npm test
```
