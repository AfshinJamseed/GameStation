const grid = document.getElementById('grid2048');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const newGameBtn = document.getElementById('newGameBtn');

let board = [];
let score = 0;
let best = localStorage.getItem('2048Best') || 0;
bestEl.innerText = best;

function initGame() {
    board = Array(4).fill().map(() => Array(4).fill(0));
    score = 0;
    scoreEl.innerText = score;
    addNewTile();
    addNewTile();
    render();
}

function addNewTile() {
    let empty = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) empty.push({ r, c });
        }
    }
    if (empty.length > 0) {
        const { r, c } = empty[Math.floor(Math.random() * empty.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function render() {
    grid.innerHTML = '';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            const value = board[r][c];
            if (value > 0) {
                tile.innerText = value;
                tile.dataset.value = value;
            }
            grid.appendChild(tile);
        }
    }
}

function move(direction) {
    let moved = false;
    const original = JSON.stringify(board);

    if (direction === 'left' || direction === 'right') {
        for (let r = 0; r < 4; r++) {
            let row = board[r].filter(val => val !== 0);
            if (direction === 'right') row.reverse();

            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    score += row[i];
                    row.splice(i + 1, 1);
                }
            }

            while (row.length < 4) row.push(0);
            if (direction === 'right') row.reverse();
            board[r] = row;
        }
    } else {
        for (let c = 0; c < 4; c++) {
            let col = [];
            for (let r = 0; r < 4; r++) {
                if (board[r][c] !== 0) col.push(board[r][c]);
            }

            if (direction === 'down') col.reverse();

            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2;
                    score += col[i];
                    col.splice(i + 1, 1);
                }
            }

            while (col.length < 4) col.push(0);
            if (direction === 'down') col.reverse();

            for (let r = 0; r < 4; r++) {
                board[r][c] = col[r];
            }
        }
    }

    moved = JSON.stringify(board) !== original;

    if (moved) {
        scoreEl.innerText = score;
        if (score > best) {
            best = score;
            bestEl.innerText = best;
            localStorage.setItem('2048Best', best);
        }
        addNewTile();
        render();
        
        if (checkLose()) {
            Modal.alert('Game Over! Your score: ' + score);
        }
    }
}

function checkLose() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) return false;
            if (c < 3 && board[r][c] === board[r][c + 1]) return false;
            if (r < 3 && board[r][c] === board[r + 1][c]) return false;
        }
    }
    return true;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); move('left'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); move('right'); }
    if (e.key === 'ArrowUp') { e.preventDefault(); move('up'); }
    if (e.key === 'ArrowDown') { e.preventDefault(); move('down'); }
});

newGameBtn.addEventListener('click', initGame);

initGame();
