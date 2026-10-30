# 魔法藥草筆記 · Grimoire Herbarium

以 GitHub Pages 托管的靜態網站，用來整理魔法藥草筆記。羊皮紙 × 煉金術風格，
目錄頁可依「掌管行星 / 代表元素 / 魔法屬性」篩選藥草。

## 檔案結構

```
├── index.html          # 目錄頁（篩選 + 卡片列表）
├── herb.html           # 藥草詳情頁（依 ?id= 顯示對應條目）
├── assets/
│   ├── style.css       # 羊皮紙 + 煉金術樣式
│   └── app.js          # 篩選與渲染邏輯（一般不需要改）
└── data/
    └── herbs.js        # ★ 所有藥草資料都在這裡，新增/修改只動這支檔案
```

## 上架到 GitHub Pages（約 5 分鐘）

1. 在 GitHub 開一個新 repository，例如 `grimoire-herbarium`
2. 把本資料夾所有檔案上傳到 repository 根目錄（`Add file → Upload files`）
3. 進入 `Settings → Pages`，Source 選 `Deploy from a branch`，
   Branch 選 `main` / `/ (root)`，儲存
4. 等約 1 分鐘，即可透過 `https://你的帳號.github.io/grimoire-herbarium/` 訪問

## 如何新增一筆藥草

1. 編輯 `data/herbs.js`，複製一份現有條目（大括號 `{ ... }` 整段），貼在 `];` 之前
2. 修改各欄位：
   - `id`：唯一英文代號（網址用，例如 `"rosemary"`），不能重複、不能有空白
   - `name` / `english` / `latin`：中文名、英文名、學名
   - `planet`：掌管行星（太陽 / 月亮 / 水星 / 金星 / 火星 / 木星 / 土星）
   - `element`：代表元素（火 / 水 / 風 / 土）
   - `deities`：相關神靈陣列
   - `magicProperties`：魔法屬性陣列（目錄頁的篩選選項會自動從所有條目收集）
   - `sections`：內文，每個 `{ title, paragraphs }` 是一個小節，
     `paragraphs` 是字串陣列，一個字串一個段落
   - `recipes`：配方（可整段省略），材料寫在 `ingredients: [{amount, item}]`
3. Commit 儲存，網站約 1 分鐘後自動更新

## 篩選邏輯

- 行星、元素為單選群組（同一群組內多選為 OR）
- 魔法屬性多選為 OR（任一命中即顯示）
- 不同群組之間為 AND
- 搜尋框比對名稱、學名、神靈與屬性

## 進階（可選）

- 想換行星/元素的煉金術符號：修改 `assets/app.js` 最上方的
  `PLANET_SYMBOLS` / `ELEMENT_SYMBOLS`
- 新增資料欄位（如「產地」「採收時節」）：在條目物件加上欄位，
  再於 `app.js` 的 `initHerb()` 或卡片模板中輸出即可
