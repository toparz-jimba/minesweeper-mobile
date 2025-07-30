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
        this.hintButton = document.getElementById('hint-btn');
        this.statsButton = document.getElementById('stats-btn');
        
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
        
        // ヒント機能用の変数
        this.probabilities = []; // 各セルの爆弾確率
        this.hintHighlightedCells = []; // ヒントで光っているセル
        this.statsMode = false; // 統計モードのオンオフ
        
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
        
        // ヒントボタンのイベントリスナー
        this.hintButton.addEventListener('click', () => this.showHint());
        
        // 統計モードボタンのイベントリスナー
        this.statsButton.addEventListener('click', () => this.toggleStatsMode());
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
        this.clearHintHighlight(); // ヒントハイライトをクリア
        if (this.statsMode) {
            this.clearStatsMode(); // 統計モードをクリア
        }
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
        
        // ヒントハイライトをクリア
        this.clearHintHighlight();
        
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
        
        // ヒントハイライトをクリア
        this.clearHintHighlight();
        
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
            // ヒントハイライトをクリア
            this.clearHintHighlight();
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
        
        // 統計モードが有効な場合は更新
        this.updateStatsModeIfActive();
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
        
        // 統計モードが有効な場合は更新
        this.updateStatsModeIfActive();
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
    
    // 確率計算機能
    calculateProbabilities() {
        const config = this.difficulties[this.currentDifficulty];
        
        // 確率配列を初期化
        this.probabilities = [];
        for (let row = 0; row < config.rows; row++) {
            this.probabilities[row] = [];
            for (let col = 0; col < config.cols; col++) {
                // 初期値：すでに開いているセルは0、フラグ付きは1、未開封は-1
                const cell = this.board[row][col];
                if (cell.isRevealed) {
                    this.probabilities[row][col] = 0;
                } else if (cell.isFlagged) {
                    this.probabilities[row][col] = 1;
                } else {
                    this.probabilities[row][col] = -1; // 計算対象
                }
            }
        }
        
        // 制約条件を収集
        const constraints = [];
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const cell = this.board[row][col];
                if (cell.isRevealed && !cell.isMine && cell.neighborMines > 0) {
                    const constraint = {
                        row: row,
                        col: col,
                        requiredMines: cell.neighborMines,
                        unknownCells: [],
                        flaggedCount: 0
                    };
                    
                    // 周囲のセルを調査
                    for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
                        for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
                            if (r !== row || c !== col) {
                                const neighborCell = this.board[r][c];
                                if (!neighborCell.isRevealed && !neighborCell.isFlagged) {
                                    constraint.unknownCells.push({row: r, col: c});
                                } else if (neighborCell.isFlagged) {
                                    constraint.flaggedCount++;
                                }
                            }
                        }
                    }
                    
                    constraint.remainingMines = constraint.requiredMines - constraint.flaggedCount;
                    if (constraint.unknownCells.length > 0) {
                        constraints.push(constraint);
                    }
                }
            }
        }
        
        // 簡易的な確率計算
        // まず確定的な状況を処理
        let changed = true;
        while (changed) {
            changed = false;
            
            for (const constraint of constraints) {
                // 全てのセルが爆弾の場合
                if (constraint.remainingMines === constraint.unknownCells.length) {
                    for (const cell of constraint.unknownCells) {
                        if (this.probabilities[cell.row][cell.col] !== 1) {
                            this.probabilities[cell.row][cell.col] = 1;
                            changed = true;
                        }
                    }
                }
                // 爆弾が無い場合
                else if (constraint.remainingMines === 0) {
                    for (const cell of constraint.unknownCells) {
                        if (this.probabilities[cell.row][cell.col] !== 0) {
                            this.probabilities[cell.row][cell.col] = 0;
                            changed = true;
                        }
                    }
                }
            }
            
            // 確定したセルを制約から除外
            if (changed) {
                for (const constraint of constraints) {
                    constraint.unknownCells = constraint.unknownCells.filter(
                        cell => this.probabilities[cell.row][cell.col] === -1
                    );
                    
                    let confirmedMines = 0;
                    for (let r = Math.max(0, constraint.row - 1); r <= Math.min(config.rows - 1, constraint.row + 1); r++) {
                        for (let c = Math.max(0, constraint.col - 1); c <= Math.min(config.cols - 1, constraint.col + 1); c++) {
                            if ((r !== constraint.row || c !== constraint.col) && 
                                this.probabilities[r][c] === 1) {
                                confirmedMines++;
                            }
                        }
                    }
                    constraint.remainingMines = constraint.requiredMines - confirmedMines;
                }
            }
        }
        
        // 残りの未確定セルに対して簡易的な確率を計算
        const totalUnknownCells = [];
        let remainingMines = config.mines - this.flaggedCells;
        
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                if (this.probabilities[row][col] === -1) {
                    totalUnknownCells.push({row, col});
                } else if (this.probabilities[row][col] === 1 && !this.board[row][col].isFlagged) {
                    remainingMines--;
                }
            }
        }
        
        // 制約に関わる未確定セルの確率を計算
        for (const cell of totalUnknownCells) {
            const relevantConstraints = constraints.filter(
                c => c.unknownCells.some(u => u.row === cell.row && u.col === cell.col)
            );
            
            if (relevantConstraints.length > 0) {
                // 簡易的に、最も制約的な確率を採用
                let maxProbability = 0;
                for (const constraint of relevantConstraints) {
                    const probability = constraint.remainingMines / constraint.unknownCells.length;
                    maxProbability = Math.max(maxProbability, probability);
                }
                this.probabilities[cell.row][cell.col] = maxProbability;
            } else {
                // 制約に関わらないセルは全体の平均確率
                this.probabilities[cell.row][cell.col] = remainingMines / totalUnknownCells.length;
            }
        }
    }
    
    // ヒント表示機能
    showHint() {
        if (this.gameState !== 'playing' || this.firstClick) {
            return;
        }
        
        // 前のヒントハイライトをクリア
        this.clearHintHighlight();
        
        // 確率を計算
        this.calculateProbabilities();
        
        const config = this.difficulties[this.currentDifficulty];
        let bestCells = [];
        let bestType = null; // 'mine' or 'safe'
        
        // 確定爆弾を探す（確率1.0）
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                if (this.probabilities[row][col] === 1 && 
                    !this.board[row][col].isFlagged && 
                    !this.board[row][col].isRevealed) {
                    bestCells.push({row, col});
                    bestType = 'mine';
                }
            }
        }
        
        // 確定爆弾が無い場合、確定安全セルを探す（確率0）
        if (bestCells.length === 0) {
            for (let row = 0; row < config.rows; row++) {
                for (let col = 0; col < config.cols; col++) {
                    if (this.probabilities[row][col] === 0 && 
                        !this.board[row][col].isRevealed) {
                        bestCells.push({row, col});
                        bestType = 'safe';
                    }
                }
            }
        }
        
        // それも無い場合、制約に関わるセルで最も確率の低いセルを探す
        if (bestCells.length === 0) {
            let minProbability = 1;
            const constraints = [];
            
            // 制約を再収集
            for (let row = 0; row < config.rows; row++) {
                for (let col = 0; col < config.cols; col++) {
                    const cell = this.board[row][col];
                    if (cell.isRevealed && !cell.isMine && cell.neighborMines > 0) {
                        const unknownNeighbors = [];
                        for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
                            for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
                                if ((r !== row || c !== col) && !this.board[r][c].isRevealed && !this.board[r][c].isFlagged) {
                                    unknownNeighbors.push({row: r, col: c});
                                }
                            }
                        }
                        if (unknownNeighbors.length > 0) {
                            constraints.push({unknownCells: unknownNeighbors});
                        }
                    }
                }
            }
            
            // 制約に関わるセルのみを対象にする
            const constraintCells = new Set();
            for (const constraint of constraints) {
                for (const cell of constraint.unknownCells) {
                    constraintCells.add(`${cell.row},${cell.col}`);
                }
            }
            
            for (let row = 0; row < config.rows; row++) {
                for (let col = 0; col < config.cols; col++) {
                    const prob = this.probabilities[row][col];
                    const cellKey = `${row},${col}`;
                    // 制約に関わるセルのみを対象
                    if (constraintCells.has(cellKey) && prob > 0 && prob < 1 && !this.board[row][col].isRevealed) {
                        if (prob < minProbability) {
                            minProbability = prob;
                            bestCells = [{row, col}];
                        } else if (prob === minProbability) {
                            bestCells.push({row, col});
                        }
                    }
                }
            }
            bestType = 'safe';
        }
        
        // ハイライト表示
        if (bestCells.length > 0) {
            const highlightClass = bestType === 'mine' ? 'hint-mine' : 'hint-safe';
            for (const cell of bestCells) {
                this.board[cell.row][cell.col].element.classList.add(highlightClass);
                this.hintHighlightedCells.push({
                    row: cell.row, 
                    col: cell.col, 
                    class: highlightClass
                });
            }
            
            // メッセージ表示
            if (bestType === 'mine') {
                this.showHintMessage('💡 赤く光っているマスは爆弾が確定しています！');
            } else if (this.probabilities[bestCells[0].row][bestCells[0].col] === 0) {
                this.showHintMessage('💡 緑に光っているマスは安全です！');
            } else {
                const probability = Math.round(this.probabilities[bestCells[0].row][bestCells[0].col] * 100);
                this.showHintMessage(`💡 緑に光っているマスは爆弾確率が最も低いです（${probability}%）`);
            }
        } else {
            this.showHintMessage('💡 ヒントが見つかりませんでした');
        }
    }
    
    // ヒントメッセージ表示
    showHintMessage(message) {
        const originalMessage = this.gameMessage.textContent;
        const originalClass = this.gameMessage.className;
        const wasHidden = this.gameMessage.classList.contains('hidden');
        
        this.gameMessage.textContent = message;
        this.gameMessage.className = 'game-message hint';
        this.gameMessage.classList.remove('hidden');
        
        // 3秒後に元に戻す
        setTimeout(() => {
            if (wasHidden) {
                this.gameMessage.classList.add('hidden');
            } else {
                this.gameMessage.textContent = originalMessage;
                this.gameMessage.className = originalClass;
            }
        }, 3000);
    }
    
    // ヒントハイライトをクリア
    clearHintHighlight() {
        if (!this.board || this.board.length === 0) {
            this.hintHighlightedCells = [];
            return;
        }
        
        for (const highlighted of this.hintHighlightedCells) {
            const cell = this.board[highlighted.row]?.[highlighted.col];
            if (cell && cell.element) {
                cell.element.classList.remove(highlighted.class);
            }
        }
        this.hintHighlightedCells = [];
    }
    
    // 統計モードのトグル
    toggleStatsMode() {
        if (this.gameState !== 'playing' || this.firstClick) {
            return;
        }
        
        this.statsMode = !this.statsMode;
        this.statsButton.classList.toggle('active', this.statsMode);
        
        if (this.statsMode) {
            this.showStatsMode();
        } else {
            this.clearStatsMode();
        }
    }
    
    // 統計モード表示
    showStatsMode() {
        // 確率を計算
        this.calculateProbabilities();
        
        const config = this.difficulties[this.currentDifficulty];
        
        // 全てのセルに確率を表示
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const cell = this.board[row][col];
                if (!cell.isRevealed && !cell.isFlagged) {
                    const probability = this.probabilities[row][col];
                    if (probability >= 0) {
                        // 確率をパーセンテージで表示
                        const percentage = Math.round(probability * 100);
                        cell.element.classList.add('stats-mode');
                        cell.element.setAttribute('data-probability', `${percentage}%`);
                    }
                }
            }
        }
        
        // メッセージ表示
        this.showStatsModeMessage('📊 統計モード: 各マスの爆弾確率を表示中');
    }
    
    // 統計モードをクリア
    clearStatsMode() {
        const config = this.difficulties[this.currentDifficulty];
        
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const cell = this.board[row][col];
                if (cell.element) {
                    cell.element.classList.remove('stats-mode');
                    cell.element.removeAttribute('data-probability');
                }
            }
        }
        
        this.statsMode = false;
        this.statsButton.classList.remove('active');
    }
    
    // 統計モードメッセージ表示
    showStatsModeMessage(message) {
        const originalMessage = this.gameMessage.textContent;
        const originalClass = this.gameMessage.className;
        const wasHidden = this.gameMessage.classList.contains('hidden');
        
        this.gameMessage.textContent = message;
        this.gameMessage.className = 'game-message hint';
        this.gameMessage.classList.remove('hidden');
        
        // 2秒後に元に戻す
        setTimeout(() => {
            if (wasHidden && !this.statsMode) {
                this.gameMessage.classList.add('hidden');
            } else if (!this.statsMode) {
                this.gameMessage.textContent = originalMessage;
                this.gameMessage.className = originalClass;
            }
        }, 2000);
    }
    
    // セルの状態が変化したときに統計モードを更新
    updateStatsModeIfActive() {
        if (this.statsMode) {
            this.showStatsMode();
        }
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
}); 