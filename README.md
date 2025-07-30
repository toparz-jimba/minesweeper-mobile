# マインスイーパーWebゲーム - プロジェクト説明書

## 📋 プロジェクト概要

このプロジェクトは、HTML、CSS、JavaScriptで作成されたWebブラウザ向けマインスイーパーゲームです。モダンなUI/UXと上級者向け機能を備えた完全機能版マインスイーパーで、**PWA（Progressive Web App）**としてスマートフォンやPCにインストール可能です。

## 📁 ファイル構成

```
minesweeper/
├── index.html              # メインHTMLファイル（PWA対応）
├── style.css               # CSSスタイルシート
├── script.js               # JavaScriptゲームロジック
├── manifest.json           # PWAマニフェストファイル
├── service-worker.js       # Service Worker（オフライン対応）
├── icon.svg                # アプリアイコン（SVG形式）
├── icons/                  # PWAアイコン各サイズ
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
├── PWA_INSTALL_GUIDE.md    # PWAインストールガイド
├── README.md               # このドキュメント
├── CLAUDE.md               # Claude Code用ガイド
├── generate_icons.py       # アイコン生成スクリプト（要ImageMagick）
├── generate_placeholder_icons.py  # プレースホルダーアイコン生成（要Pillow）
└── create_minimal_icons.py # 最小限アイコン生成（外部依存なし）
```

## 🎮 主要機能

### 基本機能
- **4つの難易度レベル**:
  - 初級: 9×9, 10地雷
  - 中級: 16×16, 40地雷  
  - 上級: 16×30, 99地雷
  - 🔥 極悪: 64×64, 999地雷
- **基本操作**:
  - 左クリック: セルを開く
  - 右クリック: フラグを立てる/外す
  - ダブルクリック: コード機能（一括展開）
- **ゲーム要素**:
  - リアルタイムタイマー
  - 残り地雷数カウンター
  - 勝利/敗北判定
  - ゲームリセット機能

### 上級機能
- **コード機能**: 数字セルをダブルクリックで、フラグ数が一致する場合に隣接セルを一括展開
- **最初のクリック保護**: 初回クリック位置に地雷が配置されない仕様
- **自動展開**: 空白セルクリック時の連鎖展開
- **盤面拡大縮小**: 50%～300%の範囲で10%刻みの拡大縮小機能
- **完全スクロール対応**: 拡大時でも盤面の端まで見えるスクロール機能（四方向すべて対応）
- **レスポンシブデザイン**: モバイル対応

### PWA機能
- **アプリインストール**: スマートフォンやPCにアプリとしてインストール可能
- **オフラインプレイ**: 一度アクセスすればインターネット接続なしでプレイ可能
- **ホーム画面アイコン**: アプリアイコンからワンタップで起動
- **全画面表示**: ブラウザUIなしのネイティブアプリ風表示

## 🏗️ 技術的実装詳細

### HTML構造 (index.html)
```html
<div class="container">
  <header class="game-header">        <!-- ヘッダー: タイトル、地雷数、タイマー -->
    <div class="game-info">...</div>
  </header>
  <main class="game-area">            <!-- メイン: ゲームボード、メッセージ -->
    <div class="game-board-wrapper">  <!-- ズーム対応スクロールラッパー（JS動的生成） -->
      <div id="game-board"></div>
    </div>
  </main>
  <footer class="controls">           <!-- フッター: 難易度選択、拡大縮小、操作説明 -->
    <div class="difficulty-selector">...</div>
    <div class="zoom-controls">...</div>  <!-- 拡大縮小コントロール -->
    <div class="instructions">...</div>
  </footer>
</div>
```

### CSS設計 (style.css)
- **レイアウト**: Flexbox + CSS Grid
- **デザインシステム**: 
  - フラットデザイン（単色背景）
  - カードベースレイアウト
  - ホバーエフェクト
  - アニメーション (slideIn)
  - CSS Transform（拡大縮小機能）
