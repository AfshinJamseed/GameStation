const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Constants & Config ---
const CONFIG = {
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    TANK_SIZE: 30,
    TANK_SPEED: 3,
    ROTATION_SPEED: 0.08,
    BULLET_SPEED: 7,
    BULLET_RADIUS: 4,
    MAX_BOUNCES: 1,
    COOLDOWN: 50, // Frames
    WIN_SCORE: 5,
    COLORS: {
        P1: '#00f3ff',
        P2: '#ff0055',
        WALL: '#555577', // Lighter for visibility
        BG: '#0a0a12'
    }
};

// --- Game State ---
const state = {
    isRunning: false,
    p1Score: 0,
    p2Score: 0,
    gameOver: false,
    p1: null,
    p2: null,
    bullets: [],
    walls: [],
    particles: []
};

const keys = {};

// --- Inputs ---
// --- Inputs ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.code)) {
        e.preventDefault(); // Prevent scrolling and button clicks
    }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Touch Controls
document.addEventListener('DOMContentLoaded', () => {
    const touchButtons = document.querySelectorAll('.t-btn');

    touchButtons.forEach(btn => {
        const keyCode = btn.getAttribute('data-key');

        // Touch/Click Start
        ['touchstart', 'mousedown'].forEach(eventType => {
            btn.addEventListener(eventType, (e) => {
                e.preventDefault();
                keys[keyCode] = true;
            });
        });

        // Touch/Click End
        ['touchend', 'mouseup', 'touchcancel'].forEach(eventType => {
            btn.addEventListener(eventType, (e) => {
                e.preventDefault();
                keys[keyCode] = false;
            });
        });
    });
});

// --- Classes ---

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v) { return new Vector(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector(this.x - v.x, this.y - v.y); }
    mult(n) { return new Vector(this.x * n, this.y * n); }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        const m = this.mag();
        return m === 0 ? new Vector(0, 0) : new Vector(this.x / m, this.y / m);
    }
}

class Tank {
    constructor(x, y, color, controls, angle) {
        this.pos = new Vector(x, y);
        this.color = color;
        this.angle = angle; // Radians
        this.controls = controls;
        this.cooldown = 0;
        this.width = CONFIG.TANK_SIZE;
        this.height = CONFIG.TANK_SIZE;
        this.alive = true;
    }

    update() {
        if (!this.alive) return;

        // Rotation
        if (keys[this.controls.left]) this.angle -= CONFIG.ROTATION_SPEED;
        if (keys[this.controls.right]) this.angle += CONFIG.ROTATION_SPEED;

        // Movement
        let moveDir = 0;
        if (keys[this.controls.up]) moveDir = 1;
        if (keys[this.controls.down]) moveDir = -1;

        if (moveDir !== 0) {
            const vel = new Vector(
                Math.cos(this.angle) * CONFIG.TANK_SPEED * moveDir,
                Math.sin(this.angle) * CONFIG.TANK_SPEED * moveDir
            );

            // Wall Collision (Simple bounding box check for next position)
            const nextPos = this.pos.add(vel);
            if (!this.checkCollision(nextPos)) {
                this.pos = nextPos;
            }
        }

        // Shooting
        if (this.cooldown > 0) this.cooldown--;
        if (keys[this.controls.shoot] && this.cooldown <= 0) {
            this.shoot();
            this.cooldown = CONFIG.COOLDOWN;
        }
    }

    checkCollision(pos) {
        // Map Boundaries
        if (pos.x < this.width / 2 || pos.x > CONFIG.GAME_WIDTH - this.width / 2 ||
            pos.y < this.height / 2 || pos.y > CONFIG.GAME_HEIGHT - this.height / 2) {
            return true;
        }

        // Walls
        const half = this.width / 2;
        const rect = { l: pos.x - half, r: pos.x + half, t: pos.y - half, b: pos.y + half };

        for (const wall of state.walls) {
            if (rect.r > wall.x && rect.l < wall.x + wall.w &&
                rect.b > wall.y && rect.t < wall.y + wall.h) {
                return true;
            }
        }
        return false;
    }

