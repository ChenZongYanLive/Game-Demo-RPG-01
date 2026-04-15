# 2D 動作 RPG（Web）工具與專案規劃

## Context

目前 `Game-Demo-RPG-01` 倉庫是空的（僅有 README.md）。使用者要做一款 **2D 動作 RPG**，使用 **TypeScript**，跑在 **網頁瀏覽器**，目標是 **完整原型**：多關卡、技能樹、物品系統。

本規劃的目的是：在動手寫程式前，先決定要採用哪些工具（引擎、編輯器、建置工具、資產來源等），並定義專案結構與關鍵系統，讓後續開發能聚焦在遊戲邏輯而非選型。

---

## 推薦技術棧

| 面向 | 工具 | 為什麼 |
|---|---|---|
| **遊戲引擎** | **Phaser 3** (`phaser@3.x`) | 目前 JS/TS 2D 遊戲最成熟的選擇。內建場景系統、Tilemap、Arcade/Matter 物理、動畫、輸入、音效、Particle、Tween，幾乎涵蓋動作 RPG 所需的一切，文件與社群範例最多。 |
| **語言** | **TypeScript 5.x** | 動作 RPG 的狀態機、技能、物品系統容易失控，型別系統能大幅降低維護成本。Phaser 官方有 `.d.ts`。 |
| **建置工具** | **Vite** | 熱更新快、設定少、對 TS 原生友好，Phaser 官方也推薦。 |
| **地圖編輯** | **Tiled Map Editor**（免費） | 事實上的 2D tilemap 標準，匯出 JSON 後 Phaser 可直接載入，包含圖層、物件層（出生點、NPC、觸發區）、碰撞。 |
| **像素美術** | **Aseprite**（付費，強烈推薦）或 **LibreSprite / Piskel**（免費替代） | 專為 pixel art 與角色動畫設計，動畫時間軸匯出 spritesheet 非常順。 |
| **免費資產** | **Kenney.nl**、**OpenGameArt.org**、**itch.io free assets**（Pixel Frog、Penzilla 等） | 原型階段直接用現成素材，不要卡在畫圖。 |
| **音效 / 音樂** | **sfxr / Bfxr / jsfxr**（SFX）、**BeepBox**（音樂）、**Freesound.org** | 快速產生 8-bit 風格音效，符合 Demo 需求。 |
| **測試** | **Vitest** | 與 Vite 無縫整合，用來單元測試遊戲邏輯（傷害計算、物品堆疊、技能公式等非渲染邏輯）。 |
| **程式品質** | **ESLint + Prettier** | 基本配備。 |
| **版控** | **Git**（已啟用） | — |
| **部署** | **GitHub Pages / Netlify / Vercel** | Vite build 出的靜態檔案直接丟上去即可。 |

> **備選引擎簡評**（最終仍推薦 Phaser 3）：
> - *ExcaliburJS* — TypeScript-first 很漂亮，但社群與資產較少。
> - *PixiJS* — 只是 renderer，物理、輸入、場景都要自己寫，不適合原型階段。
> - *melonJS* — 輕量但生態系遠小於 Phaser。
> - *Godot + Web export* — 體驗很好，但語言是 GDScript/C#，不符合「JS/TS」的偏好。

---

## 建議專案結構

```
Game-Demo-RPG-01/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── assets/
│       ├── tilemaps/       # Tiled 匯出的 .json + tileset 圖片
│       ├── sprites/        # 角色、怪物、特效 spritesheet
│       ├── ui/             # 血條、邊框、icon
│       └── audio/          # .ogg / .mp3
└── src/
    ├── main.ts             # Phaser Game 實例入口
    ├── scenes/
    │   ├── BootScene.ts        # 最小資源載入 + 初始化
    │   ├── PreloadScene.ts     # 進度條、載入所有資產
    │   ├── MainMenuScene.ts
    │   ├── WorldScene.ts       # 主要探索場景
    │   ├── CombatScene.ts      # 若要切換戰鬥畫面；動作 RPG 通常直接整合進 WorldScene
    │   └── UIScene.ts          # 覆蓋在遊戲上的 HUD / 選單
    ├── entities/
    │   ├── Player.ts
    │   ├── Enemy.ts
    │   └── Projectile.ts
    ├── systems/
    │   ├── CombatSystem.ts     # 傷害、擊退、無敵時間
    │   ├── InventorySystem.ts
    │   ├── SkillTreeSystem.ts
    │   ├── QuestSystem.ts
    │   └── SaveSystem.ts       # localStorage 存檔
    ├── data/                   # 純 JSON / TS const，資料驅動
    │   ├── items.ts
    │   ├── skills.ts
    │   ├── enemies.ts
    │   └── dialogues.ts
    ├── ui/
    │   ├── HealthBar.ts
    │   ├── InventoryPanel.ts
    │   └── SkillTreePanel.ts
    └── utils/
        └── math.ts, rng.ts, ...
```

