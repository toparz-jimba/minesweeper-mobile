#!/usr/bin/env python3
"""
PWA用プレースホルダーアイコン生成スクリプト
Pillowを使用して簡易的なアイコンを生成します
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillowがインストールされていません。")
    print("pip3 install Pillow でインストールしてください。")
    exit(1)

import os

# アイコンサイズのリスト
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

# 出力ディレクトリ
output_dir = "icons"

# ディレクトリが存在しない場合は作成
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print("プレースホルダーアイコンを生成中...")

# 各サイズのアイコンを生成
for size in sizes:
    # 新しい画像を作成（青い背景）
    img = Image.new('RGBA', (size, size), color=(52, 152, 219, 255))
    draw = ImageDraw.Draw(img)
    
    # 角丸の四角形を描画
    corner_radius = size // 10
    
    # 中央に地雷のシンボルを描画（簡易版）
    center = size // 2
    mine_radius = size // 8
    
    # 地雷本体（黒い円）
    draw.ellipse(
        [center - mine_radius, center - mine_radius, 
         center + mine_radius, center + mine_radius],
        fill=(44, 62, 80, 255)
    )
    
    # トゲを描画
    spike_length = mine_radius * 2
    spike_width = size // 40
    
    # 縦横のトゲ
    draw.rectangle([center - spike_width, center - spike_length, 
                   center + spike_width, center + spike_length], 
                   fill=(44, 62, 80, 255))
    draw.rectangle([center - spike_length, center - spike_width, 
                   center + spike_length, center + spike_width], 
                   fill=(44, 62, 80, 255))
    
    # 斜めのトゲ（簡易版）
    diagonal_offset = spike_length // 1.4
    draw.polygon([
        (center - diagonal_offset, center - spike_width),
        (center - spike_width, center - diagonal_offset),
        (center + spike_width, center + diagonal_offset),
        (center + diagonal_offset, center + spike_width)
    ], fill=(44, 62, 80, 255))
    
    draw.polygon([
        (center + diagonal_offset, center - spike_width),
        (center + spike_width, center - diagonal_offset),
        (center - spike_width, center + diagonal_offset),
        (center - diagonal_offset, center + spike_width)
    ], fill=(44, 62, 80, 255))
    
    # ハイライト
    highlight_radius = mine_radius // 3
    highlight_offset = mine_radius // 3
    draw.ellipse(
        [center - highlight_offset - highlight_radius, 
         center - highlight_offset - highlight_radius,
         center - highlight_offset + highlight_radius, 
         center - highlight_offset + highlight_radius],
        fill=(52, 73, 94, 128)
    )
    
    # 画像を保存
    output_file = os.path.join(output_dir, f"icon-{size}x{size}.png")
    img.save(output_file, 'PNG')
    print(f"✓ {output_file} を生成しました")

print("\nプレースホルダーアイコンの生成が完了しました！")
print("注意: これは簡易的なアイコンです。本番環境では適切にデザインされたアイコンの使用を推奨します。")