class Minesweeper {
    constructor() {
        this.board = [];
        this.rows = 16;
        this.cols = 16;
        this.mines = 40;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        this.timer = 0;
        this.timerInterval = null;
        this.touchStartTime = 0;
        this.touchTimer = null;
        
        // ズーム・パン機能用の変数
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.hammerManager = null;
        
        // ゲーム履歴（アンドゥ用）
        this.history = [];
        this.maxHistory = 10;
        
        // 現在のテーマ
        this.currentTheme = 'dark';
        
        // 振動フィードバックの強度
        this.hapticPatterns = {
            reveal: [10],
            flag: [20, 10, 20],
            unflag: [10, 5, 10],
            explode: [100, 50, 100, 50, 200],
            win: [50, 30, 50, 30, 50, 30, 100],
            error: [30, 20, 30],
            chain: [5, 5, 5, 5, 10]
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.resetGame();
    }
    
    setupEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('difficultySelect').addEventListener('change', (e) => this.setDifficulty(e.target.value));
        
        // Hammer.jsでタッチ操作を設定
        this.setupHammerGestures();
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
                break;
        }
        
        this.resetGame();
    }
    
    resetGame() {
        this.board = [];
        this.flagCount = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        this.timer = 0;
        
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        document.getElementById('resetBtn').textContent = 'リセット 😊';
        document.getElementById('mineCount').textContent = this.mines;
        document.getElementById('flagCount').textContent = '0';
        document.getElementById('maxFlags').textContent = this.mines;
        document.getElementById('timer').textContent = '0';
        
        // 旗カウンターの状態をリセット
        const flagCounter = document.querySelector('.flag-counter');
        flagCounter.classList.remove('warning', 'max-reached');
        
        this.resetZoom();
        this.createBoard();
        this.placeMines();
        this.renderBoard();
    }
    
    createBoard() {
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
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
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        
        // DocumentFragmentを使用してDOM操作を最適化
        const fragment = document.createDocumentFragment();
        
        gameBoard.innerHTML = '';
        gameBoard.className = 'game-board';
        
        if (this.gameOver) {
            gameBoard.classList.add('game-over');
        }
        
        const cellSize = '35px';
        gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, ${cellSize})`;
        gameBoard.style.gridTemplateRows = `repeat(${this.rows}, ${cellSize})`;
        
        // バッチ処理でセルを作成
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const cellData = this.board[i][j];
                
                if (cellData.isRevealed) {
                    cell.classList.add('revealed');
                    if (cellData.isMine) {
                        cell.classList.add('mine');
                    } else if (cellData.neighborMines > 0) {
                        cell.textContent = cellData.neighborMines;
                        cell.dataset.count = cellData.neighborMines;
                    }
                } else if (cellData.isFlagged) {
                    cell.classList.add('flagged');
                }
                
                this.setupCellEventListeners(cell, i, j);
                fragment.appendChild(cell);
            }
        }
        
        // 一度にすべてのセルを追加
        gameBoard.appendChild(fragment);
    }
    
    setupCellEventListeners(cell, row, col) {
        // マウスイベント（デスクトップ用）
        cell.addEventListener('click', (e) => {
            if (e.shiftKey || e.ctrlKey) {
                this.handleRightClick(row, col);
            } else {
                this.handleLeftClick(row, col);
            }
        });
        
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(row, col);
        });
        
        cell.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.handleDoubleClick(row, col);
        });
        
        // Hammer.jsでタッチイベントを設定（モバイル用）
        const hammer = new Hammer(cell, {
            recognizers: [
                [Hammer.Tap, { event: 'singletap' }],
                [Hammer.Tap, { event: 'doubletap', taps: 2 }],
                [Hammer.Press, { time: 170 }],
                [Hammer.Swipe, { direction: Hammer.DIRECTION_ALL, threshold: 10, velocity: 0.3 }]
            ]
        });
        
        // ダブルタップとシングルタップを区別
        hammer.get('doubletap').recognizeWith('singletap');
        hammer.get('singletap').requireFailure('doubletap');
        
        // パン操作中フラグ
        let isPanning = false;
        
        // 親要素のHammerインスタンスでパン状態を監視
        if (this.hammerManager) {
            this.hammerManager.on('panstart', () => {
                isPanning = true;
            });
            this.hammerManager.on('panend', () => {
                setTimeout(() => {
                    isPanning = false;
                }, 50);
            });
        }
        
        // シングルタップ（セルを開く）
        hammer.on('singletap', () => {
            // パン操作中は無視
            if (isPanning) return;
            this.handleLeftClick(row, col);
        });
        
        // ダブルタップ（周囲を開く）
        hammer.on('doubletap', () => {
            this.handleDoubleClick(row, col);
        });
        
        // 長押し（旗を立てる）
        hammer.on('press', () => {
            this.handleRightClick(row, col);
            // バイブレーションフィードバック
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
        });
        
        // スワイプ（素早く旗を立てる）
        hammer.on('swipe', (e) => {
            // パン操作中は無視
            if (isPanning) return;
            
            // 上スワイプで旗を立てる
            if (e.direction === Hammer.DIRECTION_UP) {
                this.handleRightClick(row, col);
            }
        });
    }
    
    handleLeftClick(row, col) {
        if (this.gameOver) return;
        
        const cell = this.board[row][col];
        
        if (cell.isFlagged || cell.isRevealed) return;
        
        if (this.timer === 0 && this.timerInterval === null) {
            this.startTimer();
        }
        
        this.revealCell(row, col);
        
        if (cell.isMine) {
            this.endGame(false);
        } else {
            this.checkWin();
        }
    }
    
    handleRightClick(row, col) {
        if (this.gameOver) return;
        
        const cell = this.board[row][col];
        
        if (cell.isRevealed) return;
        
        this.saveHistory();
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagCount--;
            
            // アンフラグエフェクト
            if (typeof soundManager !== 'undefined') {
                soundManager.sounds.unflag();
            }
            if (navigator.vibrate) {
                navigator.vibrate(this.hapticPatterns.unflag);
            }
        } else {
            if (this.flagCount < this.mines) {
                cell.isFlagged = true;
                this.flagCount++;
                
                // フラグエフェクト
                if (cellElement) {
                    cellElement.classList.add('flag-animation');
                    if (typeof particleSystem !== 'undefined') {
                        particleSystem.flagEffect(cellElement);
                    }
                }
                if (typeof soundManager !== 'undefined') {
                    soundManager.sounds.flag();
                }
                if (navigator.vibrate) {
                    navigator.vibrate(this.hapticPatterns.flag);
                }
            } else {
                // フラグ上限エラー
                const gameBoard = document.getElementById('gameBoard');
                gameBoard.classList.add('error-shake');
                setTimeout(() => {
                    gameBoard.classList.remove('error-shake');
                }, 300);
                
                if (typeof soundManager !== 'undefined') {
                    soundManager.sounds.error();
                }
                if (navigator.vibrate) {
                    navigator.vibrate(this.hapticPatterns.error);
                }
            }
        }
        
        document.getElementById('mineCount').textContent = this.mines - this.flagCount;
        document.getElementById('flagCount').textContent = this.flagCount;
        document.getElementById('maxFlags').textContent = this.mines;
        
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
        
        this.renderBoard();
    }
    
    handleDoubleClick(row, col) {
        if (this.gameOver) return;
        
        const cell = this.board[row][col];
        
        // 開いていて数字があるセルのみ処理
        if (!cell.isRevealed || cell.neighborMines === 0) return;
        
        // 周囲のフラグ数をカウント
        let flaggedCount = 0;
        for (let i = row - 1; i <= row + 1; i++) {
            for (let j = col - 1; j <= col + 1; j++) {
                if (i >= 0 && i < this.rows && j >= 0 && j < this.cols) {
                    if (this.board[i][j].isFlagged) {
                        flaggedCount++;
                    }
                }
            }
        }
        
        // フラグ数が数字と一致する場合のみ周囲を開く
        if (flaggedCount === cell.neighborMines) {
            let hitMine = false;
            for (let i = row - 1; i <= row + 1; i++) {
                for (let j = col - 1; j <= col + 1; j++) {
                    if (i >= 0 && i < this.rows && j >= 0 && j < this.cols) {
                        const neighborCell = this.board[i][j];
                        if (!neighborCell.isRevealed && !neighborCell.isFlagged) {
                            this.revealCell(i, j);
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
    
    revealCell(row, col, isChain = false, chainDelay = 0) {
        if (!this.isValidCell(row, col)) return;
        
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) return;
        
        // 履歴を保存（チェーン開示の最初のみ）
        if (!isChain) {
            this.saveHistory();
            this.chainRevealQueue = [];
            this.isChainRevealing = false;
        }
        
        cell.isRevealed = true;
        this.revealedCount++;
        
        // 空のセルの場合、隣接セルを収集
        if (!cell.isMine && cell.neighborMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (this.isValidCell(newRow, newCol) && 
                        !this.board[newRow][newCol].isRevealed && 
                        !this.board[newRow][newCol].isFlagged) {
                        this.revealCell(newRow, newCol, true);
                    }
                }
            }
        }
        
        // バッチレンダリング（連鎖開示の最後にまとめて実行）
        if (!isChain) {
            this.renderBoard();
            this.applyRevealAnimations();
        }
    }
    
    // アニメーションを後から適用
    applyRevealAnimations() {
        // 新しく開いたセルだけにアニメーションを適用
        // （すでに開いているセルには影響しない）
        requestAnimationFrame(() => {
            // 音は最初の1回だけ
            if (typeof soundManager !== 'undefined') {
                soundManager.sounds.reveal();
            }
            
            // 振動は1回だけ
            if (navigator.vibrate) {
                navigator.vibrate(this.hapticPatterns.reveal);
            }
        });
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
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
            
            // 勝利エフェクト
            const gameBoard = document.getElementById('gameBoard');
            gameBoard.classList.add('win-animation');
            
            // セルに遅延を設定
            const cells = document.querySelectorAll('.cell');
            cells.forEach((cell, index) => {
                cell.style.setProperty('--win-delay', index);
            });
            
            if (typeof soundManager !== 'undefined') {
                soundManager.sounds.win();
            }
            if (typeof particleSystem !== 'undefined') {
                particleSystem.winCelebration();
            }
            if (navigator.vibrate) {
                navigator.vibrate(this.hapticPatterns.win);
            }
            
            // よりスタイリッシュな勝利メッセージ
            setTimeout(() => {
                this.showMessage('🎉 クリア！ 🎉', 'success');
            }, 500);
        } else {
            document.getElementById('resetBtn').textContent = 'リセット 😵';
            
            // 爆発エフェクト
            if (typeof soundManager !== 'undefined') {
                soundManager.sounds.explode();
            }
            if (navigator.vibrate) {
                navigator.vibrate(this.hapticPatterns.explode);
            }
            
            this.revealAllMines();
        }
    }
    
    revealAllMines() {
        // すべての地雷を一度に表示
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j].isMine) {
                    this.board[i][j].isRevealed = true;
                }
            }
        }
        
        this.renderBoard();
        
        // アニメーションを後から適用
        requestAnimationFrame(() => {
            const mineCells = document.querySelectorAll('.cell.mine');
            mineCells.forEach((cell, index) => {
                cell.classList.add('mine-explode');
                // 最初の3個だけパーティクルエフェクト
                if (typeof particleSystem !== 'undefined' && index < 3) {
                    particleSystem.explodeEffect(cell);
                }
            });
        });
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = this.timer;
        }, 1000);
    }
    
    // Hammer.jsでジェスチャーを設定
    setupHammerGestures() {
        const viewport = document.querySelector('.board-viewport');
        const gameBoard = document.getElementById('gameBoard');
        
        // Hammer.jsのインスタンスを作成
        this.hammerManager = new Hammer.Manager(viewport);
        
        // ピンチジェスチャーを追加
        const pinch = new Hammer.Pinch({ enable: true });
        const pan = new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 5 });
        const tap = new Hammer.Tap({ event: 'singletap' });
        const press = new Hammer.Press({ time: 170 }); // 170msで長押し認識
        
        // ジェスチャーを追加
        this.hammerManager.add([pinch, pan, tap, press]);
        
        // ピンチとパンを同時に認識
        pinch.recognizeWith(pan);
        
        // ピンチ開始
        let lastScale = 1;
        let startScale = 1;
        
        this.hammerManager.on('pinchstart', (e) => {
            startScale = this.scale;
            lastScale = e.scale;
        });
        
        // ピンチ中
        this.hammerManager.on('pinchmove', (e) => {
            const scaleDelta = e.scale / lastScale;
            const newScale = Math.max(0.5, Math.min(3, this.scale * scaleDelta));
            
            // ピンチの中心点を基準にスケール
            const centerX = e.center.x;
            const centerY = e.center.y;
            const scaleRatio = newScale / this.scale;
            
            this.translateX = centerX - (centerX - this.translateX) * scaleRatio;
            this.translateY = centerY - (centerY - this.translateY) * scaleRatio;
            this.scale = newScale;
            
            this.updateTransform();
            lastScale = e.scale;
        });
        
        // パン開始
        let startX = 0;
        let startY = 0;
        
        this.hammerManager.on('panstart', (e) => {
            startX = this.translateX;
            startY = this.translateY;
        });
        
        // パン中
        this.hammerManager.on('panmove', (e) => {
            this.translateX = startX + e.deltaX;
            this.translateY = startY + e.deltaY;
            this.updateTransform();
        });
        
        // パン終了
        this.hammerManager.on('panend', () => {
            this.adjustBoardPosition();
        });
    }
    
    
    updateTransform() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
    
    adjustBoardPosition() {
        const gameBoard = document.getElementById('gameBoard');
        const boardContainer = document.querySelector('.board-container');
        const boardRect = gameBoard.getBoundingClientRect();
        const containerRect = boardContainer.getBoundingClientRect();
        
        let needsAdjustment = false;
        let newTranslateX = this.translateX;
        let newTranslateY = this.translateY;
        
        // 余裕（マージン）を設定（20px）
        const margin = 20;
        
        // 盤面の現在の端の位置
        const boardLeft = boardRect.left;
        const boardRight = boardRect.right;
        const boardTop = boardRect.top;
        const boardBottom = boardRect.bottom;
        
        // コンテナの実際の境界（画面全体から見た位置）
        const containerLeft = containerRect.left;
        const containerRight = containerRect.right;
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;
        
        // X軸の調整
        if (boardRect.width <= containerRect.width) {
            // 盤面が画面より小さい場合は中央に
            newTranslateX = 0;
            needsAdjustment = true;
        } else {
            // 盤面が画面より大きい場合（マージンを考慮）
            if (boardLeft > containerLeft + margin) {
                // 左端が画面内に入りすぎている
                newTranslateX = this.translateX - (boardLeft - containerLeft - margin);
                needsAdjustment = true;
            } else if (boardRight < containerRight - margin) {
                // 右端が画面内に入りすぎている
                newTranslateX = this.translateX + (containerRight - margin - boardRight);
                needsAdjustment = true;
            }
        }
        
        // Y軸の調整は行わない（上下方向は自由に移動可能）
        
        // アニメーション付きで位置を調整
        if (needsAdjustment) {
            this.translateX = newTranslateX;
            this.translateY = newTranslateY;
            
            // スムーズなアニメーション
            gameBoard.style.transition = 'transform 0.3s ease-out';
            this.updateTransform();
            
            // アニメーション後にtransitionを削除
            setTimeout(() => {
                gameBoard.style.transition = '';
            }, 300);
        }
    }
    
    resetZoom() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
    }
    
    // 履歴保存（アンドゥ用）
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
        
        // アンドゥボタンの状態を更新
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.disabled = false;
        }
    }
    
    // アンドゥ実行
    undo() {
        if (this.history.length === 0 || this.gameOver) return;
        
        const state = this.history.pop();
        this.board = state.board;
        this.flagCount = state.flagCount;
        this.revealedCount = state.revealedCount;
        
        // UI更新
        document.getElementById('mineCount').textContent = this.mines - this.flagCount;
        document.getElementById('flagCount').textContent = this.flagCount;
        
        // アンドゥボタンの状態を更新
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn && this.history.length === 0) {
            undoBtn.disabled = true;
        }
        
        // サウンド再生
        if (typeof soundManager !== 'undefined') {
            soundManager.sounds.click();
        }
        
        this.renderBoard();
    }
    
    // テーマ切り替え
    setTheme(theme) {
        document.body.className = '';
        document.body.classList.add(`theme-${theme}`);
        this.currentTheme = theme;
        localStorage.setItem('minesweeper-theme', theme);
        
        // テーマ切り替えサウンド
        if (typeof soundManager !== 'undefined') {
            soundManager.sounds.click();
        }
    }
    
    // 初期テーマ設定
    loadTheme() {
        const savedTheme = localStorage.getItem('minesweeper-theme') || 'dark';
        this.setTheme(savedTheme);
    }
    
    // メッセージ表示
    showMessage(text, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `game-message ${type}`;
        messageEl.textContent = text;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#333'};
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: fadeInOut 2s ease-in-out;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        
        // アニメーション用のスタイル追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
            style.remove();
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Minesweeper();
    game.loadTheme();
    window.minesweeperGame = game; // グローバルアクセス用
});