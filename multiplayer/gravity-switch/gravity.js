const canvas = document.getElementById('gravityCanvas');
const ctx = canvas.getContext('2d');
const p1StarsEl = document.getElementById('p1Stars');
const p2StarsEl = document.getElementById('p2Stars');
const gravityDisplayEl = document.getElementById('gravityDisplay');
const gameMessageEl = document.getElementById('gameMessage');
const resetBtn = document.getElementById('resetBtn');

canvas.width = 1000;
canvas.height = 600;

// Game state
let gameActive = true;
let scrollSpeed = 4;
let cameraX = 0;
const LEVEL_LENGTH = 4000;
const PLAYER_SIZE = 24;

const FLOOR_Y = 500;
const CEILING_Y = 100;
const PLATFORM_HEIGHT = 30;

// Players
const player1 = {
    x: 150,
    y: FLOOR_Y - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    gravityFlipped: false,
    onGround: false,
    alive: true,
    color: '#00d9ff',
    animFrame: 0
};

const player2 = {
    x: 200,
    y: FLOOR_Y - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    gravityFlipped: false,
    onGround: false,
    alive: true,
    color: '#ff00ff',
    animFrame: 0
};

// Continuous floor/ceiling + vertical wall obstacles
const floorSegments = [];
const ceilingSegments = [];
const verticalObstacles = [];

function generateLevel() {
    floorSegments.length = 0;
    ceilingSegments.length = 0;
    verticalObstacles.length = 0;

    // SAFE ZONE - No obstacles
    floorSegments.push({ x: -500, width: 1500, safe: true });
    ceilingSegments.push({ x: -500, width: 1500, safe: true });

    // MAIN LEVEL - Continuous platforms
    floorSegments.push({ x: 1000, width: LEVEL_LENGTH, safe: false });
    ceilingSegments.push({ x: 1000, width: LEVEL_LENGTH, safe: false });

    // Add vertical wall obstacles
    let x = 1200;
    while (x < LEVEL_LENGTH + 800) {
        const gapPosition = Math.random() < 0.5 ? 'top' : 'bottom';

        verticalObstacles.push({
            x: x,
            gapPosition: gapPosition,
            gapSize: 180
        });

        x += 350 + Math.random() * 200;
    }

    // FINISH - No obstacles
    const finishStart = LEVEL_LENGTH + 1000;
    floorSegments.push({ x: finishStart, width: 400, finish: true });
    ceilingSegments.push({ x: finishStart, width: 400, finish: true });
}

// Input
const keys = {};

window.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    if (e.key.toLowerCase() === 'q' && !keys['q']) {
        player1.gravityFlipped = !player1.gravityFlipped;
        player1.onGround = false;
        player1.vy = 0;
    }

    if (e.key === 'Shift' && !keys['shift']) {
        player2.gravityFlipped = !player2.gravityFlipped;
        player2.onGround = false;
        player2.vy = 0;
    }

    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

resetBtn.addEventListener('click', resetGame);

function updateGravityDisplay() {
    const p1Gravity = player1.gravityFlipped ? '⬆️' : '⬇️';
    const p2Gravity = player2.gravityFlipped ? '⬆️' : '⬇️';
    gravityDisplayEl.innerHTML = `P1: ${p1Gravity} | P2: ${p2Gravity}`;
}

function updatePlayer(player) {
    if (!player.alive) return;

    player.animFrame += 0.15;

    const gravity = player.gravityFlipped ? -0.6 : 0.6;
    player.vy += gravity;
    player.y += player.vy;

    player.onGround = false;

    if (player.gravityFlipped) {
        // Running on ceiling
        if (player.vy < 0 && player.y <= CEILING_Y + PLATFORM_HEIGHT) {
            player.y = CEILING_Y + PLATFORM_HEIGHT;
            player.vy = 0;
            player.onGround = true;
        }
    } else {
        // Running on floor
        if (player.vy > 0 && player.y + player.height >= FLOOR_Y) {
            player.y = FLOOR_Y - player.height;
            player.vy = 0;
            player.onGround = true;
        }
    }

    // Check finish
    if (cameraX > LEVEL_LENGTH + 1000 && player.onGround) {
        endGame(player === player1 ? 'Player 1' : 'Player 2');
    }

    // Death by falling
    if (player.y > canvas.height + 50 || player.y < -50) {
        player.alive = false;
        checkGameOver();
    }

    // Vertical wall collision
    for (const obstacle of verticalObstacles) {
        const relativeX = obstacle.x - cameraX;
        const wallWidth = 20;

        // Check if player is hitting the wall
        if (player.x + player.width > relativeX && player.x < relativeX + wallWidth) {
            const gapTop = obstacle.gapPosition === 'top' ? CEILING_Y + PLATFORM_HEIGHT : FLOOR_Y - obstacle.gapSize;
            const gapBottom = obstacle.gapPosition === 'top' ? CEILING_Y + PLATFORM_HEIGHT + obstacle.gapSize : FLOOR_Y;

            // Player NOT in gap = hit wall
            if (player.y < gapTop || player.y + player.height > gapBottom) {
                player.alive = false;
                checkGameOver();
            }
        }
    }
}