    shoot() {
        const muzzleLength = this.width / 1.5;
        const startPos = new Vector(
            this.pos.x + Math.cos(this.angle) * muzzleLength,
            this.pos.y + Math.sin(this.angle) * muzzleLength
        );
        const vel = new Vector(
            Math.cos(this.angle) * CONFIG.BULLET_SPEED,
            Math.sin(this.angle) * CONFIG.BULLET_SPEED
        );
        state.bullets.push(new Bullet(startPos, vel, this.color));
    }

    draw() {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);

        // Body
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Turret
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -5, this.width / 1.2, 10);

        ctx.restore();
    }
}

class Bullet {
    constructor(pos, vel, color) {
        this.pos = pos;
        this.vel = vel;
        this.color = color;
        this.bounces = 0;
        this.active = true;
        this.radius = CONFIG.BULLET_RADIUS;
    }

    update() {
        this.pos = this.pos.add(this.vel);

        // Wall collisions
        // Check Horizontal
        let hit = false;

        // Map Boundries (Bounce)
        if (this.pos.x < this.radius || this.pos.x > CONFIG.GAME_WIDTH - this.radius) {
            this.vel.x *= -1;
            hit = true;
        }
        if (this.pos.y < this.radius || this.pos.y > CONFIG.GAME_HEIGHT - this.radius) {
            this.vel.y *= -1;
            hit = true;
        }

        // Inner Walls
        if (!hit) {
            for (const wall of state.walls) {
                // Determine collision side
                // Closest point on rectangle to circle center
                const clampX = Math.max(wall.x, Math.min(this.pos.x, wall.x + wall.w));
                const clampY = Math.max(wall.y, Math.min(this.pos.y, wall.y + wall.h));

                const distX = this.pos.x - clampX;
                const distY = this.pos.y - clampY;
                const distance = Math.sqrt(distX * distX + distY * distY);

                if (distance < this.radius) {
                    // Resolve Bounce
                    // Simple AABB method for bullet velocity reflection
                    // If we were moving towards the wall x, flip x. 
                    // This is a simplification but works enough for simple rects.

                    // Check previous position to see which axis we crossed
                    const prevPos = this.pos.sub(this.vel);

                    if (prevPos.x <= wall.x || prevPos.x >= wall.x + wall.w) {
                        this.vel.x *= -1;
                    } else {
                        this.vel.y *= -1;
                    }
                    hit = true;
                    break;
                }
            }
        }

        if (hit) {
            this.bounces++;
            if (this.bounces > CONFIG.MAX_BOUNCES) {
                this.active = false;
                createExplosion(this.pos, this.color, 5);
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Particle {
    constructor(x, y, color) {
        this.pos = new Vector(x, y);
        this.vel = new Vector((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
        this.alpha = 1;
        this.color = color;
    }
    update() {
        this.pos = this.pos.add(this.vel);
        this.alpha -= 0.05;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, 3, 3);
        ctx.globalAlpha = 1;
    }
}

// --- Game Logic ---

function initGame() {
    canvas.width = CONFIG.GAME_WIDTH;
    canvas.height = CONFIG.GAME_HEIGHT;

    // Create random map
    generateMap();

    // Reset Players
    state.p1 = new Tank(50, 50, CONFIG.COLORS.P1,
        { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'Space' }, 0);
    state.p2 = new Tank(CONFIG.GAME_WIDTH - 50, CONFIG.GAME_HEIGHT - 50, CONFIG.COLORS.P2,
        { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter' }, Math.PI);

    state.bullets = [];
    state.particles = [];
}

function generateMap() {
    state.walls = [];
    // Simple symmetric map
    const w = CONFIG.GAME_WIDTH;
    const h = CONFIG.GAME_HEIGHT;

    // Center block
    state.walls.push({ x: w / 2 - 50, y: h / 2 - 50, w: 100, h: 100 });

    // Corner protections
    state.walls.push({ x: 150, y: 100, w: 20, h: 100 });
    state.walls.push({ x: w - 170, y: h - 200, w: 20, h: 100 });

    // Horizontal bars
    state.walls.push({ x: w / 2 - 150, y: 100, w: 300, h: 20 });
    state.walls.push({ x: w / 2 - 150, y: h - 120, w: 300, h: 20 });
}

function checkHits() {
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];

        // P1 Hit
        if (state.p1.alive && checkCircleRect(b.pos, b.radius, state.p1)) {
            killPlayer(1);
            b.active = false;
        }
        // P2 Hit
        else if (state.p2.alive && checkCircleRect(b.pos, b.radius, state.p2)) {
            killPlayer(2);
            b.active = false;
        }
    }
}

function checkCircleRect(circlePos, radius, rectObj) {
    // Basic aligned rect check
    const half = rectObj.width / 2;
    const rectX = rectObj.pos.x - half;
    const rectY = rectObj.pos.y - half;

    const clampX = Math.max(rectX, Math.min(circlePos.x, rectX + rectObj.width));
    const clampY = Math.max(rectY, Math.min(circlePos.y, rectY + rectObj.height));

    const distX = circlePos.x - clampX;
    const distY = circlePos.y - clampY;

    return (distX * distX + distY * distY) < (radius * radius);
}

function killPlayer(playerNum) {
    const deadTank = playerNum === 1 ? state.p1 : state.p2;
    deadTank.alive = false;
    createExplosion(deadTank.pos, deadTank.color, 30);

    if (playerNum === 1) state.p2Score++;
    else state.p1Score++;

    updateScoreUI();

    if (state.p1Score >= CONFIG.WIN_SCORE || state.p2Score >= CONFIG.WIN_SCORE) {
        endGame(playerNum === 1 ? 2 : 1); // Winner is the other one? No, if P1 dies, P2 scores.
    } else {
        setTimeout(() => initGame(), 2000); // Next round
    }
}

function endGame(winnerNum) {
    state.isRunning = false;
    document.getElementById('winner-text').innerText = `Player ${winnerNum} Wins!`;
    document.getElementById('winner-text').style.color = winnerNum === 1 ? CONFIG.COLORS.P1 : CONFIG.COLORS.P2;
    document.getElementById('game-over-screen').classList.add('active');
}

function updateScoreUI() {
    document.getElementById('score1').innerText = state.p1Score;
    document.getElementById('score2').innerText = state.p2Score;
}

function createExplosion(pos, color, count) {
    for (let i = 0; i < count; i++) {
        state.particles.push(new Particle(pos.x, pos.y, color));
    }
}

function loop() {
    if (!state.isRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear

    // Draw Walls
    ctx.fillStyle = CONFIG.COLORS.WALL;
    ctx.shadowBlur = 0;
    for (const w of state.walls) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        // Add neon border to walls
        ctx.strokeStyle = '#6a6a8a';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
    }

    state.p1.update();
    state.p1.draw();

    state.p2.update();
    state.p2.draw();

    // Bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.update();
        b.draw();
        if (!b.active) state.bullets.splice(i, 1);
    }

    // Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0) state.particles.splice(i, 1);
    }

    checkHits();

    requestAnimationFrame(loop);
}

// --- UI Handlers ---
document.getElementById('start-btn').addEventListener('click', (e) => {
    e.target.blur(); // Remove focus so Enter doesn't trigger it again
    document.getElementById('start-screen').classList.remove('active');
    state.p1Score = 0;
    state.p2Score = 0;
    updateScoreUI();
    initGame();
    state.isRunning = true;
    loop();
});

document.getElementById('play-again-btn').addEventListener('click', (e) => {
    e.target.blur();
    document.getElementById('game-over-screen').classList.remove('active');
    state.p1Score = 0;
    state.p2Score = 0;
    updateScoreUI();
    initGame();
    state.isRunning = true;
    loop();
});

document.getElementById('restart-btn').addEventListener('click', (e) => {
    e.target.blur();
    state.isRunning = false; // Stop loop
    document.getElementById('start-screen').classList.add('active');
    document.getElementById('game-over-screen').classList.remove('active');
});

// Resize handler to keep aspect ratio if needed, or just center
// For now, fixed canvas size is fine. 
