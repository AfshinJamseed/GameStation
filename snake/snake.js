const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const difficultySelect = document.getElementById('difficulty');

// Game Settings
const box = 20; // 20x20 grid
const canvasSize = 400;
const tileCount = canvasSize / box;

// Speed Settings (ms)
const SPEEDS = {
    SLOW: 200,
    NORMAL: 100,
    FAST: 60,
    INSANE: 30
};
let currentSpeed = SPEEDS.NORMAL;
let currentDifficultyKey = 'NORMAL';

// Game State
let score = 0;
let highScore = 0;
let snake = [];
let food = {};
let d; // Direction
let gameLoop;
let isGameRunning = false;

// Initialize High Score
updateHighScoreDisplay();

// Event Listeners
document.addEventListener('keydown', direction);
startBtn.addEventListener('click', startGame);
difficultySelect.addEventListener('change', (e) => {
    currentDifficultyKey = e.target.value;
    currentSpeed = SPEEDS[currentDifficultyKey];
    updateHighScoreDisplay();

    // If playing, restart with new speed
    if (isGameRunning) {
        clearInterval(gameLoop);
        gameLoop = setInterval(draw, currentSpeed);
        // Focus back on canvas/window to ensure keys work
        startBtn.blur();
        difficultySelect.blur();
    }
});

function updateHighScoreDisplay() {
    highScore = localStorage.getItem(`snakeHighScore_${currentDifficultyKey}`) || 0;
    highScoreElement.innerText = highScore;
}

function startGame() {
    if (isGameRunning) return;

    // Reset State
    isGameRunning = true;
    score = 0;
    snake = [];
    snake[0] = { x: 9 * box, y: 10 * box }; // Start center
    d = null; // Wait for input
    scoreElement.innerText = score;
    startBtn.innerText = 'Running...';
    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';

    createFood();
    clearInterval(gameLoop);
    gameLoop = setInterval(draw, currentSpeed);
}

function direction(event) {
    let key = event.keyCode;
    // 37 Left, 38 Up, 39 Right, 40 Down
    const moveKeys = [37, 38, 39, 40, 65, 87, 68, 83];

    if (moveKeys.includes(key)) {
        event.preventDefault(); // Stop window scrolling
    }

    // Allow queueing moves? For now simple logic
    if ((key == 37 || key == 65) && d != 'RIGHT') {
        d = 'LEFT';
    } else if ((key == 38 || key == 87) && d != 'DOWN') {
        d = 'UP';
    } else if ((key == 39 || key == 68) && d != 'LEFT') {
        d = 'RIGHT';
    } else if ((key == 40 || key == 83) && d != 'UP') {
        d = 'DOWN';
    }
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * tileCount) * box,
        y: Math.floor(Math.random() * tileCount) * box
    };
    // Ensure food doesn't spawn on snake
    for (let i = 0; i < snake.length; i++) {
        if (food.x == snake[i].x && food.y == snake[i].y) {
            createFood();
        }
    }
}

function checkCollision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x == array[i].x && head.y == array[i].y) {
            return true;
        }
    }
    return false;
}

function draw() {
    // Clear Screen
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw Snake
    for (let i = 0; i < snake.length; i++) {
        // Gradient or Color for Snake
        ctx.fillStyle = (i == 0) ? '#00f3ff' : '#00ff9d'; // Head Cyan, Body Green
        ctx.shadowBlur = 10;
        ctx.shadowColor = (i == 0) ? '#00f3ff' : '#00ff9d';
        ctx.fillRect(snake[i].x, snake[i].y, box, box);

        ctx.strokeStyle = '#050505'; // Border
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
        ctx.shadowBlur = 0; // Reset shadow
    }

    // Draw Food
    ctx.fillStyle = '#bc13fe'; // Magenta Food
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#bc13fe';
    ctx.fillRect(food.x, food.y, box, box);
    ctx.shadowBlur = 0;

    // Old Head Position
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    // Move Head
    if (d == 'LEFT') snakeX -= box;
    if (d == 'UP') snakeY -= box;
    if (d == 'RIGHT') snakeX += box;
    if (d == 'DOWN') snakeY += box;

    // If game hasn't started moving properly (d is null), just draw
    if (d == null) return;

    // Snake eats Food
    if (snakeX == food.x && snakeY == food.y) {
        score++;
        scoreElement.innerText = score;

        // Live High Score Update
        if (score > highScore) {
            highScore = score;
            highScoreElement.innerText = highScore;
            localStorage.setItem(`snakeHighScore_${currentDifficultyKey}`, highScore);
        }

        createFood();
    } else {
        // Remove Tail
        snake.pop();
    }

    // Add new Head
    let newHead = { x: snakeX, y: snakeY };

    // Game Over Rules
    if (
        snakeX < 0 ||
        snakeX >= canvasSize ||
        snakeY < 0 ||
        snakeY >= canvasSize ||
        checkCollision(newHead, snake)
    ) {
        clearInterval(gameLoop);
        isGameRunning = false;
        startBtn.innerText = 'Play Again';
        startBtn.disabled = false;
        startBtn.style.opacity = '1';

        // Update High Score (Final check)
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(`snakeHighScore_${currentDifficultyKey}`, highScore);
            highScoreElement.innerText = highScore;
        }

        // Game Over Text
        ctx.fillStyle = "white";
        ctx.font = "40px Outfit";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", canvasSize / 2, canvasSize / 2 - 20);
        ctx.font = "20px Outfit";
        ctx.fillText(`Score: ${score}`, canvasSize / 2, canvasSize / 2 + 20);
    } else {
        snake.unshift(newHead);
    }
}