function checkGameOver() {
    if (!player1.alive && !player2.alive) {
        endGame('Nobody');
    }
}

function endGame(winner) {
    gameActive = false;
    if (winner === 'Nobody') {
        gameMessageEl.innerText = '💥 Both Hit Walls!';
    } else {
        gameMessageEl.innerText = `🏆 ${winner} Wins!`;
    }
    gameMessageEl.style.display = 'block';
    resetBtn.style.display = 'block';
}

function resetGame() {
    player1.x = 150;
    player1.y = FLOOR_Y - PLAYER_SIZE;
    player1.vy = 0;
    player1.gravityFlipped = false;
    player1.alive = true;
    player1.animFrame = 0;

    player2.x = 200;
    player2.y = FLOOR_Y - PLAYER_SIZE;
    player2.vy = 0;
    player2.gravityFlipped = false;
    player2.alive = true;
    player2.animFrame = 0;

    cameraX = 0;
    scrollSpeed = 4;
    generateLevel();
    updateGravityDisplay();

    gameActive = true;
    gameMessageEl.style.display = 'none';
    resetBtn.style.display = 'none';
}

function drawPlayer(player) {
    if (!player.alive) return;

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    if (player.gravityFlipped) {
        ctx.scale(1, -1);
    }

    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.roundRect(-player.width / 2, -player.height / 2, player.width, player.height, 6);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    const eyeOffset = Math.sin(player.animFrame) * 2;
    ctx.fillRect(-8, -6 + eyeOffset, 5, 5);
    ctx.fillRect(3, -6 + eyeOffset, 5, 5);

    ctx.fillStyle = '#000';
    ctx.fillRect(-6, -4 + eyeOffset, 2, 2);
    ctx.fillRect(5, -4 + eyeOffset, 2, 2);

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = player.color;
    for (let i = 1; i <= 3; i++) {
        ctx.fillRect(-player.width / 2 - i * 8, -player.height / 2, player.width * 0.7, player.height);
    }

    ctx.restore();
}

function draw() {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a0a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Floor
    for (const segment of floorSegments) {
        const relativeX = segment.x - cameraX;
        if (relativeX + segment.width > 0 && relativeX < canvas.width) {
            const color = segment.safe ? '#4CAF50' : (segment.finish ? '#00ff9d' : '#6495ED');
            ctx.fillStyle = color;
            ctx.shadowBlur = segment.safe || segment.finish ? 15 : 5;
            ctx.shadowColor = color;
            ctx.fillRect(relativeX, FLOOR_Y, segment.width, PLATFORM_HEIGHT);

            if (segment.safe) {
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'white';
                ctx.font = 'bold 14px Outfit';
                ctx.fillText('SAFE ZONE', relativeX + 50, FLOOR_Y - 10);
            } else if (segment.finish) {
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'white';
                ctx.font = 'bold 16px Outfit';
                ctx.fillText('🏁 FINISH', relativeX + 100, FLOOR_Y - 10);
            }
        }
    }

    // Ceiling
    for (const segment of ceilingSegments) {
        const relativeX = segment.x - cameraX;
        if (relativeX + segment.width > 0 && relativeX < canvas.width) {
            const color = segment.safe ? '#4CAF50' : (segment.finish ? '#00ff9d' : '#9370DB');
            ctx.fillStyle = color;
            ctx.shadowBlur = segment.safe || segment.finish ? 15 : 5;
            ctx.shadowColor = color;
            ctx.fillRect(relativeX, CEILING_Y, segment.width, PLATFORM_HEIGHT);
        }
    }

    ctx.shadowBlur = 0;

    // Vertical wall obstacles
    for (const obstacle of verticalObstacles) {
        const relativeX = obstacle.x - cameraX;

        if (relativeX > -50 && relativeX < canvas.width + 50) {
            const wallWidth = 20;

            ctx.fillStyle = '#ff3366';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff3366';

            if (obstacle.gapPosition === 'top') {
                // Gap at top, wall at bottom
                const gapBottom = CEILING_Y + PLATFORM_HEIGHT + obstacle.gapSize;
                ctx.fillRect(relativeX, gapBottom, wallWidth, FLOOR_Y - gapBottom + PLATFORM_HEIGHT);
            } else {
                // Gap at bottom, wall at top
                const gapTop = FLOOR_Y - obstacle.gapSize;
                ctx.fillRect(relativeX, CEILING_Y, wallWidth, gapTop - CEILING_Y);
            }

            ctx.shadowBlur = 0;
        }
    }

    // Players
    drawPlayer(player1);
    drawPlayer(player2);

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '14px Outfit';
    ctx.fillText(`Distance: ${Math.floor(cameraX / 10)}m`, 10, 30);
}

function gameLoop() {
    if (gameActive) {
        cameraX += scrollSpeed;

        updatePlayer(player1);
        updatePlayer(player2);
        updateGravityDisplay();

        p1StarsEl.innerText = player1.alive ? '✅' : '❌';
        p2StarsEl.innerText = player2.alive ? '✅' : '❌';
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Init
generateLevel();
updateGravityDisplay();
gameLoop();
