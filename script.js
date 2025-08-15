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
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.lastTouchDistance = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.resetGame();
    }
    
    setupEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('difficultySelect').addEventListener('change', (e) => this.setDifficulty(e.target.value));
        
        // ズーム・パン機能のイベントリスナー（モバイル専用）
        const viewport = document.querySelector('.board-viewport');
        
        // タッチイベント（ピンチズーム・パン）
        viewport.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        viewport.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        viewport.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
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
        gameBoard.innerHTML = '';
        gameBoard.className = 'game-board';
        
        if (this.gameOver) {
            gameBoard.classList.add('game-over');
        }
        
        const cellSize = '35px';
        gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, ${cellSize})`;
        gameBoard.style.gridTemplateRows = `repeat(${this.rows}, ${cellSize})`;
        
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
                gameBoard.appendChild(cell);
            }
        }
    }
    
    setupCellEventListeners(cell, row, col) {
        // マウスイベント
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
        
        // タッチイベント
        let touchStartX, touchStartY;
        let longPressTriggered = false;
        let lastTapTime = 0;
        let isMultiTouch = false;
        
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            // マルチタッチ（ピンチ操作など）を検出
            if (e.touches.length > 1) {
                isMultiTouch = true;
                clearTimeout(this.touchTimer);
                return;
            }
            
            isMultiTouch = false;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            longPressTriggered = false;
            
            this.touchTimer = setTimeout(() => {
                // マルチタッチの場合は旗を立てない
                if (!isMultiTouch) {
                    longPressTriggered = true;
                    this.handleRightClick(row, col);
                    // 旗を立てた時により強いバイブレーションフィードバック
                    if (navigator.vibrate) {
                        navigator.vibrate([50, 30, 50]); // パターンバイブレーション
                    }
                }
            }, 500);
        });
        
        cell.addEventListener('touchend', (e) => {
            e.preventDefault();
            clearTimeout(this.touchTimer);
            
            // マルチタッチの場合は何もしない
            if (isMultiTouch) {
                isMultiTouch = false;
                return;
            }
            
            // 親コンテナがパン操作中の場合はセルのクリックを無視
            if (this.hasMoved) {
                return;
            }
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const distance = Math.sqrt(
                Math.pow(touchEndX - touchStartX, 2) + 
                Math.pow(touchEndY - touchStartY, 2)
            );
            
            if (!longPressTriggered && distance < 10) {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;
                
                if (tapLength < 300 && tapLength > 0) {
                    // ダブルタップ検出
                    this.handleDoubleClick(row, col);
                    lastTapTime = 0;
                } else {
                    // シングルタップ
                    this.handleLeftClick(row, col);
                    lastTapTime = currentTime;
                }
            }
        });
        
        cell.addEventListener('touchmove', (e) => {
            clearTimeout(this.touchTimer);
            // マルチタッチを検出
            if (e.touches.length > 1) {
                isMultiTouch = true;
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
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagCount--;
        } else {
            if (this.flagCount < this.mines) {
                cell.isFlagged = true;
                this.flagCount++;
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
    
    revealCell(row, col) {
        if (!this.isValidCell(row, col)) return;
        
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        this.revealedCount++;
        
        if (!cell.isMine && cell.neighborMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    this.revealCell(row + dr, col + dc);
                }
            }
        }
        
        this.renderBoard();
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
            alert('おめでとう！クリアしました！');
        } else {
            document.getElementById('resetBtn').textContent = 'リセット 😵';
            this.revealAllMines();
        }
    }
    
    revealAllMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j].isMine) {
                    this.board[i][j].isRevealed = true;
                }
            }
        }
        this.renderBoard();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = this.timer;
        }, 1000);
    }
    
    // ズーム・パン機能のメソッド
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            // ピンチズーム開始
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            this.lastTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        } else if (e.touches.length === 1) {
            // パン開始の準備（実際の移動は一定距離動いてから）
            this.panStartX = e.touches[0].clientX;
            this.panStartY = e.touches[0].clientY;
            this.potentialPanStartX = e.touches[0].clientX - this.translateX;
            this.potentialPanStartY = e.touches[0].clientY - this.translateY;
            this.hasMoved = false;
        }
    }
    
    handleTouchMove(e) {
        if (e.touches.length === 2) {
            // ピンチズーム処理
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            if (this.lastTouchDistance > 0) {
                const scaleDelta = currentDistance / this.lastTouchDistance;
                this.scale = Math.max(0.5, Math.min(3, this.scale * scaleDelta));
                this.updateTransform();
            }
            
            this.lastTouchDistance = currentDistance;
        } else if (e.touches.length === 1) {
            // 移動距離を計算
            const moveX = e.touches[0].clientX - this.panStartX;
            const moveY = e.touches[0].clientY - this.panStartY;
            const distance = Math.sqrt(moveX * moveX + moveY * moveY);
            
            // 一定距離（10px）以上動いたらパン開始
            if (distance > 10 || this.isPanning) {
                if (!this.isPanning) {
                    this.isPanning = true;
                    this.hasMoved = true;
                    this.startX = this.potentialPanStartX;
                    this.startY = this.potentialPanStartY;
                }
                
                // パン処理（制限なしで自由に動かす）
                e.preventDefault();
                this.translateX = e.touches[0].clientX - this.startX;
                this.translateY = e.touches[0].clientY - this.startY;
                this.updateTransform();
            }
        }
    }
    
    handleTouchEnd(e) {
        if (e.touches.length < 2) {
            this.lastTouchDistance = 0;
        }
        if (e.touches.length === 0) {
            this.isPanning = false;
            // タッチ終了時に盤面位置を調整
            this.adjustBoardPosition();
        }
    }
    
    
    updateTransform() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
    
    adjustBoardPosition() {
        const gameBoard = document.getElementById('gameBoard');
        const viewport = document.querySelector('.board-viewport');
        const boardRect = gameBoard.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        
        let needsAdjustment = false;
        let newTranslateX = this.translateX;
        let newTranslateY = this.translateY;
        
        // 盤面の実際のサイズ（元のサイズ）
        const originalWidth = boardRect.width / this.scale;
        const originalHeight = boardRect.height / this.scale;
        
        // 盤面の現在の端の位置
        const boardLeft = boardRect.left;
        const boardRight = boardRect.right;
        const boardTop = boardRect.top;
        const boardBottom = boardRect.bottom;
        
        // X軸の調整
        if (boardRect.width <= viewportRect.width) {
            // 盤面が画面より小さい場合は中央に
            newTranslateX = 0;
            needsAdjustment = true;
        } else {
            // 盤面が画面より大きい場合
            if (boardLeft > viewportRect.left) {
                // 左端が画面内に入りすぎている
                newTranslateX = this.translateX - (boardLeft - viewportRect.left);
                needsAdjustment = true;
            } else if (boardRight < viewportRect.right) {
                // 右端が画面内に入りすぎている
                newTranslateX = this.translateX + (viewportRect.right - boardRight);
                needsAdjustment = true;
            }
        }
        
        // Y軸の調整
        if (boardRect.height <= viewportRect.height) {
            // 盤面が画面より小さい場合は中央に
            newTranslateY = 0;
            needsAdjustment = true;
        } else {
            // 盤面が画面より大きい場合
            if (boardTop > viewportRect.top) {
                // 上端が画面内に入りすぎている
                newTranslateY = this.translateY - (boardTop - viewportRect.top);
                needsAdjustment = true;
            } else if (boardBottom < viewportRect.bottom) {
                // 下端が画面内に入りすぎている
                newTranslateY = this.translateY + (viewportRect.bottom - boardBottom);
                needsAdjustment = true;
            }
        }
        
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
}

document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});