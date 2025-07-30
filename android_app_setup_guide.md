# マインスイーパー Androidアプリ化 手順書

## 📋 概要
HTML/CSS/JavaScriptで作成されたWebマインスイーパーをKivy + WebViewを使用してAndroidアプリ化する手順です。

## 🔧 事前準備

### 1. 開発環境の確認
```bash
# Python バージョン確認
python3 --version

# プロジェクトディレクトリに移動
cd /path/to/minesweeper
```

### 2. Python仮想環境の作成
```bash
# venv環境作成
python3 -m venv minesweeper_app_env

# 環境アクティベート
source minesweeper_app_env/bin/activate
```

### 3. 必要パッケージのインストール
```bash
# Kivy関連パッケージインストール
pip install kivy kivymd buildozer python-for-android cython
```

## 📱 Androidアプリファイル作成

### 4. メインアプリファイル作成（main.py）
```python
#!/usr/bin/env python3
# WebViewでマインスイーパーWebアプリを表示するKivyアプリ
# 詳細内容は main.py を参照
```

### 5. Android設定ファイル初期化・カスタマイズ
```bash
# buildozer設定ファイル作成
buildozer init

# buildozer.spec をカスタマイズ:
# - title = マインスイーパー
# - package.name = minesweeper  
# - package.domain = com.gamedev
# - version = 1.0
# - requirements = python3,kivy,pyjnius
# - source.include_exts = py,png,jpg,kv,atlas,html,css,js
# - orientation = landscape,portrait
# - android.permissions = android.permission.INTERNET, android.permission.ACCESS_NETWORK_STATE
```

### 6. 依存関係ファイル作成（requirements.txt）
```txt
kivy==2.3.1
kivymd==1.2.0
buildozer==1.5.0
python-for-android==2024.1.21
pyjnius
```

## 🛠️ Android開発環境セットアップ

### 7. Java開発環境インストール（macOS）
```bash
# OpenJDK 11 インストール
brew install openjdk@11

# Java環境変数設定
export JAVA_HOME="/opt/homebrew/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"
```

### 8. Android開発依存関係インストール
```bash
# 必要なツールインストール
brew install autoconf automake libtool pkg-config cmake openssl

# Java バージョン確認
java -version
```

## 🚀 Androidアプリビルド

### 9. デバッグAPK作成
```bash
# 環境変数設定
source minesweeper_app_env/bin/activate
export JAVA_HOME="/opt/homebrew/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"

# デバッグビルド実行（初回は30-60分）
buildozer android debug
```

### 10. ビルド成果物確認
```bash
# APKファイル確認
ls -la bin/

# 期待ファイル: マインスイーパー-1.0-arm64-v8a_armeabi-v7a-debug.apk
```

## 📂 完成プロジェクト構成

```
minesweeper/
├── index.html              # マインスイーパーWebアプリ
├── style.css               # CSS スタイル
├── script.js               # JavaScript ゲームロジック
├── README.md               # プロジェクト説明書
├── main.py                 # Kivy Android アプリメイン
├── buildozer.spec          # Android設定ファイル
├── requirements.txt        # Python依存関係
├── build_instructions.md   # 詳細ビルド手順
├── minesweeper_app_env/    # Python仮想環境
├── .buildozer/             # ビルドキャッシュ
└── bin/                    # 生成APKファイル
```

## 🔍 テスト・配布

### 11. APKテスト
```bash
# Android端末にAPKインストール
adb install bin/マインスイーパー-1.0-arm64-v8a_armeabi-v7a-debug.apk

# または: APKファイルを端末に転送して手動インストール
```

### 12. リリース版作成（Google Play Store用）
```bash
# 署名キー作成
keytool -genkey -v -keystore minesweeper-release-key.keystore -alias minesweeper -keyalg RSA -keysize 2048 -validity 10000

# リリースAPK作成
buildozer android release
```

## ⚠️ トラブルシューティング

### よくある問題
- **Java Runtime Not Found**: JAVA_HOME設定確認
- **Space left on device**: ディスク容量確認、キャッシュクリア
- **Build失敗**: `buildozer android clean` でキャッシュクリア後再実行

### 対処コマンド
```bash
# キャッシュクリア
buildozer android clean

# 詳細ログ表示
buildozer android debug --verbose

# ディスク容量確認
df -h
```

## 🎯 期待結果

### アプリ機能
- ✅ WebViewでマインスイーパー表示
- ✅ 全難易度対応（初級～極悪64×64）
- ✅ タッチ操作サポート
- ✅ ズーム・スクロール機能
- ✅ 横画面・縦画面対応
- ✅ フルスクリーン表示

### パフォーマンス
- APKサイズ: 約20-30MB
- 対応Android: API 21以上（Android 5.0+）
- アーキテクチャ: ARM64, ARM32対応

---

## 📝 注意事項

1. **初回ビルド時間**: 30-60分程度（Android SDK/NDKダウンロードのため）
2. **ネットワーク**: 安定したインターネット接続が必要
3. **ディスク容量**: 最低5GB以上の空き容量推奨
4. **macOS専用**: 本手順はmacOS環境向け（他OSは調整が必要）

## 🚀 今後の拡張可能性

- ハイスコア機能追加
- マルチプレイヤー対応  
- カスタムテーマ機能
- 統計・分析機能
- プッシュ通知機能

---

**完成おめでとうございます！** 🎉
本手順書により、WebアプリからAndroidアプリへの変換が完了しました。 