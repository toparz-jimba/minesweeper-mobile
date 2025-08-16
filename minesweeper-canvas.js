class MinesweeperCanvas {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.board = [];
        this.rows = 16;
        this.cols = 16;
        this.mines = 40;
        this.cellSize = 35;
        this.padding = 2;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        this.timer = 0;
        this.timerInterval = null;
        
        // アニメーション関連
        this.animations = [];
        this.lastFrameTime = 0;
        this.animationId = null;
        
        // マウス/タッチ状態
        this.mouseX = 0;
        this.mouseY = 0;
        this.hoveredCell = null;
        this.pressedCell = null;
        this.longPressTimer = null;
        
        // ダブルクリック/タップ検出
        this.lastClickTime = 0;
        this.lastClickCell = null;
        this.doubleClickDelay = 300;
        
        // タッチ移動検出
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoved = false;
        this.touchMoveThreshold = 5; // 5px以上動いたらスワイプと判定
        
        // ズーム・パン用
        this.scale = 1;
        this.targetScale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.targetTranslateX = 0;
        this.targetTranslateY = 0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.lastPanX = 0;
        this.lastPanY = 0;
        
        // ピンチズーム用
        this.initialPinchDistance = null;
        this.initialScale = 1;
        this.initialPinchCenterX = null;
        this.initialPinchCenterY = null;
        this.initialTranslateX = null;
        this.initialTranslateY = null;
        
        // ズーム設定
        this.minScale = 0.5;
        this.maxScale = 4;
        this.smoothFactor = 0.15;
        
        // ゲーム履歴（アンドゥ用）
        this.history = [];
        this.maxHistory = 10;
        
        // テーマカラー
        this.themes = {
            dark: {
                background: '#1a1a1a',
                boardBg: '#3a3a3a',
                cellBg: '#4a4a4a',
                cellHover: '#5a5a5a',
                cellRevealed: '#2a2a2a',
                cellMine: '#d32f2f',
                cellFlagged: '#5a5a5a',
                flagColor: '#ffd700',
                text: '#f0f0f0',
                numbers: ['#4fc3f7', '#81c784', '#ff6b6b', '#9575cd', '#ffb74d', '#4dd0e1', '#f06292', '#a0a0a0']
            },
            light: {
                background: '#f5f5f5',
                boardBg: '#e0e0e0',
                cellBg: '#ffffff',
                cellHover: '#f0f0f0',
                cellRevealed: '#f8f8f8',
                cellMine: '#ff5252',
                cellFlagged: '#e0e0e0',
                flagColor: '#ff6b6b',
                text: '#333333',
                numbers: ['#2196f3', '#4caf50', '#f44336', '#673ab7', '#ff9800', '#00bcd4', '#e91e63', '#607d8b']
            },
            neon: {
                background: '#0a0a1f',
                boardBg: '#0f0f2e',
                cellBg: '#1a1a3e',
                cellHover: '#2a2a4e',
                cellRevealed: '#0a0a1f',
                cellMine: '#ff0040',
                cellFlagged: '#2a2a4e',
                flagColor: '#ff00ff',
                text: '#00ffff',
                numbers: ['#00ffff', '#00ff88', '#ff00ff', '#ff88ff', '#ffaa00', '#00aaff', '#ff0088', '#ffffff']
            }
        };
        this.currentTheme = 'dark';
        this.theme = this.themes.dark;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadTheme();
        this.resetGame();
        this.startGameLoop();
    }
    
    setupCanvas() {
        // 既存のゲームボードを隠す
        const oldBoard = document.getElementById('gameBoard');
        if (oldBoard) {
            oldBoard.style.display = 'none';
        }
        
        // Canvasを作成
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gameCanvas';
        this.canvas.style.touchAction = 'none';
        this.canvas.style.userSelect = 'none';
        this.canvas.style.cursor = 'pointer';
        
        const boardViewport = document.querySelector('.board-viewport');
        boardViewport.innerHTML = '';
        boardViewport.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = this.cols * this.cellSize + (this.cols + 1) * this.padding;
        const height = this.rows * this.cellSize + (this.rows + 1) * this.padding;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        this.ctx.scale(dpr, dpr);
    }
    
    setupEventListeners() {
        // マウスイベント
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // マウスホイールズーム
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        
        // タッチイベント
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // 既存のUIコントロール
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('difficultySelect').addEventListener('change', (e) => this.setDifficulty(e.target.value));
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // ズーム量を計算
        const delta = e.deltaY * -0.001;
        const scaleFactor = Math.pow(1.5, delta);
        const oldScale = this.targetScale;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, oldScale * scaleFactor));
        
        if (newScale !== oldScale) {
            // マウス位置を中心にズーム
            // スケール変化の比率
            const ratio = newScale / oldScale;
            
            // マウス位置を基準に新しい位置を計算
            this.targetScale = newScale;
            this.targetTranslateX = mouseX - (mouseX - this.targetTranslateX) * ratio;
            this.targetTranslateY = mouseY - (mouseY - this.targetTranslateY) * ratio;
        }
    }
    
    constrainPan() {
        const boardWidth = this.cols * (this.cellSize + this.padding) + this.padding;
        const boardHeight = this.rows * (this.cellSize + this.padding) + this.padding;
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // 盤面の実際のサイズ（ズーム適用後）
        const scaledBoardWidth = boardWidth * this.targetScale;
        const scaledBoardHeight = boardHeight * this.targetScale;
        
        // 盤面の一部が常に画面内に表示されるように制限
        const margin = 100; // 最低でも100pxは盤面が見えるように
        
        // X軸: 盤面の左端が画面右端より左に、右端が画面左端より右に
        const minX = -scaledBoardWidth + margin;
        const maxX = canvasRect.width - margin;
        this.targetTranslateX = Math.max(minX, Math.min(maxX, this.targetTranslateX));
        
        // Y軸: 盤面の上端が画面下端より上に、下端が画面上端より下に
        const minY = -scaledBoardHeight + margin;
        const maxY = canvasRect.height - margin;
        this.targetTranslateY = Math.max(minY, Math.min(maxY, this.targetTranslateY));
    }
    
    getCellFromCoords(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (x - rect.left - this.translateX) / this.scale;
        const canvasY = (y - rect.top - this.translateY) / this.scale;
        
        const col = Math.floor(canvasX / (this.cellSize + this.padding));
        const row = Math.floor(canvasY / (this.cellSize + this.padding));
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return { row, col };
        }
        return null;
    }
    
    handleMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        
        // パン中の処理
        if (this.isPanning) {
            const deltaX = e.clientX - this.panStartX;
            const deltaY = e.clientY - this.panStartY;
            // マウスの場合は指と同じ方向（ドラッグ＆ドロップの感覚）
            this.targetTranslateX = this.lastPanX + deltaX;
            this.targetTranslateY = this.lastPanY + deltaY;
            this.constrainPan();
            return;
        }
        
        const cell = this.getCellFromCoords(e.clientX, e.clientY);
        if (cell && (!this.hoveredCell || cell.row !== this.hoveredCell.row || cell.col !== this.hoveredCell.col)) {
            this.hoveredCell = cell;
            this.canvas.style.cursor = 'pointer';
        } else if (!cell) {
            this.hoveredCell = null;
            this.canvas.style.cursor = 'default';
        }
    }
    
    handleMouseDown(e) {
        // 中クリックまたはAltキーでパン開始
        if (e.button === 1 || e.altKey) {
            this.isPanning = true;
            this.panStartX = e.clientX;
            this.panStartY = e.clientY;
            this.lastPanX = this.translateX;
            this.lastPanY = this.translateY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        
        const cell = this.getCellFromCoords(e.clientX, e.clientY);
        if (!cell || this.gameOver) return;
        
        if (e.button === 2 || e.shiftKey || e.ctrlKey) {
            // 右クリック - 旗を立てる
            this.toggleFlag(cell.row, cell.col);
        } else {
            this.pressedCell = cell;
        }
    }
    
    handleMouseUp(e) {
        // パン終了
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
            return;
        }
        
        if (!this.pressedCell || this.gameOver) return;
        
        const cell = this.getCellFromCoords(e.clientX, e.clientY);
        if (cell && cell.row === this.pressedCell.row && cell.col === this.pressedCell.col) {
            const currentTime = Date.now();
            
            // ダブルクリック検出
            if (this.lastClickCell && 
                this.lastClickCell.row === cell.row && 
                this.lastClickCell.col === cell.col &&
                currentTime - this.lastClickTime < this.doubleClickDelay) {
                
                this.handleDoubleClick(cell.row, cell.col);
                this.lastClickCell = null;
                this.lastClickTime = 0;
            } else {
                this.revealCell(cell.row, cell.col);
                this.lastClickCell = cell;
                this.lastClickTime = currentTime;
            }
        }
        
        this.pressedCell = null;
    }
    
    handleMouseLeave() {
        this.hoveredCell = null;
        this.pressedCell = null;
        this.isPanning = false;
        this.canvas.style.cursor = 'default';
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchMoved = false;
        
        // 長押しタイマーをクリア
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // 1本指の場合、現在のターゲット位置を記録
        if (e.touches.length === 1) {
            this.lastPanX = this.targetTranslateX;
            this.lastPanY = this.targetTranslateY;
            this.isPanning = false;  // 1本指の時はパンニング状態を解除
        }
        
        // 2本指でのピンチズーム検出
        if (e.touches.length === 2) {
            this.isPanning = true;  // 2本指の時はピンチモード
            const touch2 = e.touches[1];
            this.initialPinchDistance = Math.hypot(
                touch2.clientX - touch.clientX,
                touch2.clientY - touch.clientY
            );
            // ターゲット値を使用（アニメーション中の値ではなく）
            this.initialScale = this.targetScale;
            
            // ピンチの初期中心を記録
            const rect = this.canvas.getBoundingClientRect();
            this.initialPinchCenterX = ((touch.clientX + touch2.clientX) / 2) - rect.left;
            this.initialPinchCenterY = ((touch.clientY + touch2.clientY) / 2) - rect.top;
            
            // 現在のターゲット位置を記録（ピンチ開始時の基準点）
            this.initialTranslateX = this.targetTranslateX;
            this.initialTranslateY = this.targetTranslateY;
            
            // 2本指の時は旗を立てない
            this.pressedCell = null;
            return;
        }
        
        if (this.gameOver) return;
        
        const cell = this.getCellFromCoords(touch.clientX, touch.clientY);
        // セルが存在してもしなくても、パン移動のために処理を続ける
        if (cell) {
            this.pressedCell = cell;
            
            // 1本指の時のみ長押し検出（旗を立てる）
            if (e.touches.length === 1) {
                this.longPressTimer = setTimeout(() => {
                    if (this.pressedCell && 
                        this.pressedCell.row === cell.row && 
                        this.pressedCell.col === cell.col &&
                        !this.touchMoved &&
                        !this.isPanning) {  // ピンチ中でないことを確認
                        this.toggleFlag(cell.row, cell.col);
                        this.pressedCell = null;
                        
                        // 振動フィードバック
                        if (navigator.vibrate) {
                            navigator.vibrate([20, 10, 20]);
                        }
                    }
                }, 300); // 300msに変更
            }
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        
        // 1本指のパン移動（isPanningをチェックしない）
        if (e.touches.length === 1) {
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // スワイプ判定とパン移動
            if (!this.touchMoved && distance > this.touchMoveThreshold) {
                this.touchMoved = true;
                
                // 長押しタイマーをキャンセル
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            }
            
            // スワイプ中は常にパン移動を更新
            if (this.touchMoved || distance > this.touchMoveThreshold) {
                // 指の動きと同じ方向に盤面を移動（ドラッグのような動き）
                // 左上にスワイプ = 盤面を右下に移動 = 左上が見える
                this.targetTranslateX = this.lastPanX + deltaX * 1.5;  // 同じ方向に移動
                this.targetTranslateY = this.lastPanY + deltaY * 1.5;
                
                // パン移動時のみ境界チェック
                this.constrainPan();
            }
        }
        
        // ピンチズーム処理
        if (e.touches.length === 2) {
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch.clientX,
                touch2.clientY - touch.clientY
            );
            
            // 現在のピンチ中心
            const rect = this.canvas.getBoundingClientRect();
            const currentCenterX = ((touch.clientX + touch2.clientX) / 2) - rect.left;
            const currentCenterY = ((touch.clientY + touch2.clientY) / 2) - rect.top;
            
            if (this.initialPinchDistance) {
                const scaleFactor = currentDistance / this.initialPinchDistance;
                const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.initialScale * scaleFactor));
                
                // スケール変化の比率
                const ratio = newScale / this.initialScale;
                
                // 初期ピンチ中心を基準にズーム
                // ピンチ中心が固定されたと仮定して計算
                this.targetScale = newScale;
                this.targetTranslateX = this.initialPinchCenterX - (this.initialPinchCenterX - this.initialTranslateX) * ratio;
                this.targetTranslateY = this.initialPinchCenterY - (this.initialPinchCenterY - this.initialTranslateY) * ratio;
                
                // ピンチ中心の移動を追加（指を動かした場合のパン）
                const centerDeltaX = currentCenterX - this.initialPinchCenterX;
                const centerDeltaY = currentCenterY - this.initialPinchCenterY;
                this.targetTranslateX += centerDeltaX;
                this.targetTranslateY += centerDeltaY;
            }
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        this.isPanning = false;
        this.initialPinchDistance = null;
        this.initialPinchCenterX = null;
        this.initialPinchCenterY = null;
        this.initialTranslateX = null;
        this.initialTranslateY = null;
        
        // スワイプした場合は何もしない
        if (this.touchMoved) {
            this.pressedCell = null;
            return;
        }
        
        // 長押しでない場合はセルを開く
        if (this.pressedCell && !this.touchMoved) {
            const currentTime = Date.now();
            const cell = this.pressedCell;
            
            // ダブルタップ検出
            if (this.lastClickCell && 
                this.lastClickCell.row === cell.row && 
                this.lastClickCell.col === cell.col &&
                currentTime - this.lastClickTime < this.doubleClickDelay) {
                
                this.handleDoubleClick(cell.row, cell.col);
                this.lastClickCell = null;
                this.lastClickTime = 0;
            } else {
                this.revealCell(cell.row, cell.col);
                this.lastClickCell = cell;
                this.lastClickTime = currentTime;
            }
        }
        
        this.pressedCell = null;
    }
    
    setDifficulty(level) {
        switch(level) {
            case 'easy':
                this.rows = 9;
                this.cols = 9;
                this.mines = 10;
                break;
            case 'medium':
                this.rows = 16;
                this.cols = 16;
                this.mines = 40;
                break;
            case 'hard':
                this.rows = 16;
                this.cols = 30;
                this.mines = 99;
                break;
            case 'backEasy':
                this.rows = 9;
                this.cols = 9;
                this.mines = 20;
                break;
            case 'backMedium':
                this.rows = 16;
                this.cols = 16;
                this.mines = 64;
                break;
            case 'backHard':
                this.rows = 16;
                this.cols = 30;
                this.mines = 120;
                break;
            case 'extreme':
                this.rows = 64;
                this.cols = 64;
                this.mines = 999;
                this.cellSize = 20; // 極悪は小さめのセル
                break;
            default:
                this.cellSize = 35;
        }
        
        if (level !== 'extreme') {
            this.cellSize = 35;
        }
        
        this.resizeCanvas();
        this.resetGame();
    }
    
    resetGame() {
        this.board = [];
        this.flagCount = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        this.timer = 0;
        this.animations = [];
        this.history = [];
        this.scale = 1;
        this.targetScale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.targetTranslateX = 0;
        this.targetTranslateY = 0;
        
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        document.getElementById('resetBtn').textContent = 'リセット 😊';
        document.getElementById('mineCount').textContent = this.mines;
        document.getElementById('flagCount').textContent = '0';
        document.getElementById('maxFlags').textContent = this.mines;
        document.getElementById('timer').textContent = '0';
        
        this.createBoard();
        this.placeMines();
    }
    
    createBoard() {
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0,
                    animationProgress: 0
                };
            }
        }
    }
    
    placeMines() {
        let minesPlaced = 0;
        
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (!this.board[row][col].isMine) {
                this.board[row][col].isMine = true;
                minesPlaced++;
                
                // 周囲のセルの地雷カウントを増やす
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const newRow = row + dr;
                        const newCol = col + dc;
                        if (this.isValidCell(newRow, newCol)) {
                            this.board[newRow][newCol].neighborMines++;
                        }
                    }
                }
            }
        }
    }
    
    revealCell(row, col) {
        if (!this.isValidCell(row, col) || this.gameOver) return;
        
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) return;
        
        // タイマー開始
        if (this.timer === 0 && this.timerInterval === null) {
            this.startTimer();
        }
        
        // 履歴保存
        this.saveHistory();
        
        cell.isRevealed = true;
        this.revealedCount++;
        
        // アニメーション追加
        this.addRevealAnimation(row, col);
        
        // サウンド再生
        if (typeof soundManager !== 'undefined') {
            soundManager.sounds.reveal();
        }
        
        // 振動
        if (navigator.vibrate) {
            navigator.vibrate([10]);
        }
        
        if (cell.isMine) {
            this.endGame(false);
        } else {
            // 空のセルの場合、隣接セルも開く
            if (cell.neighborMines === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        this.revealCell(row + dr, col + dc);
                    }
                }
            }
            
            this.checkWin();
        }
    }
    
    toggleFlag(row, col) {
        if (!this.isValidCell(row, col) || this.gameOver) return;
        
        const cell = this.board[row][col];
        
        if (cell.isRevealed) return;
        
        this.saveHistory();
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagCount--;
            
            if (typeof soundManager !== 'undefined') {
                soundManager.sounds.unflag();
            }
        } else {
            if (this.flagCount < this.mines) {
                cell.isFlagged = true;
                this.flagCount++;
                
                // アニメーション追加
                this.addFlagAnimation(row, col);
                
                if (typeof soundManager !== 'undefined') {
                    soundManager.sounds.flag();
                }
            }
        }
        
        document.getElementById('mineCount').textContent = this.mines - this.flagCount;
        document.getElementById('flagCount').textContent = this.flagCount;
        
        // 旗カウンターの状態を更新
        const flagCounter = document.querySelector('.flag-counter');
        if (this.flagCount === this.mines) {
            flagCounter.classList.add('max-reached');
            flagCounter.classList.remove('warning');
        } else if (this.flagCount >= this.mines * 0.8) {
            flagCounter.classList.add('warning');
            flagCounter.classList.remove('max-reached');
        } else {
            flagCounter.classList.remove('warning', 'max-reached');
        }
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    handleDoubleClick(row, col) {
        if (!this.isValidCell(row, col) || this.gameOver) return;
        
        const cell = this.board[row][col];
        
        // 開いていて数字があるセルのみ処理
        if (!cell.isRevealed || cell.neighborMines === 0) return;
        
        // 周囲のフラグ数をカウント
        let flaggedCount = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.isValidCell(newRow, newCol)) {
                    if (this.board[newRow][newCol].isFlagged) {
                        flaggedCount++;
                    }
                }
            }
        }
        
        // フラグ数が数字と一致する場合のみ周囲を開く
        if (flaggedCount === cell.neighborMines) {
            let hitMine = false;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (this.isValidCell(newRow, newCol)) {
                        const neighborCell = this.board[newRow][newCol];
                        if (!neighborCell.isRevealed && !neighborCell.isFlagged) {
                            this.revealCell(newRow, newCol);
                            if (neighborCell.isMine) {
                                hitMine = true;
                            }
                        }
                    }
                }
            }
            
            if (hitMine) {
                this.endGame(false);
            } else {
                this.checkWin();
            }
        }
    }
    
    checkWin() {
        const totalCells = this.rows * this.cols;
        const nonMineCells = totalCells - this.mines;
        
        if (this.revealedCount === nonMineCells) {
            this.endGame(true);
        }
    }
    
    endGame(won) {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        if (won) {
            document.getElementById('resetBtn').textContent = 'リセット 😎';
            
            if (typeof soundManager !== 'undefined') {
                soundManager.sounds.win();
            }
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50, 30, 50, 30, 100]);
            }
            
            // 勝利メッセージ
            setTimeout(() => {
                this.showMessage('🎉 クリア！ 🎉');
            }, 500);
        } else {
            document.getElementById('resetBtn').textContent = 'リセット 😵';
            
            if (typeof soundManager !== 'undefined') {
                soundManager.sounds.explode();
            }
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 200]);
            }
            
            // すべての地雷を表示
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    if (this.board[i][j].isMine) {
                        this.board[i][j].isRevealed = true;
                    }
                }
            }
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = this.timer;
        }, 1000);
    }
    
    // アニメーション
    addRevealAnimation(row, col) {
        this.animations.push({
            type: 'reveal',
            row,
            col,
            progress: 0,
            duration: 200
        });
    }
    
    addFlagAnimation(row, col) {
        this.animations.push({
            type: 'flag',
            row,
            col,
            progress: 0,
            duration: 300
        });
    }
    
    updateAnimations(deltaTime) {
        this.animations = this.animations.filter(anim => {
            anim.progress += deltaTime;
            return anim.progress < anim.duration;
        });
        
        // スムーズなズーム・パンアニメーション
        const smoothing = this.smoothFactor;
        this.scale += (this.targetScale - this.scale) * smoothing;
        this.translateX += (this.targetTranslateX - this.translateX) * smoothing;
        this.translateY += (this.targetTranslateY - this.translateY) * smoothing;
    }
    
    // 描画
    startGameLoop() {
        const gameLoop = (timestamp) => {
            const deltaTime = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;
            
            this.updateAnimations(deltaTime);
            this.render();
            
            this.animationId = requestAnimationFrame(gameLoop);
        };
        
        this.animationId = requestAnimationFrame(gameLoop);
    }
    
    render() {
        const ctx = this.ctx;
        const theme = this.theme;
        
        // キャンバス全体をクリア
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
        
        // 変換行列を適用（ズーム・パン）
        ctx.save();
        ctx.translate(this.translateX, this.translateY);
        ctx.scale(this.scale, this.scale);
        
        // 背景を描画
        const boardWidth = this.cols * (this.cellSize + this.padding) + this.padding;
        const boardHeight = this.rows * (this.cellSize + this.padding) + this.padding;
        ctx.fillStyle = theme.boardBg;
        ctx.fillRect(0, 0, boardWidth, boardHeight);
        
        // セルを描画
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.renderCell(row, col);
            }
        }
        
        ctx.restore();
    }
    
    renderCell(row, col) {
        const ctx = this.ctx;
        const theme = this.theme;
        const cell = this.board[row][col];
        const x = col * (this.cellSize + this.padding) + this.padding;
        const y = row * (this.cellSize + this.padding) + this.padding;
        
        // アニメーション計算
        let scale = 1;
        let opacity = 1;
        
        const anim = this.animations.find(a => a.row === row && a.col === col);
        if (anim) {
            const progress = Math.min(anim.progress / anim.duration, 1);
            if (anim.type === 'reveal') {
                scale = 0.8 + 0.2 * progress;
            } else if (anim.type === 'flag') {
                scale = 0.5 + 0.5 * progress;
            }
        }
        
        ctx.save();
        
        // スケール変換
        if (scale !== 1) {
            const centerX = x + this.cellSize / 2;
            const centerY = y + this.cellSize / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);
        }
        
        // セルの背景
        if (cell.isRevealed) {
            if (cell.isMine) {
                ctx.fillStyle = theme.cellMine;
            } else {
                ctx.fillStyle = theme.cellRevealed;
            }
        } else if (cell.isFlagged) {
            ctx.fillStyle = theme.cellFlagged;
        } else {
            // ホバー効果
            if (this.hoveredCell && 
                this.hoveredCell.row === row && 
                this.hoveredCell.col === col) {
                ctx.fillStyle = theme.cellHover;
            } else {
                ctx.fillStyle = theme.cellBg;
            }
        }
        
        ctx.fillRect(x, y, this.cellSize, this.cellSize);
        
        // セルの内容
        if (cell.isRevealed) {
            if (cell.isMine) {
                // 地雷を描画
                ctx.font = `${this.cellSize * 0.6}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('💣', x + this.cellSize / 2, y + this.cellSize / 2);
            } else if (cell.neighborMines > 0) {
                // 数字を描画
                ctx.font = `bold ${this.cellSize * 0.6}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.numbers[cell.neighborMines - 1];
                ctx.fillText(cell.neighborMines, x + this.cellSize / 2, y + this.cellSize / 2);
            }
        } else if (cell.isFlagged) {
            // 旗を描画
            ctx.font = `${this.cellSize * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = theme.flagColor;
            ctx.fillText('🚩', x + this.cellSize / 2, y + this.cellSize / 2);
        }
        
        ctx.restore();
    }
    
    // 履歴管理
    saveHistory() {
        const state = {
            board: JSON.parse(JSON.stringify(this.board)),
            flagCount: this.flagCount,
            revealedCount: this.revealedCount,
            timer: this.timer
        };
        
        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.disabled = false;
        }
    }
    
    undo() {
        if (this.history.length === 0 || this.gameOver) return;
        
        const state = this.history.pop();
        this.board = state.board;
        this.flagCount = state.flagCount;
        this.revealedCount = state.revealedCount;
        
        document.getElementById('mineCount').textContent = this.mines - this.flagCount;
        document.getElementById('flagCount').textContent = this.flagCount;
        
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn && this.history.length === 0) {
            undoBtn.disabled = true;
        }
        
        if (typeof soundManager !== 'undefined') {
            soundManager.sounds.click();
        }
    }
    
    // テーマ管理
    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            this.theme = this.themes[themeName];
            document.body.className = '';
            document.body.classList.add(`theme-${themeName}`);
            localStorage.setItem('minesweeper-theme', themeName);
            
            if (typeof soundManager !== 'undefined') {
                soundManager.sounds.click();
            }
        }
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('minesweeper-theme') || 'dark';
        this.setTheme(savedTheme);
    }
    
    showMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.textContent = text;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: fadeInOut 2s ease-in-out;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 2000);
    }
}

// グローバルインスタンス
window.minesweeperCanvasGame = new MinesweeperCanvas();