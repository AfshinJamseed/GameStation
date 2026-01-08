import { MultiplayerManager } from "../multiplayer-manager.js";
import { auth } from "../../auth/firebase-config.js";

const canvas = document.getElementById('duelCanvas');
const ctx = canvas.getContext('2d');
const p1HealthEl = document.getElementById('p1Health');
const p2HealthEl = document.getElementById('p2Health');
const p1NameEl = document.getElementById('p1Name');
const p2NameEl = document.getElementById('p2Name');
const gravityIndicatorEl = document.getElementById('gravityIndicator');
const gameMessageEl = document.getElementById('gameMessage');
const resetBtn = document.getElementById('resetBtn');

// Lobby Elements
const lobbyOverlay = document.getElementById('lobbyOverlay');
const hostBtn = document.getElementById('hostBtn');
const joinBtn = document.getElementById('joinBtn');
const localBtn = document.getElementById('localBtn');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const roomCodeText = document.getElementById('roomCodeText');

canvas.width = 900;
canvas.height = 600;

// Game state
let gameMode = 'local'; // local, online
let isHost = false;
let gameActive = false;
let gravityDirection = 1;
const GRAVITY = 0.3;
let mpManager = new MultiplayerManager('duel');

// Players
const player1 = {
    id: 'p1',
    x: 100,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    size: 20,
    health: 3,
    color: '#00f3ff',
    name: 'Player 1'
};

const player2 = {
    id: 'p2',
    x: canvas.width - 100,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    angle: Math.PI,
    size: 20,
    health: 3,
    color: '#bc13fe',
    name: 'Player 2'
};

const bullets = [];
const keys = {};

// --- Lobby Logic ---
localBtn.addEventListener('click', () => {
    gameMode = 'local';
    lobbyOverlay.style.display = 'none';
    startGame();
});

hostBtn.addEventListener('click', async () => {
    gameMode = 'online';
    isHost = true;
    const user = auth.currentUser;
    const name = user ? (user.displayName || user.email.split('@')[0]) : 'Host';
    player1.name = name;
    p1NameEl.innerText = name + ' (You)';

    try {
        const roomId = await mpManager.createRoom({ name, uid: user?.uid });
        roomCodeText.innerText = roomId.slice(-6).toUpperCase();
        roomCodeDisplay.style.display = 'block';
        hostBtn.disabled = true;
        joinBtn.disabled = true;

        mpManager.onUpdate((room) => {
            if (room.state === 'playing' && !gameActive) {
                player2.name = room.guest.name;
                p2NameEl.innerText = room.guest.name;
                lobbyOverlay.style.display = 'none';
                startGame();
            }
            if (room.gameState && !isHost) {
                syncFromHost(room.gameState);
            }
            // If we are host, we listen for guest inputs (in a more advanced version)
            // For now, Guest sends their position, Host sends everything else
            if (room.gameState && isHost) {
                syncGuestOnly(room.gameState);
            }
        });
    } catch (e) {
        alert("Failed to create room");
    }
});

joinBtn.addEventListener('click', async () => {
    const code = prompt("Enter Room ID (exact):");
    if (!code) return;

    gameMode = 'online';
    isHost = false;
    const user = auth.currentUser;
    const name = user ? (user.displayName || user.email.split('@')[0]) : 'Guest';
    player2.name = name;
    p2NameEl.innerText = name + ' (You)';

    try {
        const host = await mpManager.joinRoom(code, { name, uid: user?.uid });
        player1.name = host.name;
        p1NameEl.innerText = host.name;
        lobbyOverlay.style.display = 'none';

        mpManager.onUpdate((room) => {
            if (room.gameState) {
                syncFromHost(room.gameState);
            }
            if (room.state === 'finished' && gameActive) {
                endGame(room.gameState.winMessage);
            }
        });

        startGame();
    } catch (e) {
        alert(e.message);
    }
});

// --- Game Logic ---
function startGame() {
    gameActive = true;
    resetGame();
    gameLoop();
}

function updatePlayer(player, up, down, left, right) {
    if (left) player.angle -= 0.08;
    if (right) player.angle += 0.08;
    if (up) {
        player.vx += Math.cos(player.angle) * 0.3;
        player.vy += Math.sin(player.angle) * 0.3;
    }
    player.vy += GRAVITY * gravityDirection;
    player.vx *= 0.98;
    player.vy *= 0.98;
    player.x += player.vx;
    player.y += player.vy;

    // Bounds
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;
    if (player.y < 0) player.y = canvas.height;
    if (player.y > canvas.height) player.y = 0;
}

