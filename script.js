/* Global Theme System & Space/Winter Effects */
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    createBackground();
});

function initTheme() {
    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('gamestation_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }

    // Create theme toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.innerHTML = savedTheme === 'light' ? '🌙' : '☀️';
    toggleBtn.title = 'Toggle Theme';

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        toggleBtn.innerHTML = isLight ? '🌙' : '☀️';
        localStorage.setItem('gamestation_theme', isLight ? 'light' : 'dark');

        // Recreate background with new theme
        const container = document.getElementById('background-container');
        if (container) {
            container.remove();
        }
        createBackground();
    });

    document.body.appendChild(toggleBtn);
}

function createBackground() {
    const container = document.createElement('div');
    container.id = 'background-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '0';
    container.style.overflow = 'hidden';

    // Ensure it's the first child (behind content)
    document.body.prepend(container);

    const isLight = document.body.classList.contains('light-theme');

    if (isLight) {
        createWinterTheme(container);
    } else {
        createSpaceTheme(container);
    }
}

function createWinterTheme(container) {
    const snowCount = 100;

    for (let i = 0; i < snowCount; i++) {
        const snow = document.createElement('div');
        snow.style.position = 'absolute';
        snow.style.left = Math.random() * 100 + 'vw';
        snow.style.top = '-10px';
        snow.style.width = (Math.random() * 5 + 2) + 'px';
        snow.style.height = snow.style.width;
        snow.style.background = 'white';
        snow.style.borderRadius = '50%';
        snow.style.opacity = Math.random() * 0.6 + 0.4;
        snow.style.animation = `snowFall ${Math.random() * 3 + 5}s linear infinite`;
        snow.style.animationDelay = Math.random() * 5 + 's';

        container.appendChild(snow);
    }

    // Add snowfall animation
    if (!document.getElementById('winter-animations')) {
        const style = document.createElement('style');
        style.id = 'winter-animations';
        style.innerHTML = `
            @keyframes snowFall {
                0% { transform: translateY(-10px); }
                100% { transform: translateY(100vh); }
            }
        `;
        document.head.appendChild(style);
    }
}

