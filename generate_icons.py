#!/usr/bin/env python3
"""
PWA用アイコン生成スクリプト
SVGファイルから各サイズのPNGアイコンを生成します
"""

import os
import subprocess

# アイコンサイズのリスト
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

# 出力ディレクトリ
output_dir = "icons"

# SVGファイル
svg_file = "icon.svg"

# ディレクトリが存在しない場合は作成
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"SVGファイル '{svg_file}' から各サイズのアイコンを生成中...")

# 各サイズのアイコンを生成
for size in sizes:
    output_file = os.path.join(output_dir, f"icon-{size}x{size}.png")
    
    # ImageMagickを使用してSVGをPNGに変換
    # 代替: rsvg-convert, inkscape, cairosvg など
    try:
        # macOSでbrewからImageMagickがインストールされている場合
        subprocess.run([
            "convert",
            "-background", "none",
            "-resize", f"{size}x{size}",
            svg_file,
            output_file
        ], check=True)
        print(f"✓ {output_file} を生成しました")
    except subprocess.CalledProcessError:
        print(f"✗ {output_file} の生成に失敗しました")
        print("  ImageMagickがインストールされていない可能性があります")
        print("  brew install imagemagick でインストールしてください")
    except FileNotFoundError:
        print("convertコマンドが見つかりません。")
        print("以下のいずれかの方法でアイコンを生成してください：")
        print("1. brew install imagemagick")
        print("2. オンラインSVG→PNG変換ツールを使用")
        print("3. デザインツール（Figma、Illustrator等）で手動変換")
        break

print("\n生成完了！")
print("注意: 実際のアプリではより洗練されたアイコンデザインを推奨します。")