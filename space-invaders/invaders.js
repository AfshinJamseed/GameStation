const canvas = document.getElementById('invadersCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const startBtn = document.getElementById('startBtn');

let gameRunning = false;
let score = 0;
let lives = 3;
let level = 1;

// Player
const player = { x: 275, y: 550, width: 50, height: 30, speed: 5 };

// Bullets
let playerBullets = [];
let alienBullets = [];

// Aliens
let aliens = [];
let alienSpeed = 1;
let alienDirection = 1;

// Controls
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameRunning) {
        e.preventDefault();
        shoot();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function initGame() {
    score = 0;
    lives = 3;
    level = 1;
    alienSpeed = 1;
    scoreEl.innerText = score;
    livesEl.innerText = lives;
    levelEl.innerText = level;
    startLevel();
}

function startLevel() {
    aliens = [];
    playerBullets = [];
    alienBullets = [];
    player.x = 275;

    // Create alien grid (5 rows, 8 columns)
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
            aliens.push({
                x: col * 60 + 50,
                y: row * 50 + 50,
                width: 40,
                height: 30,
                alive: true
            });
        }
    }
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update player
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;

    // Draw player
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Update and draw player bullets
    playerBullets = playerBullets.filter(b => {
        b.y -= 7;
        ctx.fillStyle = '#00ff9d';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        return b.y > 0;
    });

    // Update and draw aliens
    let moveDown = false;
    aliens.forEach(alien => {
        if (!alien.alive) return;

        alien.x += alienSpeed * alienDirection;

        if (alien.x <= 0 || alien.x >= canvas.width - alien.width) {
            moveDown = true;
        }

        ctx.fillStyle = '#bc13fe';
        ctx.fillRect(alien.x, alien.y, alien.width, alien.height);

        // Random alien shooting
        if (Math.random() < 0.001) {
            alienBullets.push({
                x: alien.x + alien.width / 2,
                y: alien.y + alien.height,
                width: 3,
                height: 10
            });
        }
    });

    if (moveDown) {
        alienDirection *= -1;
        aliens.forEach(a => a.y += 20);
    }

    // Update alien bullets
    alienBullets = alienBullets.filter(b => {
        b.y += 5;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        return b.y < canvas.height;
    });

    // Collision detection
    playerBullets.forEach((bullet, bi) => {
        aliens.forEach(alien => {
            if (alien.alive && collision(bullet, alien)) {
                alien.alive = false;
                playerBullets.splice(bi, 1);
                score += 10;
                scoreEl.innerText = score;
            }
        });
    });

    // Alien bullets hit player
    alienBullets.forEach((bullet, bi) => {
        if (collision(bullet, player)) {
            alienBullets.splice(bi, 1);
            lives--;
            livesEl.innerText = lives;
            if (lives <= 0) gameOver();
        }
    });

    // Check if all aliens defeated
    if (aliens.every(a => !a.alive)) {
        level++;
        levelEl.innerText = level;
        alienSpeed += 0.5;
        startLevel();
    }

    // Check if aliens reached player
    if (aliens.some(a => a.alive && a.y + a.height >= player.y)) {
        gameOver();
    }

    requestAnimationFrame(gameLoop);
}

function shoot() {
    if (playerBullets.length < 3) {
        playerBullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10
        });
    }
}

function collision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

async function gameOver() {
    gameRunning = false;
    startBtn.innerText = 'Start Game';
    startBtn.disabled = false;
    await Modal.alert(`Game Over! Final Score: ${score}`, '💥 Game Over');
}

startBtn.addEventListener('click', () => {
    if (gameRunning) return;
    gameRunning = true;
    startBtn.innerText = 'Playing...';
    startBtn.disabled = true;
    initGame();
    gameLoop();
});