function createSpaceTheme(container) {
    // Check if canvas already exists
    let canvas = container.querySelector('canvas');
    if (canvas) return;

    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    container.appendChild(canvas);

    // Initial Resize
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    let stars = [];

    // Config
    const starCount = 200;
    const mouseSafetyRadius = 200;

    // Mouse tracking
    let mouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    class Star {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5; // Base size
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 30) + 1;

            // Random drifting velocity
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;

            this.alpha = Math.random() * 0.5 + 0.5;
            this.glow = 0;
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.beginPath();

            // Add proximity glow effect sizing
            const currentSize = this.size + (this.glow * 3);
            ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
            ctx.fill();

            // Draw Glow Aura if near mouse
            if (this.glow > 0.01) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = "rgba(0, 243, 255, 1)"; // Cyan glow
                ctx.fillStyle = `rgba(0, 243, 255, ${this.glow})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, currentSize * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // Reset
            }
        }

        update() {
            // Standard drift
            this.x += this.vx;
            this.y += this.vy;

            // Boundary warp
            if (this.x > canvas.width + 50) this.x = -50;
            if (this.x < -50) this.x = canvas.width + 50;
            if (this.y > canvas.height + 50) this.y = -50;
            if (this.y < -50) this.y = canvas.height + 50;

            // Mouse Interaction
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // "Antigravity" effect calculation
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const maxDistance = mouseSafetyRadius;
            const force = (maxDistance - distance) / maxDistance;

            // Physics
            if (distance < mouseSafetyRadius) {
                // Glow up
                this.glow = Math.min(this.glow + 0.05, 1);

                // Repel effect (Antigravity)
                const directionX = forceDirectionX * force * this.density * 0.6;
                const directionY = forceDirectionY * force * this.density * 0.6;
                this.x -= directionX;
                this.y -= directionY;
            } else {
                this.glow = Math.max(this.glow - 0.02, 0); // Fade out
            }
        }
    }

    function init() {
        stars = [];
        for (let i = 0; i < starCount; i++) {
            stars.push(new Star());
        }
    }

    function animate() {
        // Stop if container removed (theme switch)
        if (!document.getElementById('background-container')) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < stars.length; i++) {
            stars[i].draw();
            stars[i].update();
        }

        requestAnimationFrame(animate);
    }

    init();
    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    createBlackHoles(container);
}

function createBlackHoles(container) {
    const blackHolesConfig = [
        { left: 15, top: 20, size: 120 },
        { left: 85, top: 70, size: 100 },
        { left: 75, top: 15, size: 80 }
    ];

    blackHolesConfig.forEach(config => {
        const hole = document.createElement('div');
        hole.classList.add('celestial-object', 'black-hole');

        hole.style.left = config.left + 'vw';
        hole.style.top = config.top + 'vh';
        hole.style.width = config.size + 'px';
        hole.style.height = config.size + 'px';
        container.appendChild(hole);
    });
}

/* --- Global Navigation & Notifications (Firebase Version) --- */
import { auth, db } from "./auth/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Initialize nav on auth state change
onAuthStateChanged(auth, async (user) => {
    setupGlobalNav(user);
    if (user) {
        updateNotificationBadge(user.uid);

        // Ensure user is marked as online when active
        try {
            updateDoc(doc(db, "users", user.uid), {
                isOnline: true,
                lastSeen: new Date().toISOString()
            }).catch(() => { }); // Ignore errors if DB is disabled
        } catch (e) { }

        if (window.location.pathname.includes('notifications.html')) {
            renderNotificationsPage(user.uid);
        }
    }
});

function setupGlobalNav(user) {
    // Remove existing global nav if it exists
    const existingNav = document.querySelector('.global-nav');
    if (existingNav) existingNav.remove();

    // Hide old nav-bar if it exists
    const oldNav = document.querySelector('.nav-bar');
    if (oldNav) oldNav.style.display = 'none';

    // Create Global Nav
    const nav = document.createElement('nav');
    nav.className = 'global-nav';

    let navContentRight = '';
    if (user) {
        navContentRight = `
            <a href='auth/friends.html' class='nav-link'>Friends</a>
            <a href='auth/profile.html' class='nav-link'>Profile</a>
            <div class='nav-icon-container'>
                <a href='auth/profile.html' class='nav-icon-btn mobile-only' title='Profile'>👤</a>
                <button class='nav-icon-btn' id='globalNotifBtn' title='Notifications'>
                    🔔
                    <span class='notification-badge' id='navNotificationBadge'></span>
                </button>
            </div>
        `;
    } else {
        navContentRight = `
            <a href='auth/login.html' class='nav-link nav-btn-login'>Login</a>
            <a href='auth/login.html' class='nav-icon-btn mobile-only' title='Login'>🔑</a>
        `;
    }

    nav.innerHTML = `
        <a href='/index.html' class='nav-brand'>GameStation</a>
        <div class='nav-links'>
            <a href='/index.html' class='nav-link'>Home</a>
            ${navContentRight}
        </div>
    `;

    // Path Fixing
    const path = window.location.pathname;
    const rootPrefix = document.querySelector('.back-link') ? '../' : '';

    const brand = nav.querySelector('.nav-brand');
    const home = nav.querySelectorAll('.nav-link')[0];
    brand.href = rootPrefix + 'index.html';
    home.href = rootPrefix + 'index.html';

    if (user) {
        const friends = nav.querySelectorAll('.nav-link')[1];
        const profile = nav.querySelectorAll('.nav-link')[2];
        const profileIcon = nav.querySelector('.nav-icon-btn[title="Profile"]');
        const notifBtn = nav.querySelector('#globalNotifBtn');

        friends.href = rootPrefix + 'auth/friends.html';
        profile.href = rootPrefix + 'auth/profile.html';
        if (profileIcon) profileIcon.href = rootPrefix + 'auth/profile.html';
        notifBtn.onclick = () => window.location.href = rootPrefix + 'notifications.html';

        if (path.includes('/auth/')) {
            friends.href = 'friends.html';
            profile.href = 'profile.html';
            if (profileIcon) profileIcon.href = 'profile.html';
        }
    } else {
        const loginBtn = nav.querySelector('.nav-btn-login');
        const loginIcon = nav.querySelector('.nav-icon-btn[title="Login"]');
        loginBtn.href = rootPrefix + 'auth/login.html';
        if (loginIcon) loginIcon.href = rootPrefix + 'auth/login.html';
        if (path.includes('/auth/')) {
            loginBtn.href = 'login.html';
            if (loginIcon) loginIcon.href = 'login.html';
        }
    }

    document.body.prepend(nav);
    const container = document.querySelector('.container');
    if (container) container.style.marginTop = '80px';
}

function updateNotificationBadge(uid) {
    onSnapshot(doc(db, "users", uid), (snapshot) => {
        const userData = snapshot.data();
        if (userData && userData.notifications) {
            const unreadCount = userData.notifications.filter(n => !n.read).length;
            const badge = document.getElementById('navNotificationBadge');
            if (badge) {
                if (unreadCount > 0) {
                    badge.classList.add('active');
                } else {
                    badge.classList.remove('active');
                }
            }
        }
    });
}

/* Helper to send notification (Firestore Version) */
window.sendNotification = async function (targetUserId, message, type = 'info') {
    try {
        const userRef = doc(db, "users", targetUserId);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
            const userData = snapshot.data();
            const notifications = userData.notifications || [];

            notifications.unshift({
                id: Date.now(),
                message: message,
                date: new Date().toISOString(),
                type: type,
                read: false
            });

            await updateDoc(userRef, { notifications: notifications.slice(0, 50) }); // Keep last 50
            console.log('Notification sent to ' + targetUserId);
        }
    } catch (error) {
        console.error("Failed to send notification:", error);
    }
};

function renderNotificationsPage(uid) {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    onSnapshot(doc(db, "users", uid), (snapshot) => {
        const userData = snapshot.data();
        if (!userData || !userData.notifications || userData.notifications.length === 0) {
            list.innerHTML = "<div class='empty-state'><p>No notifications yet</p></div>";
            return;
        }

        list.innerHTML = '';
        userData.notifications.forEach(n => {
            const item = document.createElement('div');
            item.className = `notification-item ${!n.read ? 'unread' : ''} ${n.type}`;
            item.innerHTML = `
                <div class='notif-header'>
                    <span class='notif-type'>${n.type}</span>
                    <span class='notif-date'>${new Date(n.date).toLocaleDateString()}</span>
                </div>
                <div class='notif-message'>${n.message}</div>
            `;
            list.appendChild(item);
        });

        const markBtn = document.getElementById('markAllReadBtn');
        if (markBtn) {
            markBtn.onclick = async () => {
                const updatedNotifs = userData.notifications.map(n => ({ ...n, read: true }));
                await updateDoc(doc(db, "users", uid), { notifications: updatedNotifs });
            };
        }
    });
}
