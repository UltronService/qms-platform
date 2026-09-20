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

## Admin CMS 視覺預覽（假資料 · 無 API）

Ant Design React 後台預覽，供利害關係人點擊走查；按鈕與表單皆為前端假動作，不含真實憑證或後端。

**GitHub Pages（合併後，需已啟用 Pages）：**

| 頁面 | 網址 |
| --- | --- |
| 登入 | https://ultronservice.github.io/qms-platform/admin/#/login |
| 品牌列表 | https://ultronservice.github.io/qms-platform/admin/#/brands |
| 品牌編輯 | https://ultronservice.github.io/qms-platform/admin/#/brands/1/edit |

- 登入頁不含帳密提示（UI 走查原則）；內部走查帳密：`admin` / `preview`
- 本地開發：`cd admin && npm install && npm run dev`，開啟終端機顯示的 localhost 網址
- 重新建置靜態檔：`cd admin && npm run build`（產出會寫入 `admin/index.html` 與 `admin/assets/` 供 Pages 部署）

## Test

```bash
npm test
```
