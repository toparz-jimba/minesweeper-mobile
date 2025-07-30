# PWAインストールガイド

## 🚀 PWAとは
Progressive Web App（PWA）は、Webアプリケーションをスマートフォンやパソコンに「アプリ」としてインストールできる技術です。

### PWAの特徴
- ✅ **インストール無料** - アプリストアを通さずに直接インストール
- ✅ **オフライン対応** - 一度アクセスすれば、インターネット接続なしでもプレイ可能
- ✅ **自動更新** - アプリの更新は自動的に行われます
- ✅ **軽量** - 通常のアプリより容量が小さい

## 📱 インストール方法

### 1. ローカルでのテスト（開発時）

```bash
# ローカルサーバーを起動
python3 -m http.server 8000

# ブラウザでアクセス
# http://localhost:8000
```

**注意**: PWAのインストールにはHTTPS接続が必要です。localhostは例外として許可されています。

### 2. Android（Chrome）でのインストール

1. ChromeブラウザでPWAサイトにアクセス
2. メニュー（3点アイコン）をタップ
3. 「ホーム画面に追加」または「アプリをインストール」を選択
4. 名前を確認して「追加」をタップ
5. ホーム画面にアイコンが追加されます

### 3. iOS（Safari）でのインストール

1. SafariブラウザでPWAサイトにアクセス
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. 名前を確認して「追加」をタップ
5. ホーム画面にアイコンが追加されます

### 4. PC（Chrome/Edge）でのインストール

1. Chrome/EdgeブラウザでPWAサイトにアクセス
2. アドレスバーの右端にある「インストール」アイコン（＋）をクリック
3. 「インストール」をクリック
4. デスクトップやスタートメニューにアプリが追加されます

## 🌐 本番環境へのデプロイ

### 無料ホスティングサービス

#### 1. GitHub Pages（推奨）
```bash
# GitHubにリポジトリを作成後
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[username]/minesweeper.git
git push -u origin main

# Settings > Pages で GitHub Pages を有効化
# https://[username].github.io/minesweeper/ でアクセス可能
```

#### 2. Netlify
- [netlify.com](https://www.netlify.com/)にアクセス
- GitHubリポジトリを接続、または直接ファイルをドラッグ&ドロップ
- 自動的にHTTPSでホスティング

#### 3. Vercel
- [vercel.com](https://vercel.com/)にアクセス
- GitHubリポジトリを接続
- 自動デプロイ設定可能

## 🔧 トラブルシューティング

### PWAがインストールできない場合

1. **HTTPS接続を確認**
   - PWAはHTTPS接続が必須です（localhostを除く）

2. **manifest.jsonの確認**
   - ブラウザの開発者ツール > Application > Manifestで確認

3. **Service Workerの確認**
   - ブラウザの開発者ツール > Application > Service Workersで確認

4. **アイコンファイルの確認**
   - 最低限192x192pxのアイコンが必要

### アイコンについて

現在はプレースホルダーアイコンを使用しています。本格的なアイコンを作成する場合：

1. `icon.svg`を編集してデザインを変更
2. 以下のツールでPNG変換：
   - オンライン: [realfavicongenerator.net](https://realfavicongenerator.net/)
   - macOS: `brew install imagemagick` 後に `python3 generate_icons.py`
   - デザインツール: Figma、Illustrator等

## 📝 メンテナンス

### キャッシュの更新
Service Workerのバージョンを変更することで、強制的にキャッシュを更新できます：

```javascript
// service-worker.js の1行目
const CACHE_NAME = 'minesweeper-v1.0.1'; // バージョンを上げる
```

### アンインストール方法

- **Android**: アプリアイコンを長押し → アンインストール
- **iOS**: アプリアイコンを長押し → ×マークをタップ
- **PC**: アプリ内メニュー → アンインストール

## 🎮 プレイ方法

インストール後は、通常のアプリと同じように起動できます。オフラインでもプレイ可能です！