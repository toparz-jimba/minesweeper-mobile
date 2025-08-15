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
        
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            longPressTriggered = false;
            
            this.touchTimer = setTimeout(() => {
                longPressTriggered = true;
                this.handleRightClick(row, col);
                // 旗を立てた時により強いバイブレーションフィードバック
                if (navigator.vibrate) {
                    navigator.vibrate([50, 30, 50]); // パターンバイブレーション
                }
            }, 500);
        });
        
        cell.addEventListener('touchend', (e) => {
            e.preventDefault();
            clearTimeout(this.touchTimer);
            
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
        
        cell.addEventListener('touchmove', () => {
            clearTimeout(this.touchTimer);
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
        } else if (e.touches.length === 1 && !e.target.classList.contains('cell')) {
            // パン開始（セル以外をタッチした場合）
            this.isPanning = true;
            this.startX = e.touches[0].clientX - this.translateX;
            this.startY = e.touches[0].clientY - this.translateY;
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
        } else if (e.touches.length === 1 && this.isPanning) {
            // パン処理
            e.preventDefault();
            this.translateX = e.touches[0].clientX - this.startX;
            this.translateY = e.touches[0].clientY - this.startY;
            this.updateTransform();
        }
    }
    
    handleTouchEnd(e) {
        if (e.touches.length < 2) {
            this.lastTouchDistance = 0;
        }
        if (e.touches.length === 0) {
            this.isPanning = false;
        }
    }
    
    
    updateTransform() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
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