# 放視大賞 Vision Get Wild｜2027 一頁式資訊網站

純 HTML／CSS 靜態網站（僅中文版）。無後端、資料庫、表單、Cookie、追蹤碼或第三方程式庫；腳本僅有本站自有的 `judges.js`（評審名單折疊，未載入時名單全部展開）、`effects.js`（卡片光暈）與 `events-filter.js`（活動篩選）。

## 檔案結構

| 路徑 | 說明 |
|---|---|
| `index.html` | 首頁 |
| `404.html` | 找不到頁面（需在伺服器設定為 404 錯誤頁） |
| `styles.css` | 共用樣式 |
| `judges.js` | 評審名單折疊（WAI-ARIA disclosure 模式） |
| `effects.js` | 卡片滑鼠光暈（裝飾用；觸控裝置與「減少動態效果」時停用） |
| `news.html` | 最新消息列表（產生器產生，請勿手動修改） |
| `news-<id>.html` | 每則消息的內文頁（產生器產生，請勿手動修改） |
| `events.html` | 主題活動總覽與報名（產生器產生，請勿手動修改） |
| `privacy.html`、`copyright.html`、`faq.html` | 隱私權及資訊安全政策、著作權聲明、常見問題（產生器產生；內容請改 `_tools/pages/*.html`） |
| `events-filter.js` | 主題活動頁的日期篩選 |
| `_tools/` | 活動資料 `events.csv`、消息資料 `news.csv`、消息內文 `news/*.txt` 與產生器 `build_events.py`，**不可上傳至網站根目錄** |
| `vgw_website_assets/` | 圖片、Logo、圖示與下載檔；`*/web/` 為網頁實際使用的 WebP 壓縮版，原始檔保留於上層 |
| `vgw_website_assets/5_downloads/` | 參展辦法、競賽作業須知 PDF |
| `_deploy/` | nginx／Apache 安全設定範本，**不可上傳至網站根目錄** |

## 第三方套件與外部服務盤點

| 類別 | 名稱 | 用途 | 載入方式 |
|---|---|---|---|
| 程式庫／框架 | 無 | — | — |
| 網頁字型 | 無（使用作業系統內建字型） | — | — |
| 流量分析／追蹤碼 | 無 | — | — |
| 社群嵌入元件 | 無（分享改用瀏覽器內建 Web Share API） | — | — |
| 站外連結 | SurveyCake | 報名表單 | 僅超連結，標示為站外連結 |
| 站外連結 | Facebook、Instagram | 社群頁面 | 僅超連結 |
| 站外連結 | Google 地圖 | 展場位置 | 僅超連結 |

## 主題活動維護

1. 用 Excel 開啟 `_tools/events.csv`（UTF-8），一列一場活動。欄位：
   - `id`：小寫英數與連字號，不可重複（如 `forum-01`）
   - `date`（YYYY-MM-DD）、`start`／`end`（HH:MM）
   - `type`：`forum`、`talk`、`pitch`、`workshop`
   - `status`：`open`（報名中，必填報名網址）、`upcoming`（即將開放）、`full`（已額滿）、`closed`（已截止）
   - `register_url`：SurveyCake 表單網址，必須 `https://` 開頭
   - `featured`：`Y` 表示顯示在首頁（最多 3 場，依 CSV 列的先後順序排列；未標示時取最近 3 場）
   - 中文標題、講者、地點、語言、簡介（`_zh` 欄位；`_en` 欄位目前未使用）；`capacity` 名額
   - `image`（選填）：放在 `vgw_website_assets/7_events/` 的英文檔名，並填寫替代文字 `image_alt_zh`
2. 存檔時選「CSV UTF-8」。
3. 在專案資料夾執行 `python3 _tools/build_events.py`，會更新首頁的最新消息與精選活動，並重新產生 `news.html`、各則消息內文頁 `news-<id>.html` 與 `events.html`。
4. 表單額滿或截止時，記得把 `status` 改為 `full` 或 `closed` 並重新產生，網站不會自動得知表單狀態。

產生器會檢查必填欄位、日期時間格式，並拒絕非 https 的網址；所有文字都會轉義，避免 XSS。

## 最新消息維護

最新消息改由 `_tools/news.csv` 維護（Excel 開啟、存成 CSV UTF-8），與活動一起由 `python3 _tools/build_events.py` 產生：

| 欄位 | 說明 |
|---|---|
| `id` | 小寫英數與連字號，不可重複 |
| `source` | `official`（官網公告）、`facebook`、`instagram`、`event`（活動消息） |
| `date` | YYYY-MM-DD；活動消息可留空，自動帶入活動日期 |
| `url` | 外部連結，必須 `https://` 開頭（FB／IG 貼文按「⋯ → 複製連結」取得）；活動消息不需要 |
| `event_id` | 對應 `events.csv` 的 `id`，填寫後此則消息會連到「消息與活動」頁中該場活動卡片 |
| `title_zh` | 標題；活動消息可留空，自動帶入活動名稱（`title_en` 欄位目前未使用） |
| `home` | `Y` 表示顯示在首頁（最多 3 則；未標示時取最新 3 則） |

### 消息內文

每則消息點開後是獨立的內文頁 `news-<id>.html`，內文放在 `_tools/news/<id>.txt`（UTF-8 純文字，可用「文字編輯」或記事本編輯）：

- 空一行＝新段落；同一段內換行會保留
- `## 標題` 單獨一行＝段落小標
- 每行以 `- ` 開頭＝項目清單；以 `1. `、`2. ` 開頭＝編號清單
- 內文中的 `https://` 網址與 e-mail 會自動變成連結（網址標示為站外連結）