- **グリッド線**: 1pxのgapによる最小限の境界線
- **レスポンシブ**: @media queries使用
- **特殊対応**: 極悪難易度用の小セルスタイル、スクロールバーカスタマイズ、ズームコントロール、拡大時端表示ラッパー

### JavaScript アーキテクチャ (script.js)

#### クラス構造: `Minesweeper`
```javascript
class Minesweeper {
  constructor()                    // 初期化、イベントリスナー設定
  
  // ゲーム管理
  newGame()                       // 新規ゲーム開始
  createBoard()                   // ボード作成・DOM操作
  createGameBoardWrapper()        // スクロールラッパー作成
  
  // 地雷配置
  placeMines(excludeRow, excludeCol)  // 地雷配置（初回クリック除外）
  calculateNeighborMines()        // 隣接地雷数計算
  
  // ユーザー操作
  handleCellClick(event, row, col)     // 左クリック処理
  handleRightClick(event, row, col)    // 右クリック処理  
  handleDoubleClick(event, row, col)   // ダブルクリック処理（コード機能）
  
  // ゲームロジック
  revealCell(row, col)            // セル開示
  revealNeighbors(row, col)       // 隣接セル開示
  toggleFlag(row, col)            // フラグ切り替え
  
  // コード機能関連
  countAdjacentFlags(row, col)    // 隣接フラグ数カウント
  revealAdjacentUnflagged(row, col) // フラグなし隣接セル開示
  
  // ゲーム状態管理
  checkWinCondition()             // 勝利条件チェック
  gameOver(won)                   // ゲーム終了処理
  startTimer() / clearTimer()     // タイマー管理
  updateDisplay()                 // UI更新
  
  // 拡大縮小機能
  zoomIn()                        // 拡大処理
  zoomOut()                       // 縮小処理
  zoomReset()                     // ズーム初期化
  updateZoom()                    // ズーム状態更新（動的padding調整含む）
}
```

#### データ構造
```javascript
// 難易度設定
this.difficulties = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
  extreme: { rows: 64, cols: 64, mines: 999 }
}

// セルデータ構造
this.board[row][col] = {
  isMine: boolean,        // 地雷フラグ
  isRevealed: boolean,    // 開示フラグ
  isFlagged: boolean,     // フラグフラグ
  neighborMines: number,  // 隣接地雷数
  element: DOMElement     // DOM要素参照
}

// 拡大縮小データ
this.zoomLevel = 1.0      // 拡大縮小レベル (1.0 = 100%)
this.minZoom = 0.5        // 最小ズーム (50%)
this.maxZoom = 3.0        // 最大ズーム (300%)
this.zoomStep = 0.1       // ズームステップ (10%)
```

## 🔧 カスタマイズポイント

### 新難易度追加
1. `this.difficulties`オブジェクトに新設定追加
2. HTMLの`<select>`に新オプション追加
3. 必要に応じてCSS調整（セルサイズ等）

### UI/デザイン変更
- **色変更**: CSS変数やグラデーション定義を修正
- **セルサイズ**: `.cell`クラスの`width/height`調整
- **アニメーション**: `@keyframes`定義の変更

### 機能拡張例
- **統計機能**: 勝率、平均時間等の記録
- **ハイスコア**: localStorage使用
- **ヒント機能**: 安全なセルの示唆
- **リプレイ機能**: 操作履歴の保存/再生

## 🎯 重要な実装ポイント

### コード機能（ダブルクリック）
- 開示済み数字セルのみ対象
- 隣接フラグ数 === セルの数字 の場合のみ実行
- 誤フラグがあると地雷を踏む可能性あり（仕様）

### パフォーマンス最適化
- **極悪難易度（64×64）対応**: 
  - セルサイズ動的調整
  - スクロール領域設定
  - DOM操作最適化
- **拡大縮小機能**: 
  - CSS Transform使用による高速拡大縮小
  - ボタン状態の動的制御
  - スムーズなアニメーション