關鍵原則：
- **資料驅動**：武器、技能、怪物、掉落全部寫成資料檔，`src/systems/*` 讀取這些資料執行邏輯。未來新增內容不用改程式。
- **Scene 分層**：`UIScene` 獨立於 `WorldScene`，這樣開啟選單時可以暫停遊戲世界但不暫停 UI。
- **Entity 繼承 `Phaser.Physics.Arcade.Sprite`**：動作 RPG 用 Arcade Physics 已足夠；碰撞、移動全部交給它處理。

---

## 要實作的核心系統（優先順序）

1. **玩家移動 + Tilemap 碰撞** — WASD / 方向鍵、與 Tiled 碰撞層整合。
2. **攻擊 + 敵人 AI + 傷害計算** — 最小戰鬥迴圈，包含 i-frames、擊退、死亡。
3. **HUD（HP/MP/經驗值）+ 升級曲線**。
4. **物品系統** — 背包、裝備欄、撿取、使用消耗品。資料在 `data/items.ts`。
5. **技能樹** — 節點依賴 + 技能點；技能效果由 `CombatSystem` 讀取。
6. **多關卡 / 關卡切換** — 用 `WorldScene.restart({ mapKey })` 重新載入不同 Tiled map。
7. **存檔系統** — `SaveSystem` 序列化 Player 狀態 + 旗標到 `localStorage`。
8. **NPC 對話 + 任務旗標** — 最小可用即可，資料驅動。

---

## 資產流程

1. 在 **Tiled** 畫關卡 → 匯出 JSON → 放 `public/assets/tilemaps/`。
2. 在 **Aseprite**（或 Piskel）畫 sprite → 匯出 spritesheet + JSON → 放 `public/assets/sprites/`。
3. 在 `PreloadScene` 用 `this.load.tilemapTiledJSON(...)` / `this.load.atlas(...)` 載入。
4. **原型期直接使用 Kenney / itch.io 的免費包**，先把系統做完，再換成自製美術。

---

## Milestones（依序推進，不綁時間）

- **M0 — Setup**：`npm create vite@latest` + 安裝 Phaser、配 ESLint/Prettier/Vitest、跑出一個空場景。
- **M1 — Walk-on-map**：Tiled 地圖 + 玩家移動 + 碰撞。
- **M2 — Combat loop**：攻擊、敵人、死亡、掉落。
- **M3 — RPG systems**：HUD、背包、裝備、升級。
- **M4 — Skill tree + 多關卡**：切場景、技能解鎖。
- **M5 — Save / Menu / Polish**：存讀檔、主選單、音效、小特效。
- **M6 — Deploy**：`vite build` → 部署 GitHub Pages。

---

## 初始要修改 / 新增的關鍵檔案

倉庫目前僅有 `README.md`，以下檔案在 M0 會首次建立：

- `package.json`、`tsconfig.json`、`vite.config.ts`、`index.html`
- `src/main.ts`（Phaser `Game` 設定：解析度、physics、scene list）
- `src/scenes/BootScene.ts`、`src/scenes/PreloadScene.ts`、`src/scenes/MainMenuScene.ts`、`src/scenes/WorldScene.ts`
- `public/assets/`（先放一組 Kenney 的 tileset 與一個玩家 sprite）
- `.gitignore`（`node_modules/`、`dist/`）

---

## 驗證方式（end-to-end）

每個 Milestone 完成後應能執行以下檢查：

1. `npm run dev` — Vite 啟動，瀏覽器開 `http://localhost:5173`，畫面能顯示對應 Milestone 的功能。
2. `npm run build && npm run preview` — 驗證 production build 沒有壞掉。
3. `npm run test` — Vitest 跑 `src/systems/*` 的單元測試（例如 `CombatSystem.calcDamage()`、`InventorySystem.addItem()` 的邊界情況）。
4. `npx tsc --noEmit` — 型別檢查通過。
5. **手動遊玩測試**：開瀏覽器實際操作，檢查：走路、攻擊、撿物品、升級、開背包、切關卡、存檔後重整網頁能讀回。
6. 部署後：在實際網址上再跑一次手動測試，確認資產路徑沒問題（Phaser 的 asset path 在部署到子目錄時最容易出錯）。

---

## 下一步

若同意此技術棧，進入實作階段後的第一個 PR 會是 **M0 Setup**：初始化 Vite + TypeScript + Phaser 3，跑出一個顯示「Hello RPG」的空場景作為骨架。
