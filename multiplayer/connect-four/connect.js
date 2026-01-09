const boardEl = document.getElementById('connectBoard');
const turnIndicatorEl = document.getElementById('turnIndicator');
const currentPlayerEl = document.getElementById('currentPlayer');
const gameMessageEl = document.getElementById('gameMessage');
const resetBtn = document.getElementById('resetBtn');

const ROWS = 6;
const COLS = 7;
let board = [];
let currentPlayer = 1;
let gameActive = true;

// Keyboard support
window.addEventListener('keydown', (e) => {
    // Prevent scrolling
    if (['Arrow Up', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    // Number keys 1-7 for columns
    const num = parseInt(e.key);
    if (num >= 1 && num <= 7) {
        dropDisc(num - 1);
    }
});

function initBoard() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    boardEl.innerHTML = '';

    for (let col = 0; col < COLS; col++) {
        const column = document.createElement('div');
        column.className = 'column';
        column.dataset.col = col;

        for (let row = 0; row < ROWS; row++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            column.appendChild(cell);
        }

        column.addEventListener('click', () => dropDisc(col));
        boardEl.appendChild(column);
    }

    currentPlayer = 1;
    gameActive = true;
    updateTurnIndicator();
    gameMessageEl.style.display = 'none';
}

function dropDisc(col) {
    if (!gameActive) return;

    // Find lowest empty row
    let row = -1;
    for (let r = 0; r < ROWS; r++) {
        if (board[r][col] === 0) {
            row = r;
            break;
        }
    }

    if (row === -1) return; // Column full

    // Place disc
    board[row][col] = currentPlayer;

    // Update visuals
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add(`player${currentPlayer}`);

    // Check win
    if (checkWin(row, col)) {
        endGame(`🎉 Player ${currentPlayer} Wins!`);
        highlightWinningCells(row, col);
        return;
    }

    // Check draw
    if (board.every(row => row.every(cell => cell !== 0))) {
        endGame("It's a Draw!");
        return;
    }

    // Switch player
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnIndicator();
}

function checkWin(row, col) {
    const player = board[row][col];

    // Horizontal
    let count = 1;
    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
    for (let c = col + 1; c < COLS && board[row][c] === player; c++) count++;
    if (count >= 4) return true;

    // Vertical
    count = 1;
    for (let r = row - 1; r >= 0 && board[r][col] === player; r--) count++;
    for (let r = row + 1; r < ROWS && board[r][col] === player; r++) count++;
    if (count >= 4) return true;

    // Diagonal \
    count = 1;
    for (let i = 1; row - i >= 0 && col - i >= 0 && board[row - i][col - i] === player; i++) count++;
    for (let i = 1; row + i < ROWS && col + i < COLS && board[row + i][col + i] === player; i++) count++;
    if (count >= 4) return true;

    // Diagonal /
    count = 1;
    for (let i = 1; row - i >= 0 && col + i < COLS && board[row - i][col + i] === player; i++) count++;
    for (let i = 1; row + i < ROWS && col - i >= 0 && board[row + i][col - i] === player; i++) count++;
    if (count >= 4) return true;

    return false;
}

function highlightWinningCells(row, col) {
    const player = board[row][col];
    const directions = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal \
        [1, -1]   // Diagonal /
    ];

    for (const [dr, dc] of directions) {
        const cells = [[row, col]];

        // Check both directions
        for (let i = 1; i < 4; i++) {
            const r1 = row + dr * i;
            const c1 = col + dc * i;
            if (r1 >= 0 && r1 < ROWS && c1 >= 0 && c1 < COLS && board[r1][c1] === player) {
                cells.push([r1, c1]);
            }

            const r2 = row - dr * i;
            const c2 = col - dc * i;
            if (r2 >= 0 && r2 < ROWS && c2 >= 0 && c2 < COLS && board[r2][c2] === player) {
                cells.push([r2, c2]);
            }
        }

        if (cells.length >= 4) {
            cells.forEach(([r, c]) => {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                cell.classList.add('winning');
            });
            break;
        }
    }
}

function updateTurnIndicator() {
    currentPlayerEl.innerText = `Player ${currentPlayer}`;
    currentPlayerEl.style.color = currentPlayer === 1 ? '#00f3ff' : '#bc13fe';
}

function endGame(message) {
    gameActive = false;
    gameMessageEl.innerText = message;
    gameMessageEl.style.display = 'block';
    gameMessageEl.style.color = currentPlayer === 1 ? '#00f3ff' : '#bc13fe';
}

resetBtn.addEventListener('click', initBoard);

// Touch Controls
document.querySelectorAll('.col-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const col = parseInt(btn.getAttribute('data-col'));
        dropDisc(col);
    });
});

// Initialize
initBoard();
