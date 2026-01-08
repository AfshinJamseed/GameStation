import { MultiplayerManager } from "../multiplayer-manager.js";
import { auth } from "../../auth/firebase-config.js";

const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const player1ScoreEl = document.getElementById('player1Score');
const player2ScoreEl = document.getElementById('player2Score');
const p1NameEl = document.getElementById('p1Name');
const p2NameEl = document.getElementById('p2Name');
const gameMessageEl = document.getElementById('gameMessage');
const resetBtn = document.getElementById('resetBtn');

// Lobby Elements
const lobbyOverlay = document.getElementById('lobbyOverlay');
const hostBtn = document.getElementById('hostBtn');
const joinBtn = document.getElementById('joinBtn');
const localBtn = document.getElementById('localBtn');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const roomCodeText = document.getElementById('roomCodeText');

// Canvas sizing
canvas.width = 800;
canvas.height = 500;

// Game state
let gameMode = 'local'; // local, online
let isHost = false;
let gameRunning = false;
let player1Score = 0;
let player2Score = 0;
const winningScore = 5;
let mpManager = new MultiplayerManager('pong');

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
    speed: 6,
    name: 'Player 1'
};

const player2 = {
    x: canvas.width - 30 - paddleWidth,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6,
    name: 'Player 2'
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
    if (e.key === ' ' && !gameRunning && gameMode === 'local') {
        startGame();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// --- Lobby Logic ---
localBtn.addEventListener('click', () => {
    gameMode = 'local';
    lobbyOverlay.style.display = 'none';
    resetGame();
});

hostBtn.addEventListener('click', async () => {
    gameMode = 'online';
    isHost = true;
    const user = auth.currentUser;
    const name = user ? (user.displayName || user.email.split('@')[0]) : 'Host';
    player1.name = name;
    p1NameEl.innerText = name;

    try {
        const roomCode = await mpManager.createRoom({ name, uid: user?.uid });
        roomCodeText.innerText = roomCode;
        roomCodeDisplay.style.display = 'block';
        hostBtn.disabled = true;
        joinBtn.disabled = true;

        mpManager.onUpdate((room) => {
            if (room.state === 'playing' && !gameRunning) {
                player2.name = room.guest.name;
                p2NameEl.innerText = room.guest.name;
                lobbyOverlay.style.display = 'none';
                startGame();
            }
            if (room.gameState && !isHost) {
                syncFromHost(room.gameState);
            }
            if (room.gameState && isHost) {
                syncGuestOnly(room.gameState);
            }
        });
    } catch (e) {
        alert("Failed to create room");
    }
});

joinBtn.addEventListener('click', async () => {
    const code = prompt("Enter 6-digit Room Code:");
    if (!code) return;

    gameMode = 'online';
    isHost = false;
    const user = auth.currentUser;
    const name = user ? (user.displayName || user.email.split('@')[0]) : 'Guest';
    player2.name = name;
    p2NameEl.innerText = name;

    try {
        const host = await mpManager.joinRoom(code, { name, uid: user?.uid });
        player1.name = host.name;
        p1NameEl.innerText = host.name;
        lobbyOverlay.style.display = 'none';

        mpManager.onUpdate((room) => {
            if (room.gameState) {
                syncFromHost(room.gameState);
            }
            if (room.state === 'finished' && gameRunning) {
                endGame(room.gameState.winMessage);
            }
        });

        startGame();
    } catch (e) {
        alert(e.message);
    }
});

resetBtn.addEventListener('click', () => {
    if (gameMode === 'local') resetGame();
    else location.reload(); // Simplest way to restart online session
});

function startGame() {
    gameRunning = true;
    gameMessageEl.style.display = 'none';

    if (gameMode === 'local' || isHost) {
        // Random ball direction
        const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
        const direction = Math.random() < 0.5 ? 1 : -1;
        ball.dx = Math.cos(angle) * ball.speed * direction;
        ball.dy = Math.sin(angle) * ball.speed;
    }
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
    if (gameMode === 'local') {
        if (keys['w']) player1.dy = -player1.speed;
        else if (keys['s']) player1.dy = player1.speed;
        else player1.dy = 0;

        if (keys['arrowup']) player2.dy = -player2.speed;
        else if (keys['arrowdown']) player2.dy = player2.speed;
        else player2.dy = 0;
    } else {
        if (isHost) {
            if (keys['w'] || keys['arrowup']) player1.dy = -player1.speed;
            else if (keys['s'] || keys['arrowdown']) player1.dy = player1.speed;
            else player1.dy = 0;
        } else {
            if (keys['w'] || keys['arrowup']) player2.dy = -player2.speed;
            else if (keys['s'] || keys['arrowdown']) player2.dy = player2.speed;
            else player2.dy = 0;
        }
    }

    // Update positions
    player1.y += player1.dy;
    player2.y += player2.dy;

    // Boundaries
    player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));
    player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));
}