function shoot(player) {
    bullets.push({
        x: player.x + Math.cos(player.angle) * player.size,
        y: player.y + Math.sin(player.angle) * player.size,
        vx: Math.cos(player.angle) * 8,
        vy: Math.sin(player.angle) * 8,
        ownerId: player.id,
        color: player.color
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.vy += GRAVITY * gravityDirection * 0.5;
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }

        // Host handles collisions in online mode
        if (gameMode === 'local' || isHost) {
            const targets = [player1, player2].filter(p => p.id !== bullet.ownerId);
            for (const target of targets) {
                const dx = bullet.x - target.x;
                const dy = bullet.y - target.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < target.size) {
                    target.health--;
                    updateHealthUI();
                    bullets.splice(i, 1);
                    checkWin();
                    break;
                }
            }
        }
    }
}

function checkWin() {
    if (player1.health <= 0) endGame(`${player2.name} Wins! 🚀`);
    else if (player2.health <= 0) endGame(`${player1.name} Wins! 🚀`);
}

function endGame(msg) {
    gameActive = false;
    gameMessageEl.innerText = msg;
    gameMessageEl.style.display = 'block';

    if (gameMode === 'local') {
        resetBtn.style.display = 'block';
    }
}

function syncFromHost(state) {
    player1.x = state.p1.x;
    player1.y = state.p1.y;
    player1.angle = state.p1.angle;
    player1.health = state.p1.health;

    // Guest only syncs P2 if they aren't controlling it (but they are)
    // Actually, Guest sends their P2 to Host, Host sends everything back
    if (!isHost) {
        player2.health = state.p2.health;
    }

    bullets.length = 0;
    state.bullets.forEach(b => bullets.push(b));
    gravityDirection = state.gravity;
    updateGravityUI();
    updateHealthUI();

    if (state.winMessage) endGame(state.winMessage);
}

function syncGuestOnly(state) {
    if (state.p2) {
        player2.x = state.p2.x;
        player2.y = state.p2.y;
        player2.angle = state.p2.angle;
    }
}

function updateHealthUI() {
    p1HealthEl.style.width = (player1.health / 3 * 100) + '%';
    p2HealthEl.style.width = (player2.health / 3 * 100) + '%';
}

function updateGravityUI() {
    gravityIndicatorEl.innerHTML = gravityDirection === 1 ? '⬇️ Gravity' : '⬆️ Gravity';
}

function resetGame() {
    player1.x = 100; player1.y = canvas.height / 2; player1.vx = 0; player1.vy = 0; player1.angle = 0; player1.health = 3;
    player2.x = canvas.width - 100; player2.y = canvas.height / 2; player2.vx = 0; player2.vy = 0; player2.angle = Math.PI; player2.health = 3;
    bullets.length = 0;
    gravityDirection = 1;
    updateHealthUI();
    updateGravityUI();
    gameMessageEl.style.display = 'none';
    resetBtn.style.display = 'none';
}

// Draw Loop
function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawShip(player1);
    drawShip(player2);
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    });
}

function drawShip(p) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.moveTo(p.size, 0); ctx.lineTo(-p.size, -p.size / 2); ctx.lineTo(-p.size / 2, 0); ctx.lineTo(-p.size, p.size / 2); ctx.closePath(); ctx.fill();
    ctx.restore();
}

let lastSync = 0;
function gameLoop(time) {
    if (!gameActive) return;

    if (gameMode === 'local') {
        updatePlayer(player1, keys['w'], keys['s'], keys['a'], keys['d']);
        updatePlayer(player2, keys['arrowup'], keys['arrowdown'], keys['arrowleft'], keys['arrowright']);
    } else {
        if (isHost) {
            updatePlayer(player1, keys['w'], keys['s'], keys['a'], keys['d']);
        } else {
            updatePlayer(player2, keys['arrowup'], keys['arrowdown'], keys['arrowleft'], keys['arrowright']);
        }
    }

    updateBullets();
    draw();

    // High frequency sync for multiplayer
    if (gameMode === 'online' && time - lastSync > 50) {
        lastSync = time;
        const state = isHost ? {
            p1: { x: player1.x, y: player1.y, angle: player1.angle, health: player1.health },
            p2: { health: player2.health }, // Host dictates health
            bullets: bullets,
            gravity: gravityDirection,
            winMessage: !gameActive ? gameMessageEl.innerText : null
        } : {
            p2: { x: player2.x, y: player2.y, angle: player2.angle }
        };
        mpManager.updateGameState(state);
    }

    requestAnimationFrame(gameLoop);
}

// Input
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    if (gameActive) {
        if (gameMode === 'local') {
            if (key === ' ') shoot(player1);
            if (key === 'enter') shoot(player2);
            if (key === 'g') gravityDirection *= -1;
        } else {
            if (isHost) {
                if (key === ' ') shoot(player1);
                if (key === 'g') gravityDirection *= -1;
            } else {
                if (key === 'enter') shoot(player2);
            }
        }
    }
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
resetBtn.addEventListener('click', startGame);
