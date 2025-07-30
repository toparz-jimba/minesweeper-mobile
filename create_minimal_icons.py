#!/usr/bin/env python3
"""
最小限のBase64エンコードされたPNGアイコンを生成
外部ライブラリ不要
"""

import os
import base64

# 1x1ピクセルの青い画像のBase64データ
# これは実際のアイコンではなく、PWAが動作するための最小限のプレースホルダー
blue_pixel_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

# アイコンサイズのリスト
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

# 出力ディレクトリ
output_dir = "icons"

# ディレクトリが存在しない場合は作成
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print("最小限のプレースホルダーアイコンを生成中...")

# Base64データをデコード
pixel_data = base64.b64decode(blue_pixel_base64)

# 各サイズのアイコンを生成（実際には同じ1x1ピクセル画像）
for size in sizes:
    output_file = os.path.join(output_dir, f"icon-{size}x{size}.png")
    
    with open(output_file, 'wb') as f:
        f.write(pixel_data)
    
    print(f"✓ {output_file} を生成しました（プレースホルダー）")

print("\n最小限のアイコンファイルを生成しました。")
print("\n重要: これらは1x1ピクセルのプレースホルダーです。")
print("実際のアイコンを生成するには、以下の方法をお試しください：")
print("1. オンラインツール（例: https://realfavicongenerator.net/）")
print("2. デザインツール（Figma、Canva等）でicon.svgを基に手動作成")
print("3. brew install imagemagick 後に generate_icons.py を実行")