function updateBall() {
    if (!gameRunning) return;

    // Only host or local mode calculates ball physics
    if (gameMode === 'local' || isHost) {
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Top/bottom collision
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
            ball.dy *= -1;
        }

        // Paddle collision (Host/Local only)
        if (ball.x - ball.radius < player1.x + player1.width && ball.y > player1.y && ball.y < player1.y + player1.height && ball.dx < 0) {
            ball.dx *= -1.05;
            ball.dx = Math.min(ball.dx, 12);
        }
        if (ball.x + ball.radius > player2.x && ball.y > player2.y && ball.y < player2.y + player2.height && ball.dx > 0) {
            ball.dx *= -1.05;
            ball.dx = Math.max(ball.dx, -12);
        }

        // Score - left side
        if (ball.x - ball.radius < 0) {
            player2Score++;
            player2ScoreEl.innerText = player2Score;
            if (!checkWin()) {
                resetBall();
                setTimeout(() => startGame(), 1000);
            }
        }
        // Score - right side
        if (ball.x + ball.radius > canvas.width) {
            player1Score++;
            player1ScoreEl.innerText = player1Score;
            if (!checkWin()) {
                resetBall();
                setTimeout(() => startGame(), 1000);
            }
        }
    }
}

function checkWin() {
    let msg = '';
    if (player1Score >= winningScore) msg = `🎉 ${player1.name} Wins!`;
    else if (player2Score >= winningScore) msg = `🎉 ${player2.name} Wins!`;

    if (msg) {
        endGame(msg);
        return true;
    }
    return false;
}

function endGame(msg) {
    gameRunning = false;
    gameMessageEl.innerText = msg;
    gameMessageEl.style.display = 'block';
    resetBtn.style.display = 'block';
}

function syncFromHost(state) {
    player1.y = state.p1.y;
    player1Score = state.p1.score;
    player2Score = state.p2.score;
    player1ScoreEl.innerText = player1Score;
    player2ScoreEl.innerText = player2Score;

    ball.x = state.ball.x;
    ball.y = state.ball.y;

    if (state.winMessage) endGame(state.winMessage);
}

function syncGuestOnly(state) {
    if (state.p2) {
        player2.y = state.p2.y;
    }
}

function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke(); ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillStyle = '#bc13fe';
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

    // Draw ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();
}

let lastSync = 0;
function gameLoop(time) {
    updatePaddles();
    updateBall();
    draw();

    if (gameMode === 'online' && time - lastSync > 50) {
        lastSync = time;
        const state = isHost ? {
            p1: { y: player1.y, score: player1Score },
            p2: { score: player2Score },
            ball: { x: ball.x, y: ball.y },
            winMessage: !gameRunning && (player1Score >= winningScore || player2Score >= winningScore) ? gameMessageEl.innerText : null
        } : {
            p2: { y: player2.y }
        };
        mpManager.updateGameState(state);
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();
