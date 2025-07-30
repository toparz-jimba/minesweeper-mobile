class Minesweeper {
    constructor() {
        this.gameBoard = document.getElementById('game-board');
        this.mineCountDisplay = document.getElementById('mine-count');
        this.timerDisplay = document.getElementById('timer');
        this.resetButton = document.getElementById('reset-btn');
        this.difficultySelect = document.getElementById('difficulty');
        this.gameMessage = document.getElementById('game-message');
        this.zoomInButton = document.getElementById('zoom-in');
        this.zoomOutButton = document.getElementById('zoom-out');
        this.zoomResetButton = document.getElementById('zoom-reset');
        this.zoomLevelDisplay = document.getElementById('zoom-level');
        
        // ゲームボードラッパーを作成
        this.createGameBoardWrapper();
        
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 },
            extreme: { rows: 64, cols: 64, mines: 999 },
            easyBack: { rows: 9, cols: 9, mines: 20 },
            mediumBack: { rows: 16, cols: 16, mines: 64 },
            hardBack: { rows: 16, cols: 30, mines: 120 }
        };
        
        this.currentDifficulty = 'easy';
        this.board = [];
        this.gameState = 'playing'; // 'playing', 'won', 'lost'
        this.firstClick = true;
        this.flaggedCells = 0;
        this.revealedCells = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.zoomLevel = 1.0; // 拡大縮小レベル (1.0 = 100%)
        this.minZoom = 0.5; // 最小ズーム (50%)
        this.maxZoom = 3.0; // 最大ズーム (300%)
        this.zoomStep = 0.1; // ズームステップ (10%)
        
        this.initializeEventListeners();
        this.newGame();
    }
    
    createGameBoardWrapper() {
        // ゲームボードの親要素を取得
        const gameArea = this.gameBoard.parentElement;
        
        // ラッパーdivを作成
        const wrapper = document.createElement('div');
        wrapper.className = 'game-board-wrapper';
        
        // ゲームボードをラッパーに移動
        gameArea.insertBefore(wrapper, this.gameBoard);
        wrapper.appendChild(this.gameBoard);
        
        // ラッパーの参照を保存
        this.gameBoardWrapper = wrapper;
    }
    
    initializeEventListeners() {
        this.resetButton.addEventListener('click', () => this.newGame());
        this.difficultySelect.addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
            this.newGame();
        });
        
        // 拡大縮小機能のイベントリスナー
        this.zoomInButton.addEventListener('click', () => this.zoomIn());
        this.zoomOutButton.addEventListener('click', () => this.zoomOut());
        this.zoomResetButton.addEventListener('click', () => this.zoomReset());
    }
    
    newGame() {
        this.gameState = 'playing';
        this.firstClick = true;
        this.flaggedCells = 0;
        this.revealedCells = 0;
        this.timer = 0;
        this.clearTimer();
        this.updateDisplay();
        this.hideMessage();
        this.createBoard();
        this.updateZoom(); // ズーム状態を初期化
    }
    
    createBoard() {
        const config = this.difficulties[this.currentDifficulty];
        this.board = [];
        this.gameBoard.innerHTML = '';
        
        // セルサイズを難易度に応じて調整
        const cellSize = this.currentDifficulty === 'extreme' ? '15px' : '30px';
        
        // ボードのグリッドサイズを設定
        this.gameBoard.style.gridTemplateColumns = `repeat(${config.cols}, ${cellSize})`;
        this.gameBoard.style.gridTemplateRows = `repeat(${config.rows}, ${cellSize})`;
        
        // ボードデータの初期化
        for (let row = 0; row < config.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < config.cols; col++) {
                this.board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0,
                    element: null
                };
            }
        }
        
        // セル要素の作成
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e, row, col));
                cell.addEventListener('dblclick', (e) => this.handleDoubleClick(e, row, col));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, row, col));
                
                this.board[row][col].element = cell;
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    placeMines(excludeRow, excludeCol) {
        const config = this.difficulties[this.currentDifficulty];
        const totalCells = config.rows * config.cols;
        const mines = [];
        
        // 地雷位置をランダムに決定（最初のクリック位置は除外）
        while (mines.length < config.mines) {
            const row = Math.floor(Math.random() * config.rows);
            const col = Math.floor(Math.random() * config.cols);
            
            if ((row !== excludeRow || col !== excludeCol) && 
                !mines.some(mine => mine.row === row && mine.col === col)) {
                mines.push({ row, col });
                this.board[row][col].isMine = true;
            }
        }
        
        // 隣接地雷数を計算
        this.calculateNeighborMines();
    }
    
    calculateNeighborMines() {
        const config = this.difficulties[this.currentDifficulty];
        
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                if (!this.board[row][col].isMine) {
                    let count = 0;
                    for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
                        for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
                            if (this.board[r][c].isMine) {
                                count++;
                            }
                        }
                    }
                    this.board[row][col].neighborMines = count;
                }
            }
        }
    }
    
    handleCellClick(event, row, col) {
        event.preventDefault();
        
        if (this.gameState !== 'playing' || this.board[row][col].isFlagged || this.board[row][col].isRevealed) {
            return;
        }
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        this.revealCell(row, col);
    }
    
    handleRightClick(event, row, col) {
        event.preventDefault();
        
        if (this.gameState !== 'playing' || this.board[row][col].isRevealed) {
            return;
        }
        
        this.toggleFlag(row, col);
    }
    
    handleDoubleClick(event, row, col) {
        event.preventDefault();
        
        if (this.gameState !== 'playing') {
            return;
        }
        
        const cell = this.board[row][col];
        
        // 開かれた数字セルのみ対象
        if (!cell.isRevealed || cell.isMine || cell.neighborMines === 0) {
            return;
        }
        
        // 周囲のフラグ数をカウント
        const flagCount = this.countAdjacentFlags(row, col);
        
        // フラグ数が数字と一致する場合、残りのセルを開く
        if (flagCount === cell.neighborMines) {
            this.revealAdjacentUnflagged(row, col);
        }
    }
    
    revealCell(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) {
            return;
        }
        
        cell.isRevealed = true;
        cell.element.classList.add('revealed');
        this.revealedCells++;
        
        if (cell.isMine) {
            this.gameOver(false);
            return;
        }
        
        if (cell.neighborMines > 0) {
            cell.element.textContent = cell.neighborMines;
            cell.element.classList.add(`number-${cell.neighborMines}`);
        } else {
            // 隣接セルを自動で開く
            this.revealNeighbors(row, col);
        }
        
        this.checkWinCondition();
    }
    
    revealNeighbors(row, col) {
        const config = this.difficulties[this.currentDifficulty];
        
        for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
                if (r !== row || c !== col) {
                    this.revealCell(r, c);
                }
            }
        }
    }
    
    toggleFlag(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            cell.element.classList.remove('flagged');
            cell.element.textContent = '';
            this.flaggedCells--;
        } else {
            cell.isFlagged = true;
            cell.element.classList.add('flagged');
            cell.element.textContent = '🚩';
            this.flaggedCells++;
        }
        
        this.updateDisplay();
    }
    
    checkWinCondition() {
        const config = this.difficulties[this.currentDifficulty];
        const totalCells = config.rows * config.cols;
        const nonMineCells = totalCells - config.mines;
        
        if (this.revealedCells === nonMineCells) {
            this.gameOver(true);
        }
    }
    
    gameOver(won) {
        this.gameState = won ? 'won' : 'lost';
        this.clearTimer();
        
        if (!won) {
            // すべての地雷を表示
            const config = this.difficulties[this.currentDifficulty];
            for (let row = 0; row < config.rows; row++) {
                for (let col = 0; col < config.cols; col++) {
                    const cell = this.board[row][col];
                    if (cell.isMine && !cell.isFlagged) {
                        cell.element.classList.add('mine');
                        cell.element.textContent = '💣';
                    }
                }
            }
        }
        
        this.showMessage(won);
    }
    
    showMessage(won) {
        this.gameMessage.textContent = won ? 
            `🎉 おめでとうございます！ ${this.timer}秒でクリアしました！` : 
            '💥 ゲームオーバー！もう一度挑戦してください。';
        this.gameMessage.className = `game-message ${won ? 'win' : 'lose'}`;
        this.gameMessage.classList.remove('hidden');
    }
    
    hideMessage() {
        this.gameMessage.classList.add('hidden');
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }
    
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    countAdjacentFlags(row, col) {
        const config = this.difficulties[this.currentDifficulty];
        let flagCount = 0;
        
        for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
                if (r !== row || c !== col) {
                    if (this.board[r][c].isFlagged) {
                        flagCount++;
                    }
                }
            }
        }
        
        return flagCount;
    }
    
    revealAdjacentUnflagged(row, col) {
        const config = this.difficulties[this.currentDifficulty];
        
        for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
                if (r !== row || c !== col) {
                    const adjacentCell = this.board[r][c];
                    if (!adjacentCell.isRevealed && !adjacentCell.isFlagged) {
                        this.revealCell(r, c);
                    }
                }
            }
        }
    }
    
    updateDisplay() {
        const config = this.difficulties[this.currentDifficulty];
        const remainingMines = config.mines - this.flaggedCells;
        const minePadding = this.currentDifficulty === 'extreme' ? 3 : 2;
        this.mineCountDisplay.textContent = remainingMines.toString().padStart(minePadding, '0');
        this.timerDisplay.textContent = this.timer.toString().padStart(3, '0');
    }
    
    // 拡大縮小機能
    zoomIn() {
        if (this.zoomLevel < this.maxZoom) {
            this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
            this.updateZoom();
        }
    }
    
    zoomOut() {
        if (this.zoomLevel > this.minZoom) {
            this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
            this.updateZoom();
        }
    }
    
    zoomReset() {
        this.zoomLevel = 1.0;
        this.updateZoom();
    }
    
    updateZoom() {
        // ゲームボードの拡大縮小を適用
        this.gameBoard.style.transform = `scale(${this.zoomLevel})`;
        this.gameBoard.style.transformOrigin = 'top left';
        
        // ズームレベル表示を更新
        this.zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        
        // ズームレベルに応じてラッパーのpaddingを動的調整
        const basePadding = 50;
        const adjustedPadding = Math.max(basePadding, basePadding * this.zoomLevel);
        this.gameBoardWrapper.style.padding = `${adjustedPadding}px`;
        
        // ズームボタンの有効/無効状態を更新
        this.zoomInButton.disabled = this.zoomLevel >= this.maxZoom;
        this.zoomOutButton.disabled = this.zoomLevel <= this.minZoom;
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
}); 