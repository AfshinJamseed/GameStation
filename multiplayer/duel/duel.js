const canvas = document.getElementById('duelCanvas');
const ctx = canvas.getContext('2d');
const p1HealthEl = document.getElementById('p1Health');
const p2HealthEl = document.getElementById('p2Health');
const gravityIndicatorEl = document.getElementById('gravityIndicator');
const gameMessageEl = document.getElementById('gameMessage');
const resetBtn = document.getElementById('resetBtn');

canvas.width = 900;
canvas.height = 600;

// Game state
let gameActive = true;
let gravityDirection = 1; // 1 = down, -1 = up
const GRAVITY = 0.3;

// Players
const player1 = {
    x: 100,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    size: 20,
    health: 3,
    color: '#00f3ff'
};

const player2 = {
    x: canvas.width - 100,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    angle: Math.PI,
    size: 20,
    health: 3,
    color: '#bc13fe'
};

const bullets = [];

// Input
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Shoot
    if (e.key === ' ' && gameActive) {
        shoot(player1);
        e.preventDefault();
    }
    if (e.key === 'Enter' && gameActive) {
        shoot(player2);
        e.preventDefault();
    }

    // Gravity flip
    if (e.key.toLowerCase() === 'g' && gameActive) {
        gravityDirection *= -1;
        updateGravityIndicator();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

resetBtn.addEventListener('click', resetGame);

function updateGravityIndicator() {
    gravityIndicatorEl.innerHTML = gravityDirection === 1 ? '⬇️ Gravity (G to flip)' : '⬆️ Gravity (G to flip)';
}

function shoot(player) {
    bullets.push({
        x: player.x + Math.cos(player.angle) * player.size,
        y: player.y + Math.sin(player.angle) * player.size,
        vx: Math.cos(player.angle) * 8,
        vy: Math.sin(player.angle) * 8,
        owner: player,
        color: player.color
    });
}

function updatePlayer(player, up, down, left, right) {
    // Rotation
    if (left) player.angle -= 0.08;
    if (right) player.angle += 0.08;

    // Thrust
    if (up) {
        player.vx += Math.cos(player.angle) * 0.3;
        player.vy += Math.sin(player.angle) * 0.3;
    }

    // Apply gravity
    player.vy += GRAVITY * gravityDirection;

    // Friction in space
    player.vx *= 0.98;
    player.vy *= 0.98;

    // Update position
    player.x += player.vx;
    player.y += player.vy;

    // Wrap around edges
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;
    if (player.y < 0) player.y = canvas.height;
    if (player.y > canvas.height) player.y = 0;
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        // Apply gravity to bullets
        bullet.vy += GRAVITY * gravityDirection * 0.5;

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Remove if off screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }

        // Check collision with players
        const targets = [player1, player2].filter(p => p !== bullet.owner);
        for (const target of targets) {
            const dx = bullet.x - target.x;
            const dy = bullet.y - target.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < target.size) {
                target.health--;
                updateHealth();
                bullets.splice(i, 1);
                checkWin();
                break;
            }
        }
    }
}

function updateHealth() {
    p1HealthEl.style.width = (player1.health / 3 * 100) + '%';
    p2HealthEl.style.width = (player2.health / 3 * 100) + '%';
}

function checkWin() {
    if (player1.health <= 0) {
        endGame('Player 2 Wins! 🚀');
    } else if (player2.health <= 0) {
        endGame('Player 1 Wins! 🚀');
    }
}

function endGame(message) {
    gameActive = false;
    gameMessageEl.innerText = message;
    gameMessageEl.style.display = 'block';
    resetBtn.style.display = 'block';
}

function resetGame() {
    player1.x = 100;
    player1.y = canvas.height / 2;
    player1.vx = 0;
    player1.vy = 0;
    player1.angle = 0;
    player1.health = 3;

    player2.x = canvas.width - 100;
    player2.y = canvas.height / 2;
    player2.vx = 0;
    player2.vy = 0;
    player2.angle = Math.PI;
    player2.health = 3;

    bullets.length = 0;
    gravityDirection = 1;
    updateGravityIndicator();
    updateHealth();

    gameActive = true;
    gameMessageEl.style.display = 'none';
    resetBtn.style.display = 'none';
}

function drawShip(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;

    ctx.beginPath();
    ctx.moveTo(player.size, 0);
    ctx.lineTo(-player.size, -player.size / 2);
    ctx.lineTo(-player.size / 2, 0);
    ctx.lineTo(-player.size, player.size / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function draw() {
    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ships
    ctx.shadowBlur = 0;
    drawShip(player1);
    drawShip(player2);

    // Draw bullets
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (gameActive) {
        // Player 1 (WASD)
        updatePlayer(player1, keys['w'], keys['s'], keys['a'], keys['d']);

        // Player 2 (Arrows)
        updatePlayer(player2, keys['arrowup'], keys['arrowdown'], keys['arrowleft'], keys['arrowright']);

        updateBullets();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
