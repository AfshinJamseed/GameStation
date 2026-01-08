const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const player1ScoreEl = document.getElementById('player1Score');
const player2ScoreEl = document.getElementById('player2Score');
const gameMessageEl = document.getElementById('gameMessage');
const resetBtn = document.getElementById('resetBtn');

// Canvas sizing
canvas.width = 800;
canvas.height = 500;

// Game state
let gameRunning = false;
let player1Score = 0;
let player2Score = 0;
const winningScore = 5;

// Paddle dimensions
const paddleWidth = 15;
const paddleHeight = 100;

// Paddles
const player1 = {
    x: 30,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6
};

const player2 = {
    x: canvas.width - 30 - paddleWidth,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    dx: 0,
    dy: 0,
    speed: 5
};

// Input handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === ' ' && !gameRunning) {
        startGame();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

resetBtn.addEventListener('click', resetGame);

function startGame() {
    gameRunning = true;
    gameMessageEl.style.display = 'none';

    // Random ball direction
    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // -45 to 45 degrees
    const direction = Math.random() < 0.5 ? 1 : -1;
    ball.dx = Math.cos(angle) * ball.speed * direction;
    ball.dy = Math.sin(angle) * ball.speed;
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    player1ScoreEl.innerText = '0';
    player2ScoreEl.innerText = '0';
    gameMessageEl.innerText = 'Press SPACE to Start';
    gameMessageEl.style.display = 'block';
    resetBtn.style.display = 'none';
    gameRunning = false;
    resetBall();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 0;
    ball.dy = 0;
}

function updatePaddles() {
    // Player 1 (W/S)
    if (keys['w']) player1.dy = -player1.speed;
    else if (keys['s']) player1.dy = player1.speed;
    else player1.dy = 0;

    // Player 2 (Arrow Keys)
    if (keys['arrowup']) player2.dy = -player2.speed;
    else if (keys['arrowdown']) player2.dy = player2.speed;
    else player2.dy = 0;

    // Update positions
    player1.y += player1.dy;
    player2.y += player2.dy;

    // Boundaries
    player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));
    player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));
}

function updateBall() {
    if (!gameRunning) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top/bottom collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy *= -1;
    }

    // Paddle collision
    if (
        ball.x - ball.radius < player1.x + player1.width &&
        ball.y > player1.y &&
        ball.y < player1.y + player1.height &&
        ball.dx < 0
    ) {
        ball.dx *= -1.05; // Speed up slightly
        ball.dx = Math.min(ball.dx, 10); // Cap speed
    }

    if (
        ball.x + ball.radius > player2.x &&
        ball.y > player2.y &&
        ball.y < player2.y + player2.height &&
        ball.dx > 0
    ) {
        ball.dx *= -1.05;
        ball.dx = Math.max(ball.dx, -10);
    }

    // Score - left side goal
    if (ball.x - ball.radius < 0) {
        player2Score++;
        player2ScoreEl.innerText = player2Score;
        checkWin();
        resetBall();
        if (gameRunning) {
            setTimeout(() => startGame(), 1000);
        }
    }

    // Score - right side goal
    if (ball.x + ball.radius > canvas.width) {
        player1Score++;
        player1ScoreEl.innerText = player1Score;
        checkWin();
        resetBall();
        if (gameRunning) {
            setTimeout(() => startGame(), 1000);
        }
    }
}

function checkWin() {
    if (player1Score >= winningScore) {
        gameRunning = false;
        gameMessageEl.innerText = '🎉 Player 1 Wins!';
        gameMessageEl.style.display = 'block';
        resetBtn.style.display = 'block';
    } else if (player2Score >= winningScore) {
        gameRunning = false;
        gameMessageEl.innerText = '🎉 Player 2 Wins!';
        gameMessageEl.style.display = 'block';
        resetBtn.style.display = 'block';
    }
}

function draw() {
    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player 1 paddle (Cyan)
    ctx.fillStyle = '#00f3ff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f3ff';
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);

    // Player 2 paddle (Magenta)
    ctx.fillStyle = '#bc13fe';
    ctx.shadowColor = '#bc13fe';
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

    // Ball
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function gameLoop() {
    updatePaddles();
    updateBall();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start loop
gameLoop();
