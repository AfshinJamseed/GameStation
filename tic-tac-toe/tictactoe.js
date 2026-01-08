const X_CLASS = 'x';
const O_CLASS = 'o';
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const cellElements = document.querySelectorAll('[data-cell]');
const board = document.getElementById('board');
const statusText = document.getElementById('status');
const restartButton = document.getElementById('restartBtn');
const difficultySelect = document.getElementById('difficulty');
const winningLine = document.getElementById('winningLine');

let oTurn;
let gameActive = true;
let currentMode = '2P'; // 2P, EASY, MEDIUM, HARD

// Initialize
difficultySelect.value = '2P'; // Default
startGame();

// Event Listeners
restartButton.addEventListener('click', startGame);
difficultySelect.addEventListener('change', (e) => {
    currentMode = e.target.value;
    startGame();
});

function startGame() {
    oTurn = false;
    gameActive = true;

    // Reset Board
    cellElements.forEach(cell => {
        cell.classList.remove(X_CLASS);
        cell.classList.remove(O_CLASS);
        cell.textContent = '';
        cell.removeEventListener('click', handleClick);
        cell.addEventListener('click', handleClick, { once: true });
    });

    // Reset Winning Line
    winningLine.style.width = '0';
    winningLine.classList.remove('active');

    updateStatus();
}

function handleClick(e) {
    if (!gameActive) return;

    // AI Turn Check (prevent human clicking during AI thinking time)
    if (currentMode !== '2P' && oTurn) return;

    const cell = e.target;
    const currentClass = oTurn ? O_CLASS : X_CLASS;

    placeMark(cell, currentClass);

    if (handleResult(currentClass)) return; // Win or Draw happened

    swapTurns();
    updateStatus();

    // Trigger AI if needed
    if (currentMode !== '2P' && gameActive) {
        setTimeout(makeAiMove, 500); // Small delay for realism
    }
}

function makeAiMove() {
    if (!gameActive) return;

    let bestMoveIndex;

    // AI Logic based on difficulty
    if (currentMode === 'EASY') {
        bestMoveIndex = getRandomMove();
    } else if (currentMode === 'MEDIUM') {
        bestMoveIndex = getMediumMove();
    } else if (currentMode === 'HARD') {
        bestMoveIndex = getBestMove(); // Minimax
    }

    if (bestMoveIndex !== undefined) {
        const cell = cellElements[bestMoveIndex];
        placeMark(cell, O_CLASS);

        // Remove click listener for this cell since we manually placed it
        cell.removeEventListener('click', handleClick);

        if (handleResult(O_CLASS)) return;

        swapTurns();
        updateStatus();
    }
}

function placeMark(cell, currentClass) {
    cell.classList.add(currentClass);
    cell.textContent = currentClass.toUpperCase();
}

function swapTurns() {
    oTurn = !oTurn;
}

function updateStatus() {
    if (currentMode === '2P') {
        statusText.innerText = `${oTurn ? "Player O's" : "Player X's"} Turn`;
    } else {
        statusText.innerText = oTurn ? "AI is thinking..." : "Your Turn (X)";
    }
}

function handleResult(currentClass) {
    const winningCombination = getWinningCombination(currentClass);
    if (winningCombination) {
        endGame(false, winningCombination);
        return true;
    } else if (isDraw()) {
        endGame(true);
        return true;
    }
    return false;
}

function getWinningCombination(currentClass) {
    return WINNING_COMBINATIONS.find(combination => {
        return combination.every(index => {
            return cellElements[index].classList.contains(currentClass);
        });
    });
}

function isDraw() {
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) || cell.classList.contains(O_CLASS);
    });
}

function endGame(draw, winningCombination) {
    gameActive = false;
    if (draw) {
        statusText.innerText = 'Draw!';
    } else {
        statusText.innerText = `${oTurn ? (currentMode === '2P' ? "Player O" : "AI") : (currentMode === '2P' ? "Player X" : "You")} Win!`;
        drawWinningLine(winningCombination);
    }

    // Auto Reset
    setTimeout(startGame, 2000);
}