- **完全スクロール対応**:
  - ズームレベルに応じた動的padding調整
  - transform-origin最適化（左上基準）
  - 四方向完全表示保証システム

### セキュリティ
- `event.preventDefault()`で右クリックメニュー無効化
- ユーザー入力の適切な検証

## 🚀 起動方法

### ローカルでの起動

```bash
# ブラウザで直接開く（PWA機能は制限される）
open index.html

# ローカルサーバー起動（PWA完全対応）
python3 -m http.server 8000
# http://localhost:8000 でアクセス
```

### PWAとしてインストール

1. ローカルサーバーまたは本番環境でアクセス
2. ブラウザのアドレスバーにインストールアイコンが表示
3. クリックしてインストール

詳細は `PWA_INSTALL_GUIDE.md` を参照してください。

### 本番環境へのデプロイ（無料）

#### GitHub Pages（推奨）
```bash
# GitHubにリポジトリを作成後
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[username]/minesweeper.git
git push -u origin main

# Settings > Pages で有効化
# https://[username].github.io/minesweeper/ でアクセス可能
```

## 🤖 生成AI向け補足情報

このプロジェクトは以下の特徴を持ちます：
- **完全自己完結**: 外部依存なし、純粋なWeb技術のみ使用
- **ES6+準拠**: モダンJavaScript使用
- **オブジェクト指向設計**: 単一クラスでの機能分離
- **イベント駆動**: DOM操作とイベントハンドリング
- **状態管理**: ゲーム状態の適切な管理
- **PWA対応**: Service WorkerとWeb App Manifestによるアプリ化

修正・機能追加時は、既存の設計パターンに従って実装することを推奨します。特に、セルデータ構造とイベントハンドリングの一貫性を保つことが重要です。

## 📝 ドキュメント更新ルール

### ⚠️ 重要: 機能追加・変更時の必須対応

**新機能追加や既存機能の重要な変更を行う際は、必ず以下の手順に従ってください：**

1. **README.md更新**:
   - 🎮 主要機能セクションに新機能を追加
   - 🏗️ 技術的実装詳細を更新（HTML構造、CSS設計、JavaScript）
   - 🎯 重要な実装ポイントに技術的特徴を追記
   - 🔧 カスタマイズポイントに拡張方法を記載

2. **cursorrulesファイル更新**:
   - 新機能の理解が必要な場合はルールに追記
   - 設計パターンの変更があればガイドラインを更新

3. **実装時のドキュメント同期**:
   - コード変更と同時にドキュメントも更新
   - 機能説明、使用方法、技術仕様を正確に記述
   - 将来の開発者が理解しやすい説明を心がける

### 📋 更新が必要な変更例
- 新機能の追加（UI要素、ゲーム機能など）
- 重要なデザイン変更（CSS アーキテクチャの変更など）
- JavaScript クラス構造の変更
- 新しいカスタマイズポイントの追加
- パフォーマンス関連の重要な改善

**【実例】完全スクロール機能追加時の更新内容：**
- 🎮 上級機能：「完全スクロール対応」追加
- 🏗️ HTML構造：`game-board-wrapper`について記載  
- 🏗️ JavaScript：`createGameBoardWrapper()`メソッド追加
- 🎯 パフォーマンス：動的padding調整システム追記
- 📋 Cursorルール：スクロール機能・ズーム機能の実装ポイント追記

**【実例】PWA機能追加時の更新内容：**
- 📁 ファイル構成：PWA関連ファイル（manifest.json、service-worker.js等）追加
- 🎮 PWA機能：新セクション追加（インストール、オフライン対応等）
- 🚀 起動方法：PWAインストール手順とデプロイ方法追加
- 🏗️ HTML構造：PWA関連メタタグとService Worker登録追記

この仕組みにより、プロジェクトの技術仕様と実装が常に同期され、保守性と理解しやすさが保たれます。 