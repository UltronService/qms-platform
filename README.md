# qms-platform

叫號機公版框架（core + brand packs + multi-brand URLs）

- Owner: **UltronService**（private）
- Phase 1: `core/` loads `brands/<brandId>/brand.json` and renders `portrait-menu` / `landscape-queue`
- Runtime state key: `qms_state_v1`（spirit of `guiji_qms_state_v1`）
- Android Kiosk WebView skeleton: `shell/android/` (merged from PR #1)

## Public demo (Phase 1 Web)

Static Phase 1 Web ships from this repo root (`index.html`, `core/`, `brands/`). Target URL:

**https://ultronservice.github.io/qms-platform/**

- Default brand: **龜記** (`guiji`) with **`portrait-menu`** (1080×1920), via `window.__QMS_BRAND_ID__` in `index.html`.
- Production packaging: `window.__QMS_PRODUCTION__ = true` — debug shortcuts (T / double-click / Demo) are off; long-press the logo for store mute.
- Other brands: `?brand=<brandId>` (e.g. `?brand=guiji`).

**Enable Pages (org admin, one-time — same pattern as [guiji-qms-menu](https://github.com/UltronService/guiji-qms-menu)):**

1. Repo **Settings → Pages → Build and deployment → Source** → **Deploy from a branch**.
2. Branch **`main`**, folder **`/ (root)`**, save.
3. If the repo stays **private**, either make it **public** (simplest for a public demo) or use an org plan that allows **public** Pages from private repos (GitHub Team / Enterprise).

**Status (2026-09-19):** Pages is **not live yet**. The cloud agent token cannot call the Pages admin API (`403 Resource not accessible by integration`) or change repo visibility. An UltronService org owner/admin must complete the steps above.

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