官網公告（`official`）必須有內文檔。活動消息（`event`）沒有內文檔時，會自動用活動的日期、地點與簡介產生一段說明，並附上活動卡片與報名按鈕。刪除 `news.csv` 的某一列後重新產生，對應的內文頁會一併移除。

不採用 FB／IG 嵌入外掛：會載入第三方程式與追蹤 Cookie，違反本站 CSP 及政府網站「不宜嵌入第三方社群小工具」之規範。

## 政策與說明頁

`privacy.html`、`copyright.html`、`faq.html` 的內文以放視大賞官網（2026-11-09 擷取）為底稿，隱私權政策與常見問題已依本站實況修訂，放在 `_tools/pages/` 的 HTML 片段，修改後執行 `python3 _tools/build_events.py` 重新產生。可使用 `<h2>`、`<p>`、`<ol>`／`<li>`；常見問題用 `<h2>` 分類，每題 `<div><dt>問題</dt><dd>回答</dd></div>`。

## 版本控制與典藏

- 本資料夾已建立 Git 儲存庫（`.gitignore` 排除 `.DS_Store` 等系統檔）。每次修改後提交，並定期備份至機關指定位置，確認備份可還原。
- 本站為純靜態檔案，整個資料夾即可作為網站典藏版本。

## 本機預覽

以瀏覽器開啟 `index.html`。正式環境須使用 HTTPS。

## 素材與內容權利

- 網站使用主辦單位提供之主視覺、公告圖、展場照片、贊助商 Logo 與社群圖示，全部存放於本站，不引用外部圖片。正式上線前須確認各素材（特別是贊助商商標與活動照片中可辨識之人物）均已取得授權，並保存授權證明。
- **評審區塊備份**（如送審時要暫時下架）：完整區塊備份在 `_tools/parked/judges-section.html`。下架時刪除 `index.html` 中 `id="partners"` 的區塊、導覽列「評審名單」與 `HOME_SECTIONS` 的 `partners` 項目；要放回時：①把該檔內容貼回 `index.html` 的「感謝名單」區塊（`<section class="sponsors`）之前；②在導覽列「參觀資訊」後加回 `<li><a href="#partners">評審名單</a></li>`；③在 `_tools/build_events.py` 的 `HOME_SECTIONS` 加回 `("partners", "競賽評審團")`；④執行產生器並跑一次 Freego。
- 評審名單目前每類別先保留 5 位「待公布」，照片使用 `vgw_website_assets/6_judges/placeholder.svg` 佔位。公布時請將該卡片的 `is-tba` class 移除，改填姓名與職稱，照片換成正式照片。
- **評審照片規格**：橫式 2:1（建議 1200×600 px）、WebP 或 JPG、單張 200 KB 以內；胸上半身照、人物置中、頭頂留白約 1/10；放在 `vgw_website_assets/6_judges/`，檔名用英文（如 `an-01.webp`）。網頁會自動以黑白呈現、滑鼠移上去轉為彩色，原檔請保留彩色。照片旁已有姓名，`alt` 保持空白即可。須取得本人肖像使用同意。
- 下載之 PDF 封面標示「草案」，正式公告前請替換為定稿版本。PDF 已含標籤結構與語言設定，但未設定「顯示文件標題」，競賽作業須知亦缺文件標題屬性；定稿時請於 Word 設定文件標題，並以「另存 PDF → 選項 → 文件結構標籤」匯出。

## 規範與驗收界線

- **ODF-CNS 15251**：每份下載文件皆同時提供 PDF 與 ODF（.odt）兩種格式。.odt 須由 Word 原始檔「另存新檔 → OpenDocument 文字」產生，放入 `vgw_website_assets/5_downloads/`，檔名須為 `2026_VGW_exhibitor_guidelines.odt`、`2026_VGW_competition_guidelines.odt`。
- **WCAG 2.1 AA**：已完成自動化檢查（對比、320px／200% 重排、文字間距、焦點可見、語言標示、替代文字），尚須以鍵盤及螢幕閱讀器（VoiceOver／NVDA）人工測試，並依主管機關程序申請檢測。**目前不代表已通過 AA 檢測或取得標章。**
- **資安**：網頁內 CSP 僅為基本防護；正式環境須依 `_deploy/` 範本於伺服器設定 HTTPS、HSTS、CSP（含 `frame-ancestors`）、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`，隱藏伺服器版本、關閉目錄列表、封鎖隱藏檔。弱點掃描、滲透測試與源碼檢測之頻率與範圍，依機關資通安全責任等級及系統防護需求等級辦理。

## 上線前檢核

1. 放入兩個 .odt 檔（未放入前 ODT 下載連結會失效）。
2. 填入兩個 SurveyCake 報名表單網址（目前為 `href="#"`），並確認表單已附個人資料蒐集告知事項。
3. 確認報名卡片「2026 已截止」等文案與實際招募狀態一致。
4. 將 `og:image` 改為含正式網域的絕對網址（社群分享預覽需要）。
5. 填寫「最後更新」日期（頁尾）並視需要標示權責單位。
6. 請執行單位確認 `_tools/pages/` 的隱私權政策（已依本站實況改寫：靜態網站、無 Cookie、報名經 SurveyCake）與常見問題（已刪除舊年度日期題目，並加註以 2026 年公告為準）；伺服器實際防護措施確定後可補充於隱私權政策第一點。
7. 上傳時排除 `_deploy/`、`_tools/`、`.git/`、`.gitignore`、`README.md`、`.DS_Store` 等非公開檔案。
8. 部署後以 OWASP ZAP、SSL Labs 等工具預掃，修正後再送正式弱點掃描。