function drawWinningLine(combination) {
    const index1 = combination[0];
    const index2 = combination[2];

    // Helper to get coordinates
    const cell1 = cellElements[index1].getBoundingClientRect();
    const cell2 = cellElements[index2].getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    // Calculate relative centers
    const x1 = cell1.left + cell1.width / 2 - boardRect.left;
    const y1 = cell1.top + cell1.height / 2 - boardRect.top;
    const x2 = cell2.left + cell2.width / 2 - boardRect.left;
    const y2 = cell2.top + cell2.height / 2 - boardRect.top;

    // Calculate length and angle
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    // Apply styles
    winningLine.style.width = '0'; // Reset for animation
    winningLine.style.left = `${x1}px`;
    winningLine.style.top = `${y1}px`;
    winningLine.style.transform = `rotate(${angle}deg)`;
    winningLine.classList.add('active');

    // Trigger reflow to restart transition
    void winningLine.offsetWidth;

    // Animate width
    winningLine.style.width = `${length}px`;
}

/* --- AI Functions --- */

function getRandomMove() {
    const available = getAvailableCells();
    return available[Math.floor(Math.random() * available.length)];
}

function getMediumMove() {
    // 1. Check if can win
    const winMove = findWinningMove(O_CLASS);
    if (winMove !== -1) return winMove;

    // 2. Check if opponent (X) can win and block
    const blockMove = findWinningMove(X_CLASS);
    if (blockMove !== -1) return blockMove;

    // 3. Random
    return getRandomMove();
}

function findWinningMove(playerClass) {
    const available = getAvailableCells();

    for (let index of available) {
        // Temporarily play move
        cellElements[index].classList.add(playerClass);
        if (getWinningCombination(playerClass)) {
            cellElements[index].classList.remove(playerClass);
            return index;
        }
        cellElements[index].classList.remove(playerClass);
    }
    return -1;
}

function getBestMove() {
    // Minimax Algorithm
    let bestScore = -Infinity;
    let move;

    const available = getAvailableCells();

    // If first move and center available, take it (optimization)
    if (available.length >= 8 && !cellElements[4].classList.contains(X_CLASS) && !cellElements[4].classList.contains(O_CLASS)) {
        return 4;
    }

    for (let index of available) {
        cellElements[index].classList.add(O_CLASS);
        let score = minimax(cellElements, 0, false);
        cellElements[index].classList.remove(O_CLASS);

        if (score > bestScore) {
            bestScore = score;
            move = index;
        }
    }
    return move;
}

function minimax(boardState, depth, isMaximizing) {
    // Check terminal states
    if (checkWinGeneric(O_CLASS)) return 10 - depth;
    if (checkWinGeneric(X_CLASS)) return depth - 10; // Prefer slower loss? No, prefer faster win. depth - 10 means longer game = higher score (less negative). 
    // Actually: X wins is bad. -10. 
    // depth - 10 => if depth 0 (immediate loss), -10. if depth 5, -5. So AI prefers losing later.
    // simpler: return -10 + depth;
    if (getAvailableCells().length === 0) return 0;

    if (isMaximizing) { // AI Turn (O)
        let bestScore = -Infinity;
        const available = getAvailableCells();
        for (let index of available) {
            cellElements[index].classList.add(O_CLASS);
            let score = minimax(boardState, depth + 1, false);
            cellElements[index].classList.remove(O_CLASS);
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else { // Human Turn (X)
        let bestScore = Infinity;
        const available = getAvailableCells();
        for (let index of available) {
            cellElements[index].classList.add(X_CLASS);
            let score = minimax(boardState, depth + 1, true);
            cellElements[index].classList.remove(X_CLASS);
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
}

function checkWinGeneric(playerClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return cellElements[index].classList.contains(playerClass);
        });
    });
}

function getAvailableCells() {
    const available = [];
    cellElements.forEach((cell, index) => {
        if (!cell.classList.contains(X_CLASS) && !cell.classList.contains(O_CLASS)) {
            available.push(index);
        }
    });
    return available;
}
