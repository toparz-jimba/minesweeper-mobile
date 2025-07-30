# マインスイーパー Android アプリ ビルド手順

## 🚀 最終ビルド実行

### 1. デバッグAPKビルド
```bash
# venv環境をアクティベート
source minesweeper_app_env/bin/activate

# Java環境設定
export JAVA_HOME="/opt/homebrew/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"

# デバッグビルド実行（30-60分程度）
buildozer android debug
```

### 2. リリースAPKビルド（後で実行）
```bash
buildozer android release
```

## 📱 APKファイルの場所

ビルド成功後、APKファイルは以下に生成されます：
- デバッグ版: `bin/マインスイーパー-1.0-arm64-v8a_armeabi-v7a-debug.apk`
- リリース版: `bin/マインスイーパー-1.0-arm64-v8a_armeabi-v7a-release-unsigned.apk`

## 🔧 トラブルシューティング

### よくある問題と解決法

1. **ビルドエラー「No space left on device」**
   ```bash
   # ディスク容量確認
   df -h
   # 不要ファイル削除
   rm -rf .buildozer/android/platform/build*
   ```

2. **Python for Android エラー**
   ```bash
   # buildozerキャッシュクリア
   buildozer android clean
   ```

3. **NDK/SDK エラー**
   ```bash
   # 設定を確認して再ビルド
   buildozer android debug --verbose
   ```

## 📋 アプリ署名（Google Play Store用）

### 署名キー作成
```bash
keytool -genkey -v -keystore minesweeper-release-key.keystore -alias minesweeper -keyalg RSA -keysize 2048 -validity 10000
```

### buildozer.spec 署名設定追加
```ini
[app:android.gradle_dependencies]
[app:android.gradle_repositories]

# 署名設定
[app:android.gradle_dependencies]
android.gradle_dependencies = 

[app:android]
android.release_artifact = apk
android.debug_artifact = apk

# 署名キー設定
android.keystore = minesweeper-release-key.keystore
android.keyalias = minesweeper
android.keystore_passwd = パスワード
android.keyalias_passwd = パスワード
```

## 🚀 Google Play Store リリース手順

### 1. リリースAPK作成
```bash
buildozer android release
```

### 2. Play Console設定
- Google Play Console でアプリ登録
- APKアップロード
- ストア掲載情報入力
- 価格・配布設定
- 審査申請

### 3. 必要な素材
- アプリアイコン (512x512px)
- スクリーンショット（複数サイズ）
- プライバシーポリシー（必須）
- アプリ説明文

## 📊 アプリサイズ最適化

### ProGuard有効化（buildozer.spec）
```ini
android.gradle_dependencies = 
android.add_compile_options = 
android.gradle_dependencies = androidx.multidex:multidex:2.0.1
android.enable_multidex = True

# ProGuard設定
android.gradle_dependencies = 
android.gradle_dependencies = 
android.add_gradle_dependencies = com.android.tools.build:gradle:7.0.0
```

## 🔍 テスト方法

### 1. エミュレータテスト
```bash
# Android Studio エミュレータで APK インストール
adb install bin/マインスイーパー-1.0-debug.apk
```

### 2. 実機テスト
- USB デバッグを有効にしたAndroid端末に直接インストール
- APKファイルを端末に転送してインストール

## 📈 アプリ最適化のヒント

### パフォーマンス
- WebViewキャッシュ最適化
- 画像リソース圧縮
- 不要な機能削除

### ユーザビリティ
- タッチ操作の最適化
- 画面サイズ対応
- バッテリー使用量削減

## 🎯 次のステップ

1. デバッグビルド実行
2. 実機でのテスト
3. UI/UX調整
4. リリースビルド
5. Play Store申請

---

**注意**: 初回ビルドは大量のファイルダウンロードのため、30-60分程度かかります。
十分な時間とネットワーク環境を確保してから実行してください。 