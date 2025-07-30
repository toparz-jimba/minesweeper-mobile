#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
マインスイーパーAndroidアプリ
KivyのWebViewを使用してマインスイーパーWebゲームを表示
"""

import os
import threading
import http.server
import socketserver
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.utils import platform
from kivy.clock import Clock
from kivy.logger import Logger

# Androidプラットフォームでの追加インポート
if platform == 'android':
    from jnius import autoclass, cast
    WebView = autoclass('android.webkit.WebView')
    WebViewClient = autoclass('android.webkit.WebViewClient')
    LayoutParams = autoclass('android.view.ViewGroup$LayoutParams')
    LinearLayout = autoclass('android.widget.LinearLayout')
    PythonActivity = autoclass('org.kivy.android.PythonActivity')
    Settings = autoclass('android.webkit.WebSettings')
else:
    # デスクトップでのテスト用（実際には動作しませんが構文エラーを避けるため）
    WebView = None
    WebViewClient = None
    LayoutParams = None
    LinearLayout = None
    PythonActivity = None
    Settings = None


class WebViewWidget(BoxLayout):
    """WebViewをKivyに統合するためのウィジェット"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.web_view = None
        self.server_thread = None
        self.server_port = 8080
        
        if platform == 'android':
            Clock.schedule_once(self.create_webview, 0)
        else:
            # デスクトップ版では代替UI表示
            label = Label(
                text='このアプリはAndroid上で動作します\nWebブラウザでindex.htmlを開いてテストしてください',
                text_size=(None, None),
                halign='center'
            )
            self.add_widget(label)
    
    def start_local_server(self):
        """ローカルHTTPサーバーを開始"""
        try:
            # 現在のディレクトリでHTTPサーバーを開始
            handler = http.server.SimpleHTTPRequestHandler
            httpd = socketserver.TCPServer(("127.0.0.1", self.server_port), handler)
            
            Logger.info(f"MinesweeperApp: ローカルサーバー開始 http://127.0.0.1:{self.server_port}")
            
            # バックグラウンドでサーバー実行
            self.server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            self.server_thread.start()
            
            return True
            
        except Exception as e:
            Logger.error(f"MinesweeperApp: サーバー開始エラー: {e}")
            self.server_port += 1  # ポート変更して再試行
            if self.server_port < 8090:
                return self.start_local_server()
            return False
    
    def create_webview(self, dt):
        """Android WebViewを作成・設定"""
        if platform != 'android':
            return
            
        try:
            # ローカルサーバー開始
            if not self.start_local_server():
                Logger.error("MinesweeperApp: ローカルサーバーの開始に失敗")
                return
            
            # WebView作成
            activity = PythonActivity.mActivity
            context = activity.getApplicationContext()
            
            self.web_view = WebView(context)
            
            # WebView設定
            settings = self.web_view.getSettings()
            settings.setJavaScriptEnabled(True)  # JavaScript有効化
            settings.setDomStorageEnabled(True)  # DOM Storage有効化
            settings.setAllowFileAccess(True)    # ファイルアクセス許可
            settings.setAllowContentAccess(True) # コンテンツアクセス許可
            settings.setBuiltInZoomControls(True) # ズームコントロール
            settings.setSupportZoom(True)        # ズーム機能
            
            # レスポンシブデザイン対応
            settings.setUseWideViewPort(True)
            settings.setLoadWithOverviewMode(True)
            
            # WebViewClient設定（ページ遷移を内部で処理）
            web_client = WebViewClient()
            self.web_view.setWebViewClient(web_client)
            
            # レイアウト設定
            layout_params = LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT
            )
            self.web_view.setLayoutParams(layout_params)
            
            # アクティビティにWebViewを追加
            activity.addContentView(self.web_view, layout_params)
            
            # マインスイーパーを読み込み
            minesweeper_url = f"http://127.0.0.1:{self.server_port}/index.html"
            self.web_view.loadUrl(minesweeper_url)
            
            Logger.info(f"MinesweeperApp: WebView作成完了 - {minesweeper_url}")
            
        except Exception as e:
            Logger.error(f"MinesweeperApp: WebView作成エラー: {e}")


class MinesweeperApp(App):
    """マインスイーパーAndroidアプリメインクラス"""
    
    def build(self):
        """アプリUI構築"""
        Logger.info("MinesweeperApp: アプリ開始")
        
        root = BoxLayout(orientation='vertical')
        
        # タイトルバー（オプション）
        if platform != 'android':
            title_label = Label(
                text='マインスイーパー for Android',
                size_hint_y=None,
                height='48dp',
                font_size='18sp'
            )
            root.add_widget(title_label)
        
        # WebViewウィジェット
        webview_widget = WebViewWidget()
        root.add_widget(webview_widget)
        
        return root
    
    def on_pause(self):
        """アプリ一時停止時の処理"""
        Logger.info("MinesweeperApp: アプリ一時停止")
        return True
    
    def on_resume(self):
        """アプリ再開時の処理"""
        Logger.info("MinesweeperApp: アプリ再開")
        pass


if __name__ == '__main__':
    MinesweeperApp().run() 