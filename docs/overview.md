# 公版 vs 品牌包

## 白話
共用叫號引擎（core）負責掃碼、叫號狀態、歷史；品牌包（brand pack）只換外觀、文案、素材與版型開關。

## 原則
- **core**：叫號邏輯與 runtime state（對齊 `guiji_qms_state_v1`：`current` / `history` / `prefs` / `updatedAt`）
- **brands/<id>/**：`brand.json` + 靜態資產；不改 core
- **shell/**：Android Kiosk 載入某品牌靜態包；可注入 `deviceId`，不覆寫 brand theme
- Firebase：Phase 1 不動

## layout
- `portrait-menu`：直式 1080×1920 叫號+菜單
- `landscape-queue`：橫式 1920×1080 廣告+取餐牆
