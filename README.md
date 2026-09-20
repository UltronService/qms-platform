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

## Portrait vs landscape (preview URLs)

Default GitHub Pages entry is **portrait** (`portrait-menu`, 1080×1920).

- **Portrait preview:** open `/` (or `/?brand=guiji`).
- **Landscape preview:** open `/?layout=landscape-queue` (1920×1080, left ad / right queue wall).
- **Vertical history:** add `&history=vertical` (default is horizontal, new number on the left / bottom).

Permanent layout still comes from **`brand.layout`** in the brand pack; query params only override for stakeholder preview (no core fork).

## Motion v1 (call display — acceptance checklist)

Aligned with [guiji-qms-menu](https://github.com/UltronService/guiji-qms-menu) index.html:

- **Main:** highest visual weight; ~0.4s pop (small → slight overshoot → settle); re-call same number replays pop; auto-shrink font when &gt;4 digits.
- **Standby:** main + history hidden together; waking → logo returns first (~0.48s), then main pop.
- **History:** max **2**; smaller / lower contrast than main; gap ≈ 30% of main digit height; enter / push / exit slide+fade only on **new call** (not refresh / clear / layout change). Horizontal = new left; vertical = new bottom.
- **Production:** no debug panel; preview only via `?preview=1`.

## Smoke-test (main pop + history push)

Production build keeps T / Demo off. Use the gated preview flag:

1. Open `/?preview=1` (portrait) or `/?preview=1&layout=landscape-queue` (landscape).
2. Click the green banner (not the logo) or press **Space** / **Enter** — each step advances 321→330 and loops.
3. Expect: main number pops; previous main slides into history (max 2) with push animation; third push drops the oldest with slide-out fade.
4. Repeat the same number: main pops again; history stays put.

## Test

```bash
npm test
```
