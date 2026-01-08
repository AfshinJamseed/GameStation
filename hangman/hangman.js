const wordDisplay = document.getElementById('wordDisplay');
const keyboard = document.getElementById('keyboard');
const categorySpan = document.getElementById('category');
const livesSpan = document.getElementById('lives');
const gameStatus = document.getElementById('gameStatus');
const restartBtn = document.getElementById('restartBtn');
const parts = document.querySelectorAll('.body-part');

const WORDS = {
    'Tech': ['PYTHON', 'JAVASCRIPT', 'BROWSER', 'DATABASE', 'ALGORITHM', 'REACT', 'VARIABLE'],
    'Animals': ['TIGER', 'ELEPHANT', 'GIRAFFE', 'PENGUIN', 'DOLPHIN', 'KANGAROO'],
    'Countries': ['JAPAN', 'BRAZIL', 'CANADA', 'GERMANY', 'AUSTRALIA', 'EGYPT']
};

let currentWord = '';
let currentCategory = '';
let guessedLetters = [];
let mistakes = 0;
const MAX_LIVES = 6;

initGame();

restartBtn.addEventListener('click', initGame);

function initGame() {
    // Reset State
    guessedLetters = [];
    mistakes = 0;
    gameStatus.textContent = '';
    restartBtn.style.display = 'none';

    // Pick Category and Word
    const categories = Object.keys(WORDS);
    currentCategory = categories[Math.floor(Math.random() * categories.length)];
    const wordList = WORDS[currentCategory];
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];

    // Update UI
    categorySpan.textContent = currentCategory;
    livesSpan.textContent = MAX_LIVES;

    // Reset Hangman Drawing (Hide all body parts)
    parts.forEach(part => {
        part.style.display = 'none'; // Or opacity 0
        part.classList.remove('draw');
    });

    renderWord();
    renderKeyboard();
}

function renderWord() {
    wordDisplay.innerHTML = currentWord
        .split('')
        .map(letter => `
            <span class="letter">
                ${guessedLetters.includes(letter) ? letter : ''}
            </span>
        `)
        .join('');

    checkWin();
}

function renderKeyboard() {
    keyboard.innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        .split('')
        .map(letter => `
            <button
                class="key-btn"
                onclick="handleGuess('${letter}')"
                ${guessedLetters.includes(letter) ? 'disabled' : ''}
            >
                ${letter}
            </button>
        `)
        .join('');
}

function handleGuess(letter) {
    if (guessedLetters.includes(letter) || mistakes >= MAX_LIVES) return; // safety

    guessedLetters.push(letter);

    if (currentWord.includes(letter)) {
        renderWord();
        renderKeyboard(); // Update to disable button
    } else {
        mistakes++;
        livesSpan.textContent = MAX_LIVES - mistakes;
        drawNextPart();
        renderKeyboard();
        checkLoss();
    }
}

// Global handleGuess for onclick in HTML string to work
window.handleGuess = handleGuess;

function drawNextPart() {
    // parts are 0-5. mistakes starts at 1.
    const part = document.getElementById(`part-${mistakes - 1}`);
    if (part) {
        part.style.display = 'block';
        part.classList.add('draw');
    }
}

function checkWin() {
    const innerText = wordDisplay.innerText.replace(/\n/g, ''); // letters with no spaces
    if (innerText === currentWord) {
        gameStatus.innerHTML = `<span style="color: var(--accent-green)">You Won!</span>`;
        disableAllKeys();
        restartBtn.style.display = 'inline-block';
    }
}

function checkLoss() {
    if (mistakes >= MAX_LIVES) {
        gameStatus.innerHTML = `<span style="color: #ff4444">Game Over! Word was: ${currentWord}</span>`;
        disableAllKeys();
        restartBtn.style.display = 'inline-block';
    }
}

function disableAllKeys() {
    const buttons = document.querySelectorAll('.key-btn');
    buttons.forEach(btn => btn.disabled = true);
}
